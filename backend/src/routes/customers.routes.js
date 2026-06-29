const express = require("express");
const router = express.Router();
const pool = require("../db");

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return Number(value);
};

router.get("/", async (req, res) => {
  try {
    const {
      search,
      only_active = "true",
      source_channel_id,
      accepts_promotions,
      is_corporate,
    } = req.query;

    const values = [];
    let where = "WHERE 1 = 1";

    if (only_active === "true") where += " AND is_active = TRUE";

    if (source_channel_id) {
      values.push(Number(source_channel_id));
      where += ` AND source_channel_id = $${values.length}`;
    }

    if (accepts_promotions !== undefined && accepts_promotions !== "") {
      values.push(accepts_promotions === "true");
      where += ` AND accepts_promotions = $${values.length}`;
    }

    if (is_corporate !== undefined && is_corporate !== "") {
      values.push(is_corporate === "true");
      where += ` AND is_corporate = $${values.length}`;
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where += ` AND (
        LOWER(customer_code) LIKE $${values.length}
        OR LOWER(customer_name) LIKE $${values.length}
        OR LOWER(COALESCE(commercial_name,'')) LIKE $${values.length}
        OR LOWER(COALESCE(document_number,'')) LIKE $${values.length}
        OR LOWER(COALESCE(phone,'')) LIKE $${values.length}
        OR LOWER(COALESCE(secondary_phone,'')) LIKE $${values.length}
        OR LOWER(COALESCE(email,'')) LIKE $${values.length}
        OR LOWER(COALESCE(instagram,'')) LIKE $${values.length}
        OR LOWER(COALESCE(tiktok,'')) LIKE $${values.length}
      )`;
    }

    const result = await pool.query(
      `
      SELECT *
      FROM tanta_house.vw_customer_crm
      ${where}
      ORDER BY customer_name;
      `,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando clientes:", error);
    res.status(500).json({
      message: "Error consultando clientes",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM tanta_house.vw_customer_crm
      WHERE customer_id = $1;
      `,
      [Number(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error consultando cliente:", error);
    res.status(500).json({
      message: "Error consultando cliente",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      customer_name,
      commercial_name,
      document_type,
      document_number,
      phone,
      secondary_phone,
      email,
      department,
      province,
      district,
      address,
      address_reference,
      instagram,
      tiktok,
      birth_date,
      accepts_promotions = false,
      is_corporate = false,
      source_channel_id,
      referred_by_name,
      notes,
      created_by = 1,
    } = req.body;

    if (!customer_name?.trim()) {
      return res.status(400).json({ message: "El nombre del cliente es obligatorio" });
    }

    const result = await pool.query(
      `
      INSERT INTO tanta_house.customer (
        customer_code,
        customer_name,
        commercial_name,
        document_type,
        document_number,
        phone,
        secondary_phone,
        email,
        department,
        province,
        district,
        address,
        address_reference,
        instagram,
        tiktok,
        birth_date,
        accepts_promotions,
        is_corporate,
        source_channel_id,
        referred_by_name,
        notes,
        created_by
      )
      VALUES (
        tanta_house.generate_customer_code(),
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )
      RETURNING *;
      `,
      [
        customer_name.trim(),
        commercial_name || null,
        document_type || null,
        document_number || null,
        phone || null,
        secondary_phone || null,
        email || null,
        department || null,
        province || null,
        district || null,
        address || null,
        address_reference || null,
        instagram || null,
        tiktok || null,
        birth_date || null,
        Boolean(accepts_promotions),
        Boolean(is_corporate),
        toNumberOrNull(source_channel_id),
        referred_by_name || null,
        notes || null,
        Number(created_by || 1),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando cliente:", error);
    res.status(500).json({
      message: "Error creando cliente",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      customer_name,
      commercial_name,
      document_type,
      document_number,
      phone,
      secondary_phone,
      email,
      department,
      province,
      district,
      address,
      address_reference,
      instagram,
      tiktok,
      birth_date,
      accepts_promotions = false,
      is_corporate = false,
      source_channel_id,
      referred_by_name,
      notes,
      is_active = true,
      updated_by = 1,
    } = req.body;

    if (!customer_name?.trim()) {
      return res.status(400).json({ message: "El nombre del cliente es obligatorio" });
    }

    const result = await pool.query(
      `
      UPDATE tanta_house.customer
      SET
        customer_name = $1,
        commercial_name = $2,
        document_type = $3,
        document_number = $4,
        phone = $5,
        secondary_phone = $6,
        email = $7,
        department = $8,
        province = $9,
        district = $10,
        address = $11,
        address_reference = $12,
        instagram = $13,
        tiktok = $14,
        birth_date = $15,
        accepts_promotions = $16,
        is_corporate = $17,
        source_channel_id = $18,
        referred_by_name = $19,
        notes = $20,
        is_active = $21,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $22
      WHERE customer_id = $23
      RETURNING *;
      `,
      [
        customer_name.trim(),
        commercial_name || null,
        document_type || null,
        document_number || null,
        phone || null,
        secondary_phone || null,
        email || null,
        department || null,
        province || null,
        district || null,
        address || null,
        address_reference || null,
        instagram || null,
        tiktok || null,
        birth_date || null,
        Boolean(accepts_promotions),
        Boolean(is_corporate),
        toNumberOrNull(source_channel_id),
        referred_by_name || null,
        notes || null,
        Boolean(is_active),
        Number(updated_by || 1),
        Number(req.params.id),
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    res.status(500).json({
      message: "Error actualizando cliente",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (isNaN(customerId)) {
      return res.status(400).json({
        message: "ID de cliente inválido",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM tanta_house.customer
      WHERE customer_id = $1
      RETURNING customer_id, customer_name;
      `,
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    res.status(200).json({
      message: "Cliente eliminado correctamente",
      customer: result.rows[0],
    });

  } catch (error) {
    console.error("Error eliminando cliente:", error);

    res.status(500).json({
      message: "Error eliminando cliente",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});

module.exports = router;
