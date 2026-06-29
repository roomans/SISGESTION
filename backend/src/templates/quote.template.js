const fs = require("fs");
const path = require("path");
const {
  formatQuoteNumberForPdf,
  formatQuoteDateLongEs,
} = require("./quotePdfFormat.helpers");

function formatCurrency(value, currency = "PEN") {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  if (value === undefined || value === null) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getImageBase64(fileName) {
  try {
    const imagePath = path.join(__dirname, "..", "assets", fileName);
    const imageBuffer = fs.readFileSync(imagePath);

    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (error) {
    console.warn(`No se pudo cargar la imagen ${fileName}:`, error.message);
    return "";
  }
}

function quoteTemplate({ quote, lines = [] }) {
  const logoBase64 = getImageBase64("tanta-house-logo.png");
  const footerBase64 = getImageBase64("tanta-house-footer.png");
  const customerName = quote.customer_name || "cliente";
  const quoteNumberPdf = formatQuoteNumberForPdf(
  quote.quote_number,
  quote.quote_date);
  const quoteDatePdf = formatQuoteDateLongEs(quote.quote_date);

  const rows = lines
    .map(
      (line, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${line.item_description || ""}</td>
        <td class="num">${Number(line.quantity || 0).toFixed(0)}</td>
        <td class="num">${formatCurrency(
          line.taxable_amount,
          quote.currency_code
        )}</td>
        <td class="num strong">${formatCurrency(
          line.line_total,
          quote.currency_code
        )}</td>
      </tr>`
    )
    .join("");

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family:
		Calibri,
		"Carlito",
		"Segoe UI",
		Arial,
		sans-serif;
      color: #26172C;
      margin: 0;
      padding: 30px;
      padding-bottom: 180px;
      background: #ffffff;
	  font-size: 12px;
	  line-height: 1.35;
	  text-align: justify;
    }

    .header {
      display: grid;
      grid-template-columns: 210px 1fr 230px;
      gap: 24px;
      align-items: center;
    }

    .brand-logo {
      width: 140px;
      height: auto;
      display: block;
	  opacity: 0.58;
	  margin-top: -5mm;
    }

    .title-block {
      text-align: center;
      border-left: 2px solid #26172C;
      padding-left: 24px;
    }

    .title-block h1 {
      margin: 0;
      font-size: 34px;
      letter-spacing: 1px;
      color: #26172C;
      text-transform: uppercase;
    }

    .quote-number {
	  top: 135px;
      display: inline-block;
      padding: 10px 24px;
      color: #26172C;
      font-weight: bold;
      border-radius: 8px;
	  position: absolute;
	  left: 0;
	  text-decoration: underline;
	  font-size:14px;
    }

    .quote-info {
      line-height: 1.5;
    }

    .quote-info-row {
      margin-bottom: 12px;
	  position: absolute;
	  right: 0;
	  top: 135px;
	  color: #000;
	  white-space: nowrap;
	  font-size:14px;
    }

    .quote-info-label {
      color: #C97847;
      font-weight: bold;
      display: block;
      margin-bottom: 2px;
    }

    .cards {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 18px;
      margin-bottom: 22px;
    }

    .box {
      background: #fffaf3;
      border: 1px solid #ECC9A9;
      border-radius: 12px;
      padding: 16px;
    }

    .box h2 {
      margin: 0 0 14px;
      font-size: 16px;
      color: #C97847;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 18px;
      font-size: 13px;
    }

    .field-label {
      font-weight: bold;
      color: #26172C;
      display: block;
      margin-bottom: 3px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      font-size: 11.5px;
    }

    th {
      background: #26172C;
      color: #fff;
      padding: 11px 8px;
      font-size: 10.5px;
      border: 1px solid #26172C;
      letter-spacing: 0.4px;
    }

    td {
      padding: 10px 8px;
      border: 1px solid #ece7e3;
      vertical-align: top;
      background: #fff;
    }

    .center {
      text-align: center;
    }

    .num {
      text-align: center;
      white-space: nowrap;
    }

    .strong {
      font-weight: bold;
    }

    .summary-wrapper {
      display: grid;
      grid-template-columns: 1fr 330px;
      gap: 22px;
      margin-top: 18px;
    }

    .notes h3 {
      color: #C97847;
      margin: 0 0 8px;
      font-size: 15px;
      text-transform: uppercase;
    }

    .notes p {
      margin: 0;
      font-size: 12.5px;
      line-height: 1.5;
    }

    .totals {
      font-size: 13px;
      border: 1px solid #ECC9A9;
      border-radius: 10px;
      overflow: hidden;
    }

    .totals div {
      display: flex;
      justify-content: space-between;
      padding: 9px 12px;
      border-bottom: 1px solid #ECC9A9;
      background: #fffaf3;
    }

    .totals div:last-child {
      border-bottom: 0;
    }

    .total {
      font-size: 18px;
      font-weight: bold;
      color: #26172C;
      background: #ECC9A9 !important;
    }

    .footer-fixed {
      position: fixed;
      bottom: 18px;
      left: 0;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .footer-image {
      width: 720px;
      max-width: 85%;
      height: auto;
      object-fit: contain;
    }
	
	.greeting {
      margin-top: 36px;
      top: 200px;
      height: auto;
      font-size: 14px;
      line-height: 1.7;
      color: #2d2d2d;
      }
  
    .greeting strong {
      font-weight: 800;
      color: #26172C;
    }
	
	.table-wrapper {
      width: 90%;      
      margin: 26px auto;      
      padding: 16px; 
      background: #fffdfb;  
    }
  </style>
</head>

<body>

  <div class="header">
    <div>
      ${
        logoBase64
          ? `<img class="brand-logo" src="${logoBase64}" alt="Tanta House" />`
          : `<div style="font-size:24px;font-weight:bold;">Tanta House</div>`
      }
    </div>

    <div class="title-block">

    </div>
	      <div class="quote-number">
        COTIZACIÓN N° ${quoteNumberPdf}
      </div>

    <div class="quote-info">
      <div class="quote-info-row">
        Lima, ${quoteDatePdf}
      </div>
    </div>
  </div>
  
  <div class="greeting">
  
	<p>
		¡Hola <strong>${escapeHtml(customerName)}</strong>!
	</p>
	
	<p>
		Gracias por contactarnos para poner el toque de sabor a tu compartir. En <strong>Tanta House</strong> hemos preparado unas opciones especiales que combinan sabor, cariño y una buena dosis de alegría.
	</p>
	
	<p>
		A continuación, te compartimos nuestra cotización en base a los
		bocaditos que nos solicitaste.
	</p>
  </div>

  <div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th class="center">N°</th>
        <th>Producto</th>
        <th class="num">Cantidad</th>
        <th class="num">Precio(Sin IGV)</th>
        <th class="num">Precio
		(Incl. IGV)</th>
      </tr>
    </thead>

    <tbody>
      ${rows}
    </tbody>
  </table>
  </div>
  <div class="greeting">
  
	<p>
		<strong>Consideraciones:</strong>
	</p>
	
	<ul>
		<li>El pedido deberá ser confirmando con un mínimo de 2 días de anticipación.</li>
		<li>El delivery tendrá un costo adicional, el cual está sujeto a la dirección de entrega.</li>
		<li>La confirmación del pedido se hará con un adelanto del 50% y el 50% restante a la entrega del pedido.</li>

	</ul>
	
	<p>
		Quedamos totalmente a su disposición para coordinar cualquier detalle y brindarte la información que necesites.
	</p>
  </div>

  <div class="footer-fixed">
    ${
      footerBase64
        ? `<img class="footer-image" src="${footerBase64}" alt="Footer Tanta House" />`
        : ""
    }
  </div>

</body>
</html>
`;
}

module.exports = quoteTemplate;