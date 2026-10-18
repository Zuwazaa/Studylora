# Studylora

Maktab darsliklari (1–11-sinf) asosida ishlaydigan AI ustoz: darslikdan test, AI bilan suhbat, kartochkalar, xatolar ustida ishlash va natijalar. Ichiga 14 ta ilmiy isbotlangan pedagogik usul o'rnatilgan (Sokratik suhbat, ZPD, Blum taksonomiyasi, oraliqli takrorlash, faol eslash va boshqalar) va AI har javobda qaysilarini qo'llaganini ko'rsatadi.

## Tuzilma

```
server/   Node 22 + Express 5 + MongoDB (Render'da ishlaydi)
client/   React 18 + Vite (Vercel'da ishlaydi)
```

## Lokal ishga tushirish

```bash
cd server
cp .env.example .env      # kalitlarni to'ldiring, .env GitHub'ga yuklanmaydi
npm install
npm run dev               # http://localhost:8787

cd ../client
npm install
npm run dev               # http://localhost:5173 (/api serverga proxy qilinadi)
```

Testlar: `cd server && npm test`.

## Deploy

**Backend (Render)**
- Render → New → Blueprint → shu repo. `render.yaml` hammasini sozlaydi, faqat yashirin kalitlarni (Mongo, Gemini, R2) so'raydi.
- `CLIENT_ORIGIN` Vercel manziliga teng bo'lishi kerak.
- MongoDB Atlas → Network Access'da `0.0.0.0/0` ruxsat bo'lishi kerak.

**Frontend (Vercel)**
- Root directory: `client`, framework: Vite
- Environment: `VITE_API_URL=https://<render-manzil>` (sayt API'ga to'g'ridan-to'g'ri murojaat qiladi).

## Muhim eslatmalar

- Darsliklar R2'dagi yopiq bucketda saqlanadi va server orqali beriladi. Bucketda yo'q kitob eski ochiq bucketdan (`BOOKS_LEGACY_URL`) birinchi ochilganda avtomatik ko'chiriladi.
- "Qiyin" darajada internetdan savol olish Gemini Google Search grounding'dan foydalanadi. Bepul tarifda bu kvota 0, shuning uchun billing yoqilmaguncha qiyin savollar model bilimidan (olimpiada uslubida) tuziladi.
- Test javoblari brauzerga yuborilmaydi: ular HMAC bilan imzolangan token ichida turadi.
