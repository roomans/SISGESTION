const express = require("express");
const router = express.Router();
const pool = require("../db");

/**
 * Base path recomendado:
 * app.use("/api/inventory", inventoryRoutes);
 */

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
};

const toDateOrNull = (value) => {
  if (!value) return null;
  return value;
};


// ======================================================
// PRECIO REFERENCIAL ACTIVO PARA INGRESO POR COMPRA
// Recupera el precio vigente del insumo/proveedor/presentación.
// Si se envía target_unit_id, calcula el costo unitario para esa unidad.
// Ejemplo:
// - Precio SCO50 = 150
// - Equivale a 50 KG
// - Costo KG = 3
// - Si target_unit_id = KG => 3
// - Si target_unit_id = SCO50 => 150
// ======================================================

router.get("/reference-unit-cost", async (req, res) => {
  try {
    const {
      ingredient_id,
      supplier_id,
      presentation_id,
      target_unit_id,
    } = req.query;

    if (!ingredient_id || !supplier_id || !presentation_id) {
      return res.status(400).json({
        message: "Insumo, proveedor y presentación son obligatorios",
      });
    }

    const result = await pool.query(
      `
      WITH active_price AS (
        SELECT
          isp.ingredient_supplier_price_id,
          isp.ingredient_id,
          i.ingredient_code,
          i.ingredient_name,
          isp.supplier_id,
          s.supplier_name,
          isp.presentation_id,
          ipp.presentation_name,
          isp.currency_code,
          isp.current_price,
          isp.effective_from,
          isp.effective_to,
          ipp.conversion_factor,
          ipp.purchase_unit_id,
          purchase_unit.unit_code AS purchase_unit_code,
          ipp.stock_unit_id,
          stock_unit.unit_code AS stock_unit_code,
          CASE
            WHEN ipp.conversion_factor IS NULL OR ipp.conversion_factor = 0
            THEN NULL
            ELSE ROUND((isp.current_price / ipp.conversion_factor)::numeric, 6)
          END AS stock_unit_cost
        FROM tanta_house.ingredient_supplier_price isp
        JOIN tanta_house.ingredient i
          ON i.ingredient_id = isp.ingredient_id
        JOIN tanta_house.supplier s
          ON s.supplier_id = isp.supplier_id
        JOIN tanta_house.ingredient_purchase_presentation ipp
          ON ipp.presentation_id = isp.presentation_id
        LEFT JOIN tanta_house.unit_of_measure purchase_unit
          ON purchase_unit.unit_id = ipp.purchase_unit_id
        LEFT JOIN tanta_house.unit_of_measure stock_unit
          ON stock_unit.unit_id = ipp.stock_unit_id
        WHERE isp.ingredient_id = $1
          AND isp.supplier_id = $2
          AND isp.presentation_id = $3
          AND isp.is_active = TRUE
          AND isp.effective_from <= CURRENT_DATE
          AND (
            isp.effective_to IS NULL
            OR isp.effective_to >= CURRENT_DATE
          )
        ORDER BY
          isp.effective_from DESC,
          isp.ingredient_supplier_price_id DESC
        LIMIT 1
      )
      SELECT
        ap.*,
        COALESCE($4::bigint, ap.stock_unit_id) AS target_unit_id,
        target_unit.unit_code AS target_unit_code,

        CASE
          WHEN $4::bigint IS NULL THEN 1::numeric
          WHEN $4::bigint = ap.stock_unit_id THEN 1::numeric
          ELSE tanta_house.convert_ingredient_unit(
            1::numeric,
            ap.ingredient_id,
            $4::bigint,
            ap.stock_unit_id
          )
        END AS target_to_stock_quantity,

        CASE
          WHEN ap.stock_unit_cost IS NULL THEN NULL
          WHEN $4::bigint IS NULL THEN ap.stock_unit_cost
          WHEN $4::bigint = ap.stock_unit_id THEN ap.stock_unit_cost
          ELSE ROUND(
            (
              ap.stock_unit_cost *
              tanta_house.convert_ingredient_unit(
                1::numeric,
                ap.ingredient_id,
                $4::bigint,
                ap.stock_unit_id
              )
            )::numeric,
            6
          )
        END AS reference_unit_cost

      FROM active_price ap
      LEFT JOIN tanta_house.unit_of_measure target_unit
        ON target_unit.unit_id = COALESCE($4::bigint, ap.stock_unit_id);
      `,
      [
        Number(ingredient_id),
        Number(supplier_id),
        Number(presentation_id),
        target_unit_id ? Number(target_unit_id) : null,
      ]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error("Error consultando costo unitario referencial:", error);

    res.status(500).json({
      message: "Error consultando costo unitario referencial",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});


// ======================================================
// ALMACENES
// ======================================================

router.get("/warehouses", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        warehouse_id,
        warehouse_code,
        warehouse_name,
        description,
        is_default,
        is_active,
        created_at,
        updated_at
      FROM tanta_house.warehouse
      ORDER BY is_default DESC, warehouse_name;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando almacenes:", error);
    res.status(500).json({
      message: "Error consultando almacenes",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.post("/warehouses", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      warehouse_code,
      warehouse_name,
      description,
      is_default = false,
      is_active = true,
      created_by = 1,
    } = req.body;

    if (!warehouse_code?.trim() || !warehouse_name?.trim()) {
      return res.status(400).json({
        message: "Código y nombre del almacén son obligatorios",
      });
    }

    await client.query("BEGIN");

    if (is_default) {
      await client.query(`
        UPDATE tanta_house.warehouse
        SET is_default = FALSE
        WHERE is_default = TRUE;
      `);
    }

    const result = await client.query(
      `
      INSERT INTO tanta_house.warehouse (
        warehouse_code,
        warehouse_name,
        description,
        is_default,
        is_active,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
      `,
      [
        warehouse_code.trim(),
        warehouse_name.trim(),
        description || null,
        Boolean(is_default),
        Boolean(is_active),
        Number(created_by || 1),
      ]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creando almacén:", error);

    res.status(500).json({
      message: "Error creando almacén",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// UBICACIONES
// ======================================================

router.get("/locations", async (req, res) => {
  try {
    const { warehouse_id } = req.query;

    const values = [];
    let where = "";

    if (warehouse_id) {
      values.push(Number(warehouse_id));
      where = "WHERE wl.warehouse_id = $1";
    }

    const result = await pool.query(
      `
      SELECT
        wl.location_id,
        wl.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        wl.location_code,
        wl.location_name,
        wl.description,
        wl.is_default,
        wl.is_active,
        wl.created_at,
        wl.updated_at
      FROM tanta_house.warehouse_location wl
      JOIN tanta_house.warehouse w
        ON w.warehouse_id = wl.warehouse_id
      ${where}
      ORDER BY w.is_default DESC, w.warehouse_name, wl.is_default DESC, wl.location_name;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando ubicaciones:", error);
    res.status(500).json({
      message: "Error consultando ubicaciones",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.post("/locations", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      warehouse_id,
      location_code,
      location_name,
      description,
      is_default = false,
      is_active = true,
      created_by = 1,
    } = req.body;

    if (!warehouse_id || !location_code?.trim() || !location_name?.trim()) {
      return res.status(400).json({
        message: "Almacén, código y nombre de ubicación son obligatorios",
      });
    }

    await client.query("BEGIN");

    if (is_default) {
      await client.query(
        `
        UPDATE tanta_house.warehouse_location
        SET is_default = FALSE
        WHERE warehouse_id = $1
          AND is_default = TRUE;
        `,
        [Number(warehouse_id)]
      );
    }

    const result = await client.query(
      `
      INSERT INTO tanta_house.warehouse_location (
        warehouse_id,
        location_code,
        location_name,
        description,
        is_default,
        is_active,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *;
      `,
      [
        Number(warehouse_id),
        location_code.trim(),
        location_name.trim(),
        description || null,
        Boolean(is_default),
        Boolean(is_active),
        Number(created_by || 1),
      ]
    );

    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creando ubicación:", error);

    res.status(500).json({
      message: "Error creando ubicación",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// TIPOS Y MOTIVOS
// ======================================================

router.get("/movement-types", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        movement_type_id,
        movement_type_code,
        movement_type_name,
        movement_direction,
        description,
        is_system,
        is_active
      FROM tanta_house.inventory_movement_type
      WHERE is_active = TRUE
      ORDER BY movement_type_code;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando tipos de movimiento:", error);
    res.status(500).json({
      message: "Error consultando tipos de movimiento",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/movement-reasons", async (req, res) => {
  try {
    const { movement_type_id, movement_type_code } = req.query;

    const values = [];
    let where = "WHERE r.is_active = TRUE";

    if (movement_type_id) {
      values.push(Number(movement_type_id));
      where += ` AND r.movement_type_id = $${values.length}`;
    }

    if (movement_type_code) {
      values.push(movement_type_code);
      where += ` AND mt.movement_type_code = $${values.length}`;
    }

    const result = await pool.query(
      `
      SELECT
        r.movement_reason_id,
        r.movement_type_id,
        mt.movement_type_code,
        mt.movement_type_name,
        mt.movement_direction,
        r.reason_code,
        r.reason_name,
        r.description,
        r.requires_reference,
        r.is_active
      FROM tanta_house.inventory_movement_reason r
      JOIN tanta_house.inventory_movement_type mt
        ON mt.movement_type_id = r.movement_type_id
      ${where}
      ORDER BY mt.movement_type_code, r.reason_code;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando motivos de movimiento:", error);
    res.status(500).json({
      message: "Error consultando motivos de movimiento",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// ======================================================
// STOCK
// ======================================================

router.get("/stock", async (req, res) => {
  try {
    const {
      ingredient_id,
      warehouse_id,
      location_id,
      only_positive = "true",
      search,
    } = req.query;

    const values = [];
    let where = "WHERE 1 = 1";

    if (ingredient_id) {
      values.push(Number(ingredient_id));
      where += ` AND s.ingredient_id = $${values.length}`;
    }

    if (warehouse_id) {
      values.push(Number(warehouse_id));
      where += ` AND s.warehouse_id = $${values.length}`;
    }

    if (location_id) {
      values.push(Number(location_id));
      where += ` AND s.location_id = $${values.length}`;
    }

    if (only_positive === "true") {
      where += " AND s.stock_quantity > 0";
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where += ` AND (
        LOWER(s.ingredient_code) LIKE $${values.length}
        OR LOWER(s.ingredient_name) LIKE $${values.length}
      )`;
    }

    const result = await pool.query(
      `
      SELECT
        s.ingredient_id,
        s.ingredient_code,
        s.ingredient_name,
        s.warehouse_id,
        s.warehouse_code,
        s.warehouse_name,
        s.location_id,
        s.location_code,
        s.location_name,
        s.unit_id,
        s.unit_code,
        s.unit_name,
        s.stock_quantity
      FROM tanta_house.vw_inventory_stock s
      ${where}
      ORDER BY s.ingredient_name, s.warehouse_name, s.location_name;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando stock:", error);
    res.status(500).json({
      message: "Error consultando stock",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/stock-by-lot", async (req, res) => {
  try {
    const {
      ingredient_id,
      warehouse_id,
      location_id,
      only_positive = "true",
      search,
    } = req.query;

    const values = [];
    let where = "WHERE 1 = 1";

    if (ingredient_id) {
      values.push(Number(ingredient_id));
      where += ` AND s.ingredient_id = $${values.length}`;
    }

    if (warehouse_id) {
      values.push(Number(warehouse_id));
      where += ` AND s.warehouse_id = $${values.length}`;
    }

    if (location_id) {
      values.push(Number(location_id));
      where += ` AND s.location_id = $${values.length}`;
    }

    if (only_positive === "true") {
      where += " AND s.stock_quantity > 0";
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where += ` AND (
        LOWER(s.ingredient_code) LIKE $${values.length}
        OR LOWER(s.ingredient_name) LIKE $${values.length}
        OR LOWER(s.lot_code) LIKE $${values.length}
      )`;
    }

    const result = await pool.query(
      `
      SELECT
        s.ingredient_id,
        s.ingredient_code,
        s.ingredient_name,
        s.lot_id,
        s.lot_code,
        s.expiration_date,
        s.warehouse_id,
        s.warehouse_code,
        s.warehouse_name,
        s.location_id,
        s.location_code,
        s.location_name,
        s.unit_id,
        s.unit_code,
        s.unit_name,
        s.stock_quantity,
        s.average_unit_cost
      FROM tanta_house.vw_inventory_stock_by_lot s
      ${where}
      ORDER BY
        s.ingredient_name,
        s.expiration_date NULLS LAST,
        s.lot_code;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando stock por lote:", error);
    res.status(500).json({
      message: "Error consultando stock por lote",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// ======================================================
// ALERTAS VENCIMIENTO
// ======================================================

router.get("/expiration-alerts", async (req, res) => {
  try {
    const { status, days = 30 } = req.query;

    const values = [];
    let where = "WHERE stock_quantity > 0";

    if (status) {
      values.push(status);
      where += ` AND expiration_status = $${values.length}`;
    } else {
      values.push(Number(days));
      where += ` AND (
        expiration_date IS NULL
        OR expiration_date <= CURRENT_DATE + ($${values.length}::int * INTERVAL '1 day')
      )`;
    }

    const result = await pool.query(
      `
      SELECT
        ingredient_id,
        ingredient_code,
        ingredient_name,
        lot_id,
        lot_code,
        expiration_date,
        warehouse_id,
        warehouse_name,
        location_id,
        location_name,
        unit_code,
        stock_quantity,
        expiration_status
      FROM tanta_house.vw_inventory_expiration_alerts
      ${where}
      ORDER BY expiration_date NULLS LAST, ingredient_name;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando alertas de vencimiento:", error);
    res.status(500).json({
      message: "Error consultando alertas de vencimiento",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// ======================================================
// LOTES
// ======================================================

router.get("/lots", async (req, res) => {
  try {
    const {
      ingredient_id,
      warehouse_id,
      location_id,
      status,
      only_active = "true",
      search,
    } = req.query;

    const values = [];
    let where = "WHERE 1 = 1";

    if (only_active === "true") {
      where += " AND l.is_active = TRUE";
    }

    if (ingredient_id) {
      values.push(Number(ingredient_id));
      where += ` AND l.ingredient_id = $${values.length}`;
    }

    if (warehouse_id) {
      values.push(Number(warehouse_id));
      where += ` AND l.warehouse_id = $${values.length}`;
    }

    if (location_id) {
      values.push(Number(location_id));
      where += ` AND l.location_id = $${values.length}`;
    }

    if (status) {
      values.push(status);
      where += ` AND l.lot_status = $${values.length}`;
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where += ` AND (
        LOWER(l.lot_code) LIKE $${values.length}
        OR LOWER(i.ingredient_code) LIKE $${values.length}
        OR LOWER(i.ingredient_name) LIKE $${values.length}
      )`;
    }

    const result = await pool.query(
      `
      SELECT
        l.lot_id,
        l.ingredient_id,
        i.ingredient_code,
        i.ingredient_name,
        l.supplier_id,
        s.supplier_name,
        l.presentation_id,
        ipp.presentation_name,
        l.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        l.location_id,
        wl.location_code,
        wl.location_name,
        l.lot_code,
        l.supplier_lot_code,
        l.received_date,
        l.expiration_date,
        l.production_date,
        l.unit_id,
        u.unit_code,
        u.unit_name,
        l.initial_quantity,
        l.unit_cost,
        l.currency_code,
        l.lot_status,
        l.notes,
        l.is_active,
        COALESCE(stock.stock_quantity, 0) AS current_stock
      FROM tanta_house.inventory_lot l
      JOIN tanta_house.ingredient i
        ON i.ingredient_id = l.ingredient_id
      LEFT JOIN tanta_house.supplier s
        ON s.supplier_id = l.supplier_id
      LEFT JOIN tanta_house.ingredient_purchase_presentation ipp
        ON ipp.presentation_id = l.presentation_id
      JOIN tanta_house.warehouse w
        ON w.warehouse_id = l.warehouse_id
      JOIN tanta_house.warehouse_location wl
        ON wl.location_id = l.location_id
      JOIN tanta_house.unit_of_measure u
        ON u.unit_id = l.unit_id
      LEFT JOIN (
        SELECT lot_id, SUM(stock_quantity) AS stock_quantity
        FROM tanta_house.vw_inventory_stock_by_lot
        GROUP BY lot_id
      ) stock
        ON stock.lot_id = l.lot_id
      ${where}
      ORDER BY l.received_date DESC, l.lot_id DESC;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando lotes:", error);
    res.status(500).json({
      message: "Error consultando lotes",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// ======================================================
// MOVIMIENTOS
// ======================================================

router.get("/movements", async (req, res) => {
  try {
    const {
      date_from,
      date_to,
      movement_type_id,
      movement_type_code,
      ingredient_id,
      limit = 100,
    } = req.query;

    const values = [];
    let where = "WHERE 1 = 1";

    if (date_from) {
      values.push(date_from);
      where += ` AND m.movement_date::date >= $${values.length}::date`;
    }

    if (date_to) {
      values.push(date_to);
      where += ` AND m.movement_date::date <= $${values.length}::date`;
    }

    if (movement_type_id) {
      values.push(Number(movement_type_id));
      where += ` AND m.movement_type_id = $${values.length}`;
    }

    if (movement_type_code) {
      values.push(movement_type_code);
      where += ` AND mt.movement_type_code = $${values.length}`;
    }

    if (ingredient_id) {
      values.push(Number(ingredient_id));
      where += ` AND EXISTS (
        SELECT 1
        FROM tanta_house.inventory_movement_detail d
        WHERE d.movement_id = m.movement_id
          AND d.ingredient_id = $${values.length}
      )`;
    }

    values.push(Number(limit || 100));

    const result = await pool.query(
      `
      SELECT
        m.movement_id,
        m.movement_number,
        m.movement_date,
        m.movement_type_id,
        mt.movement_type_code,
        mt.movement_type_name,
        mt.movement_direction,
        m.movement_reason_id,
        mr.reason_code,
        mr.reason_name,
        m.source_document_type,
        m.source_document_id,
        m.source_document_number,
        m.reference_notes,
        m.movement_status,
        COUNT(d.movement_detail_id) AS total_lines,
        COALESCE(SUM(d.total_cost), 0) AS total_cost
      FROM tanta_house.inventory_movement m
      JOIN tanta_house.inventory_movement_type mt
        ON mt.movement_type_id = m.movement_type_id
      LEFT JOIN tanta_house.inventory_movement_reason mr
        ON mr.movement_reason_id = m.movement_reason_id
      LEFT JOIN tanta_house.inventory_movement_detail d
        ON d.movement_id = m.movement_id
      ${where}
      GROUP BY
        m.movement_id,
        mt.movement_type_code,
        mt.movement_type_name,
        mt.movement_direction,
        mr.reason_code,
        mr.reason_name
      ORDER BY m.movement_date DESC, m.movement_id DESC
      LIMIT $${values.length};
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando movimientos:", error);
    res.status(500).json({
      message: "Error consultando movimientos",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/movements/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const headerResult = await pool.query(
      `
      SELECT
        m.movement_id,
        m.movement_number,
        m.movement_date,
        m.movement_type_id,
        mt.movement_type_code,
        mt.movement_type_name,
        mt.movement_direction,
        m.movement_reason_id,
        mr.reason_code,
        mr.reason_name,
        m.source_document_type,
        m.source_document_id,
        m.source_document_number,
        m.reference_notes,
        m.movement_status,
        m.created_at,
        m.created_by
      FROM tanta_house.inventory_movement m
      JOIN tanta_house.inventory_movement_type mt
        ON mt.movement_type_id = m.movement_type_id
      LEFT JOIN tanta_house.inventory_movement_reason mr
        ON mr.movement_reason_id = m.movement_reason_id
      WHERE m.movement_id = $1;
      `,
      [Number(id)]
    );

    if (headerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Movimiento no encontrado",
      });
    }

    const detailResult = await pool.query(
      `
      SELECT
        d.movement_detail_id,
        d.movement_id,
        d.ingredient_id,
        i.ingredient_code,
        i.ingredient_name,
        d.lot_id,
        l.lot_code,
        d.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        d.location_id,
        wl.location_code,
        wl.location_name,
        d.unit_id,
        u.unit_code,
        u.unit_name,
        d.quantity,
        d.quantity_signed,
        d.unit_cost,
        d.total_cost,
        d.notes
      FROM tanta_house.inventory_movement_detail d
      JOIN tanta_house.ingredient i
        ON i.ingredient_id = d.ingredient_id
      LEFT JOIN tanta_house.inventory_lot l
        ON l.lot_id = d.lot_id
      JOIN tanta_house.warehouse w
        ON w.warehouse_id = d.warehouse_id
      JOIN tanta_house.warehouse_location wl
        ON wl.location_id = d.location_id
      JOIN tanta_house.unit_of_measure u
        ON u.unit_id = d.unit_id
      WHERE d.movement_id = $1
      ORDER BY d.movement_detail_id;
      `,
      [Number(id)]
    );

    res.json({
      movement: headerResult.rows[0],
      details: detailResult.rows,
    });
  } catch (error) {
    console.error("Error consultando detalle de movimiento:", error);
    res.status(500).json({
      message: "Error consultando detalle de movimiento",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// ======================================================
// MOVIMIENTO SIMPLE IN/OUT
// ======================================================

router.post("/movements/simple", async (req, res) => {
  try {
    const {
      movement_type_code,
      reason_code,
      ingredient_id,
      lot_id,
      warehouse_id,
      location_id,
      unit_id,
      quantity,
      unit_cost,
      source_document_type,
      source_document_id,
      source_document_number,
      notes,
      created_by = 1,
    } = req.body;

    if (
      !movement_type_code ||
      !reason_code ||
      !ingredient_id ||
      !warehouse_id ||
      !location_id ||
      !unit_id ||
      !quantity
    ) {
      return res.status(400).json({
        message:
          "Tipo, motivo, insumo, almacén, ubicación, unidad y cantidad son obligatorios",
      });
    }

    const result = await pool.query(
      `
      SELECT tanta_house.register_inventory_movement(
        $1::varchar,
        $2::varchar,
        $3::bigint,
        $4::bigint,
        $5::bigint,
        $6::bigint,
        $7::bigint,
        $8::numeric,
        $9::numeric,
        $10::varchar,
        $11::bigint,
        $12::varchar,
        $13::text,
        $14::bigint
      ) AS movement_id;
      `,
      [
        movement_type_code,
        reason_code,
        Number(ingredient_id),
        toNumberOrNull(lot_id),
        Number(warehouse_id),
        Number(location_id),
        Number(unit_id),
        Number(quantity),
        unit_cost === undefined || unit_cost === null || unit_cost === ""
          ? null
          : Number(unit_cost),
        source_document_type || null,
        toNumberOrNull(source_document_id),
        source_document_number || null,
        notes || null,
        Number(created_by || 1),
      ]
    );

    const movementId = result.rows[0].movement_id;

    res.status(201).json({
      message: "Movimiento registrado correctamente",
      movement_id: movementId,
    });
  } catch (error) {
    console.error("Error registrando movimiento simple:", error);
    res.status(500).json({
      message: "Error registrando movimiento de inventario",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// ======================================================
// INGRESO POR COMPRA
// Crea lote + movimiento de ingreso.
// ======================================================

router.post("/purchase-receipts", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      ingredient_id,
      supplier_id,
      presentation_id,
      warehouse_id,
      location_id,
      lot_code,
      supplier_lot_code,
      received_date,
      expiration_date,
      production_date,
      unit_id,
      quantity,
      unit_cost,
      currency_code = "PEN",
      source_document_number,
      notes,
      created_by = 1,
    } = req.body;

    if (
      !ingredient_id ||
      !warehouse_id ||
      !location_id ||
      !unit_id ||
      !quantity ||
      !lot_code?.trim()
    ) {
      return res.status(400).json({
        message:
          "Insumo, almacén, ubicación, unidad, cantidad y código de lote son obligatorios",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        message: "La cantidad debe ser mayor a cero",
      });
    }

    await client.query("BEGIN");

    const lotResult = await client.query(
      `
      INSERT INTO tanta_house.inventory_lot (
        ingredient_id,
        supplier_id,
        presentation_id,
        warehouse_id,
        location_id,
        lot_code,
        supplier_lot_code,
        received_date,
        expiration_date,
        production_date,
        unit_id,
        initial_quantity,
        unit_cost,
        currency_code,
        lot_status,
        notes,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,
        'AVAILABLE',
        $15,$16
      )
      RETURNING *;
      `,
      [
        Number(ingredient_id),
        toNumberOrNull(supplier_id),
        toNumberOrNull(presentation_id),
        Number(warehouse_id),
        Number(location_id),
        lot_code.trim(),
        supplier_lot_code || null,
        received_date || new Date().toISOString().substring(0, 10),
        toDateOrNull(expiration_date),
        toDateOrNull(production_date),
        Number(unit_id),
        Number(quantity),
        unit_cost === undefined || unit_cost === null || unit_cost === ""
          ? null
          : Number(unit_cost),
        currency_code || "PEN",
        notes || null,
        Number(created_by || 1),
      ]
    );

    const lot = lotResult.rows[0];

    const movementResult = await client.query(
      `
      INSERT INTO tanta_house.inventory_movement (
        movement_number,
        movement_type_id,
        movement_reason_id,
        movement_date,
        source_document_type,
        source_document_number,
        reference_notes,
        movement_status,
        created_by
      )
      SELECT
        tanta_house.generate_inventory_movement_number('IN_PURCHASE'),
        mt.movement_type_id,
        mr.movement_reason_id,
        CURRENT_TIMESTAMP,
        'PURCHASE',
        $1,
        $2,
        'CONFIRMED',
        $3
      FROM tanta_house.inventory_movement_type mt
      JOIN tanta_house.inventory_movement_reason mr
        ON mr.movement_type_id = mt.movement_type_id
      WHERE mt.movement_type_code = 'IN_PURCHASE'
        AND mr.reason_code = 'PURCHASE_RECEIPT'
      RETURNING *;
      `,
      [source_document_number || null, notes || null, Number(created_by || 1)]
    );

    if (movementResult.rows.length === 0) {
      throw new Error(
        "No existe configuración de tipo/motivo IN_PURCHASE/PURCHASE_RECEIPT"
      );
    }

    const movement = movementResult.rows[0];

    const totalCost =
      unit_cost === undefined || unit_cost === null || unit_cost === ""
        ? null
        : Number(unit_cost) * Number(quantity);

    const detailResult = await client.query(
      `
      INSERT INTO tanta_house.inventory_movement_detail (
        movement_id,
        ingredient_id,
        lot_id,
        warehouse_id,
        location_id,
        unit_id,
        quantity,
        quantity_signed,
        unit_cost,
        total_cost,
        notes,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
      `,
      [
        movement.movement_id,
        Number(ingredient_id),
        lot.lot_id,
        Number(warehouse_id),
        Number(location_id),
        Number(unit_id),
        Number(quantity),
        Number(quantity),
        unit_cost === undefined || unit_cost === null || unit_cost === ""
          ? null
          : Number(unit_cost),
        totalCost,
        notes || null,
        Number(created_by || 1),
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Ingreso por compra registrado correctamente",
      lot,
      movement,
      detail: detailResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error registrando ingreso por compra:", error);
    res.status(500).json({
      message: "Error registrando ingreso por compra",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// MERMA
// ======================================================

router.post("/waste", async (req, res) => {
  try {
    const {
      ingredient_id,
      lot_id,
      warehouse_id,
      location_id,
      unit_id,
      quantity,
      reason_code = "WASTE_DAMAGE",
      notes,
      created_by = 1,
    } = req.body;

    if (
      !ingredient_id ||
      !lot_id ||
      !warehouse_id ||
      !location_id ||
      !unit_id ||
      !quantity
    ) {
      return res.status(400).json({
        message:
          "Insumo, lote, almacén, ubicación, unidad y cantidad son obligatorios",
      });
    }

    const result = await pool.query(
      `
      SELECT tanta_house.register_inventory_movement(
        'OUT_WASTE'::varchar,
        $1::varchar,
        $2::bigint,
        $3::bigint,
        $4::bigint,
        $5::bigint,
        $6::bigint,
        $7::numeric,
        NULL::numeric,
        'WASTE'::varchar,
        NULL::bigint,
        NULL::varchar,
        $8::text,
        $9::bigint
      ) AS movement_id;
      `,
      [
        reason_code,
        Number(ingredient_id),
        Number(lot_id),
        Number(warehouse_id),
        Number(location_id),
        Number(unit_id),
        Number(quantity),
        notes || null,
        Number(created_by || 1),
      ]
    );

    res.status(201).json({
      message: "Merma registrada correctamente",
      movement_id: result.rows[0].movement_id,
    });
  } catch (error) {
    console.error("Error registrando merma:", error);
    res.status(500).json({
      message: "Error registrando merma",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

module.exports = router;
