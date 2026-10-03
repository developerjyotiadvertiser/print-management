const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

const saveWorkItemsService = async (data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      woi_jc_number,
      woi_work_allot_date,
      woi_printer_name,
      woi_status,
      media_items = [],
    } = data;

    const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // -----------------------------------------
    // 1. INSERT PARENT WORK ORDER ITEM
    // -----------------------------------------
    const workOrderSql = `
      INSERT INTO work_order_items
      (
        woi_jc_number,
        woi_work_allot_date,
        woi_printer_name,
        woi_status,
        woi_created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    const [workOrderResult] = await connection.query(workOrderSql, [
      woi_jc_number,
      woi_work_allot_date,
      woi_printer_name,
      woi_status || "Done",
      createdAt,
    ]);

    const woi_id = workOrderResult.insertId;

    // -----------------------------------------
    // 2. INSERT MULTIPLE MEDIA
    // -----------------------------------------
    if (media_items.length > 0) {
      const mediaSql = `
        INSERT INTO work_order_items_media
        (
          woim_woi_id,
          woim_media,
          woim_size_height,
          woim_size_width,
          woim_unit,
          woim_quantity,
          woim_area,
          woim_creative,
          woim_creative_image,
          woim_created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const media of media_items) {
        await connection.query(mediaSql, [
          woi_id,
          media.woim_media,
          media.woim_size_height,
          media.woim_size_width,
          media.woim_unit || "Inch",
          media.woim_quantity,
          media.woim_area,
          media.woim_creative,
          media.woim_creative_image,
          createdAt,
        ]);
      }
    }

    await connection.commit();

    return {
      success: true,
      woi_id,
      message: "Work order item saved successfully",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAllWorkItemsService = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT
        woi.*,

        COALESCE(
          JSON_ARRAYAGG(
            CASE
              WHEN woim.woim_id IS NOT NULL THEN
                JSON_OBJECT(
                  'woim_id', woim.woim_id,
                  'woim_woi_id', woim.woim_woi_id,
                  'woim_media', woim.woim_media,
                  'woim_size_height', woim.woim_size_height,
                  'woim_size_width', woim.woim_size_width,
                  'woim_unit', woim.woim_unit,
                  'woim_quantity', woim.woim_quantity,
                  'woim_area', woim.woim_area,
                  'woim_creative', woim.woim_creative,
                  'woim_creative_image', woim.woim_creative_image,
                  'woim_created_at', woim.woim_created_at,
                  'woim_updated_at', woim.woim_updated_at
                )
            END
          ),
          JSON_ARRAY()
        ) AS media_items

      FROM work_order_items AS woi

      LEFT JOIN work_order_items_media AS woim
        ON woim.woim_woi_id = woi.woi_id

      GROUP BY woi.woi_id

      ORDER BY woi.woi_id DESC
    `);

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

const updateWorkItemsService = async (woi_id, data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updateAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    // =========================================================
    // 1. GET EXISTING WORK ORDER
    // =========================================================

    const [existingWorkOrderRows] = await connection.query(
      `
        SELECT
          woi_id,
          woi_serial_number,
          woi_jc_number,
          woi_work_allot_date,
          woi_printer_name,
          woi_status
        FROM work_order_items
        WHERE woi_id = ?
      `,
      [woi_id],
    );

    if (existingWorkOrderRows.length === 0) {
      await connection.rollback();

      return {
        affectedRows: 0,
        message: "Work order item not found.",
      };
    }

    // =========================================================
    // 2. UPDATE PARENT WORK ORDER
    // =========================================================

    const parentFields = [];
    const parentValues = [];

    if (data.woi_serial_number !== undefined) {
      parentFields.push("woi_serial_number = ?");
      parentValues.push(data.woi_serial_number);
    }

    if (data.woi_jc_number !== undefined) {
      parentFields.push("woi_jc_number = ?");
      parentValues.push(data.woi_jc_number);
    }

    if (data.woi_work_allot_date !== undefined) {
      parentFields.push("woi_work_allot_date = ?");
      parentValues.push(data.woi_work_allot_date);
    }

    if (data.woi_printer_name !== undefined) {
      parentFields.push("woi_printer_name = ?");
      parentValues.push(data.woi_printer_name);
    }

    if (data.woi_status !== undefined) {
      parentFields.push("woi_status = ?");
      parentValues.push(data.woi_status);
    }

    // Only update parent if there are parent fields
    if (parentFields.length > 0) {
      parentFields.push("woi_updated_at = ?");
      parentValues.push(updateAt);

      parentValues.push(woi_id);

      const parentSql = `
        UPDATE work_order_items
        SET ${parentFields.join(", ")}
        WHERE woi_id = ?
      `;

      await connection.query(parentSql, parentValues);
    }

    // =========================================================
    // 3. GET EXISTING MEDIA ITEMS
    // =========================================================

    const [existingMediaRows] = await connection.query(
      `
        SELECT
          woim_id,
          woim_woi_id,
          woim_media,
          woim_size_height,
          woim_size_width,
          woim_unit,
          woim_quantity,
          woim_area,
          woim_creative,
          woim_creative_image
        FROM work_order_items_media
        WHERE woim_woi_id = ?
      `,
      [woi_id],
    );

    // =========================================================
    // 4. MEDIA ITEMS FROM FRONTEND
    // =========================================================

    let mediaItems = data.media_items || [];

    if (typeof mediaItems === "string") {
      try {
        mediaItems = JSON.parse(mediaItems);
      } catch (error) {
        throw new Error("Invalid media_items JSON format.");
      }
    }

    if (!Array.isArray(mediaItems)) {
      mediaItems = [];
    }

    // =========================================================
    // 5. TRACK MEDIA IDS RECEIVED FROM FRONTEND
    // =========================================================

    const receivedMediaIds = [];

    // =========================================================
    // 6. UPDATE / INSERT MEDIA ITEMS
    // =========================================================

    for (const media of mediaItems) {
      const woim_id = media.woim_id ? Number(media.woim_id) : null;

      // -------------------------------------------------------
      // UPDATE EXISTING MEDIA
      // -------------------------------------------------------

      if (woim_id) {
        const existingMedia = existingMediaRows.find(
          (item) => Number(item.woim_id) === woim_id,
        );

        if (!existingMedia) {
          throw new Error(
            `Media item ${woim_id} does not belong to work order ${woi_id}.`,
          );
        }

        receivedMediaIds.push(woim_id);

        const mediaFields = [];
        const mediaValues = [];

        if (media.woim_media !== undefined) {
          mediaFields.push("woim_media = ?");
          mediaValues.push(media.woim_media);
        }

        if (media.woim_size_height !== undefined) {
          mediaFields.push("woim_size_height = ?");
          mediaValues.push(media.woim_size_height);
        }

        if (media.woim_size_width !== undefined) {
          mediaFields.push("woim_size_width = ?");
          mediaValues.push(media.woim_size_width);
        }

        if (media.woim_unit !== undefined) {
          mediaFields.push("woim_unit = ?");
          mediaValues.push(media.woim_unit);
        }

        if (media.woim_quantity !== undefined) {
          mediaFields.push("woim_quantity = ?");
          mediaValues.push(media.woim_quantity);
        }

        if (media.woim_area !== undefined) {
          mediaFields.push("woim_area = ?");
          mediaValues.push(media.woim_area);
        }

        if (media.woim_creative !== undefined) {
          mediaFields.push("woim_creative = ?");
          mediaValues.push(media.woim_creative);
        }

        // -----------------------------------------------------
        // IMAGE
        // -----------------------------------------------------

        if (media.woim_creative_image !== undefined) {
          mediaFields.push("woim_creative_image = ?");
          mediaValues.push(media.woim_creative_image);
        }

        // -----------------------------------------------------
        // UPDATED AT
        // -----------------------------------------------------

        if (mediaFields.length > 0) {
          mediaFields.push("woim_updated_at = ?");
          mediaValues.push(updateAt);

          mediaValues.push(woim_id);

          const updateMediaSql = `
            UPDATE work_order_items_media
            SET ${mediaFields.join(", ")}
            WHERE woim_id = ?
              AND woim_woi_id = ?
          `;

          mediaValues.push(woi_id);

          await connection.query(updateMediaSql, mediaValues);
        }

        // -----------------------------------------------------
        // DELETE OLD IMAGE IF REPLACED
        // -----------------------------------------------------

        if (
          media.woim_creative_image !== undefined &&
          existingMedia.woim_creative_image &&
          existingMedia.woim_creative_image !== media.woim_creative_image
        ) {
          try {
            const oldImagePath = path.join(
              __dirname,
              "..",
              existingMedia.woim_creative_image,
            );

            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (deleteError) {
            console.error("Failed to delete old media image:", deleteError);
          }
        }
      }

      // -------------------------------------------------------
      // INSERT NEW MEDIA
      // -------------------------------------------------------
      else {
        const insertMediaSql = `
          INSERT INTO work_order_items_media
          (
            woim_woi_id,
            woim_media,
            woim_size_height,
            woim_size_width,
            woim_unit,
            woim_quantity,
            woim_area,
            woim_creative,
            woim_creative_image,
            woim_created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(insertMediaSql, [
          woi_id,
          media.woim_media || null,
          media.woim_size_height || null,
          media.woim_size_width || null,
          media.woim_unit || null,
          media.woim_quantity || null,
          media.woim_area || null,
          media.woim_creative || null,
          media.woim_creative_image || null,
          updateAt,
        ]);
      }
    }

    // =========================================================
    // 7. DELETE MEDIA ITEMS REMOVED FROM FRONTEND
    // =========================================================

    for (const existingMedia of existingMediaRows) {
      const stillExists = receivedMediaIds.includes(
        Number(existingMedia.woim_id),
      );

      if (!stillExists) {
        // -----------------------------------------------------
        // DELETE OLD IMAGE
        // -----------------------------------------------------

        if (existingMedia.woim_creative_image) {
          try {
            const oldImagePath = path.join(
              __dirname,
              "..",
              existingMedia.woim_creative_image,
            );

            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          } catch (deleteError) {
            console.error("Failed to delete removed media image:", deleteError);
          }
        }

        // -----------------------------------------------------
        // DELETE MEDIA RECORD
        // -----------------------------------------------------

        await connection.query(
          `
            DELETE FROM work_order_items_media
            WHERE woim_id = ?
              AND woim_woi_id = ?
          `,
          [existingMedia.woim_id, woi_id],
        );
      }
    }

    // =========================================================
    // 8. COMMIT
    // =========================================================

    await connection.commit();

    return {
      affectedRows: 1,
      woi_id,
      message: "Work item updated successfully.",
    };
  } catch (error) {
    // =========================================================
    // ROLLBACK
    // =========================================================

    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
};

