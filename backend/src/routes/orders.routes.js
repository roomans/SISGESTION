const express = require("express");
const router = express.Router();
const pool = require("../db");

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
    let where = "WHERE o.is_active = TRUE";

    if (status) {
      values.push(status);
      where += ` AND o.order_status = $${values.length}`;
    }

    if (campaign_id) {
      values.push(Number(campaign_id));
      where += ` AND o.campaign_id = $${values.length}`;
    }

    if (source_channel_id) {
      values.push(Number(source_channel_id));
      where += ` AND o.source_channel_id = $${values.length}`;
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where += ` AND (
        LOWER(o.order_number) LIKE $${values.length}
        OR LOWER(COALESCE(o.customer_name,'')) LIKE $${values.length}
        OR LOWER(COALESCE(o.customer_phone,'')) LIKE $${values.length}
      )`;
    }

    const result = await pool.query(
      `
      SELECT
        o.*,
        sc.source_channel_name,
        c.campaign_name
      FROM tanta_house.sales_order o
      LEFT JOIN tanta_house.source_channel sc
        ON sc.source_channel_id = o.source_channel_id
      LEFT JOIN tanta_house.sales_campaign c
        ON c.campaign_id = o.campaign_id
      ${where}
      ORDER BY o.order_date DESC, o.order_id DESC;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando pedidos:", error);

    res.status(500).json({
      message: "Error consultando pedidos",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const header = await pool.query(
      `
      SELECT
        o.*,
        sc.source_channel_name,
        c.campaign_name
      FROM tanta_house.sales_order o
      LEFT JOIN tanta_house.source_channel sc
        ON sc.source_channel_id = o.source_channel_id
      LEFT JOIN tanta_house.sales_campaign c
        ON c.campaign_id = o.campaign_id
      WHERE o.order_id = $1;
      `,
      [orderId]
    );

    if (header.rows.length === 0) {
      return res.status(404).json({
        message: "Pedido no encontrado",
      });
    }

    const lines = await pool.query(
      `
      SELECT
        ol.*,
        r.recipe_code,
        r.recipe_name,
        u.unit_code
      FROM tanta_house.sales_order_line ol
      LEFT JOIN tanta_house.recipe r
        ON r.recipe_id = ol.recipe_id
      LEFT JOIN tanta_house.unit_of_measure u
        ON u.unit_id = ol.unit_id
      WHERE ol.order_id = $1
      ORDER BY ol.line_number, ol.order_line_id;
      `,
      [orderId]
    );

    res.json({
      order: header.rows[0],
      lines: lines.rows,
    });
  } catch (error) {
    console.error("Error consultando pedido:", error);

    res.status(500).json({
      message: "Error consultando pedido",
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
      quote_id,

      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,

      referred_by_name,
      source_channel_id,
      campaign_id,

      order_date,
      order_status = "PENDING",

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

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        message: "El pedido debe tener al menos una línea",
      });
    }

    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      INSERT INTO tanta_house.sales_order (
        order_number,
        quote_id,

        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,

        referred_by_name,
        source_channel_id,
        campaign_id,

        order_date,
        order_status,

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
        tanta_house.generate_sales_order_number(),
        $1,
        $2,$3,$4,$5,$6,
        $7,$8,$9,
        $10,$11,
        $12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,
        $24,$25,$26,$27,
        $28,$29,$30,
        $31
      )
      RETURNING *;
      `,
      [
        toNumberOrNull(quote_id),

        toNumberOrNull(customer_id),
        customer_name || null,
        customer_phone || null,
        customer_email || null,
        customer_address || null,

        referred_by_name || null,
        toNumberOrNull(source_channel_id),
        toNumberOrNull(campaign_id),

        order_date || new Date().toISOString().substring(0, 10),
        order_status || "PENDING",

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

        Number(created_by || 1),
      ]
    );

    const order = orderResult.rows[0];

    const headerDefaults = {
      apply_tax: Boolean(apply_tax),
      prices_include_tax: Boolean(prices_include_tax),
      tax_percentage: toNumber(tax_percentage, 18),
    };

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      const calculatedLine = await calculateSalesLineTax(
        client,
        line,
        headerDefaults
      );

      await client.query(
        `
        INSERT INTO tanta_house.sales_order_line (
          order_id,
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
          order.order_id,
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
      SELECT tanta_house.recalculate_order_totals($1);
      `,
      [order.order_id]
    );

    await client.query("COMMIT");

    const finalOrder = await pool.query(
      `
      SELECT *
      FROM tanta_house.sales_order
      WHERE order_id = $1;
      `,
      [order.order_id]
    );

    res.status(201).json(finalOrder.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error creando pedido:", error);

    res.status(500).json({
      message: "Error creando pedido",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  } finally {
    client.release();
  }
});

