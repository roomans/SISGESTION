const express = require("express");
const multer = require("multer");
const puppeteer = require("puppeteer");

const {
  parseXmlInvoice,
} = require("../services/xmlInvoiceParser.service");

const buildXmlInvoiceTemplate = require("../templates/xmlInvoice.template");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

async function generatePdfBuffer(html) {
  if (typeof html !== "string") {
    throw new Error(
      `El template HTML debe retornar string. Valor recibido: ${typeof html}`
    );
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "10mm",
        bottom: "12mm",
        left: "10mm",
      },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

router.post("/parse", upload.single("xml"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Debe adjuntar un archivo XML",
      });
    }

    const xmlContent = req.file.buffer.toString("utf8");
    const parsed = await parseXmlInvoice(xmlContent);

    return res.json(parsed);
  } catch (error) {
    console.error("Error procesando XML:", error);

    return res.status(500).json({
      message: "Error procesando XML",
      error: error.message,
    });
  }
});

router.post("/preview-html", upload.single("xml"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Debe adjuntar un archivo XML",
      });
    }

    const xmlContent = req.file.buffer.toString("utf8");
    const parsed = await parseXmlInvoice(xmlContent);

    // IMPORTANTE:
    // xmlInvoice.template.js ahora es async porque genera el QR.
    // Por eso se debe usar await.
    const html = await buildXmlInvoiceTemplate(parsed);

    return res
      .status(200)
      .type("html")
      .send(html);
  } catch (error) {
    console.error("Error generando preview HTML:", error);

    return res.status(500).json({
      message: "Error generando preview HTML",
      error: error.message,
    });
  }
});

router.post("/pdf", upload.single("xml"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Debe adjuntar un archivo XML",
      });
    }

    const xmlContent = req.file.buffer.toString("utf8");
    const parsed = await parseXmlInvoice(xmlContent);

    // IMPORTANTE:
    // xmlInvoice.template.js ahora es async porque genera el QR.
    // Si no se usa await, el PDF puede recibir [object Object] / [object Promise].
    const html = await buildXmlInvoiceTemplate(parsed);

    const pdfBuffer = await generatePdfBuffer(html);

    const fileName = `${parsed.invoice_number || "factura-xml"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileName}"`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generando PDF XML:", error);

    return res.status(500).json({
      message: "Error generando PDF XML",
      error: error.message,
    });
  }
});

module.exports = router;
