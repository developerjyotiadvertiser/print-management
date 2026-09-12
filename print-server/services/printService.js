const pool = require("../config/db");
const moment = require("moment-timezone");

const saveChallanService = async (data) => {
  const { ch_client_id, ch_delivered_to, ch_phone, ch_remark, prints } = data;

  // Validate client
  if (!ch_client_id) {
    throw new Error("Client ID is required");
  }

  // Validate prints
  if (!Array.isArray(prints) || prints.length === 0) {
    throw new Error("At least one print is required");
  }

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const connection = await pool.getConnection();

  try {
    // =====================================================
    // 1. START TRANSACTION
    // =====================================================

    await connection.beginTransaction();

    // =====================================================
    // 2. SAVE CHALLAN
    // =====================================================

    const challanSql = `
      INSERT INTO print_challan (
        ch_client_id,
        ch_date,
        ch_delivered_to,
        ch_phone,
        ch_remark,
        ch_created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [challanResult] = await connection.query(challanSql, [
      ch_client_id,
      createdAt,
      ch_delivered_to || null,
      ch_phone || null,
      ch_remark || null,
      createdAt,
    ]);

    const ch_id = challanResult.insertId;

    // =====================================================
    // 3. SAVE ALL PRINT ITEMS
    // =====================================================

    const printSql = `
      INSERT INTO print_challan_items (
        pci_ch_id,
        pci_print_id,
        pci_description,
        pci_creative,
        pci_height,
        pci_width,
        pci_quantity,
        pci_size_unit,
        pci_area,
        pci_created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const print of prints) {
      await connection.query(printSql, [
        ch_id,
        print.pci_print_id || null,
        print.pci_description || null,
        print.pci_creative || null,
        print.pci_height || null,
        print.pci_width || null,
        print.pci_quantity || null,
        print.pci_size_unit || null,
        print.pci_area || null,
        createdAt,
      ]);
    }

    // =====================================================
    // 4. COMMIT TRANSACTION
    // =====================================================

    await connection.commit();

    // =====================================================
    // 5. GET COMPLETE CHALLAN DATA
    //    Same structure as getAllChallanService
    // =====================================================

    const [rows] = await connection.query(
      `
      SELECT 
        /* Challan details */
        c.ch_id,
        c.ch_client_id,
        c.ch_date,
        c.ch_delivered_to,
        c.ch_phone,
        c.ch_remark,
        c.ch_created_at,

        /* Client details */
        p.client_id,
        p.client_name,
        p.client_contact,
        p.client_address,
        p.pan_number,
        p.gst_number,
        p.pincode,
        p.client_created_at,
        p.client_updated_at,

        /* Print items */
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

      /* Challan -> Client */
      LEFT JOIN print_party_master p
        ON c.ch_client_id = p.client_id

      /* Challan -> Print Items */
      LEFT JOIN print_challan_items i
        ON c.ch_id = i.pci_ch_id

      WHERE c.ch_id = ?

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
        p.client_contact,
        p.client_address,
        p.pan_number,
        p.gst_number,
        p.pincode,
        p.client_created_at,
        p.client_updated_at
      `,
      [ch_id],
    );

    // =====================================================
    // 6. NORMALIZE PRINTS
    // =====================================================

    const normalizedData = rows.map((row) => ({
      ...row,
      prints:
        typeof row.prints === "string"
          ? JSON.parse(row.prints)
          : row.prints || [],
    }));

    // =====================================================
    // 7. RETURN SAME STRUCTURE AS getAllChallanService
    // =====================================================

    return {
      success: true,
      data: normalizedData[0],
    };
  } catch (error) {
    await connection.rollback();

    console.error("Save Challan Service Error:", error);

    throw error;
  } finally {
    connection.release();
  }
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
