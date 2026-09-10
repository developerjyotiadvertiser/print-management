const pool = require("../config/db");
const moment = require("moment-timezone");

const saveClientService = async (data) => {
  const {
    client_name,
    client_contact,
    client_address,
    pan_number,
    gst_number,
    pincode,
  } = data;
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO print_party_master (client_name, client_contact, client_address, pan_number, gst_number, pincode, client_created_at)
        VALUES (?, ?, ?, ?,?,?,?)
    `;
  const [result] = await pool.query(sql, [
    client_name,
    client_contact,
    client_address,
    pan_number,
    gst_number,
    pincode,
    createdAt,
  ]);
  return result;
};

const getAllClientService = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM print_party_master ORDER BY client_id DESC`,
    );
    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updateClientService = async (client_id, data) => {
  const fields = [];
  const values = [];

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  if (data.client_name !== undefined) {
    fields.push("client_name = ?");
    values.push(data.client_name);
  }
  if (data.client_contact !== undefined) {
    fields.push("client_contact = ?");
    values.push(data.client_contact);
  }
  if (data.client_address !== undefined) {
    fields.push("client_address = ?");
    values.push(data.client_address);
  }
  if (data.pan_number !== undefined) {
    fields.push("pan_number = ?");
    values.push(data.pan_number);
  }
  if (data.gst_number !== undefined) {
    fields.push("gst_number = ?");
    values.push(data.gst_number);
  }
  if (data.pincode !== undefined) {
    fields.push("pincode = ?");
    values.push(data.pincode);
  }

  // Nothing to update
  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  fields.push("client_updated_at = ?");
  values.push(updateAt);
  values.push(client_id);
  const sql = `
    UPDATE print_party_master
    SET ${fields.join(", ")}
    WHERE client_id = ?
  `;

  const [result] = await pool.query(sql, values);
  return result;
};

const deleteClientService = async (client_id) => {
  try {
    const sql = `
      DELETE FROM print_party_master
      WHERE client_id = ?
    `;
    const [result] = await pool.query(sql, [client_id]);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveClientService,
  getAllClientService,
  updateClientService,
  deleteClientService,
};
