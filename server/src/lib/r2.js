// Cloudflare R2 (S3 mos) bilan ishlash. Bucket yopiq: fayllar faqat server orqali beriladi.
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { config, HttpError } from "../config.js";

let client;
function r2() {
  const { accountId, accessKeyId, secretAccessKey } = config.r2;
  if (!accountId || !accessKeyId || !secretAccessKey) throw new HttpError(500, "R2 sozlanmagan");
  client ||= new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export const r2Enabled = () => Boolean(config.r2.accountId && config.r2.accessKeyId && config.r2.secretAccessKey && config.r2.bucket);

const isMissing = (e) => e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404;

export async function putObject(key, body, contentType = "application/pdf") {
  await r2().send(new PutObjectCommand({ Bucket: config.r2.bucket, Key: key, Body: body, ContentType: contentType }));
}

/** Oqim sifatida (Range qo'llab-quvvatlanadi). Topilmasa null. */
export async function getObjectStream(key, range) {
  try {
    return await r2().send(new GetObjectCommand({ Bucket: config.r2.bucket, Key: key, Range: range }));
  } catch (e) {
    if (isMissing(e)) return null;
    throw e;
  }
}

export async function getObjectBuffer(key) {
  const obj = await getObjectStream(key);
  if (!obj) return null;
  return Buffer.from(await obj.Body.transformToByteArray());
}

export async function listKeys(prefix) {
  const out = [];
  let token;
  do {
    const r = await r2().send(new ListObjectsV2Command({ Bucket: config.r2.bucket, Prefix: prefix, ContinuationToken: token }));
    for (const o of r.Contents || []) out.push(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return out;
}

export async function deleteObject(key) {
  if (!key || !r2Enabled()) return;
  try {
    await r2().send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: key }));
  } catch (e) {
    console.warn("[r2] o'chirishda xato:", e.message);
  }
}

/** R2 obyektini HTTP javobga uzatadi (pdf.js Range so'rovlari bilan) */
export async function pipeObject(key, req, res) {
  const range = /^bytes=\d*-\d*$/.test(req.headers.range || "") ? req.headers.range : undefined;
  const obj = await getObjectStream(key, range);
  if (!obj) return false;
  res.status(range && obj.ContentRange ? 206 : 200);
  res.set({
    "Content-Type": obj.ContentType || "application/pdf",
    "Accept-Ranges": "bytes",
    "Cache-Control": key.startsWith("books/") ? "public, max-age=604800" : "private, max-age=3600",
    ...(obj.ContentLength != null ? { "Content-Length": String(obj.ContentLength) } : {}),
    ...(obj.ContentRange ? { "Content-Range": obj.ContentRange } : {}),
  });
  await new Promise((resolve, reject) => {
    obj.Body.on("error", reject);
    res.on("close", resolve);
    obj.Body.pipe(res);
  });
  return true;
}
