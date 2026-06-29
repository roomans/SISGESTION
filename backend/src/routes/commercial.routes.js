const express = require("express");
const router = express.Router();
const pool = require("../db");

const toNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return Number(value);
};

const roundMoney = (value) => {
  return Number(Number(value || 0).toFixed(6));
};

/**
 * Endpoint puente para alimentar cotizaciones y pedidos desde recetas.
 *
 * Objetivo:
 * - El frontend de Cotizaciones/Pedidos selecciona una receta.
 * - Este endpoint devuelve costo y precio sugerido.
 * - La línea comercial guarda snapshots:
 *   recipe_cost_snapshot
 *   recipe_suggested_price_snapshot
 *   recipe_costing_mode
 *   price_was_modified
 *
 * Ruta:
 * GET /api/commercial/recipe-price/:recipeId
 *
 * Query params opcionales:
 * - costing_mode: SUPPLIER | INVENTORY
 * - quantity: cantidad comercial. Por defecto 1
 *
 * Importante:
 * Este endpoint intenta usar primero funciones/columnas de costeo existentes.
 * Si tu función de costeo devuelve nombres distintos, revisa la sección marcada
 * "AJUSTE SEGÚN TU FUNCIÓN DE COSTEO".
 */
router.get("/recipe-price/:recipeId", async (req, res) => {
  try {
    const recipeId = Number(req.params.recipeId);
    const costingMode = String(req.query.costing_mode || "SUPPLIER").toUpperCase();
    const quantity = toNumber(req.query.quantity, 1);

    if (!recipeId) {
      return res.status(400).json({
        message: "Debes indicar un recipeId válido",
      });
    }

    const recipeResult = await pool.query(
      `
      SELECT
        r.recipe_id,
        r.recipe_code,
        r.recipe_name,
        r.description,
        r.yield_quantity,
        r.yield_unit_id,
        u.unit_code AS yield_unit_code,
        u.unit_name AS yield_unit_name,
        r.labor_cost_type,
        r.labor_percentage,
        r.labor_fixed_amount,
        r.production_overhead_percentage,
        r.production_overhead_fixed_amount,
        r.profit_calculation_type,
        r.profit_percentage,
        r.is_active
      FROM tanta_house.recipe r
      LEFT JOIN tanta_house.unit_of_measure u
        ON u.unit_id = r.yield_unit_id
      WHERE r.recipe_id = $1;
      `,
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Receta no encontrada",
      });
    }

    const recipe = recipeResult.rows[0];

    /**
     * ============================================================
     * AJUSTE SEGÚN TU FUNCIÓN DE COSTEO
     * ============================================================
     *
     * Este bloque intenta usar una función SQL de costeo.
     *
     * Se asume que existe algo similar a:
     * tanta_house.calculate_recipe_cost(p_recipe_id)
     *
     * Si tu función tiene otro nombre o retorno, cambia SOLO este query.
     *
     * Campos esperados:
     * - ingredient_cost
     * - labor_cost
     * - overhead_cost
     * - production_cost
     * - profit_amount
     * - suggested_price
     * - suggested_unit_price
     *
     * Si no existe la función, el endpoint usará fallback básico desde recipe.
     */
    let costing = null;

    try {
      const costingResult = await pool.query(
        `
        SELECT *
        FROM tanta_house.calculate_recipe_cost($1);
        `,
        [recipeId]
      );

      if (costingResult.rows.length > 0) {
        costing = costingResult.rows[0];
      }
    } catch (costingError) {
      console.warn(
        "No se pudo usar calculate_recipe_cost. Se usará fallback básico:",
        costingError.message
      );
    }

    const yieldQuantity = toNumber(recipe.yield_quantity, 1) || 1;

    const ingredientCost = roundMoney(
      costing?.ingredient_cost ??
        costing?.total_ingredient_cost ??
        costing?.ingredients_cost ??
        0
    );

    const laborCost = roundMoney(
      costing?.labor_cost ??
        costing?.total_labor_cost ??
        0
    );

    const overheadCost = roundMoney(
      costing?.overhead_cost ??
        costing?.production_overhead_cost ??
        costing?.total_overhead_cost ??
        0
    );

    const productionCost = roundMoney(
      costing?.production_cost ??
        costing?.total_production_cost ??
        ingredientCost + laborCost + overheadCost
    );

    const profitAmount = roundMoney(
      costing?.profit_amount ??
        costing?.utility_amount ??
        (productionCost * toNumber(recipe.profit_percentage, 0)) / 100
    );

    const suggestedPrice = roundMoney(
      costing?.suggested_price ??
        costing?.final_price ??
        costing?.total_price ??
        productionCost + profitAmount
    );
    /*const suggestedPrice = 
      costing?.suggested_price ??
        costing?.final_price ??
        costing?.total_price ??
        productionCost + profitAmount
    ;*/

    const suggestedUnitPrice = roundMoney(
      costing?.unit_cost ??
        costing?.unit_price ??
        suggestedPrice / yieldQuantity
    );
	
    /*const suggestedUnitPrice =
      costing?.suggested_unit_price ??
        costing?.unit_price ??
        suggestedPrice / yieldQuantity
    ;*/

    const commercialQuantity = quantity > 0 ? quantity : 1;
    const lineSuggestedTotal = roundMoney(suggestedUnitPrice * commercialQuantity);

    res.json({
      recipe_id: recipe.recipe_id,
      recipe_code: recipe.recipe_code,
      recipe_name: recipe.recipe_name,
      description: recipe.description,

      yield_quantity: Number(recipe.yield_quantity || 1),
      yield_unit_id: recipe.yield_unit_id,
      yield_unit_code: recipe.yield_unit_code,
      yield_unit_name: recipe.yield_unit_name,

      costing_mode: costingMode,

      ingredient_cost: ingredientCost,
      labor_cost: laborCost,
      overhead_cost: overheadCost,
      production_cost: productionCost,
      profit_amount: profitAmount,

      suggested_price: suggestedPrice,
      suggested_unit_price: suggestedUnitPrice,

      commercial_quantity: commercialQuantity,
      line_suggested_total: lineSuggestedTotal,

      quote_line_defaults: {
        recipe_id: recipe.recipe_id,
        item_description: recipe.recipe_name,
        quantity: commercialQuantity,
        unit_id: recipe.yield_unit_id,
        unit_price: suggestedUnitPrice,

        recipe_cost_snapshot: productionCost,
        recipe_suggested_price_snapshot: suggestedUnitPrice,
        recipe_costing_mode: costingMode,
        price_was_modified: false,
      },
    });
  } catch (error) {
    console.error("Error obteniendo precio de receta para comercial:", error);

    res.status(500).json({
      message: "Error obteniendo precio/costo de receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

module.exports = router;
