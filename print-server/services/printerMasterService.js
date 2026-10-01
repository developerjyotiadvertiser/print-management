const pool = require("../config/db");
const moment = require("moment-timezone");

const savePrinterService = async (data) => {
  const { printer_name, pm_status } = data;
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO printer_master
        (printer_name, pm_status,, pm_created_at)
        VALUES (?, ?, ?)
    `;
  const [result] = await pool.query(sql, [printer_name, pm_status, createdAt]);
  return result;
};

const getAllPrinterService = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM printer_master ORDER BY pm_id DESC`,
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updatePrinterService = async (pm_id, data) => {
  const fields = [];
  const values = [];

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (data.printer_name !== undefined) {
    fields.push("printer_name = ?");
    values.push(data.printer_name);
  }

  if (data.pm_status !== undefined) {
    fields.push("pm_status = ?");
    values.push(data.pm_status);
  }

  // Nothing to update
  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  // Always update updated_at
  fields.push("pm_updated_at = ?");
  values.push(updateAt);

  // WHERE condition
  values.push(pm_id);

  const sql = `
    UPDATE printer_master
    SET ${fields.join(", ")}
    WHERE pm_id = ?
  `;

  const [result] = await pool.query(sql, values);

  return result;
};

const deletePrinterService = async (pm_id) => {
  try {
    const sql = `
      DELETE FROM printer_master
      WHERE pm_id = ?
    `;
    const [result] = await pool.query(sql, [pm_id]);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  savePrinterService,
  getAllPrinterService,
  updatePrinterService,
  deletePrinterService,
};
