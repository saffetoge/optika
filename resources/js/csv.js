function hucre(deger) {
  const metin = deger === null || deger === undefined ? '' : String(deger);
  return /[";\r\n]/.test(metin) ? `"${metin.replaceAll('"', '""')}"` : metin;
}

export function csvMetni(basliklar, satirlar) {
  const cizgiler = [basliklar, ...satirlar].map((satir) => satir.map(hucre).join(';'));
  return `﻿${cizgiler.join('\r\n')}\r\n`;
}
