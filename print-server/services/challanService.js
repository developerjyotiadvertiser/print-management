const pool = require("../config/db");
const moment = require("moment-timezone");

const saveChallanService = async (data) => {
  const {
    ch_client_id,
    ch_delivered_to,
    ch_phone,
    ch_remark,
    ch_pr_name,
    ch_pr_phone,
    prints,
  } = data;

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
         ch_pr_name,
    ch_pr_phone,
        ch_created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [challanResult] = await connection.query(challanSql, [
      ch_client_id,
      createdAt,
      ch_delivered_to || null,
      ch_phone || null,
      ch_remark || null,
      ch_pr_name || null,
      ch_pr_phone || null,
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
        pci_location,
        pci_created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        print.pci_location || null,
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
        c.ch_pr_name,
        c.ch_pr_phone,
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
                  'pci_location', i.pci_location,
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
         c.ch_pr_name,
        c.ch_pr_phone,
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

const getAllChallanService = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        /* Challan details */
        c.ch_id,
        c.ch_client_id,
        c.ch_date,
        c.ch_delivered_to,
        c.ch_phone,
        c.ch_remark,
         c.ch_pr_name,
        c.ch_pr_phone,
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
                  'pci_location', i.pci_location,
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

      GROUP BY 
        c.ch_id,
        c.ch_client_id,
        c.ch_date,
        c.ch_delivered_to,
        c.ch_phone,
        c.ch_remark,
         c.ch_pr_name,
        c.ch_pr_phone,
        c.ch_created_at,
        
        i.pci_creative,

        p.client_id,
        p.client_name,
        p.client_contact,
        p.client_address,
        p.pan_number,
        p.gst_number,
        p.pincode,
        p.client_created_at,
        p.client_updated_at

      ORDER BY c.ch_id DESC
    `);

    const normalizedRows = rows.map((row) => ({
      ...row,
      prints:
        typeof row.prints === "string"
          ? JSON.parse(row.prints)
          : row.prints || [],
    }));

    return {
      success: true,
      data: normalizedRows,
    };
  } catch (error) {
    console.error("Get All Challan Service Error:", error);
    throw error;
  }
};

const updateChallanService = async (challan_id, data) => {
  const connection = await pool.getConnection();

  const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  try {
    await connection.beginTransaction();

    // ==========================================
    // 1. CHECK CHALLAN EXISTS
    // ==========================================

    const [challanRows] = await connection.query(
      `
      SELECT ch_id
      FROM print_challan
      WHERE ch_id = ?
      `,
      [challan_id],
    );

    if (challanRows.length === 0) {
      throw new Error("Challan not found");
    }

    // ==========================================
    // 2. UPDATE CHALLAN / PARENT TABLE
    // ==========================================

    const fields = [];
    const values = [];

    if (data.ch_client_id !== undefined) {
      fields.push("ch_client_id = ?");
      values.push(data.ch_client_id);
    }

    if (data.ch_date !== undefined) {
      fields.push("ch_date = ?");
      values.push(data.ch_date);
    }

    if (data.ch_delivered_to !== undefined) {
      fields.push("ch_delivered_to = ?");
      values.push(data.ch_delivered_to);
    }

    if (data.ch_phone !== undefined) {
      fields.push("ch_phone = ?");
      values.push(data.ch_phone);
    }

    if (data.ch_remark !== undefined) {
      fields.push("ch_remark = ?");
      values.push(data.ch_remark);
    }

    if (data.ch_pr_name !== undefined) {
      fields.push("ch_pr_name = ?");
      values.push(data.ch_pr_name);
    }

    if (data.ch_pr_phone !== undefined) {
      fields.push("ch_pr_phone = ?");
      values.push(data.ch_pr_phone);
    }

    if (fields.length > 0) {
      fields.push("ch_updated_at = ?");
      values.push(updateAt);

      values.push(challan_id);

      const updateChallanSql = `
        UPDATE print_challan
        SET ${fields.join(", ")}
        WHERE ch_id = ?
      `;

      await connection.query(updateChallanSql, values);
    }

    // ==========================================
    // 3. GET EXISTING PRINT ITEMS
    // ==========================================

    const [existingPrints] = await connection.query(
      `
      SELECT pci_id
      FROM print_challan_items
      WHERE pci_ch_id = ?
      `,
      [challan_id],
    );

    const existingPciIds = new Set(
      existingPrints.map((item) => Number(item.pci_id)),
    );

    // ==========================================
    // 4. UPDATE / INSERT PRINT ITEMS
    // ==========================================

    if (Array.isArray(data.prints)) {
      for (const print of data.prints) {
        const pciId =
          print.pci_id !== undefined &&
          print.pci_id !== null &&
          print.pci_id !== ""
            ? Number(print.pci_id)
            : null;

        // ======================================
        // EXISTING PRINT -> UPDATE
        // ======================================

        if (pciId !== null && existingPciIds.has(pciId)) {
          const itemFields = [];
          const itemValues = [];

          if (print.pci_print_id !== undefined) {
            itemFields.push("pci_print_id = ?");
            itemValues.push(print.pci_print_id);
          }

          if (print.pci_description !== undefined) {
            itemFields.push("pci_description = ?");
            itemValues.push(print.pci_description);
          }

          if (print.pci_creative !== undefined) {
            itemFields.push("pci_creative = ?");
            itemValues.push(print.pci_creative);
          }

          if (print.pci_height !== undefined) {
            itemFields.push("pci_height = ?");
            itemValues.push(print.pci_height);
          }

          if (print.pci_width !== undefined) {
            itemFields.push("pci_width = ?");
            itemValues.push(print.pci_width);
          }

          if (print.pci_quantity !== undefined) {
            itemFields.push("pci_quantity = ?");
            itemValues.push(print.pci_quantity);
          }

          if (print.pci_size_unit !== undefined) {
            itemFields.push("pci_size_unit = ?");
            itemValues.push(print.pci_size_unit);
          }

          if (print.pci_area !== undefined) {
            itemFields.push("pci_area = ?");
            itemValues.push(print.pci_area);
          }

          if (print.pci_location !== undefined) {
            itemFields.push("pci_location = ?");
            itemValues.push(print.pci_location);
          }

          if (itemFields.length > 0) {
            itemFields.push("pci_updated_at = ?");
            itemValues.push(updateAt);

            itemValues.push(pciId);
            itemValues.push(challan_id);

            const updatePrintSql = `
              UPDATE print_challan_items
              SET ${itemFields.join(", ")}
              WHERE pci_id = ?
              AND pci_ch_id = ?
            `;

            await connection.query(updatePrintSql, itemValues);
          }

          continue;
        }

        // ======================================
        // NEW PRINT -> INSERT
        // ======================================

        if (pciId === null) {
          const insertPrintSql = `
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
              pci_location,
              pci_created_at,
              pci_updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const insertPrintValues = [
            challan_id,
            print.pci_print_id ?? null,
            print.pci_description ?? null,
            print.pci_creative ?? null,
            print.pci_height ?? null,
            print.pci_width ?? null,
            print.pci_quantity ?? null,
            print.pci_size_unit ?? null,
            print.pci_area ?? null,
            print.pci_location ?? null,
            updateAt,
            updateAt,
          ];

          await connection.query(insertPrintSql, insertPrintValues);
        }
      }
    }

    // ==========================================
    // 5. COMMIT TRANSACTION
    // ==========================================

    await connection.commit();

    return {
      success: true,
      message: "Challan updated successfully",
      challan_id,
    };
  } catch (error) {
    // ==========================================
    // ROLLBACK
    // ==========================================

    await connection.rollback();

    console.error("Update Challan Service Error:", error);

    throw error;
  } finally {
    connection.release();
  }
};

const deleteChallanService = async (challan_id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Delete all challan items
    const deleteItemsSql = `
      DELETE FROM print_challan_items
      WHERE pci_ch_id = ?
    `;

    await connection.query(deleteItemsSql, [challan_id]);

    // 2. Delete the challan
    const deleteChallanSql = `
      DELETE FROM print_challan
      WHERE ch_id = ?
    `;

    const [result] = await connection.query(deleteChallanSql, [challan_id]);

    // If challan does not exist
    if (result.affectedRows === 0) {
      await connection.rollback();
      throw new Error("Challan not found");
    }

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();
    console.error("Delete Challan Service Error:", error);
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
