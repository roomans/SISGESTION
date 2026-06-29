const { XMLParser } = require("fast-xml-parser");

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function text(value, defaultValue = "") {
  if (value === undefined || value === null) return defaultValue;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    const clean = String(value).trim();
    return clean === "" ? defaultValue : clean;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return defaultValue;
    return text(value[0], defaultValue);
  }

  if (typeof value === "object") {
    const preferredTextKeys = ["#text", "__cdata", "_text", "text"];

    for (const key of preferredTextKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        return text(value[key], defaultValue);
      }
    }

    return defaultValue;
  }

  return defaultValue;
}

function number(value, defaultValue = 0) {
  const raw = text(value, "");
  if (raw === "") return defaultValue;

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function pick(obj, ...paths) {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[key];
    }, obj);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function findFirstByKey(obj, keyName) {
  if (!obj || typeof obj !== "object") return undefined;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findFirstByKey(item, keyName);
      if (found !== undefined && found !== null && found !== "") return found;
    }
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(obj, keyName)) {
    return obj[keyName];
  }

  for (const value of Object.values(obj)) {
    const found = findFirstByKey(value, keyName);
    if (found !== undefined && found !== null && found !== "") return found;
  }

  return undefined;
}

function splitInvoiceNumber(invoiceNumber) {
  const clean = text(invoiceNumber, "");
  const [series = "", sequential = ""] = clean.split("-");

  return {
    series,
    sequential,
  };
}

function getPartyIdentification(party = {}) {
  return first(pick(party, "PartyIdentification")) || {};
}

function getPartyLegalEntity(party = {}) {
  return first(pick(party, "PartyLegalEntity")) || {};
}

function getPartyData(party = {}) {
  const partyIdentification = getPartyIdentification(party);
  const partyLegalEntity = getPartyLegalEntity(party);
  const partyName = first(pick(party, "PartyName")) || {};

  const identification = pick(partyIdentification, "ID");
  const registrationName = pick(partyLegalEntity, "RegistrationName");
  const commercialName = pick(partyName, "Name");

  const address = first(pick(partyLegalEntity, "RegistrationAddress")) || {};
  const addressLine = first(pick(address, "AddressLine")) || {};

  return {
    name: text(registrationName || commercialName, "-"),
    tax_id: text(identification, "-"),
    document_type: text(identification?.schemeID, ""),
    address: text(pick(addressLine, "Line"), ""),
    city: text(pick(address, "CityName"), ""),
    district: text(pick(address, "District"), ""),
    department: text(pick(address, "CountrySubentity"), ""),
    ubigeo: text(pick(address, "CountrySubentityCode"), ""),
  };
}

function getLineData(line = {}) {
  const item = first(pick(line, "Item")) || {};
  const price = first(pick(line, "Price")) || {};
  const pricingReference =
    first(pick(line, "PricingReference.AlternativeConditionPrice")) || {};

  const taxTotal = first(pick(line, "TaxTotal")) || {};
  const taxSubtotal = first(pick(taxTotal, "TaxSubtotal")) || {};
  const taxCategory = first(pick(taxSubtotal, "TaxCategory")) || {};

  const quantityNode = pick(line, "InvoicedQuantity");

  const unitPriceWithoutTax = number(pick(price, "PriceAmount"));
  const unitPriceWithTax = number(pick(pricingReference, "PriceAmount"));
  const taxableAmount = number(pick(taxSubtotal, "TaxableAmount"));
  const taxAmount = number(
    pick(taxSubtotal, "TaxAmount") || pick(taxTotal, "TaxAmount")
  );

  return {
    line_number: number(pick(line, "ID")),
    quantity: number(quantityNode),
    unit_code: quantityNode?.unitCode || "",
    description: text(pick(item, "Description") || pick(item, "Name"), "-"),
    item_code: text(pick(first(pick(item, "SellersItemIdentification")) || {}, "ID"), ""),
    line_extension_amount: number(pick(line, "LineExtensionAmount")),
    unit_price_without_tax: unitPriceWithoutTax,
    unit_price_with_tax: unitPriceWithTax,
    taxable_amount: taxableAmount,
    tax_amount: taxAmount,
    total_with_tax: taxableAmount + taxAmount,
    tax_percent: number(pick(taxCategory, "Percent")),
    tax_affectation_code: text(pick(taxCategory, "TaxExemptionReasonCode"), ""),
    free_of_charge: text(pick(line, "FreeOfChargeIndicator"), "false") === "true",
  };
}

function buildSunatQrPayload({
  supplier,
  customer,
  documentTypeCode,
  invoiceNumber,
  taxAmount,
  totalAmount,
  issueDate,
  digestValue,
}) {
  const { series, sequential } = splitInvoiceNumber(invoiceNumber);

  return [
    supplier.tax_id || "",
    documentTypeCode || "",
    series || "",
    sequential || "",
    Number(taxAmount || 0).toFixed(2),
    Number(totalAmount || 0).toFixed(2),
    issueDate || "",
    customer.document_type || "",
    customer.tax_id || "",
    digestValue || "",
  ].join("|");
}