const deleteWorkItemsService = async (woi_id) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // --------------------------------
    // GET MEDIA IMAGES BEFORE DELETE
    // --------------------------------

    const [mediaRows] = await connection.query(
      `
        SELECT
          woim_id,
          woim_creative_image
        FROM work_order_items_media
        WHERE woim_woi_id = ?
      `,
      [woi_id],
    );

    // --------------------------------
    // CHECK WORK ORDER EXISTS
    // --------------------------------

    const [workOrderRows] = await connection.query(
      `
        SELECT woi_id
        FROM work_order_items
        WHERE woi_id = ?
      `,
      [woi_id],
    );

    if (workOrderRows.length === 0) {
      await connection.rollback();

      return {
        affectedRows: 0,
        message: "Work Items record not found.",
      };
    }

    // --------------------------------
    // DELETE PARENT
    // --------------------------------
    // Related media records will be
    // automatically deleted because
    // of ON DELETE CASCADE.
    // --------------------------------

    const [result] = await connection.query(
      `
        DELETE FROM work_order_items
        WHERE woi_id = ?
      `,
      [woi_id],
    );

    // --------------------------------
    // DELETE MEDIA IMAGE FILES
    // --------------------------------

    for (const media of mediaRows) {
      if (!media.woim_creative_image) {
        continue;
      }

      try {
        const imagePath = path.join(__dirname, "..", media.woim_creative_image);

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (fileError) {
        console.error("Failed to delete media image:", fileError);
      }
    }

    // --------------------------------
    // COMMIT
    // --------------------------------

    await connection.commit();

    return result;
  } catch (error) {
    // --------------------------------
    // ROLLBACK
    // --------------------------------

    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  saveWorkItemsService,
  getAllWorkItemsService,
  updateWorkItemsService,
  deleteWorkItemsService,
};
