const pool = require("../config/db");
const moment = require("moment-timezone");

const savePrinterService = async (data) => {
  const {
    printer_name,
    pm_gst_number,
    pm_address,
    pm_pan_number,
    pm_pincode,
    pm_status,
  } = data;
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO printer_master
        (printer_name, pm_gst_number, pm_address, pm_pan_number, pm_pincode, pm_status, pm_created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
  const [result] = await pool.query(sql, [
    printer_name,
    pm_gst_number,
    pm_address,
    pm_pan_number,
    pm_pincode,
    pm_status,
    createdAt,
  ]);
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

  if (data.pm_gst_number !== undefined) {
    fields.push("pm_gst_number = ?");
    values.push(data.pm_gst_number);
  }

  if (data.pm_address !== undefined) {
    fields.push("pm_address = ?");
    values.push(data.pm_address);
  }

  if (data.pm_pan_number !== undefined) {
    fields.push("pm_pan_number = ?");
    values.push(data.pm_pan_number);
  }

  if (data.pm_pincode !== undefined) {
    fields.push("pm_pincode = ?");
    values.push(data.pm_pincode);
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

const savePrinterMediaService = async (data) => {
  const { printer_id, pmm_media, pmm_price } = data;
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO printer_master_media
        (pmm_printer_id, pmm_media, pmm_price, pmm_created_at)
        VALUES (?, ?, ?, ?)
    `;
  const [result] = await pool.query(sql, [
    printer_id,
    pmm_media,
    pmm_price,
    createdAt,
  ]);
  return result;
};

const getAllPrinterMediaByIdService = async (printer_id) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT *
        FROM printer_master_media
        WHERE pmm_printer_id = ?
      `,
      [printer_id],
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updatePrinterMediaService = async (pmm_id, data) => {
  const fields = [];
  const values = [];

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (data.pmm_media !== undefined) {
    fields.push("pmm_media = ?");
    values.push(data.pmm_media);
  }

  if (data.pmm_price !== undefined) {
    fields.push("pmm_price = ?");
    values.push(data.pmm_price);
  }

  // Nothing to update
  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  // Always update updated_at
  fields.push("pmm_updated_at = ?");
  values.push(updateAt);

  // WHERE condition
  values.push(pmm_id);

  const sql = `
    UPDATE printer_master_media
    SET ${fields.join(", ")}
    WHERE pmm_id = ?
  `;

  const [result] = await pool.query(sql, values);

  return result;
};

const deletePrinterMediaService = async (pmm_id) => {
  try {
    const sql = `
      DELETE FROM printer_master_media
      WHERE pmm_id = ?
    `;
    const [result] = await pool.query(sql, [pmm_id]);
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

  savePrinterMediaService,
  getAllPrinterMediaByIdService,
  updatePrinterMediaService,
  deletePrinterMediaService,
};
