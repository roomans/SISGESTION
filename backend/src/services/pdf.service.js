const puppeteer = require("puppeteer");

async function htmlToPdfBuffer(html) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "20mm",
        bottom: "0mm",
        left: "20mm",
      },
    });
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };
