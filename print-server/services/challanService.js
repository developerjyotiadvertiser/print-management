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
    remark_one,
  } = data;
  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  const sql = `
        INSERT INTO print_records
        (creative, media_type, print_date, width, height, size_unit, quality_print, quantity, total_area, 	remarks,, remark_one, print_created_at)
        VALUES (?, ?, ?, ?,?,?,?,?,?, ?, ?, ?)
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
    remark_one,
    createdAt,
  ]);
  return result;
};

const getAllChallanService = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.ch_id,
        c.ch_client_id,
        c.ch_date,
        c.ch_delivered_to,
        c.ch_phone,
        c.ch_remark,
        c.ch_created_at,

        p.client_id,
        p.client_name,
        p.client_contact,

        COALESCE(
          JSON_ARRAYAGG(
            CASE
              WHEN i.pci_id IS NOT NULL THEN
                JSON_OBJECT(
                  'pci_id', i.pci_id,
                  'pci_ch_id', i.pci_ch_id,
                  'pci_print_id', i.pci_print_id,
                  'pci_description', i.pci_description,
                  'pci_creative', i.pci_creative,
                  'pci_height', i.pci_height,
                  'pci_width', i.pci_width,
                  'pci_quantity', i.pci_quantity,
                  'pci_size_unit', i.pci_size_unit,
                  'pci_area', i.pci_area,
                  'pci_created_at', i.pci_created_at
                )
            END
          ),
          JSON_ARRAY()
        ) AS prints

      FROM print_challan c

      LEFT JOIN print_challan_items i
        ON c.ch_id = i.pci_ch_id

      LEFT JOIN print_party_master p
        ON c.ch_client_id = p.client_id

      GROUP BY 
        c.ch_id,
        c.ch_client_id,
        c.ch_date,
        c.ch_delivered_to,
        c.ch_phone,
        c.ch_remark,
        c.ch_created_at,
        p.client_id,
        p.client_name,
        p.client_contact

      ORDER BY c.ch_id DESC
    `);

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

  if (data.remark_one !== undefined) {
    fields.push("remark_one = ?");
    values.push(data.remark_one);
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

const deleteChallanService = async (challan_id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const deleteItemsSql = `
      DELETE FROM print_challan_items
      WHERE pci_ch_id = ?
    `;

    await connection.query(deleteItemsSql, [challan_id]);
    const deleteChallanSql = `
      DELETE FROM print_challan
      WHERE ch_id = ?
    `;

    const [result] = await connection.query(deleteChallanSql, [challan_id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Challan not found");
    }

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  saveChallanService,
  getAllChallanService,
  updateChallanService,
  deleteChallanService,
};
