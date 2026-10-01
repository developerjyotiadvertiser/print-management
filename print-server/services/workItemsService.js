const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

const saveWorkItemsService = async (data) => {
  const {
    woi_serial_number,
    woi_jc_number,
    woi_work_allot_date,
    woi_printer_name,
    woi_media,
    woi_size_height,
    woi_size_width,
    woi_quantity,
    woi_area,
    woi_creative,
    woi_creative_image,
    woi_status,
  } = data;

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const sql = `
    INSERT INTO work_order_items
    (
      woi_serial_number,
      woi_jc_number,
      woi_work_allot_date,
      woi_printer_name,
      woi_media,
      woi_size_height,
      woi_size_width,
      woi_quantity,
      woi_area,
      woi_creative,
      woi_creative_image,
      woi_status,
      woi_created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [
    woi_serial_number,
    woi_jc_number,
    woi_work_allot_date,
    woi_printer_name,
    woi_media,
    woi_size_height,
    woi_size_width,
    woi_quantity,
    woi_area,
    woi_creative,
    woi_creative_image,
    woi_status,
    createdAt,
  ]);

  return result;
};

const getAllWorkItemsService = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM work_order_items ORDER BY woi_id DESC`,
    );

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updateWorkItemsService = async (woi_id, data) => {
  const fields = [];
  const values = [];

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // Get existing record
  const [existingRows] = await pool.query(
    `
      SELECT woi_id, woi_creative_image
      FROM work_order_items
      WHERE woi_id = ?
    `,
    [woi_id],
  );

  if (existingRows.length === 0) {
    return {
      affectedRows: 0,
      oldImage: null,
    };
  }

  const oldImage = existingRows[0].woi_creative_image;

  // --------------------------------
  // INDIVIDUAL FIELD UPDATES
  // --------------------------------

  if (data.woi_serial_number !== undefined) {
    fields.push("woi_serial_number = ?");
    values.push(data.woi_serial_number);
  }

  if (data.woi_jc_number !== undefined) {
    fields.push("woi_jc_number = ?");
    values.push(data.woi_jc_number);
  }

  if (data.woi_work_allot_date !== undefined) {
    fields.push("woi_work_allot_date = ?");
    values.push(data.woi_work_allot_date);
  }

  if (data.woi_printer_name !== undefined) {
    fields.push("woi_printer_name = ?");
    values.push(data.woi_printer_name);
  }

  if (data.woi_media !== undefined) {
    fields.push("woi_media = ?");
    values.push(data.woi_media);
  }

  if (data.woi_size_height !== undefined) {
    fields.push("woi_size_height = ?");
    values.push(data.woi_size_height);
  }

  if (data.woi_size_width !== undefined) {
    fields.push("woi_size_width = ?");
    values.push(data.woi_size_width);
  }

  if (data.woi_unit !== undefined) {
    fields.push("woi_unit = ?");
    values.push(data.woi_unit);
  }

  if (data.woi_quantity !== undefined) {
    fields.push("woi_quantity = ?");
    values.push(data.woi_quantity);
  }

  if (data.woi_area !== undefined) {
    fields.push("woi_area = ?");
    values.push(data.woi_area);
  }

  if (data.woi_creative !== undefined) {
    fields.push("woi_creative = ?");
    values.push(data.woi_creative);
  }

  if (data.woi_creative_image !== undefined) {
    fields.push("woi_creative_image = ?");
    values.push(data.woi_creative_image);
  }

  if (data.woi_status !== undefined) {
    fields.push("woi_status = ?");
    values.push(data.woi_status);
  }

  // --------------------------------
  // NOTHING TO UPDATE
  // --------------------------------
  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  // --------------------------------
  // UPDATED AT
  // --------------------------------
  fields.push("woi_updated_at = ?");
  values.push(updateAt);

  // --------------------------------
  // WHERE
  // --------------------------------
  values.push(woi_id);

  const sql = `
    UPDATE work_order_items
    SET ${fields.join(", ")}
    WHERE woi_id = ?
  `;

  const [result] = await pool.query(sql, values);

  // --------------------------------
  // DELETE OLD IMAGE
  // --------------------------------
  if (
    data.woi_creative_image !== undefined &&
    oldImage &&
    oldImage !== data.woi_creative_image
  ) {
    try {
      const oldImagePath = path.join(__dirname, "..", oldImage);

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    } catch (deleteError) {
      console.error("Failed to delete old work item image:", deleteError);
    }
  }

  return result;
};

const deleteWorkItemsService = async (woi_id) => {
  try {
    const sql = `
      DELETE FROM work_order_items
      WHERE woi_id = ?
    `;
    const [result] = await pool.query(sql, [woi_id]);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveWorkItemsService,
  getAllWorkItemsService,
  updateWorkItemsService,
  deleteWorkItemsService,
};
