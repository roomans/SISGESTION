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
    console.error("Error consultando insumos:", error);
    res.status(500).json({ message: "Error consultando insumos" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      ingredient_code,
      ingredient_name,
      category_id,
      stock_unit_id,
      minimum_stock = 0,
      is_perishable = false,
      shelf_life_days,
      is_active = true,
      created_by = 1,
    } = req.body;

    if (!ingredient_code || !ingredient_name || !category_id || !stock_unit_id) {
      return res.status(400).json({
        message: "Código, nombre, categoría y unidad son obligatorios",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO tanta_house.ingredient (
        ingredient_code,
        ingredient_name,
        category_id,
        stock_unit_id,
        minimum_stock,
        is_perishable,
        shelf_life_days,
        is_active,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
      `,
      [
        ingredient_code,
        ingredient_name,
        category_id,
        stock_unit_id,
        minimum_stock,
        is_perishable,
        shelf_life_days || null,
        is_active,
        created_by,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando insumo:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe un insumo con ese código",
      });
    }

    res.status(500).json({ message: "Error creando insumo" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      ingredient_code,
      ingredient_name,
      category_id,
      stock_unit_id,
      minimum_stock = 0,
      is_perishable = false,
      shelf_life_days,
      is_active = true,
      updated_by = 1,
    } = req.body;

    if (!ingredient_code || !ingredient_name || !category_id || !stock_unit_id) {
      return res.status(400).json({
        message: "Código, nombre, categoría y unidad son obligatorios",
      });
    }

    const result = await pool.query(
      `
      UPDATE tanta_house.ingredient
      SET
        ingredient_code = $1,
        ingredient_name = $2,
        category_id = $3,
        stock_unit_id = $4,
        minimum_stock = $5,
        is_perishable = $6,
        shelf_life_days = $7,
        is_active = $8,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $9
      WHERE ingredient_id = $10
      RETURNING *;
      `,
      [
        ingredient_code,
        ingredient_name,
        category_id,
        stock_unit_id,
        minimum_stock,
        is_perishable,
        shelf_life_days || null,
        is_active,
        updated_by,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Insumo no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando insumo:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe un insumo con ese código",
      });
    }

    res.status(500).json({ message: "Error actualizando insumo" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { updated_by = 1 } = req.body || {};

    const result = await pool.query(
      `
      UPDATE tanta_house.ingredient
      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1
      WHERE ingredient_id = $2
      RETURNING *;
      `,
      [updated_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Insumo no encontrado" });
    }

    res.json({
      message: "Insumo desactivado correctamente",
      ingredient: result.rows[0],
    });
  } catch (error) {
    console.error("Error eliminando insumo:", error);
    res.status(500).json({ message: "Error eliminando insumo" });
  }
});

module.exports = router;