async function parseXmlInvoice(xmlContent) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text",
    cdataPropName: "#text",
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true,
    removeNSPrefix: true,
  });

  const parsed = parser.parse(xmlContent);
  const invoice = parsed.Invoice;

  if (!invoice) {
    throw new Error("No se encontró el nodo Invoice en el XML.");
  }

  const supplierParty = pick(invoice, "AccountingSupplierParty.Party") || {};
  const customerParty = pick(invoice, "AccountingCustomerParty.Party") || {};
  const sellerAddress = pick(invoice, "SellerSupplierParty.Party.PostalAddress");

  const taxTotal = first(pick(invoice, "TaxTotal")) || {};
  const legalMonetaryTotal = pick(invoice, "LegalMonetaryTotal") || {};
  const paymentTerms = first(pick(invoice, "PaymentTerms")) || {};

  const notes = asArray(pick(invoice, "Note")).map((note) => text(note));
  const invoiceLines = asArray(pick(invoice, "InvoiceLine"));

  const supplier = getPartyData(supplierParty);
  const customer = getPartyData(customerParty);

  if (sellerAddress) {
    const sellerAddressLine = first(pick(sellerAddress, "AddressLine")) || {};

    supplier.seller_address = text(
      pick(sellerAddressLine, "Line"),
      supplier.address
    );

    supplier.seller_city = text(pick(sellerAddress, "CityName"), supplier.city);
    supplier.seller_district = text(
      pick(sellerAddress, "District"),
      supplier.district
    );
  }

  const invoiceNumber = text(pick(invoice, "ID"), "-");
  const documentTypeCode = text(pick(invoice, "InvoiceTypeCode"), "");
  const issueDate = text(pick(invoice, "IssueDate"), null);
  const issueTime = text(pick(invoice, "IssueTime"), null);

  const subtotalAmount = number(pick(legalMonetaryTotal, "LineExtensionAmount"));
  const taxAmount = number(pick(taxTotal, "TaxAmount"));
  const totalAmount = number(pick(legalMonetaryTotal, "PayableAmount"));

  const digestValue = text(
    pick(
      parsed,
      "Invoice.UBLExtensions.UBLExtension.ExtensionContent.Signature.SignedInfo.Reference.DigestValue"
    ) || findFirstByKey(invoice, "DigestValue"),
    ""
  );

  const { series, sequential } = splitInvoiceNumber(invoiceNumber);

  const qrPayload = buildSunatQrPayload({
    supplier,
    customer,
    documentTypeCode,
    invoiceNumber,
    taxAmount,
    totalAmount,
    issueDate,
    digestValue,
  });

  return {
    document_type: "INVOICE",
    document_type_code: documentTypeCode,
    invoice_number: invoiceNumber,
    series,
    sequential,
    issue_date: issueDate,
    issue_time: issueTime,
    currency_code: text(pick(invoice, "DocumentCurrencyCode"), "PEN"),
    amount_in_words: notes.find((item) => item.startsWith("SON:")) || "",

    payment: {
      payment_terms_id: text(pick(paymentTerms, "ID"), ""),
      payment_means: text(pick(paymentTerms, "PaymentMeansID"), ""),
    },

    supplier,
    customer,

    totals: {
      subtotal_amount: subtotalAmount,
      taxable_amount: number(
        pick(taxTotal, "TaxSubtotal.TaxableAmount"),
        subtotalAmount
      ),
      tax_amount: taxAmount,
      allowance_total_amount: number(
        pick(legalMonetaryTotal, "AllowanceTotalAmount")
      ),
      charge_total_amount: number(pick(legalMonetaryTotal, "ChargeTotalAmount")),
      prepaid_amount: number(pick(legalMonetaryTotal, "PrepaidAmount")),
      total_amount: totalAmount,
    },

    lines: invoiceLines.map(getLineData),

    qr: {
      digest_value: digestValue,
      payload: qrPayload,
      components: {
        supplier_tax_id: supplier.tax_id || "",
        document_type_code: documentTypeCode || "",
        series,
        sequential,
        tax_amount: Number(taxAmount || 0).toFixed(2),
        total_amount: Number(totalAmount || 0).toFixed(2),
        issue_date: issueDate || "",
        customer_document_type: customer.document_type || "",
        customer_tax_id: customer.tax_id || "",
        digest_value: digestValue || "",
      },
    },

    raw: {
      ubl_version: text(pick(invoice, "UBLVersionID")),
      customization_id: text(pick(invoice, "CustomizationID")),
    },
  };
}

module.exports = {
  parseXmlInvoice,
};
