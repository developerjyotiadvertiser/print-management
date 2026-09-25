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
    mm_id,
  } = data;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const createdAt = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

    // --------------------------------------------------
    // 1. Save Print Record
    // --------------------------------------------------

    const printSql = `
      INSERT INTO print_records
      (
        creative,
        media_type,
        print_date,
        width,
        height,
        size_unit,
        quality_print,
        quantity,
        total_area,
        remarks,
        remark_one,
        print_created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [printResult] = await connection.query(printSql, [
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

    // --------------------------------------------------
    // 2. Get Current Media Stock
    // --------------------------------------------------

    const mediaSql = `
      SELECT
        mm_id,
        mm_width,
        mm_size
      FROM media_master
      WHERE mm_id = ?
      FOR UPDATE
    `;

    const [mediaRows] = await connection.query(mediaSql, [mm_id]);

    if (mediaRows.length === 0) {
      throw new Error("Media master record not found.");
    }

    const media = mediaRows[0];

    const currentWidth = Number(media.mm_width);
    const currentSize = Number(media.mm_size);

    const printWidth = Number(width);
    const printArea = Number(total_area);

    if (
      Number.isNaN(currentWidth) ||
      Number.isNaN(currentSize) ||
      Number.isNaN(printWidth) ||
      Number.isNaN(printArea)
    ) {
      throw new Error("Invalid media stock or print values.");
    }

    // --------------------------------------------------
    // 3. Calculate Remaining Stock
    // --------------------------------------------------

    const remainingWidth = currentWidth - printWidth;
    const remainingSize = currentSize - printArea;

    // --------------------------------------------------
    // 4. Check Stock
    // --------------------------------------------------

    if (remainingWidth < 0) {
      throw new Error(
        `Insufficient media width. Available: ${currentWidth}, Required: ${printWidth}`,
      );
    }

    if (remainingSize < 0) {
      throw new Error(
        `Insufficient media stock. Available: ${currentSize}, Required: ${printArea}`,
      );
    }

    // --------------------------------------------------
    // 5. Update Media Master
    // --------------------------------------------------

    const updateMediaSql = `
      UPDATE media_master
      SET
        mm_width = ?,
        mm_size = ?,
        mm_updated_at = ?
      WHERE mm_id = ?
    `;

    await connection.query(updateMediaSql, [
      remainingWidth,
      remainingSize,
      createdAt,
      mm_id,
    ]);

    // --------------------------------------------------
    // 6. Commit
    // --------------------------------------------------

    await connection.commit();

    connection.release();

    return {
      success: true,
      print_id: printResult.insertId,
      stock: {
        previous_width: currentWidth,
        used_width: printWidth,
        remaining_width: remainingWidth,
        previous_size: currentSize,
        used_size: printArea,
        remaining_size: remainingSize,
      },
    };
  } catch (error) {
    await connection.rollback();
    connection.release();

    throw error;
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
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updateAt = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

    // --------------------------------------------------
    // 1. Get OLD print record
    // --------------------------------------------------

    const [oldPrintRows] = await connection.query(
      `
      SELECT
        print_id,
        print_mm_id,
        media_type,
        width,
        total_area
      FROM print_records
      WHERE print_id = ?
      FOR UPDATE
      `,
      [print_id],
    );

    if (oldPrintRows.length === 0) {
      throw new Error("Print record not found.");
    }

    const oldPrint = oldPrintRows[0];

    // --------------------------------------------------
    // 2. Determine NEW values
    // --------------------------------------------------

    const newMmId = data.mm_id !== undefined ? data.mm_id : oldPrint.mm_id;

    const newWidth =
      data.width !== undefined ? Number(data.width) : Number(oldPrint.width);

    const newTotalArea =
      data.total_area !== undefined
        ? Number(data.total_area)
        : Number(oldPrint.total_area);

    const oldWidth = Number(oldPrint.width);
    const oldTotalArea = Number(oldPrint.total_area);

    if (
      Number.isNaN(oldWidth) ||
      Number.isNaN(oldTotalArea) ||
      Number.isNaN(newWidth) ||
      Number.isNaN(newTotalArea)
    ) {
      throw new Error("Invalid print width or total area.");
    }

    // --------------------------------------------------
    // 3. Restore OLD stock
    // --------------------------------------------------

    const [oldMediaRows] = await connection.query(
      `
      SELECT
        mm_id,
        mm_width,
        mm_size
      FROM media_master
      WHERE mm_id = ?
      FOR UPDATE
      `,
      [oldPrint.print_mm_id],
    );

    if (oldMediaRows.length === 0) {
      throw new Error("Old media master record not found.");
    }

    const oldMedia = oldMediaRows[0];

    const restoredWidth = Number(oldMedia.mm_width) + oldWidth;

    const restoredSize = Number(oldMedia.mm_size) + oldTotalArea;

    await connection.query(
      `
      UPDATE media_master
      SET
        mm_width = ?,
        mm_size = ?,
        mm_updated_at = ?
      WHERE mm_id = ?
      `,
      [restoredWidth, restoredSize, updateAt, oldPrint.print_mm_id],
    );

    // --------------------------------------------------
    // 4. If media was changed, lock NEW media separately
    // --------------------------------------------------

    let newMedia;

    if (Number(newMmId) === Number(oldPrint.mm_id)) {
      // Same media
      newMedia = {
        mm_id: oldPrint.print_mm_id,
        mm_width: restoredWidth,
        mm_size: restoredSize,
      };
    } else {
      // Different media
      const [newMediaRows] = await connection.query(
        `
        SELECT
          mm_id,
          mm_width,
          mm_size
        FROM media_master
        WHERE mm_id = ?
        FOR UPDATE
        `,
        [newMmId],
      );

      if (newMediaRows.length === 0) {
        throw new Error("New media master record not found.");
      }

      newMedia = newMediaRows[0];
    }

    // --------------------------------------------------
    // 5. Calculate NEW remaining stock
    // --------------------------------------------------

    const currentWidth = Number(newMedia.mm_width);
    const currentSize = Number(newMedia.mm_size);

    const remainingWidth = currentWidth - newWidth;
    const remainingSize = currentSize - newTotalArea;

    // --------------------------------------------------
    // 6. Check NEW stock
    // --------------------------------------------------

    if (remainingWidth < 0) {
      throw new Error(
        `Insufficient media width. Available: ${currentWidth}, Required: ${newWidth}`,
      );
    }

    if (remainingSize < 0) {
      throw new Error(
        `Insufficient media stock. Available: ${currentSize}, Required: ${newTotalArea}`,
      );
    }

    // --------------------------------------------------
    // 7. Deduct NEW stock
    // --------------------------------------------------

    await connection.query(
      `
      UPDATE media_master
      SET
        mm_width = ?,
        mm_size = ?,
        mm_updated_at = ?
      WHERE mm_id = ?
      `,
      [remainingWidth, remainingSize, updateAt, newMmId],
    );

    // --------------------------------------------------
    // 8. Update print record
    // --------------------------------------------------

    const fields = [];
    const values = [];

    if (data.creative !== undefined) {
      fields.push("creative = ?");
      values.push(data.creative);
    }

    if (data.media_type !== undefined) {
      fields.push("media_type = ?");
      values.push(data.media_type);
    }

    if (data.print_mm_id !== undefined) {
      fields.push("print_mm_id = ?");
      values.push(data.print_mm_id);
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

    if (fields.length === 0) {
      throw new Error("No fields provided for update.");
    }

    fields.push("print_updated_at = ?");
    values.push(updateAt);

    values.push(print_id);

    const sql = `
      UPDATE print_records
      SET ${fields.join(", ")}
      WHERE print_id = ?
    `;

    const [result] = await connection.query(sql, values);

    // --------------------------------------------------
    // 9. Commit
    // --------------------------------------------------

    await connection.commit();

    connection.release();

    return {
      success: true,
      print_id,
      stock: {
        old_width: oldWidth,
        old_area: oldTotalArea,

        new_width: newWidth,
        new_area: newTotalArea,

        remaining_width: remainingWidth,
        remaining_size: remainingSize,
      },
    };
  } catch (error) {
    await connection.rollback();
    connection.release();

    throw error;
  }
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
