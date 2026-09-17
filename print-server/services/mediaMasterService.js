const pool = require("../config/db");
const moment = require("moment-timezone");

const saveMediaMasterService = async (data) => {
  const { mm_media, mm_brand, mm_gsm, mm_size, mm_status } = data;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  try {
    // Get the latest serial number
    const [rows] = await pool.query(`
      SELECT mm_serial_number
      FROM media_master
      WHERE mm_serial_number LIKE 'media-%'
      ORDER BY CAST(SUBSTRING_INDEX(mm_serial_number, '-', -1) AS UNSIGNED) DESC
      LIMIT 1
    `);

    let nextNumber = 1;

    if (rows.length > 0) {
      const lastSerial = rows[0].mm_serial_number; // media-5
      const lastNumber = parseInt(lastSerial.split("-")[1], 10);

      nextNumber = lastNumber + 1;
    }

    const mm_serial_number = `media-${nextNumber}`;

    const sql = `
      INSERT INTO media_master
      (
        mm_serial_number,
        mm_media,
        mm_brand,
        mm_gsm,
        mm_size,
        mm_status,
        mm_created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
      mm_serial_number,
      mm_media,
      mm_brand,
      mm_gsm,
      mm_size,
      mm_status,
      createdAt,
    ]);

    return result;
  } catch (error) {
    console.error("Error saving media:", error);
    throw error;
  }
};

const getAllMediaMasterService = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM media_master ORDER BY mm_id DESC`,
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updateMediaMasterService = async (mm_id, data) => {
  const fields = [];
  const values = [];

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  if (data.mm_media !== undefined) {
    fields.push("mm_media = ?");
    values.push(data.mm_media);
  }

  if (data.mm_brand !== undefined) {
    fields.push("	mm_brand = ?");
    values.push(data.mm_brand);
  }
  if (data.mm_gsm !== undefined) {
    fields.push("mm_gsm = ?");
    values.push(data.mm_gsm);
  }
  if (data.mm_size !== undefined) {
    fields.push("mm_size = ?");
    values.push(data.mm_size);
  }
  if (data.mm_status !== undefined) {
    fields.push("mm_status = ?");
    values.push(data.mm_status);
  }

  // Nothing to update
  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  // Always update print_updated_at
  fields.push("mm_updated_at = ?");
  values.push(updateAt);
  values.push(mm_id);
  const sql = `
    UPDATE media_master
    SET ${fields.join(", ")}
    WHERE mm_id = ?
  `;

  const [result] = await pool.query(sql, values);
  return result;
};

const deleteMediaMasterService = async (mm_id) => {
  try {
    const sql = `
      DELETE FROM media_master
      WHERE mm_id = ?
    `;
    const [result] = await pool.query(sql, [mm_id]);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveMediaMasterService,
  getAllMediaMasterService,
  updateMediaMasterService,
  deleteMediaMasterService,
};
