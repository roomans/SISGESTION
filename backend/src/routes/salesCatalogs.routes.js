const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/source-channels", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM tanta_house.source_channel
      WHERE is_active = TRUE
      ORDER BY source_channel_name;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando canales:", error);
    res.status(500).json({
      message: "Error consultando canales",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/campaigns", async (req, res) => {
  try {
    const { only_active = "true" } = req.query;

    const result = await pool.query(
      `
      SELECT *
      FROM tanta_house.sales_campaign
      WHERE ($1::boolean = FALSE OR is_active = TRUE)
      ORDER BY start_date DESC NULLS LAST, campaign_name;
      `,
      [only_active === "true"]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando campañas:", error);
    res.status(500).json({
      message: "Error consultando campañas",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.post("/campaigns", async (req, res) => {
  try {
    const {
      campaign_code,
      campaign_name,
      campaign_type,
      start_date,
      end_date,
      description,
      created_by = 1,
    } = req.body;

    if (!campaign_code?.trim() || !campaign_name?.trim()) {
      return res.status(400).json({
        message: "Código y nombre de campaña son obligatorios",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO tanta_house.sales_campaign (
        campaign_code, campaign_name, campaign_type,
        start_date, end_date, description, created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *;
      `,
      [
        campaign_code.trim(),
        campaign_name.trim(),
        campaign_type || null,
        start_date || null,
        end_date || null,
        description || null,
        Number(created_by || 1),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando campaña:", error);
    res.status(500).json({
      message: "Error creando campaña",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

module.exports = router;
