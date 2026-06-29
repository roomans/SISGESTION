const puppeteer = require("puppeteer");

async function generatePdfFromHtml(html, options = {}) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm",
      },
      ...options,
    });
  } finally {
    await browser.close();
  }
}

module.exports = {
  generatePdfFromHtml,
};
