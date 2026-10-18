import { useEffect, useState } from "react";
import { Books } from "../api/client";

let cache = null;
let pending = null;

// Darsliklar manifesti: { "10-algebra": "https://.../algebra-10.pdf" }
export function useBooks() {
  const [books, setBooks] = useState(cache);
  useEffect(() => {
    if (cache) return;
    pending ||= Books.list().then((r) => (cache = r.books || {})).catch(() => ({}));
    pending.then(setBooks);
  }, []);
  return books;
}
