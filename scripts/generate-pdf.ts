/**
 * Generates AVANA-DIY-Store-Audit-Kit.pdf from the HTML source.
 * Run: npx tsx scripts/generate-pdf.ts
 * Output: public/AVANA-DIY-Store-Audit-Kit.pdf
 */
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const HTML_PATH = path.join(ROOT, 'public', 'ava-diy-audit-kit.html')
const PDF_PATH = path.join(ROOT, 'public', 'AVANA-DIY-Store-Audit-Kit.pdf')

if (!fs.existsSync(HTML_PATH)) {
  console.error('HTML source not found:', HTML_PATH)
  process.exit(1)
}

console.log('Launching Chromium...')
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()

const fileUrl = `file://${HTML_PATH}`
await page.goto(fileUrl, { waitUntil: 'networkidle0' })

// Fix: dark section backgrounds are stripped by the default print CSS
// (body { background: #fff } in the HTML's @media print).
// Inject override AFTER the page's own styles so we win specificity.
await page.addStyleTag({
  content: `
    @page { margin: 0; size: A4; }
    * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
    @media print { body { background: unset !important; } }
  `,
})

console.log('Generating PDF...')
const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
})

await browser.close()

fs.writeFileSync(PDF_PATH, pdfBuffer)
console.log('PDF written to:', PDF_PATH)
console.log('Size:', Math.round(fs.statSync(PDF_PATH).size / 1024), 'KB')
