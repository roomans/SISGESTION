const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 1;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando categorías:", error);
    res.status(500).json({ message: "Error consultando categorías" });
  }
});

router.get("/units", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 1;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando unidades:", error);
    res.status(500).json({ message: "Error consultando unidades" });
  }
});

module.exports = router;