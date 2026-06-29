const express = require("express");
const router = express.Router();
const pool = require("../db");

/**
 * ======================================================
 * COSTEO DE RECETAS - MÚLTIPLES MODOS
 * ======================================================
 *
 * Modos:
 * - supplier
 * - inventory
 * - comparison
 */

/**
 * ======================================================
 * COSTEO POR PROVEEDOR
 * (modelo actual)
 * ======================================================
 */
router.get("/:recipeId/costing/supplier", async (req, res) => {
  try {
    const { recipeId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM tanta_house.calculate_recipe_cost_supplier($1)
      `,
      [Number(recipeId)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error costeo proveedor:", error);

    res.status(500).json({
      message: "Error obteniendo costeo por proveedor",
      error: error.message,
    });
  }
});

/**
 * ======================================================
 * COSTEO POR INVENTARIO
 * Usa costo promedio valorizado de almacén
 * ======================================================
 */
router.get("/:recipeId/costing/inventory", async (req, res) => {
  try {
    const { recipeId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM tanta_house.calculate_recipe_cost_inventory($1)
      `,
      [Number(recipeId)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error costeo inventario:", error);

    res.status(500).json({
      message: "Error obteniendo costeo por inventario",
      error: error.message,
    });
  }
});

/**
 * ======================================================
 * COSTEO COMPARATIVO
 * ======================================================
 */
router.get("/:recipeId/costing/comparison", async (req, res) => {
  try {
    const { recipeId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM tanta_house.calculate_recipe_cost_comparison($1)
      `,
      [Number(recipeId)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error costeo comparativo:", error);

    res.status(500).json({
      message: "Error obteniendo comparación de costos",
      error: error.message,
    });
  }
});

module.exports = router;
