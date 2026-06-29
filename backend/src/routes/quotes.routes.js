const express = require("express");
const router = express.Router();
const pool = require("../db");
const quoteTemplate = require("../templates/quote.template");
const { htmlToPdfBuffer } = require("../services/pdf.service");

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
};

const toNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return Number(value);
};

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return Boolean(value);
};

async function calculateSalesLineTax(client, line, headerDefaults = {}) {
  const quantity = toNumber(line.quantity, 1);
  const unitPrice = toNumber(line.unit_price, 0);
  const discountAmount = toNumber(line.discount_amount, 0);

  const applyTax =
    line.apply_tax === undefined || line.apply_tax === null
      ? toBoolean(headerDefaults.apply_tax, false)
      : toBoolean(line.apply_tax, false);

  const pricesIncludeTax =
    line.prices_include_tax === undefined || line.prices_include_tax === null
      ? toBoolean(headerDefaults.prices_include_tax, true)
      : toBoolean(line.prices_include_tax, true);

  const taxPercentage =
    line.tax_percentage === undefined || line.tax_percentage === null || line.tax_percentage === ""
      ? toNumber(headerDefaults.tax_percentage, 18)
      : toNumber(line.tax_percentage, 18);

  const manualTaxAmount = toNumberOrNull(line.manual_tax_amount);
  const manualTotalAmount = toNumberOrNull(line.manual_total_amount);
  const manualAdjustmentAmount = toNumber(line.manual_adjustment_amount, 0);

  const result = await client.query(
    `
    SELECT *
    FROM tanta_house.calculate_sales_line_tax(
      $1::numeric,
      $2::numeric,
      $3::numeric,
      $4::boolean,
      $5::boolean,
      $6::numeric,
      $7::numeric,
      $8::numeric,
      $9::numeric
    );
    `,
    [
      quantity,
      unitPrice,
      discountAmount,
      applyTax,
      pricesIncludeTax,
      taxPercentage,
      manualTaxAmount,
      manualTotalAmount,
      manualAdjustmentAmount,
    ]
  );

  const calculated = result.rows[0];

  return {
    quantity,
    unit_price: unitPrice,
    discount_amount: discountAmount,

    apply_tax: applyTax,
    prices_include_tax: pricesIncludeTax,
    tax_percentage: taxPercentage,

    line_subtotal: calculated.line_subtotal,
    taxable_amount: calculated.taxable_amount,
    exempt_amount: calculated.exempt_amount,
    calculated_tax_amount: calculated.calculated_tax_amount,
    final_tax_amount: calculated.final_tax_amount,
    calculated_total_amount: calculated.calculated_total_amount,
    final_total_amount: calculated.final_total_amount,

    manual_tax_amount: manualTaxAmount,
    manual_total_amount: manualTotalAmount,
    manual_adjustment_amount: manualAdjustmentAmount,
    manual_adjustment_reason: line.manual_adjustment_reason || null,
    is_tax_manual: manualTaxAmount !== null,
    is_total_manual: manualTotalAmount !== null,

    // Compatibilidad con el modelo anterior
    line_total: calculated.final_total_amount,

    // Snapshot de receta para trazabilidad comercial
    recipe_cost_snapshot: toNumberOrNull(line.recipe_cost_snapshot),
    recipe_suggested_price_snapshot: toNumberOrNull(line.recipe_suggested_price_snapshot),
    recipe_costing_mode: line.recipe_costing_mode || null,
    price_was_modified: Boolean(line.price_was_modified),
  };
}

