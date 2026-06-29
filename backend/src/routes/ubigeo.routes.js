const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/departamentos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT departamento
      FROM "SISGES"."MAE_UBIGEO"
      ORDER BY departamento
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo departamentos" });
  }
});

router.get("/provincias/:departamento", async (req, res) => {
  try {
    const { departamento } = req.params;

    const result = await pool.query(
      `
      SELECT DISTINCT provincia
      FROM "SISGES"."MAE_UBIGEO"
      WHERE departamento = $1
      ORDER BY provincia
      `,
      [departamento]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo provincias" });
  }
});

router.get("/distritos/:departamento/:provincia", async (req, res) => {
  try {
    const { departamento, provincia } = req.params;

    const result = await pool.query(
      `
      SELECT DISTINCT distrito
      FROM "SISGES"."MAE_UBIGEO"
      WHERE departamento = $1
        AND provincia = $2
      ORDER BY distrito
      `,
      [departamento, provincia]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo distritos" });
  }
});

module.exports = router;