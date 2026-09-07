const pool = require("../config/db");
const moment = require("moment-timezone");

const savePrintService = async (data) => {
  const {
    creative,
    media_type,
    width,
    height,
    size_unit,
    quality_print,
    quantity,
    total_area,
    remarks,
  } = data;
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO print_records
        (creative, media_type, print_date, width, height, size_unit, quality_print, quantity, total_area, 	remarks, print_created_at)
        VALUES (?, ?, ?, ?,?,?,?,?,?, ?, ?)
    `;
  const [result] = await pool.query(sql, [
    creative,
    media_type,
    createdAt,
    width,
    height,
    size_unit,
    quality_print,
    quantity,
    total_area,
    remarks,
    createdAt,
  ]);
  return result;
};

const getAllPrintService = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM print_records ORDER BY print_id DESC`,
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updatePrintService = async (print_id, data) => {
  const fields = [];
  const values = [];

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (data.creative !== undefined) {
    fields.push("creative = ?");
    values.push(data.creative);
  }

  if (data.media_type !== undefined) {
    fields.push("media_type = ?");
    values.push(data.media_type);
  }

  if (data.print_date !== undefined) {
    fields.push("print_date = ?");
    values.push(data.print_date);
  }

  if (data.width !== undefined) {
    fields.push("width = ?");
    values.push(data.width);
  }

  if (data.height !== undefined) {
    fields.push("height = ?");
    values.push(data.height);
  }

  if (data.size_unit !== undefined) {
    fields.push("size_unit = ?");
    values.push(data.size_unit);
  }

  if (data.quality_print !== undefined) {
    fields.push("quality_print = ?");
    values.push(data.quality_print);
  }

  if (data.quantity !== undefined) {
    fields.push("quantity = ?");
    values.push(data.quantity);
  }

  if (data.total_area !== undefined) {
    fields.push("total_area = ?");
    values.push(data.total_area);
  }

  if (data.remarks !== undefined) {
    fields.push("remarks = ?");
    values.push(data.remarks);
  }

  // Nothing to update
  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  // Always update print_updated_at
  fields.push("print_updated_at = ?");
  values.push(updateAt);

  values.push(print_id);

  const sql = `
    UPDATE print_records
    SET ${fields.join(", ")}
    WHERE print_id = ?
  `;

  const [result] = await pool.query(sql, values);

  return result;
};

const deletePrintService = async (print_id) => {
  try {
    const sql = `
      DELETE FROM print_records
      WHERE print_id = ?
    `;

    const [result] = await pool.query(sql, [print_id]);

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  savePrintService,
  getAllPrintService,
  updatePrintService,
  deletePrintService,
};
