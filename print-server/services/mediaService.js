const pool = require("../config/db");
const moment = require("moment-timezone");

const saveMediaService = async (data) => {
  const { mt_name, mt_status } = data;
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO media_type
        (mt_name, mt_status, mt_created_at)
        VALUES (?, ?, ?)
    `;
  const [result] = await pool.query(sql, [mt_name, mt_status, createdAt]);
  return result;
};

const getAllMediaService = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM media_type ORDER BY mt_id DESC`,
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updateMediaService = async (mt_id, data) => {
  const fields = [];
  const values = [];

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  if (data.mt_name !== undefined) {
    fields.push("mt_name = ?");
    values.push(data.mt_name);
  }
  if (data.mt_status !== undefined) {
    fields.push("mt_status = ?");
    values.push(data.mt_status);
  }

  // Nothing to update
  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  // Always update print_updated_at
  fields.push("mt_updated_at = ?");
  values.push(updateAt);
  values.push(mt_id);
  const sql = `
    UPDATE media_type
    SET ${fields.join(", ")}
    WHERE mt_id = ?
  `;

  const [result] = await pool.query(sql, values);
  return result;
};

const deleteMediaService = async (mt_id) => {
  try {
    const sql = `
      DELETE FROM media_type
      WHERE mt_id = ?
    `;
    const [result] = await pool.query(sql, [mt_id]);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveMediaService,
  getAllMediaService,
  updateMediaService,
  deleteMediaService,
};
