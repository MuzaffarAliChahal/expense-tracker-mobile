// Builds docs/cover.jpg for the README from the real web build of the app.
// Usage: npx expo export --platform web --output-dir dist && node scripts/readme-screenshots.mjs
// Needs Playwright: npm i --no-save playwright && npx playwright install chromium
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const base = '/expense-tracker-mobile'; // matches experiments.baseUrl in app.json
const port = 4174;
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url.startsWith(base)) url = url.slice(base.length) || '/';
  let file = path.join(root, url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(port, r));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('page error:', e.message));
const shots = {};
const snap = async (name) => { shots[name] = (await page.screenshot()).toString('base64'); };

await page.goto(`http://localhost:${port}${base}/`);
await page.waitForTimeout(1500);
await page.getByText('Try the demo (no server needed)').click();
await page.waitForTimeout(1500);
await snap('list');
await page.getByLabel('Add expense').click();
await page.waitForTimeout(1000);
await page.getByLabel('Amount').fill('18.40');
await page.getByLabel('Description').fill('Team lunch');
await page.getByText('Food', { exact: true }).click();
await page.waitForTimeout(300);
await snap('add');
await page.getByText('Save expense').click();
await page.waitForTimeout(1200);
await page.getByText('Monthly report', { exact: true }).last().click();
await page.waitForTimeout(1200);
await snap('report');

const card = 'background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);padding:11px 14px;border-radius:10px';
const phone = (img, left, top, deg) =>
  `<div style="position:absolute;left:${left}px;top:${top}px;width:200px;height:420px;border-radius:30px;background:#0f0b1f;padding:9px;transform:rotate(${deg}deg);box-shadow:0 25px 50px rgba(0,0,0,.45)">` +
  `<img src="data:image/png;base64,${img}" style="width:200px;height:410px;border-radius:22px;object-fit:cover;object-position:top"/></div>`;
const html = `<html><body style="margin:0;width:1200px;height:675px;background:linear-gradient(135deg,#1e1b4b,#4c1d95);font-family:Inter,Segoe UI,Arial,sans-serif;overflow:hidden;position:relative">
<div style="position:absolute;left:60px;top:70px;width:420px;color:#fff">
<div style="color:#c4b5fd;letter-spacing:3px;font-weight:600;font-size:16px">OPEN SOURCE · REACT NATIVE · EXPO</div>
<div style="font-size:54px;font-weight:800;line-height:1.08;margin-top:18px">Expense Tracker Mobile</div>
<div style="font-size:21px;color:#ddd6fe;margin-top:18px;line-height:1.4">iOS and Android app for a Spring Boot API with JWT login</div>
<div style="margin-top:30px;display:grid;gap:10px;font-size:17px">
<div style="${card}">Secure token storage (Keychain / Keystore)</div>
<div style="${card}">Infinite scroll, monthly reports, validation</div>
<div style="${card}">TypeScript, Jest, GitHub Actions</div>
</div>
<div style="margin-top:34px;color:#a78bfa;font-size:14px">Muzaffar Ali Hakim · github.com/MuzaffarAliChahal</div>
</div>
${phone(shots.list, 505, 105, -4)}${phone(shots.report, 725, 70, 0)}${phone(shots.add, 945, 105, 4)}
</body></html>`;

const cover = await browser.newPage({ viewport: { width: 1200, height: 675 } });
await cover.setContent(html);
await cover.waitForTimeout(300);
fs.mkdirSync('docs', { recursive: true });
await cover.screenshot({ path: 'docs/cover.jpg', type: 'jpeg', quality: 80 });
console.log('wrote docs/cover.jpg');

await browser.close();
server.close();
