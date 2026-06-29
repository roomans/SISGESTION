const express = require("express");
const pool = require("../db");

const router = express.Router();

// CIIU
router.get("/ciiu", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        codigo_valor,
        descripcion
      FROM "SISGES"."MAE_LISTA_VALORES"
      WHERE cod_grupo = '0002'
        AND tipo_grupo = 'CODIGO_CIIU_SUNAT'
      ORDER BY descripcion
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error obteniendo CIIU",
    });
  }
});

// Tipos de documento
router.get("/tipo-documento", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        codigo_valor,
        descripcion
      FROM "SISGES"."MAE_LISTA_VALORES"
      WHERE cod_grupo = '0001'
        AND tipo_grupo = 'TIPO_DOC_SUNAT'
      ORDER BY codigo_valor
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error obteniendo tipos de documento",
    });
  }
});

module.exports = router;