router.post("/from-quote/:quoteId", async (req, res) => {
  const client = await pool.connect();

  try {
    const quoteId = Number(req.params.quoteId);
    const createdBy = Number(req.body.created_by || 1);

    await client.query("BEGIN");

    const quoteResult = await client.query(
      `
      SELECT *
      FROM tanta_house.sales_quote
      WHERE quote_id = $1;
      `,
      [quoteId]
    );

    if (quoteResult.rows.length === 0) {
      throw new Error("Cotización no encontrada");
    }

    const quote = quoteResult.rows[0];

    const quoteLinesResult = await client.query(
      `
      SELECT *
      FROM tanta_house.sales_quote_line
      WHERE quote_id = $1
      ORDER BY line_number;
      `,
      [quoteId]
    );

    const orderResult = await client.query(
      `
      INSERT INTO tanta_house.sales_order (
        order_number,
        quote_id,

        customer_id,
        customer_name,
        customer_phone,
        customer_email,
        customer_address,

        referred_by_name,
        source_channel_id,
        campaign_id,

        order_date,
        order_status,

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

        subtotal_amount,
        taxable_amount,
        exempt_amount,
        calculated_tax_amount,
        final_tax_amount,

        discount_amount,
        delivery_amount,
        manual_adjustment_amount,
        manual_adjustment_reason,

        total_amount,
        currency_code,
        commercial_terms,
        notes,

        created_by
      )
      VALUES (
        tanta_house.generate_sales_order_number(),
        $1,
        $2,$3,$4,$5,$6,
        $7,$8,$9,
        CURRENT_DATE,
        'PENDING',
        $10,$11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,
        $22,$23,$24,$25,$26,
        $27,$28,$29,$30,
        $31,$32,$33,$34,
        $35
      )
      RETURNING *;
      `,
      [
        quote.quote_id,

        quote.customer_id,
        quote.customer_name,
        quote.customer_phone,
        quote.customer_email,
        quote.customer_address,

        quote.referred_by_name,
        quote.source_channel_id,
        quote.campaign_id,

        quote.delivery_contact_name,
        quote.delivery_phone,
        quote.delivery_department,
        quote.delivery_province,
        quote.delivery_district,
        quote.delivery_address,
        quote.delivery_reference,
        quote.requested_delivery_date,
        quote.requested_delivery_time,

        quote.apply_tax,
        quote.prices_include_tax,
        quote.tax_percentage,

        quote.subtotal_amount,
        quote.taxable_amount,
        quote.exempt_amount,
        quote.calculated_tax_amount,
        quote.final_tax_amount,

        quote.discount_amount,
        quote.delivery_amount,
        quote.manual_adjustment_amount,
        quote.manual_adjustment_reason,

        quote.total_amount,
        quote.currency_code,
        quote.commercial_terms,
        quote.notes,

        createdBy,
      ]
    );

    const order = orderResult.rows[0];

    for (const line of quoteLinesResult.rows) {
      await client.query(
        `
        INSERT INTO tanta_house.sales_order_line (
          order_id,
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
          order.order_id,
          line.line_number,
          line.recipe_id,
          line.item_description,
          line.quantity,
          line.unit_id,
          line.unit_price,
          line.discount_amount,

          line.apply_tax,
          line.prices_include_tax,
          line.tax_percentage,

          line.line_subtotal,
          line.taxable_amount,
          line.exempt_amount,
          line.calculated_tax_amount,
          line.manual_tax_amount,
          line.final_tax_amount,
          line.calculated_total_amount,
          line.manual_total_amount,
          line.final_total_amount,
          line.manual_adjustment_amount,
          line.manual_adjustment_reason,
          line.is_tax_manual,
          line.is_total_manual,

          line.line_total,
          line.notes,
          createdBy,
          line.recipe_cost_snapshot,
          line.recipe_suggested_price_snapshot,
          line.recipe_costing_mode,
          line.price_was_modified,
        ]
      );
    }

    await client.query(
      `
      UPDATE tanta_house.sales_quote
      SET quote_status = 'APPROVED'
      WHERE quote_id = $1;
      `,
      [quoteId]
    );

    await client.query("COMMIT");

    res.status(201).json(order);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error generando pedido desde cotización:", error);

    res.status(500).json({
      message: "Error generando pedido desde cotización",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
