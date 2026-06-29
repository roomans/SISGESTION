const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 1;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando precios:", error);
    res.status(500).json({
      message: "Error consultando precios",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/presentations", async (req, res) => {
  try {
    const result = await pool.query(`
       SELECT 1;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando presentaciones:", error);
    res.status(500).json({
      message: "Error consultando presentaciones",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.post("/presentations", async (req, res) => {
  try {
    const {
      ingredient_id,
      presentation_name,
      purchase_unit_id,
      stock_unit_id,
      conversion_factor,
      is_default = false,
      created_by = 1,
    } = req.body;

    if (
      !ingredient_id ||
      !presentation_name?.trim() ||
      !purchase_unit_id ||
      !stock_unit_id ||
      !conversion_factor
    ) {
      return res.status(400).json({
        message:
          "Insumo, presentación, unidad de compra, unidad de stock y factor de conversión son obligatorios",
      });
    }

    if (Number(conversion_factor) <= 0) {
      return res.status(400).json({
        message: "El factor de conversión debe ser mayor a cero",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO tanta_house.ingredient_purchase_presentation (
        ingredient_id,
        presentation_name,
        purchase_unit_id,
        stock_unit_id,
        conversion_factor,
        is_default,
        is_active,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,TRUE,$7)
      RETURNING
        presentation_id,
        ingredient_id,
        presentation_name,
        purchase_unit_id,
        stock_unit_id,
        conversion_factor,
        is_default,
        is_active,
        created_at,
        created_by,
        updated_at,
        updated_by;
      `,
      [
        Number(ingredient_id),
        presentation_name.trim(),
        Number(purchase_unit_id),
        Number(stock_unit_id),
        Number(conversion_factor),
        Boolean(is_default),
        Number(created_by),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando presentación:", error);

    res.status(500).json({
      message: "Error creando presentación",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      ingredient_id,
      supplier_id,
      presentation_id,
      currency_code = "PEN",
      current_price,
      effective_from,
      last_purchase_date,
      is_active = true,
      created_by = 1,
    } = req.body;

    if (
      !ingredient_id ||
      !supplier_id ||
      !presentation_id ||
      !current_price ||
      !effective_from
    ) {
      return res.status(400).json({
        message:
          "Insumo, proveedor, presentación, precio y fecha de vigencia son obligatorios",
      });
    }

    if (Number(current_price) <= 0) {
      return res.status(400).json({
        message: "El precio debe ser mayor a cero",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO tanta_house.ingredient_supplier_price (
        ingredient_id,
        supplier_id,
        presentation_id,
        currency_code,
        current_price,
        effective_from,
        last_purchase_date,
        is_active,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
      `,
      [
        Number(ingredient_id),
        Number(supplier_id),
        Number(presentation_id),
        currency_code || "PEN",
        Number(current_price),
        effective_from,
        last_purchase_date || null,
        Boolean(is_active),
        Number(created_by),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando precio:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "Ya existe un precio para este insumo, proveedor, presentación y moneda",
        error: error.message,
        detail: error.detail,
      });
    }

    res.status(500).json({
      message: "Error creando precio",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      ingredient_id,
      supplier_id,
      presentation_id,
      currency_code = "PEN",
      current_price,
      effective_from,
      last_purchase_date,
      is_active = true,
      updated_by = 1,
    } = req.body;

    if (
      !ingredient_id ||
      !supplier_id ||
      !presentation_id ||
      !current_price ||
      !effective_from
    ) {
      return res.status(400).json({
        message:
          "Insumo, proveedor, presentación, precio y fecha de vigencia son obligatorios",
      });
    }

    if (Number(current_price) <= 0) {
      return res.status(400).json({
        message: "El precio debe ser mayor a cero",
      });
    }

    const result = await pool.query(
      `
      UPDATE tanta_house.ingredient_supplier_price
      SET
        ingredient_id = $1,
        supplier_id = $2,
        presentation_id = $3,
        currency_code = $4,
        current_price = $5,
        effective_from = $6,
        last_purchase_date = $7,
        is_active = $8,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $9
      WHERE ingredient_supplier_price_id = $10
      RETURNING *;
      `,
      [
        Number(ingredient_id),
        Number(supplier_id),
        Number(presentation_id),
        currency_code || "PEN",
        Number(current_price),
        effective_from,
        last_purchase_date || null,
        Boolean(is_active),
        Number(updated_by),
        Number(id),
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Precio no encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando precio:", error);

    res.status(500).json({
      message: "Error actualizando precio",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { updated_by = 1 } = req.body || {};

    const result = await pool.query(
      `
      UPDATE tanta_house.ingredient_supplier_price
      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1
      WHERE ingredient_supplier_price_id = $2
      RETURNING *;
      `,
      [Number(updated_by), Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Precio no encontrado",
      });
    }

    res.json({
      message: "Precio desactivado correctamente",
      price: result.rows[0],
    });
  } catch (error) {
    console.error("Error eliminando precio:", error);

    res.status(500).json({
      message: "Error eliminando precio",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

module.exports = router;