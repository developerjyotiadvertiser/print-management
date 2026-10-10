const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

const saveFinalWorkOrderService = async (data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      fwo_date,
      fwo_pm_id,
      fwo_subtotal,
      fwo_adjustment_amount,
      fwo_grand_total,
      fwo_paid_amount,
      fwo_balance_amount,
      fwo_status,
      fwo_payment_status,
      fwo_remarks,
      woi_ids, // Array of selected work order item IDs
    } = data;

    const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // 1. Insert the final work order
    const workOrderSql = `
      INSERT INTO final_work_orders (
        fwo_number,
        fwo_date,
        fwo_pm_id,
        fwo_subtotal,
        fwo_adjustment_amount,
        fwo_grand_total,
        fwo_paid_amount,
        fwo_balance_amount,
        fwo_status,
        fwo_payment_status,
        fwo_remarks,
        fwo_woi_ids,
        fwo_created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [workOrderResult] = await connection.query(workOrderSql, [
      null,
      fwo_date,
      fwo_pm_id,
      fwo_subtotal,
      fwo_adjustment_amount,
      fwo_grand_total,
      fwo_paid_amount,
      fwo_balance_amount,
      fwo_status,
      fwo_payment_status,
      fwo_remarks,
      JSON.stringify(woi_ids ?? []),
      createdAt,
    ]);

    // 2. Generate the final work order number
    const fwo_id = workOrderResult.insertId;
    const fwo_number = `wo-${fwo_id}`;

    await connection.query(
      `UPDATE final_work_orders
       SET fwo_number = ?
       WHERE fwo_id = ?`,
      [fwo_number, fwo_id],
    );

    // 3. Update selected work order items
    if (Array.isArray(woi_ids) && woi_ids.length > 0) {
      await connection.query(
        `UPDATE work_order_items
         SET woi_status = 'wo_created'
         WHERE woi_id IN (?)`,
        [woi_ids],
      );
    }

    // 4. Commit transaction
    await connection.commit();

    return {
      success: true,
      fwo_id,
      fwo_number,
      message: "Final work order saved successfully",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAllFinalWorkOrderService = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT
        fwo.*,
        pm.*,
        fwo.fwo_woi_ids AS woi_ids
      FROM final_work_orders AS fwo
      LEFT JOIN printer_master AS pm
        ON pm.pm_id = fwo.fwo_pm_id
      ORDER BY fwo.fwo_id DESC
    `);

    // Convert saved IDs into arrays
    const formattedRows = rows.map((row) => {
      let woi_ids = [];

      if (row.woi_ids !== null && row.woi_ids !== undefined) {
        try {
          const parsed = JSON.parse(String(row.woi_ids));

          woi_ids = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // Handle legacy values such as "15"
          woi_ids = [row.woi_ids];
        }
      }

      return {
        ...row,
        woi_ids,
      };
    });

    return {
      success: true,
      data: formattedRows,
    };
  } catch (error) {
    console.error("Error fetching final work orders:", error);
    throw error;
  }
};

// const updateFinalWorkOrderService = async (fwo_id, data) => {
//   const fields = [];
//   const values = [];

//   const updateAt = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

//   const allowedFields = [
//     "fwo_date",
//     "fwo_pm_id",
//     "fwo_subtotal",
//     "fwo_adjustment_amount",
//     "fwo_grand_total",
//     "fwo_paid_amount",
//     "fwo_balance_amount",
//     "fwo_status",
//     "fwo_payment_status",
//     "fwo_remarks",
//   ];

//   // Dynamically build update fields
//   allowedFields.forEach((field) => {
//     if (data[field] !== undefined) {
//       fields.push(`${field} = ?`);
//       values.push(data[field]);
//     }
//   });

//   // Nothing to update
//   if (fields.length === 0) {
//     throw new Error("No fields provided for update.");
//   }

//   // Always update the modified timestamp
//   fields.push("fwo_updated_at = ?");
//   values.push(updateAt);

//   values.push(fwo_id);

//   const sql = `
//     UPDATE final_work_orders
//     SET ${fields.join(", ")}
//     WHERE fwo_id = ?
//   `;

//   const [result] = await pool.query(sql, values);

//   return result;
// };

