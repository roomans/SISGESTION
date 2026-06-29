const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        user_id,
        username,
        full_name,
        email,
        is_active,
        created_at,
        created_by,
        updated_at,
        updated_by
      FROM "SISGES"."app_user"
      ORDER BY user_id;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando usuarios:", error);
    res.status(500).json({ message: "Error consultando usuarios" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      username,
      full_name,
      email,
      password,
      is_active = true,
      created_by = 1,
    } = req.body;

    if (!username || !full_name || !password) {
      return res.status(400).json({
        message: "Usuario, nombre completo y contraseña son obligatorios",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO tanta_house.app_user (
        username,
        full_name,
        email,
        password_hash,
        is_active,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        user_id,
        username,
        full_name,
        email,
        is_active,
        created_at,
        created_by,
        updated_at,
        updated_by;
      `,
      [username, full_name, email || null, passwordHash, is_active, created_by]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando usuario:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "El nombre de usuario ya existe",
      });
    }

    res.status(500).json({ message: "Error creando usuario" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      username,
      full_name,
      email,
      password,
      is_active,
      updated_by = 1,
    } = req.body;

    if (!username || !full_name) {
      return res.status(400).json({
        message: "Usuario y nombre completo son obligatorios",
      });
    }

    let result;

    if (password && password.trim() !== "") {
      const passwordHash = await bcrypt.hash(password, 10);

      result = await pool.query(
        `
        UPDATE tanta_house.app_user
        SET
          username = $1,
          full_name = $2,
          email = $3,
          password_hash = $4,
          is_active = $5,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $6
        WHERE user_id = $7
        RETURNING
          user_id,
          username,
          full_name,
          email,
          is_active,
          created_at,
          created_by,
          updated_at,
          updated_by;
        `,
        [
          username,
          full_name,
          email || null,
          passwordHash,
          is_active,
          updated_by,
          id,
        ]
      );
    } else {
      result = await pool.query(
        `
        UPDATE tanta_house.app_user
        SET
          username = $1,
          full_name = $2,
          email = $3,
          is_active = $4,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = $5
        WHERE user_id = $6
        RETURNING
          user_id,
          username,
          full_name,
          email,
          is_active,
          created_at,
          created_by,
          updated_at,
          updated_by;
        `,
        [username, full_name, email || null, is_active, updated_by, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando usuario:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "El nombre de usuario ya existe",
      });
    }

    res.status(500).json({ message: "Error actualizando usuario" });
  }
});

module.exports = router;