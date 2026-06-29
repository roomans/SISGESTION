const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/ingredient-prices", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        isp.ingredient_supplier_price_id AS price_history_id,
        isp.ingredient_id,
        i.ingredient_code,
        i.ingredient_name,
        isp.supplier_id,
        s.supplier_name,
        isp.presentation_id,
        ipp.presentation_name,
        isp.currency_code,
        LAG(isp.current_price) OVER (
          PARTITION BY 
            isp.ingredient_id,
            isp.supplier_id,
            isp.presentation_id,
            isp.currency_code
          ORDER BY isp.effective_from
        ) AS previous_price,
        isp.current_price AS new_price,
        isp.effective_from,
        isp.effective_to,
        isp.last_purchase_date,
        isp.created_at AS changed_at
      FROM tanta_house.ingredient_supplier_price isp
      JOIN tanta_house.ingredient i
        ON i.ingredient_id = isp.ingredient_id
      JOIN tanta_house.supplier s
        ON s.supplier_id = isp.supplier_id
      JOIN tanta_house.ingredient_purchase_presentation ipp
        ON ipp.presentation_id = isp.presentation_id
      ORDER BY
        i.ingredient_code,
        isp.effective_from;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando historial de precios:", error);

    res.status(500).json({
      message: "Error consultando historial de precios",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/ingredient-prices/:ingredientId/chart", async (req, res) => {
  try {
    const { ingredientId } = req.params;

    const result = await pool.query(
      `
      SELECT
        isp.ingredient_supplier_price_id,
        i.ingredient_code,
        i.ingredient_name,
        s.supplier_name,
        ipp.presentation_name,
        isp.currency_code,
        isp.current_price,
        isp.effective_from
      FROM tanta_house.ingredient_supplier_price isp
      JOIN tanta_house.ingredient i
        ON i.ingredient_id = isp.ingredient_id
      JOIN tanta_house.supplier s
        ON s.supplier_id = isp.supplier_id
      JOIN tanta_house.ingredient_purchase_presentation ipp
        ON ipp.presentation_id = isp.presentation_id
      WHERE isp.ingredient_id = $1
      ORDER BY isp.effective_from;
      `,
      [ingredientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando gráfico de precios:", error);

    res.status(500).json({
      message: "Error consultando gráfico de precios",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/recipe-costs", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error("Error consultando historial de costos de recetas:", error);

    res.status(500).json({
      message: "Error consultando historial de costos de recetas",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

module.exports = router;