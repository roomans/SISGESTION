const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Usuario y contraseña son obligatorios",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        user_id,
        username,
        full_name,
        email,
        password_hash,
        is_active
      FROM "SISGES"."app_user"
      WHERE username = $1
      LIMIT 1;
      `,
      [username]
    );

    console.log("DB RESULT:", result.rows);

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Usuario no encontrado",
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        message: "Usuario inactivo",
      });
    }

    console.log("HASH EN BD:", user.password_hash);

    const passwordIsValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    console.log("PASSWORD VALID:", passwordIsValid);

    if (!passwordIsValid) {
      return res.status(401).json({
        message: "Contraseña incorrecta",
      });
    }

    return res.json({
      message: "Login correcto",
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("ERROR REAL LOGIN:", error);

    return res.status(500).json({
      message: "Error interno en login",
      error: error.message,
    });
  }
});

module.exports = router;