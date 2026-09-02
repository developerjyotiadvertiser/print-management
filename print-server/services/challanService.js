const pool = require("../config/db");
const moment = require("moment-timezone");

const saveChallanService = async (data) => {
  const {
    ch_client_id,
    ch_print_id,
    ch_date,
    ch_description,
    ch_creative,
    ch_height,
    ch_width,
    ch_quantity,
    ch_area,
    ch_delivered_to,
    ch_phone,
    ch_remark,
  } = data;
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO print_challan (ch_client_id,
    ch_print_id,
    ch_date,
    ch_description,
    ch_creative,
    ch_height,
    ch_width,
    ch_quantity,
    ch_area,
    ch_delivered_to,
    ch_phone,
    ch_remark,
    ch_created_at)
    VALUES (?, ?, ?, ?,?,?,?, ?, ?, ?, ?, ?, ?)
    `;
  const [result] = await pool.query(sql, [
    ch_client_id,
    ch_print_id,
    ch_date,
    ch_description,
    ch_creative,
    ch_height,
    ch_width,
    ch_quantity,
    ch_area,
    ch_delivered_to,
    ch_phone,
    ch_remark,
    createdAt,
  ]);
  return result;
};

const getAllChallanService = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM print_challan ORDER BY Ch_id DESC`,
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updateChallanService = async (challan_id, data) => {
  const fields = [];
  const values = [];

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  if (data.ch_client_id !== undefined) {
    fields.push("ch_client_id = ?");
    values.push(data.ch_client_id);
  }

  if (data.ch_print_id !== undefined) {
    fields.push("	ch_print_id = ?");
    values.push(data.ch_print_id);
  }

  if (data.ch_date !== undefined) {
    fields.push("ch_date = ?");
    values.push(data.ch_date);
  }

  if (data.ch_description !== undefined) {
    fields.push("ch_description = ?");
    values.push(data.ch_description);
  }

  if (data.ch_creative !== undefined) {
    fields.push("ch_creative = ?");
    values.push(data.ch_creative);
  }

  if (data.ch_height !== undefined) {
    fields.push("ch_height = ?");
    values.push(data.ch_height);
  }

  if (data.ch_width !== undefined) {
    fields.push("ch_width = ?");
    values.push(data.ch_width);
  }

  if (data.ch_quantity !== undefined) {
    fields.push("ch_quantity = ?");
    values.push(data.ch_quantity);
  }

  if (data.ch_area !== undefined) {
    fields.push("ch_area = ?");
    values.push(data.ch_area);
  }

  if (data.delivered_to !== undefined) {
    fields.push("delivered_to = ?");
    values.push(data.delivered_to);
  }

  if (data.ch_phone !== undefined) {
    fields.push("ch_phone = ?");
    values.push(data.ch_phone);
  }

  if (data.ch_remark !== undefined) {
    fields.push("ch_remark = ?");
    values.push(data.ch_remark);
  }

  // Nothing to update

  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  // Always update Challan_updated_at
  fields.push("ch_updated_at = ?");
  values.push(updateAt);

  values.push(challan_id);

  const sql = `
    UPDATE print_challan
    SET ${fields.join(", ")}
    WHERE ch_id = ?
  `;

  const [result] = await pool.query(sql, values);

  return result;
};

const deleteChallanService = async (challan_id) => {
  try {
    const sql = `
      DELETE FROM print_challan
      WHERE ch_id = ?
    `;

    const [result] = await pool.query(sql, [challan_id]);

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveChallanService,
  getAllChallanService,
  updateChallanService,
  deleteChallanService,
};
