const express = require("express");
const router = express.Router();
const pool = require("../db");

// =========================================
// LISTAR RECETAS
// =========================================
router.get("/", async (req, res) => {
  try {
    const query = `
     Select 1;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando recetas:", error);

    res.status(500).json({
      message: "Error consultando recetas",
      error: error.message,
      detail: error.detail,
      code: error.code,
    });
  }
});

// =========================================
// DETALLE RECETA PARA COSTEO ACTUAL
// =========================================
router.get("/:id/details", async (req, res) => {
  const { id } = req.params;

  try {
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
        r.estimated_production_minutes,

        r.production_overhead_percentage,
        r.production_overhead_fixed_amount,

        r.profit_calculation_type,
        r.profit_percentage,

        r.is_active
      FROM tanta_house.recipe r
      JOIN tanta_house.unit_of_measure u
        ON u.unit_id = r.yield_unit_id
      WHERE r.recipe_id = $1;
      `,
      [Number(id)]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Receta no encontrada",
      });
    }

    const ingredientsResult = await pool.query(
      `
      SELECT
        ri.recipe_ingredient_id,
        ri.recipe_id,
        ri.ingredient_id,
        i.ingredient_code,
        i.ingredient_name,
        ri.quantity,
        ri.unit_id,
        u.unit_code,
        u.unit_name,
        ri.notes,
        ri.is_active,
        luc.supplier_name,
        luc.presentation_name,
        luc.currency_code,
        luc.unit_cost,
        luc.stock_unit_id,
        luc.stock_unit_code,
        tanta_house.convert_ingredient_unit(
          ri.quantity,
          ri.ingredient_id,
          ri.unit_id,
          luc.stock_unit_id
        ) AS converted_quantity,
        ROUND(
          (
            tanta_house.convert_ingredient_unit(
              ri.quantity,
              ri.ingredient_id,
              ri.unit_id,
              luc.stock_unit_id
            ) * COALESCE(luc.unit_cost, 0)
          )::numeric,
          4
        ) AS line_cost
      FROM tanta_house.recipe_ingredient ri
      JOIN tanta_house.ingredient i
        ON i.ingredient_id = ri.ingredient_id
      JOIN tanta_house.unit_of_measure u
        ON u.unit_id = ri.unit_id
      LEFT JOIN tanta_house.vw_latest_ingredient_unit_cost luc
        ON luc.ingredient_id = ri.ingredient_id
      WHERE ri.recipe_id = $1
        AND ri.is_active = TRUE
      ORDER BY ri.recipe_ingredient_id DESC;
      `,
      [Number(id)]
    );

    const costResult = await pool.query(
      `
      SELECT *
      FROM tanta_house.calculate_recipe_cost($1::bigint);
      `,
      [Number(id)]
    );

    res.json({
      recipe: recipeResult.rows[0],
      ingredients: ingredientsResult.rows,
      cost: costResult.rows[0] || null,
    });
  } catch (error) {
    console.error("Error consultando detalle de receta:", error);

    res.status(500).json({
      message: "Error consultando detalle de receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// =========================================
// CREAR RECETA
// =========================================
router.post("/", async (req, res) => {
  const {
    recipe_code,
    recipe_name,
    description,
    yield_quantity,
    yield_unit_id,

    labor_cost_type = "PERCENTAGE",
    labor_percentage = 0,
    labor_fixed_amount = 0,
    estimated_production_minutes = null,

    production_overhead_percentage = 0,
    production_overhead_fixed_amount = 0,

    profit_calculation_type = "MARKUP",
    profit_percentage = 0,

    is_active = true,
    created_by = 1,
  } = req.body;

  if (!recipe_code?.trim() || !recipe_name?.trim() || !yield_unit_id) {
    return res.status(400).json({
      message: "Código, nombre y unidad de rendimiento son obligatorios",
    });
  }

  try {
    const query = `
      INSERT INTO tanta_house.recipe (
          recipe_code,
          recipe_name,
          description,
          yield_quantity,
          yield_unit_id,

          labor_cost_type,
          labor_percentage,
          labor_fixed_amount,
          estimated_production_minutes,

          production_overhead_percentage,
          production_overhead_fixed_amount,

          profit_calculation_type,
          profit_percentage,

          is_active,
          created_by,
          created_at
      )
      VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,
          $10,$11,
          $12,$13,
          $14,$15,CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;

    const values = [
      recipe_code.trim(),
      recipe_name.trim(),
      description || null,
      Number(yield_quantity || 1),
      Number(yield_unit_id),

      labor_cost_type || "PERCENTAGE",
      Number(labor_percentage || 0),
      Number(labor_fixed_amount || 0),
      estimated_production_minutes
        ? Number(estimated_production_minutes)
        : null,

      Number(production_overhead_percentage || 0),
      Number(production_overhead_fixed_amount || 0),

      profit_calculation_type || "MARKUP",
      Number(profit_percentage || 0),

      Boolean(is_active),
      Number(created_by || 1),
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando receta:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "Ya existe una receta con ese código",
        error: error.message,
        detail: error.detail,
      });
    }

    res.status(500).json({
      message: "Error creando receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// =========================================
// ACTUALIZAR RECETA
// =========================================
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    recipe_code,
    recipe_name,
    description,
    yield_quantity,
    yield_unit_id,

    labor_cost_type = "PERCENTAGE",
    labor_percentage = 0,
    labor_fixed_amount = 0,
    estimated_production_minutes = null,

    production_overhead_percentage = 0,
    production_overhead_fixed_amount = 0,

    profit_calculation_type = "MARKUP",
    profit_percentage = 0,

    is_active = true,
    updated_by = 1,
  } = req.body;

  if (!recipe_code?.trim() || !recipe_name?.trim() || !yield_unit_id) {
    return res.status(400).json({
      message: "Código, nombre y unidad de rendimiento son obligatorios",
    });
  }

  try {
    const query = `
      UPDATE tanta_house.recipe
      SET
          recipe_code = $1,
          recipe_name = $2,
          description = $3,
          yield_quantity = $4,
          yield_unit_id = $5,

          labor_cost_type = $6,
          labor_percentage = $7,
          labor_fixed_amount = $8,
          estimated_production_minutes = $9,

          production_overhead_percentage = $10,
          production_overhead_fixed_amount = $11,

          profit_calculation_type = $12,
          profit_percentage = $13,

          is_active = $14,
          updated_by = $15,
          updated_at = CURRENT_TIMESTAMP

      WHERE recipe_id = $16

      RETURNING *;
    `;

    const values = [
      recipe_code.trim(),
      recipe_name.trim(),
      description || null,
      Number(yield_quantity || 1),
      Number(yield_unit_id),

      labor_cost_type || "PERCENTAGE",
      Number(labor_percentage || 0),
      Number(labor_fixed_amount || 0),
      estimated_production_minutes
        ? Number(estimated_production_minutes)
        : null,

      Number(production_overhead_percentage || 0),
      Number(production_overhead_fixed_amount || 0),

      profit_calculation_type || "MARKUP",
      Number(profit_percentage || 0),

      Boolean(is_active),
      Number(updated_by || 1),
      Number(id),
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Receta no encontrada",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando receta:", error);

    res.status(500).json({
      message: "Error actualizando receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// =========================================
// DESACTIVAR RECETA
// =========================================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { updated_by = 1 } = req.body || {};

  try {
    const result = await pool.query(
      `
      UPDATE tanta_house.recipe
      SET
          is_active = FALSE,
          updated_by = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE recipe_id = $2
      RETURNING *;
      `,
      [Number(updated_by || 1), Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Receta no encontrada",
      });
    }

    res.json({
      message: "Receta desactivada correctamente",
      recipe: result.rows[0],
    });
  } catch (error) {
    console.error("Error eliminando receta:", error);

    res.status(500).json({
      message: "Error eliminando receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// =========================================
// AGREGAR INSUMO A RECETA
// =========================================
router.post("/:id/ingredients", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      ingredient_id,
      quantity,
      unit_id,
      notes,
      created_by = 1,
    } = req.body;

    if (!ingredient_id || !quantity || !unit_id) {
      return res.status(400).json({
        message: "Insumo, cantidad y unidad son obligatorios",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        message: "La cantidad debe ser mayor a cero",
      });
    }

    await pool.query(
      `
      SELECT tanta_house.convert_ingredient_unit(
        $1::numeric,
        $2::bigint,
        $3::bigint,
        i.stock_unit_id::bigint
      ) AS converted_quantity
      FROM tanta_house.ingredient i
      WHERE i.ingredient_id = $2::bigint;
      `,
      [
        Number(quantity),
        Number(ingredient_id),
        Number(unit_id),
      ]
    );

    const result = await pool.query(
      `
      INSERT INTO tanta_house.recipe_ingredient (
        recipe_id,
        ingredient_id,
        quantity,
        unit_id,
        notes,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *;
      `,
      [
        Number(id),
        Number(ingredient_id),
        Number(quantity),
        Number(unit_id),
        notes || null,
        Number(created_by || 1),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error agregando insumo a receta:", error);

    if (
      error.message?.includes("No existe ruta de conversión") ||
      error.message?.includes("No existe conversión")
    ) {
      return res.status(400).json({
        message:
          "No existe conversión para este insumo entre la unidad seleccionada y la unidad de stock",
        detail: error.message,
      });
    }

    res.status(500).json({
      message: "Error agregando insumo a receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// =========================================
// ACTUALIZAR INSUMO DE RECETA
// =========================================
router.put("/:id/ingredients/:lineId", async (req, res) => {
  try {
    const { id, lineId } = req.params;

    const {
      ingredient_id,
      quantity,
      unit_id,
      notes,
      is_active = true,
      updated_by = 1,
    } = req.body;

    if (!ingredient_id || !quantity || !unit_id) {
      return res.status(400).json({
        message: "Insumo, cantidad y unidad son obligatorios",
      });
    }

    await pool.query(
      `
      SELECT tanta_house.convert_ingredient_unit(
        $1::numeric,
        $2::bigint,
        $3::bigint,
        i.stock_unit_id::bigint
      ) AS converted_quantity
      FROM tanta_house.ingredient i
      WHERE i.ingredient_id = $2::bigint;
      `,
      [
        Number(quantity),
        Number(ingredient_id),
        Number(unit_id),
      ]
    );

    const result = await pool.query(
      `
      UPDATE tanta_house.recipe_ingredient
      SET
        ingredient_id = $1,
        quantity = $2,
        unit_id = $3,
        notes = $4,
        is_active = $5,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $6
      WHERE recipe_ingredient_id = $7
        AND recipe_id = $8
      RETURNING *;
      `,
      [
        Number(ingredient_id),
        Number(quantity),
        Number(unit_id),
        notes || null,
        Boolean(is_active),
        Number(updated_by || 1),
        Number(lineId),
        Number(id),
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Línea de receta no encontrada",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando insumo de receta:", error);

    if (
      error.message?.includes("No existe ruta de conversión") ||
      error.message?.includes("No existe conversión")
    ) {
      return res.status(400).json({
        message:
          "No existe conversión para este insumo entre la unidad seleccionada y la unidad de stock",
        detail: error.message,
      });
    }

    res.status(500).json({
      message: "Error actualizando insumo de receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// =========================================
// ELIMINAR INSUMO DE RECETA
// =========================================
router.delete("/:id/ingredients/:lineId", async (req, res) => {
  try {
    const { id, lineId } = req.params;
    const { updated_by = 1 } = req.body || {};

    const result = await pool.query(
      `
      UPDATE tanta_house.recipe_ingredient
      SET
        is_active = FALSE,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $1
      WHERE recipe_ingredient_id = $2
        AND recipe_id = $3
      RETURNING *;
      `,
      [Number(updated_by || 1), Number(lineId), Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Línea de receta no encontrada",
      });
    }

    res.json({
      message: "Insumo retirado de la receta",
      line: result.rows[0],
    });
  } catch (error) {
    console.error("Error eliminando insumo de receta:", error);

    res.status(500).json({
      message: "Error eliminando insumo de receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

// =========================================
// SIMULACIÓN DE COSTEO POR FECHA
// =========================================
router.get("/:id/cost-simulation", async (req, res) => {
  try {
    const { id } = req.params;
    const { cost_date } = req.query;

    if (!cost_date) {
      return res.status(400).json({
        message: "La fecha de simulación es obligatoria",
      });
    }

    const recipeResult = await pool.query(
      `
      SELECT
        r.recipe_id,
        r.recipe_code,
        r.recipe_name,
        r.yield_quantity,
        u.unit_code AS yield_unit_code,

        r.labor_cost_type,
        r.labor_percentage,
        r.labor_fixed_amount,
        r.estimated_production_minutes,

        r.production_overhead_percentage,
        r.production_overhead_fixed_amount,

        r.profit_calculation_type,
        r.profit_percentage
      FROM tanta_house.recipe r
      JOIN tanta_house.unit_of_measure u
        ON u.unit_id = r.yield_unit_id
      WHERE r.recipe_id = $1;
      `,
      [Number(id)]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Receta no encontrada",
      });
    }

    const detailResult = await pool.query(
      `
      SELECT
        ri.recipe_ingredient_id,
        ri.ingredient_id,
        i.ingredient_code,
        i.ingredient_name,
        ri.quantity,
        ri.unit_id,
        recipe_unit.unit_code AS recipe_unit_code,

        price.supplier_id,
        price.supplier_name,
        price.presentation_id,
        price.presentation_name,
        price.currency_code,
        price.current_price,
        price.unit_cost,
        price.stock_unit_id,
        price.stock_unit_code,
        price.effective_from,
        price.effective_to,

        tanta_house.convert_ingredient_unit(
          ri.quantity,
          ri.ingredient_id,
          ri.unit_id,
          price.stock_unit_id
        ) AS converted_quantity,

        ROUND(
          (
            tanta_house.convert_ingredient_unit(
              ri.quantity,
              ri.ingredient_id,
              ri.unit_id,
              price.stock_unit_id
            ) * COALESCE(price.unit_cost, 0)
          )::numeric,
          4
        ) AS line_cost

      FROM tanta_house.recipe_ingredient ri
      JOIN tanta_house.ingredient i
        ON i.ingredient_id = ri.ingredient_id
      JOIN tanta_house.unit_of_measure recipe_unit
        ON recipe_unit.unit_id = ri.unit_id

      LEFT JOIN LATERAL (
        SELECT
          isp.supplier_id,
          s.supplier_name,
          isp.presentation_id,
          ipp.presentation_name,
          isp.currency_code,
          isp.current_price,
          ipp.stock_unit_id,
          stock_unit.unit_code AS stock_unit_code,
          isp.effective_from,
          isp.effective_to,
          CASE
            WHEN ipp.conversion_factor IS NULL OR ipp.conversion_factor = 0
            THEN NULL
            ELSE ROUND((isp.current_price / ipp.conversion_factor)::numeric, 6)
          END AS unit_cost
        FROM tanta_house.ingredient_supplier_price isp
        JOIN tanta_house.supplier s
          ON s.supplier_id = isp.supplier_id
        JOIN tanta_house.ingredient_purchase_presentation ipp
          ON ipp.presentation_id = isp.presentation_id
        JOIN tanta_house.unit_of_measure stock_unit
          ON stock_unit.unit_id = ipp.stock_unit_id
        WHERE isp.ingredient_id = ri.ingredient_id
          AND isp.effective_from <= $2::date
          AND (
            isp.effective_to IS NULL
            OR isp.effective_to >= $2::date
          )
        ORDER BY
          isp.effective_from DESC,
          isp.ingredient_supplier_price_id DESC
        LIMIT 1
      ) price ON TRUE

      WHERE ri.recipe_id = $1
        AND ri.is_active = TRUE
      ORDER BY i.ingredient_name;
      `,
      [Number(id), cost_date]
    );

    const summaryResult = await pool.query(
      `
      SELECT *
      FROM tanta_house.calculate_recipe_cost_by_date(
        $1::bigint,
        $2::date
      );
      `,
      [Number(id), cost_date]
    );

    res.json({
      recipe: recipeResult.rows[0],
      cost_date,
      summary: summaryResult.rows[0] || null,
      ingredients: detailResult.rows,
    });
  } catch (error) {
    console.error("Error simulando costo de receta:", error);

    res.status(500).json({
      message: "Error simulando costo de receta",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

module.exports = router;