router.get("/", async (req, res) => {
  try {
    const { status, search, campaign_id, source_channel_id } = req.query;

    const values = [];
    let where = "WHERE q.is_active = TRUE";

    if (status) {
      values.push(status);
      where += ` AND q.quote_status = $${values.length}`;
    }

    if (campaign_id) {
      values.push(Number(campaign_id));
      where += ` AND q.campaign_id = $${values.length}`;
    }

    if (source_channel_id) {
      values.push(Number(source_channel_id));
      where += ` AND q.source_channel_id = $${values.length}`;
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where += ` AND (
        LOWER(q.quote_number) LIKE $${values.length}
        OR LOWER(COALESCE(q.customer_name,'')) LIKE $${values.length}
        OR LOWER(COALESCE(q.customer_phone,'')) LIKE $${values.length}
        OR LOWER(COALESCE(q.referred_by_name,'')) LIKE $${values.length}
        OR LOWER(COALESCE(q.delivery_contact_name,'')) LIKE $${values.length}
      )`;
    }

    const result = await pool.query(
      `
      SELECT
        q.*,
        sc.source_channel_name,
        c.campaign_name
      FROM tanta_house.sales_quote q
      LEFT JOIN tanta_house.source_channel sc
        ON sc.source_channel_id = q.source_channel_id
      LEFT JOIN tanta_house.sales_campaign c
        ON c.campaign_id = q.campaign_id
      ${where}
      ORDER BY q.quote_date DESC, q.quote_id DESC;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando cotizaciones:", error);
    res.status(500).json({
      message: "Error consultando cotizaciones",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const quoteId = Number(req.params.id);

    const header = await pool.query(
      `
      SELECT
        q.*,
        sc.source_channel_name,
        c.campaign_name
      FROM tanta_house.sales_quote q
      LEFT JOIN tanta_house.source_channel sc
        ON sc.source_channel_id = q.source_channel_id
      LEFT JOIN tanta_house.sales_campaign c
        ON c.campaign_id = q.campaign_id
      WHERE q.quote_id = $1;
      `,
      [quoteId]
    );

    if (header.rows.length === 0) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    const lines = await pool.query(
      `
      SELECT
        ql.*,
        r.recipe_code,
        r.recipe_name,
        u.unit_code
      FROM tanta_house.sales_quote_line ql
      LEFT JOIN tanta_house.recipe r
        ON r.recipe_id = ql.recipe_id
      LEFT JOIN tanta_house.unit_of_measure u
        ON u.unit_id = ql.unit_id
      WHERE ql.quote_id = $1
      ORDER BY ql.line_number, ql.quote_line_id;
      `,
      [quoteId]
    );

    res.json({
      quote: header.rows[0],
      lines: lines.rows,
    });
  } catch (error) {
    console.error("Error consultando cotización:", error);
    res.status(500).json({
      message: "Error consultando cotización",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,

      referred_by_name,
      source_channel_id,
      campaign_id,

      quote_date,
      valid_until,
      quote_status = "DRAFT",

      delivery_contact_name,
      delivery_phone,
      delivery_department,
      delivery_province,
      delivery_district,
      delivery_address,
      delivery_reference,
      requested_delivery_date,
      requested_delivery_time,

      apply_tax = false,
      prices_include_tax = true,
      tax_percentage = 18,

      discount_amount = 0,
      delivery_amount = 0,
      manual_adjustment_amount = 0,
      manual_adjustment_reason,

      currency_code = "PEN",
      commercial_terms,
      notes,

      lines = [],
      created_by = 1,
    } = req.body;

    if (!customer_id && !customer_name?.trim()) {
      return res.status(400).json({
        message: "Debes indicar un cliente registrado o un nombre de cliente",
      });
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        message: "La cotización debe tener al menos una línea",
      });
    }

    await client.query("BEGIN");

    let customerSnapshot = {
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
    };

    if (customer_id) {
      const customerResult = await client.query(
        `
        SELECT *
        FROM tanta_house.customer
        WHERE customer_id = $1;
        `,
        [Number(customer_id)]
      );

      if (customerResult.rows.length > 0) {
        const customer = customerResult.rows[0];

        customerSnapshot = {
          customer_name: customer.customer_name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          customer_address: customer.address,
        };
      }
    }

    const headerDefaults = {
      apply_tax: Boolean(apply_tax),
      prices_include_tax: Boolean(prices_include_tax),
      tax_percentage: toNumber(tax_percentage, 18),
    };

    const quoteResult = await client.query(
      `
      INSERT INTO tanta_house.sales_quote (
        quote_number,
        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,

        referred_by_name,
        source_channel_id,
        campaign_id,

        quote_date,
        valid_until,
        quote_status,

        delivery_contact_name,
        delivery_phone,
        delivery_department,
        delivery_province,
        delivery_district,
        delivery_address,
        delivery_reference,
        requested_delivery_date,
        requested_delivery_time,

        apply_tax,
        prices_include_tax,
        tax_percentage,

        discount_amount,
        delivery_amount,
        manual_adjustment_amount,
        manual_adjustment_reason,

        currency_code,
        commercial_terms,
        notes,

        created_by
      )
      VALUES (
        tanta_house.generate_sales_quote_number(),
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,
        $12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,
        $24,$25,$26,$27,
        $28,$29,$30,
        $31
      )
      RETURNING *;
      `,
      [
        toNumberOrNull(customer_id),
        customerSnapshot.customer_name || null,
        customerSnapshot.customer_phone || null,
        customerSnapshot.customer_email || null,
        customerSnapshot.customer_address || null,

        referred_by_name || null,
        toNumberOrNull(source_channel_id),
        toNumberOrNull(campaign_id),

        quote_date || new Date().toISOString().substring(0, 10),
        valid_until || null,
        quote_status || "DRAFT",

        delivery_contact_name || customerSnapshot.customer_name || null,
        delivery_phone || customerSnapshot.customer_phone || null,
        delivery_department || null,
        delivery_province || null,
        delivery_district || null,
        delivery_address || customerSnapshot.customer_address || null,
        delivery_reference || null,
        requested_delivery_date || null,
        requested_delivery_time || null,

        Boolean(apply_tax),
        Boolean(prices_include_tax),
        toNumber(tax_percentage, 18),

        toNumber(discount_amount, 0),
        toNumber(delivery_amount, 0),
        toNumber(manual_adjustment_amount, 0),
        manual_adjustment_reason || null,

        currency_code || "PEN",
        commercial_terms || null,
        notes || null,

        Number(created_by || 1),
      ]
    );

    const quote = quoteResult.rows[0];

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const calculatedLine = await calculateSalesLineTax(client, line, headerDefaults);

      await client.query(
        `
        INSERT INTO tanta_house.sales_quote_line (
          quote_id,
          line_number,
          recipe_id,
          item_description,
          quantity,
          unit_id,
          unit_price,
          discount_amount,

          apply_tax,
          prices_include_tax,
          tax_percentage,

          line_subtotal,
          taxable_amount,
          exempt_amount,
          calculated_tax_amount,
          manual_tax_amount,
          final_tax_amount,
          calculated_total_amount,
          manual_total_amount,
          final_total_amount,
          manual_adjustment_amount,
          manual_adjustment_reason,
          is_tax_manual,
          is_total_manual,

          line_total,
          notes,
          created_by,
          recipe_cost_snapshot,
          recipe_suggested_price_snapshot,
          recipe_costing_mode,
          price_was_modified
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,
          $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
          $25,$26,$27,$28,$29,$30,$31
        );
        `,
        [
          quote.quote_id,
          index + 1,
          toNumberOrNull(line.recipe_id),
          line.item_description,
          calculatedLine.quantity,
          toNumberOrNull(line.unit_id),
          calculatedLine.unit_price,
          calculatedLine.discount_amount,

          calculatedLine.apply_tax,
          calculatedLine.prices_include_tax,
          calculatedLine.tax_percentage,

          calculatedLine.line_subtotal,
          calculatedLine.taxable_amount,
          calculatedLine.exempt_amount,
          calculatedLine.calculated_tax_amount,
          calculatedLine.manual_tax_amount,
          calculatedLine.final_tax_amount,
          calculatedLine.calculated_total_amount,
          calculatedLine.manual_total_amount,
          calculatedLine.final_total_amount,
          calculatedLine.manual_adjustment_amount,
          calculatedLine.manual_adjustment_reason,
          calculatedLine.is_tax_manual,
          calculatedLine.is_total_manual,

          calculatedLine.line_total,
          line.notes || null,
          Number(created_by || 1),
          calculatedLine.recipe_cost_snapshot,
          calculatedLine.recipe_suggested_price_snapshot,
          calculatedLine.recipe_costing_mode,
          calculatedLine.price_was_modified,
        ]
      );
    }

    await client.query(
      `
      SELECT tanta_house.recalculate_quote_totals($1);
      `,
      [quote.quote_id]
    );

    await client.query("COMMIT");

    const finalQuote = await pool.query(
      `
      SELECT *
      FROM tanta_house.sales_quote
      WHERE quote_id = $1;
      `,
      [quote.quote_id]
    );

    res.status(201).json(finalQuote.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creando cotización:", error);

    res.status(500).json({
      message: "Error creando cotización",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  } finally {
    client.release();
  }
});

router.put("/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const quoteId = Number(req.params.id);

    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,

      referred_by_name,
      source_channel_id,
      campaign_id,

      quote_date,
      valid_until,
      quote_status,

      delivery_contact_name,
      delivery_phone,
      delivery_department,
      delivery_province,
      delivery_district,
      delivery_address,
      delivery_reference,
      requested_delivery_date,
      requested_delivery_time,

      apply_tax = false,
      prices_include_tax = true,
      tax_percentage = 18,

      discount_amount = 0,
      delivery_amount = 0,
      manual_adjustment_amount = 0,
      manual_adjustment_reason,

      currency_code = "PEN",
      commercial_terms,
      notes,

      lines = [],
      updated_by = 1,
    } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        message: "La cotización debe tener al menos una línea",
      });
    }

    await client.query("BEGIN");

    const currentQuote = await client.query(
      `
      SELECT *
      FROM tanta_house.sales_quote
      WHERE quote_id = $1;
      `,
      [quoteId]
    );

    if (currentQuote.rows.length === 0) {
      throw new Error("Cotización no encontrada");
    }

    const headerDefaults = {
      apply_tax: Boolean(apply_tax),
      prices_include_tax: Boolean(prices_include_tax),
      tax_percentage: toNumber(tax_percentage, 18),
    };

    await client.query(
      `
      UPDATE tanta_house.sales_quote
      SET
        customer_id = $1,
        customer_name = $2,
        customer_phone = $3,
        customer_email = $4,
        customer_address = $5,

        referred_by_name = $6,
        source_channel_id = $7,
        campaign_id = $8,

        quote_date = $9,
        valid_until = $10,
        quote_status = $11,

        delivery_contact_name = $12,
        delivery_phone = $13,
        delivery_department = $14,
        delivery_province = $15,
        delivery_district = $16,
        delivery_address = $17,
        delivery_reference = $18,
        requested_delivery_date = $19,
        requested_delivery_time = $20,

        apply_tax = $21,
        prices_include_tax = $22,
        tax_percentage = $23,

        discount_amount = $24,
        delivery_amount = $25,
        manual_adjustment_amount = $26,
        manual_adjustment_reason = $27,

        currency_code = $28,
        commercial_terms = $29,
        notes = $30,

        updated_at = CURRENT_TIMESTAMP,
        updated_by = $31
      WHERE quote_id = $32;
      `,
      [
        toNumberOrNull(customer_id),
        customer_name || null,
        customer_phone || null,
        customer_email || null,
        customer_address || null,

        referred_by_name || null,
        toNumberOrNull(source_channel_id),
        toNumberOrNull(campaign_id),

        quote_date || currentQuote.rows[0].quote_date,
        valid_until || currentQuote.rows[0].valid_until,
        quote_status || currentQuote.rows[0].quote_status,

        delivery_contact_name || null,
        delivery_phone || null,
        delivery_department || null,
        delivery_province || null,
        delivery_district || null,
        delivery_address || null,
        delivery_reference || null,
        requested_delivery_date || null,
        requested_delivery_time || null,

        Boolean(apply_tax),
        Boolean(prices_include_tax),
        toNumber(tax_percentage, 18),

        toNumber(discount_amount, 0),
        toNumber(delivery_amount, 0),
        toNumber(manual_adjustment_amount, 0),
        manual_adjustment_reason || null,

        currency_code || "PEN",
        commercial_terms || null,
        notes || null,

        Number(updated_by || 1),
        quoteId,
      ]
    );

    await client.query(
      `
      DELETE FROM tanta_house.sales_quote_line
      WHERE quote_id = $1;
      `,
      [quoteId]
    );

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const calculatedLine = await calculateSalesLineTax(client, line, headerDefaults);

      await client.query(
        `
        INSERT INTO tanta_house.sales_quote_line (
          quote_id,
          line_number,
          recipe_id,
          item_description,
          quantity,
          unit_id,
          unit_price,
          discount_amount,

          apply_tax,
          prices_include_tax,
          tax_percentage,

          line_subtotal,
          taxable_amount,
          exempt_amount,
          calculated_tax_amount,
          manual_tax_amount,
          final_tax_amount,
          calculated_total_amount,
          manual_total_amount,
          final_total_amount,
          manual_adjustment_amount,
          manual_adjustment_reason,
          is_tax_manual,
          is_total_manual,

          line_total,
          notes,
          created_by,
          updated_by,
          recipe_cost_snapshot,
          recipe_suggested_price_snapshot,
          recipe_costing_mode,
          price_was_modified,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,
          $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
          $25,$26,$27,$28,$29,$30,$31,$32,CURRENT_TIMESTAMP
        );
        `,
        [
          quoteId,
          index + 1,
          toNumberOrNull(line.recipe_id),
          line.item_description,
          calculatedLine.quantity,
          toNumberOrNull(line.unit_id),
          calculatedLine.unit_price,
          calculatedLine.discount_amount,

          calculatedLine.apply_tax,
          calculatedLine.prices_include_tax,
          calculatedLine.tax_percentage,

          calculatedLine.line_subtotal,
          calculatedLine.taxable_amount,
          calculatedLine.exempt_amount,
          calculatedLine.calculated_tax_amount,
          calculatedLine.manual_tax_amount,
          calculatedLine.final_tax_amount,
          calculatedLine.calculated_total_amount,
          calculatedLine.manual_total_amount,
          calculatedLine.final_total_amount,
          calculatedLine.manual_adjustment_amount,
          calculatedLine.manual_adjustment_reason,
          calculatedLine.is_tax_manual,
          calculatedLine.is_total_manual,

          calculatedLine.line_total,
          line.notes || null,
          Number(updated_by || 1),
          Number(updated_by || 1),
          calculatedLine.recipe_cost_snapshot,
          calculatedLine.recipe_suggested_price_snapshot,
          calculatedLine.recipe_costing_mode,
          calculatedLine.price_was_modified,
        ]
      );
    }

    await client.query(
      `
      SELECT tanta_house.recalculate_quote_totals($1);
      `,
      [quoteId]
    );

    await client.query("COMMIT");

    const finalQuote = await pool.query(
      `
      SELECT *
      FROM tanta_house.sales_quote
      WHERE quote_id = $1;
      `,
      [quoteId]
    );

    res.json(finalQuote.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error actualizando cotización:", error);

    res.status(500).json({
      message: "Error actualizando cotización",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  } finally {
    client.release();
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status, updated_by = 1 } = req.body;

    const result = await pool.query(
      `
      UPDATE tanta_house.sales_quote
      SET
        quote_status = $1,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $2
      WHERE quote_id = $3
      RETURNING *;
      `,
      [status, Number(updated_by || 1), Number(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando estado de cotización:", error);

    res.status(500).json({
      message: "Error actualizando estado de cotización",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/:id/pdf", async (req, res) => {
  try {
    const quoteId = Number(req.params.id);

    const header = await pool.query(
      `
      SELECT
        q.*,
        sc.source_channel_name,
        c.campaign_name
      FROM tanta_house.sales_quote q
      LEFT JOIN tanta_house.source_channel sc
        ON sc.source_channel_id = q.source_channel_id
      LEFT JOIN tanta_house.sales_campaign c
        ON c.campaign_id = q.campaign_id
      WHERE q.quote_id = $1;
      `,
      [quoteId]
    );

    if (header.rows.length === 0) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    const lines = await pool.query(
      `
      SELECT
        ql.*,
        r.recipe_code,
        r.recipe_name,
        u.unit_code
      FROM tanta_house.sales_quote_line ql
      LEFT JOIN tanta_house.recipe r
        ON r.recipe_id = ql.recipe_id
      LEFT JOIN tanta_house.unit_of_measure u
        ON u.unit_id = ql.unit_id
      WHERE ql.quote_id = $1
      ORDER BY ql.line_number, ql.quote_line_id;
      `,
      [quoteId]
    );

    const html = quoteTemplate({
      quote: header.rows[0],
      lines: lines.rows,
    });

    const pdfBuffer = await htmlToPdfBuffer(html);

    await pool.query(
      `
      UPDATE tanta_house.sales_quote
      SET pdf_generated_at = CURRENT_TIMESTAMP
      WHERE quote_id = $1;
      `,
      [quoteId]
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${header.rows[0].quote_number}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generando PDF:", error);

    res.status(500).json({
      message: "Error generando PDF de cotización",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

module.exports = router;