const updateFinalWorkOrderService = async (fwo_id, data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updateAt = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

    // Get existing work order IDs
    const [existingOrders] = await connection.query(
      `SELECT fwo_woi_ids
       FROM final_work_orders
       WHERE fwo_id = ?
       FOR UPDATE`,
      [fwo_id],
    );

    if (existingOrders.length === 0) {
      throw new Error("Final work order not found.");
    }

    // Parse IDs
    const parseIds = (ids) => {
      if (Array.isArray(ids)) {
        return ids.map(Number);
      }

      if (!ids) return [];

      if (typeof ids === "string") {
        try {
          const parsed = JSON.parse(ids);

          return Array.isArray(parsed) ? parsed.map(Number) : [];
        } catch {
          return [];
        }
      }

      return [];
    };

    const oldIds = parseIds(existingOrders[0].fwo_woi_ids);

    // Payload uses woi_ids
    const newIds = data.woi_ids !== undefined ? parseIds(data.woi_ids) : oldIds;

    // Find removed IDs
    const removedIds = oldIds.filter((id) => !newIds.includes(id));

    // Declare update arrays
    const fields = [];
    const values = [];

    const allowedFields = [
      "fwo_date",
      "fwo_pm_id",
      "fwo_subtotal",
      "fwo_adjustment_amount",
      "fwo_grand_total",
      "fwo_paid_amount",
      "fwo_balance_amount",
      "fwo_status",
      "fwo_payment_status",
      "fwo_remarks",
    ];

    // Build update fields
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    // Update fwo_woi_ids
    if (data.woi_ids !== undefined) {
      fields.push("fwo_woi_ids = ?");
      values.push(JSON.stringify(newIds));
    }

    if (fields.length === 0) {
      throw new Error("No fields provided for update.");
    }

    // Update timestamp
    fields.push("fwo_updated_at = ?");
    values.push(updateAt);
    values.push(fwo_id);

    // Update final work order
    const [result] = await connection.query(
      `UPDATE final_work_orders
       SET ${fields.join(", ")}
       WHERE fwo_id = ?`,
      values,
    );

    // Set removed work order items back to Allotted
    if (removedIds.length > 0) {
      const placeholders = removedIds.map(() => "?").join(",");

      await connection.query(
        `UPDATE work_order_items
         SET woi_status = 'Allotted'
         WHERE woi_id IN (${placeholders})`,
        removedIds,
      );
    }

    await connection.commit();

    return {
      ...result,
      removedIds,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// const deleteFinalWorkOrderService = async (fwo_id) => {
//   try {
//     const sql = `
//       DELETE FROM final_work_orders
//       WHERE fwo_id = ?
//     `;
//     const [result] = await pool.query(sql, [fwo_id]);
//     return result;
//   } catch (error) {
//     throw error;
//   }
// };

const deleteFinalWorkOrderService = async (fwo_id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get work order item IDs before deleting
    const [orders] = await connection.query(
      `SELECT fwo_woi_ids
       FROM final_work_orders
       WHERE fwo_id = ?
       FOR UPDATE`,
      [fwo_id],
    );

    if (orders.length === 0) {
      throw new Error("Final work order not found.");
    }

    // 2. Parse fwo_woi_ids
    const parseIds = (ids) => {
      if (Array.isArray(ids)) {
        return ids.map(Number).filter(Number.isFinite);
      }

      if (!ids) return [];

      if (typeof ids === "string") {
        try {
          const parsed = JSON.parse(ids);

          return Array.isArray(parsed)
            ? parsed.map(Number).filter(Number.isFinite)
            : [];
        } catch {
          return [];
        }
      }

      return [];
    };

    const woiIds = parseIds(orders[0].fwo_woi_ids);

    // 3. Delete the final work order
    const [result] = await connection.query(
      `DELETE FROM final_work_orders
       WHERE fwo_id = ?`,
      [fwo_id],
    );

    // 4. Set associated work order items back to Allotted
    if (woiIds.length > 0) {
      const placeholders = woiIds.map(() => "?").join(",");

      await connection.query(
        `UPDATE work_order_items
         SET woi_status = 'Allotted'
         WHERE woi_id IN (${placeholders})`,
        woiIds,
      );
    }

    // 5. Commit transaction
    await connection.commit();

    return {
      ...result,
      allottedWoiIds: woiIds,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  saveFinalWorkOrderService,
  getAllFinalWorkOrderService,
  updateFinalWorkOrderService,
  deleteFinalWorkOrderService,
};
