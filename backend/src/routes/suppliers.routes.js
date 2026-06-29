const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT proveedor_id,
       tipo_documento,
       nro_documento,
       nombre,
       apellido_paterno,
       apellido_materno,
       razon_social,
       departamento,
       provincia,
       ciudad,
       direccion,
       ubigeo,
       correo,
       telefono,
       pagina_web,
       ciiu,
       calificacion,
       representante_legal,
       status,
       create_date,
       create_by,
       last_update,
       update_by
	  FROM "SISGES"."MAE_PROVEEDOR"
	  ORDER BY Proveedor_id desc;
      `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error consultando proveedores:", error);
    res.status(500).json({ message: "Error consultando proveedores" });
  }
});

router.post("/", async (req, res) => {
  try {
const {
  nombre,
  apellido_paterno,
  apellido_materno,
  razon_social,
  tipo_documento,
  nro_documento,
  departamento,
  provincia,
  ciudad,
  direccion,
  correo,
  telefono,
  ciiu,
  representante_legal,
  calificacion,
  status = true,
  create_by = 1,
} = req.body;

if (!razon_social) {
  return res.status(400).json({
    message: "La razón social es obligatoria",
  });
}
	
	const ubigeoResult = await pool.query(
  `
  SELECT ubigeo_inei
  FROM "SISGES"."MAE_UBIGEO"
  WHERE departamento = $1
    AND provincia = $2
    AND distrito = $3
  LIMIT 1
  `,
  [departamento, provincia, ciudad]
);

const ubigeo =
  ubigeoResult.rows.length > 0
    ? ubigeoResult.rows[0].ubigeo_inei
    : null;
console.log(req.body);

const statusCodigo = status ? "A" : "I";
const proveedor_id = parseInt(nro_documento);
const result = await pool.query(
  `
INSERT INTO "SISGES"."MAE_PROVEEDOR" (
  proveedor_id,
  tipo_documento,
  nro_documento,
  nombre,
  apellido_paterno,
  apellido_materno,
  razon_social,
  departamento,
  provincia,
  ciudad,
  direccion,
  ubigeo,
  correo,
  telefono,
  ciiu,
  representante_legal,
  calificacion,
  status,
  create_by
)
VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
  $11,$12,$13,$14,$15,$16,$17,$18,$19
)
RETURNING *;
  `,
[
  proveedor_id,
  tipo_documento,
  nro_documento || null,
  nombre || null,
  apellido_paterno || null,
  apellido_materno || null,
  razon_social || null,
  departamento || null,
  provincia || null,
  ciudad || null,
  direccion || null,
  ubigeo || null,
  correo || null,
  telefono || null,
  ciiu || null,
  representante_legal || null,
  calificacion || null,
  statusCodigo,
  create_by,
]
);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando proveedor:", error);
    res.status(500).json({ message: "Error creando proveedor" });
  }
});

router.put("/:id", async (req, res) => {
  try {
	  console.log(req.body);
console.log("status:", req.body.status, typeof req.body.status);
    const { id } = req.params;

    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      razon_social,
      tipo_documento,
      nro_documento,
      departamento,
      provincia,
      ciudad,
      direccion,
      correo,
      telefono,
      ciiu,
      representante_legal,
      calificacion,
      status = true,
      update_by = 1,
    } = req.body;

    const ubigeoResult = await pool.query(
      `
      SELECT ubigeo_inei
      FROM "SISGES"."MAE_UBIGEO"
      WHERE departamento = $1
        AND provincia = $2
        AND distrito = $3
      LIMIT 1
      `,
      [departamento, provincia, ciudad]
    );

    const ubigeo =
      ubigeoResult.rows.length > 0
        ? ubigeoResult.rows[0].ubigeo_inei
        : null;

    const statusCodigo = status ? "A" : "I";
	console.log("ID recibido:", id);

    const result = await pool.query(
      `
      UPDATE "SISGES"."MAE_PROVEEDOR"
      SET
        tipo_documento = $1,
        nro_documento = $2,
        nombre = $3,
        apellido_paterno = $4,
        apellido_materno = $5,
        razon_social = $6,
        departamento = $7,
        provincia = $8,
        ciudad = $9,
        direccion = $10,
        ubigeo = $11,
        correo = $12,
        telefono = $13,
        ciiu = $14,
        representante_legal = $15,
        calificacion = $16,
        status = $17,
        last_update = CURRENT_TIMESTAMP,
        update_by = $18
      WHERE proveedor_id = $19
      RETURNING *;
      `,
      [
        tipo_documento,
        nro_documento,
        nombre || null,
        apellido_paterno || null,
        apellido_materno || null,
        razon_social || null,
        departamento || null,
        provincia || null,
        ciudad || null,
        direccion || null,
        ubigeo,
        correo || null,
        telefono || null,
        ciiu || null,
        representante_legal || null,
        calificacion || null,
        statusCodigo,
        update_by,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Proveedor no encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando proveedor:", error);
    res.status(500).json({
      message: "Error actualizando proveedor",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM "SISGES"."MAE_PROVEEDOR"
      WHERE proveedor_id = $1
      RETURNING *;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Proveedor no encontrado",
      });
    }

    res.json({
      message: "Proveedor eliminado correctamente",
      supplier: result.rows[0],
    });
  } catch (error) {
    console.error("Error eliminando proveedor:", error);
    res.status(500).json({
      message: "Error eliminando proveedor",
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
  }
});
module.exports = router;