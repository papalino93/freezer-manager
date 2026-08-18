// Genera le icone PNG (PWA + apple-touch + favicon) dagli SVG sorgente in
// scripts/brand-src/, usando Chromium per rasterizzare in modo nitido a
// ogni dimensione (niente dipendenze native tipo sharp).
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

async function renderSvgToPng(svgPath, size, outPath, { forceAlpha = false } = {}) {
  const svg = readFileSync(svgPath, "utf-8");
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<html><body style="margin:0;padding:0;width:${size}px;height:${size}px;">${svg}</body></html>`
  );
  await page.evaluate(() => {
    const svgEl = document.querySelector("svg");
    if (svgEl) {
      svgEl.setAttribute("width", String(window.innerWidth));
      svgEl.setAttribute("height", String(window.innerHeight));
    }
  });
  // omitBackground forza un PNG RGBA (con canale alpha) anche se il
  // contenuto è opaco: alcuni decoder ICO (incluso quello usato da
  // Next/Turbopack) rifiutano un PNG incapsulato senza canale alpha.
  await page.screenshot({ path: outPath, omitBackground: forceAlpha });
  await browser.close();
  console.log("wrote", outPath);
}

// Costruisce un .ico valido incapsulando un PNG (formato supportato da
// tutti i browser/OS moderni, niente bisogno di codificare BMP raw).
function pngToIco(pngPath, icoPath, size) {
  const png = readFileSync(pngPath);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image size
  entry.writeUInt32LE(22, 12); // offset (6 header + 16 entry)

  writeFileSync(icoPath, Buffer.concat([header, entry, png]));
  console.log("wrote", icoPath);
}

const badge = path.join(root, "scripts/brand-src/logo-badge.svg");
const square = path.join(root, "scripts/brand-src/logo-square.svg");

await renderSvgToPng(square, 512, path.join(root, "public/icon-512.png"));
await renderSvgToPng(square, 192, path.join(root, "public/icon-192.png"));
await renderSvgToPng(square, 180, path.join(root, "public/apple-icon.png"));
await renderSvgToPng(badge, 32, path.join(root, "public/favicon-32.png"), { forceAlpha: true });

pngToIco(
  path.join(root, "public/favicon-32.png"),
  path.join(root, "src/app/favicon.ico"),
  32
);
