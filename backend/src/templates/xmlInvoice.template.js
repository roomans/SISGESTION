const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

function normalizeValue(value) {
  if (value === undefined || value === null) return "";

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }

  if (Array.isArray(value)) {
    return value.length ? normalizeValue(value[0]) : "";
  }

  if (typeof value === "object") {
    const keys = ["#text", "__cdata", "_text", "text"];

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        return normalizeValue(value[key]);
      }
    }

    const values = Object.values(value);
    return values.length ? normalizeValue(values[0]) : "";
  }

  return "";
}

function money(value, currencyCode = "PEN") {
  const symbol = currencyCode === "PEN" ? "S/" : currencyCode;
  return `${symbol} ${Number(normalizeValue(value) || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return normalizeValue(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  const normalized = normalizeValue(value);

  if (!normalized) return "-";

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function getDocumentName(documentTypeCode) {
  const map = {
    "01": "Factura electrónica",
    "03": "Boleta de venta electrónica",
    "07": "Nota de crédito electrónica",
    "08": "Nota de débito electrónica",
  };

  return map[normalizeValue(documentTypeCode)] || "Comprobante electrónico";
}

function getLogoBase64() {
  const candidates = [
    path.join(__dirname, "../assets/tanta-house-logo.png"),
    path.join(__dirname, "../assets/logo.png"),
    path.join(__dirname, "../../assets/tanta-house-logo.png"),
    path.join(__dirname, "../../assets/logo.png"),
    path.join(process.cwd(), "src/assets/tanta-house-logo.png"),
    path.join(process.cwd(), "src/assets/logo.png"),
    path.join(process.cwd(), "assets/tanta-house-logo.png"),
    path.join(process.cwd(), "assets/logo.png"),
    path.join(process.cwd(), "public/logo.png"),
    path.join(process.cwd(), "public/tanta-house-logo.png"),
  ];

  const logoPath = candidates.find((item) => fs.existsSync(item));

  if (!logoPath) return "";

  const ext = path.extname(logoPath).toLowerCase().replace(".", "") || "png";
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  const base64 = fs.readFileSync(logoPath).toString("base64");

  return `data:${mime};base64,${base64}`;
}

function truncate(value, max = 120) {
  const clean = normalizeValue(value);
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

async function buildXmlInvoiceTemplate(data) {
  const currency = normalizeValue(data.currency_code || "PEN");
  const documentName = getDocumentName(data.document_type_code);
  const supplier = data.supplier || {};
  const customer = data.customer || {};
  const totals = data.totals || {};
  const payment = data.payment || {};
  const lines = data.lines || [];

  const logoBase64 = getLogoBase64();

  const qrPayload = normalizeValue(data.qr?.payload || "");
  const qrBase64 = qrPayload
    ? await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 145,
      })
    : "";

  return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(documentName)} ${escapeHtml(data.invoice_number)}</title>

  <style>
    @page {
      size: A4;
      margin: 14mm 13mm 14mm 13mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Calibri, "Carlito", "Segoe UI", Arial, sans-serif;
      color: #26172C;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.42;
    }

    .page {
      width: 100%;
    }

    .hero {
      position: relative;
      overflow: hidden;
      border-radius: 20px;
      padding: 20px 22px;
      margin-bottom: 16px;
      min-height: 155px;
      background: linear-gradient(135deg, #F3EFDC 0%, #ECC9A9 55%, #F7E5D1 100%);
      border: 1px solid #E6C8AA;
    }

    .hero::after {
      content: "";
      position: absolute;
      right: -55px;
      top: -70px;
      width: 190px;
      height: 190px;
      border-radius: 999px;
      background: rgba(201, 120, 71, 0.16);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1fr 240px;
      gap: 18px;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-box {
      width: 122px;
      height: 122px;
      border-radius: 999px;
      background: rgba(255,255,255,0.55);
      border: 1px solid rgba(255,255,255,0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .logo {
      width: 112px;
      max-height: 112px;
      object-fit: contain;
    }

    .logo-fallback {
      width: 112px;
      height: 112px;
      border-radius: 999px;
      background: #26172C;
      color: #F3EFDC;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.1;
    }

    .supplier-name {
      font-size: 21px;
      font-weight: 900;
      margin-bottom: 5px;
      color: #26172C;
    }

    .supplier-detail {
      color: #4f394f;
      margin-bottom: 3px;
    }

    .document-card {
      background: rgba(255,255,255,0.84);
      border: 1px solid rgba(38, 23, 44, 0.16);
      border-radius: 18px;
      overflow: hidden;
      text-align: center;
      box-shadow: 0 10px 24px rgba(38, 23, 44, 0.08);
    }

    .document-ruc {
      padding: 9px 10px;
      font-weight: 900;
      font-size: 13px;
      border-bottom: 1px solid rgba(38,23,44,0.12);
    }

    .document-name {
      padding: 12px 10px;
      background: #26172C;
      color: #F3EFDC;
      font-weight: 900;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    .document-number {
      padding: 12px 10px;
      font-size: 17px;
      font-weight: 900;
      color: #C97847;
    }

    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 14px;
    }

    .card {
      border: 1px solid #ead7c7;
      border-radius: 16px;
      padding: 14px;
      background: #fffdf9;
    }

    .card-title {
      font-size: 12px;
      font-weight: 900;
      color: #C97847;
      text-transform: uppercase;
      margin-bottom: 10px;
      letter-spacing: 0.4px;
    }

    .row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 8px;
      margin-bottom: 5px;
    }

    .label {
      font-weight: 800;
      color: #4f394f;
    }

    .value {
      color: #26172C;
    }

    .table-card {
      margin-top: 14px;
      border: 1px solid #ead7c7;
      border-radius: 18px;
      overflow: hidden;
      background: #fffdf9;
    }

    .table-heading {
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff7ef;
      border-bottom: 1px solid #ead7c7;
    }

    .table-title {
      font-size: 13px;
      font-weight: 900;
      color: #26172C;
    }

    .table-subtitle {
      font-size: 10px;
      color: #7c667b;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
    }

    th {
      background: #26172C;
      color: #F3EFDC;
      padding: 9px 7px;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.25px;
      border-right: 1px solid rgba(255,255,255,0.12);
    }

    td {
      padding: 8px 7px;
      border-top: 1px solid #f0e2d6;
      border-right: 1px solid #f4e7dd;
      vertical-align: top;
      background: #fff;
    }

    tbody tr:nth-child(even) td {
      background: #fffaf5;
    }

    .description {
      font-weight: 800;
      color: #26172C;
    }

    .small {
      font-size: 9.5px;
      color: #7c667b;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .summary-area {
      display: grid;
      grid-template-columns: 1fr 310px;
      gap: 15px;
      margin-top: 15px;
      align-items: start;
    }

    .amount-words {
      border: 1px solid #ead7c7;
      border-radius: 16px;
      padding: 14px;
      background: #fffdf9;
      min-height: 92px;
    }

    .summary {
      border: 1px solid #ead7c7;
      border-radius: 16px;
      overflow: hidden;
      background: #fff;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 12px;
      border-bottom: 1px solid #f0e2d6;
      background: #fff;
    }

    .summary-row.total {
      background: linear-gradient(135deg, #26172C, #C97847);
      color: #fff;
      font-size: 16px;
      font-weight: 900;
      border-bottom: none;
    }

    .qr-section {
      display: grid;
      grid-template-columns: 148px 1fr;
      gap: 15px;
      align-items: center;
      margin-top: 15px;
      padding: 13px;
      border: 1px solid #ead7c7;
      border-radius: 16px;
      background: #fffdf9;
      page-break-inside: avoid;
    }

    .qr-image {
      width: 138px;
      height: 138px;
      object-fit: contain;
      border: 1px solid #ead7c7;
      border-radius: 12px;
      padding: 5px;
      background: #fff;
    }

    .qr-title {
      font-weight: 900;
      color: #26172C;
      margin-bottom: 5px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .qr-payload {
      margin-top: 6px;
      font-size: 8.6px;
      color: #7c667b;
      word-break: break-all;
      line-height: 1.35;
    }

    .footer {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid #ead7c7;
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 9.5px;
      color: #7c667b;
    }

    .tagline {
      font-weight: 800;
      color: #C97847;
    }
  </style>
</head>

<body>
  <div class="page">
    <section class="hero">
      <div class="hero-content">
        <div class="brand">
          <div class="logo-box">
            ${
              logoBase64
                ? `<img class="logo" src="${logoBase64}" />`
                : `<div class="logo-fallback">TANTA<br/>HOUSE</div>`
            }
          </div>

          <div>
            <div class="supplier-name">${escapeHtml(supplier.name)}</div>

            <div class="supplier-detail">
              <strong>RUC:</strong> ${escapeHtml(supplier.tax_id)}
            </div>

            <div class="supplier-detail">
              <strong>Dirección:</strong>
              ${escapeHtml(supplier.address || supplier.seller_address || "-")}
            </div>

            <div class="supplier-detail">
              ${escapeHtml(supplier.department || "")}
              ${supplier.city ? ` - ${escapeHtml(supplier.city)}` : ""}
              ${supplier.district ? ` - ${escapeHtml(supplier.district)}` : ""}
            </div>
          </div>
        </div>

        <div class="document-card">
          <div class="document-ruc">RUC ${escapeHtml(supplier.tax_id)}</div>
          <div class="document-name">${escapeHtml(documentName)}</div>
          <div class="document-number">${escapeHtml(data.invoice_number)}</div>
        </div>
      </div>
    </section>

    <section class="section-grid">
      <div class="card">
        <div class="card-title">Cliente</div>

        <div class="row">
          <div class="label">Razón social</div>
          <div class="value">${escapeHtml(customer.name)}</div>
        </div>

        <div class="row">
          <div class="label">RUC/DNI</div>
          <div class="value">${escapeHtml(customer.tax_id)}</div>
        </div>

        <div class="row">
          <div class="label">Tipo doc.</div>
          <div class="value">${escapeHtml(customer.document_type || "-")}</div>
        </div>

        <div class="row">
          <div class="label">Dirección</div>
          <div class="value">${escapeHtml(customer.address || "-")}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Datos del comprobante</div>

        <div class="row">
          <div class="label">Fecha emisión</div>
          <div class="value">${escapeHtml(formatDate(data.issue_date))}</div>
        </div>

        <div class="row">
          <div class="label">Hora emisión</div>
          <div class="value">${escapeHtml(data.issue_time || "-")}</div>
        </div>

        <div class="row">
          <div class="label">Moneda</div>
          <div class="value">${escapeHtml(currency)}</div>
        </div>

        <div class="row">
          <div class="label">Forma pago</div>
          <div class="value">${escapeHtml(payment.payment_means || "-")}</div>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="table-heading">
        <div>
          <div class="table-title">Detalle del comprobante</div>
          <div class="table-subtitle">Productos/servicios registrados en el XML</div>
        </div>
        <div class="table-subtitle">${lines.length} línea(s)</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 34px;">Ítem</th>
            <th>Descripción</th>
            <th style="width: 58px;">Unidad</th>
            <th style="width: 64px;">Cant.</th>
            <th style="width: 80px;">P. unit.</th>
            <th style="width: 78px;">Base</th>
            <th style="width: 70px;">IGV</th>
            <th style="width: 82px;">Total</th>
          </tr>
        </thead>

        <tbody>
          ${
            lines.length
              ? lines.map((line, index) => {
                  const lineTotal =
                    Number(normalizeValue(line.total_with_tax) || 0) ||
                    Number(normalizeValue(line.line_extension_amount) || 0) +
                      Number(normalizeValue(line.tax_amount) || 0);

                  return `
                    <tr>
                      <td class="text-center">${escapeHtml(line.line_number || index + 1)}</td>
                      <td>
                        <div class="description">${escapeHtml(truncate(line.description, 95))}</div>
                        ${
                          line.tax_affectation_code
                            ? `<div class="small">Afectación IGV: ${escapeHtml(line.tax_affectation_code)}</div>`
                            : ""
                        }
                      </td>
                      <td class="text-center">${escapeHtml(line.unit_code || "-")}</td>
                      <td class="text-right">${Number(normalizeValue(line.quantity) || 0).toFixed(2)}</td>
                      <td class="text-right">${money(line.unit_price_without_tax, currency)}</td>
                      <td class="text-right">${money(line.taxable_amount || line.line_extension_amount, currency)}</td>
                      <td class="text-right">${money(line.tax_amount, currency)}</td>
                      <td class="text-right"><strong>${money(lineTotal, currency)}</strong></td>
                    </tr>
                  `;
                }).join("")
              : `
                <tr>
                  <td colspan="8" class="text-center">Sin líneas registradas</td>
                </tr>
              `
          }
        </tbody>
      </table>
    </section>

    <section class="summary-area">
      <div class="amount-words">
        <div class="card-title">Importe en letras</div>
        <div>${escapeHtml(data.amount_in_words || "-")}</div>
      </div>

      <div class="summary">
        <div class="summary-row">
          <span>Op. gravadas</span>
          <strong>${money(totals.taxable_amount, currency)}</strong>
        </div>

        <div class="summary-row">
          <span>Subtotal</span>
          <strong>${money(totals.subtotal_amount, currency)}</strong>
        </div>

        <div class="summary-row">
          <span>Descuentos</span>
          <strong>${money(totals.allowance_total_amount, currency)}</strong>
        </div>

        <div class="summary-row">
          <span>Cargos</span>
          <strong>${money(totals.charge_total_amount, currency)}</strong>
        </div>

        <div class="summary-row">
          <span>IGV</span>
          <strong>${money(totals.tax_amount, currency)}</strong>
        </div>

        <div class="summary-row total">
          <span>Total</span>
          <strong>${money(totals.total_amount, currency)}</strong>
        </div>
      </div>
    </section>

    ${
      qrBase64
        ? `
          <section class="qr-section">
            <div>
              <img class="qr-image" src="${qrBase64}" />
            </div>

            <div>
              <div class="qr-title">Código QR SUNAT</div>
              <div class="small">
                Código generado a partir de los datos tributarios del XML.
              </div>

              ${
                data.qr?.digest_value
                  ? `<div class="small"><strong>DigestValue:</strong> ${escapeHtml(data.qr.digest_value)}</div>`
                  : ""
              }

              <div class="qr-payload">${escapeHtml(qrPayload)}</div>
            </div>
          </section>
        `
        : ""
    }

    <div class="footer">
      <div>Representación visual generada a partir de XML UBL/SUNAT.</div>
      <div class="tagline">Tanta House · La vida hay que saber hornearla.</div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = buildXmlInvoiceTemplate;
