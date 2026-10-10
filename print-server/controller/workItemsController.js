const workItemsService = require("../services/workItemsService");

// const saveWorkItemsController = async (req, res) => {
//   try {
//     const {
//       woi_jc_number,
//       woi_work_allot_date,
//       woi_printer_name,
//       woi_status,
//     } = req.body;

//     // -----------------------------------------
//     // PARSE MEDIA ITEMS
//     // -----------------------------------------
//     let media_items = [];

//     if (req.body.media_items) {
//       try {
//         media_items =
//           typeof req.body.media_items === "string"
//             ? JSON.parse(req.body.media_items)
//             : req.body.media_items;
//       } catch (error) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid media_items JSON format.",
//         });
//       }
//     }

//     // -----------------------------------------
//     // HANDLE UPLOADED IMAGES
//     // -----------------------------------------
//     const files = req.files || [];

//     media_items = media_items.map((media, index) => ({
//       ...media,

//       woim_creative_image: files[index]
//         ? `/uploads/work-items/${files[index].filename}`
//         : null,
//     }));

//     // -----------------------------------------
//     // SAVE WORK ITEM + MEDIA
//     // -----------------------------------------
//     const result = await workItemsService.saveWorkItemsService({
//       woi_jc_number,
//       woi_work_allot_date,
//       woi_printer_name,
//       woi_status,
//       media_items,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Work Item Saved Successfully.",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Save Work Item Error:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const saveWorkItemsController = async (req, res) => {
  try {
    const { woi_jc_number, woi_work_allot_date, woi_pm_id, woi_status } =
      req.body;

    if (!woi_pm_id) {
      return res.status(400).json({
        success: false,
        message: "Printer is required.",
      });
    }

    // Parse media items
    let media_items = [];

    try {
      media_items =
        typeof req.body.media_items === "string"
          ? JSON.parse(req.body.media_items)
          : req.body.media_items || [];
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid media_items JSON format.",
      });
    }

    if (!Array.isArray(media_items) || media_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one media item is required.",
      });
    }

    // Parse image indexes sent by the frontend
    let imageIndexes = [];

    try {
      imageIndexes = req.body.image_indexes
        ? JSON.parse(req.body.image_indexes)
        : [];
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid image_indexes format.",
      });
    }

    if (!Array.isArray(imageIndexes)) {
      return res.status(400).json({
        success: false,
        message: "image_indexes must be an array.",
      });
    }

    const files = req.files || [];
    const imageByMediaIndex = new Map();

    files.forEach((file, fileIndex) => {
      const mediaIndex = Number(imageIndexes[fileIndex]);

      if (
        Number.isInteger(mediaIndex) &&
        mediaIndex >= 0 &&
        mediaIndex < media_items.length
      ) {
        imageByMediaIndex.set(
          mediaIndex,
          `/uploads/work-items/${file.filename}`,
        );
      }
    });

    // Map frontend fields to existing DB fields
    const normalizedMediaItems = media_items.map((media, index) => {
      if (!media.woim_pmm_id) {
        throw new Error(`Media ${index + 1}: Printer media is required.`);
      }

      return {
        // Existing DB column woim_media stores pmm_id.
        woim_media: media.woim_pmm_id,
        woim_size_height: media.woim_size_height,
        woim_size_width: media.woim_size_width,
        woim_unit: media.woim_unit,
        woim_quantity: media.woim_quantity,
        woim_area: media.woim_area,
        woim_creative: media.woim_creative,
        woim_creative_image: imageByMediaIndex.get(index) || null,
      };
    });

    const result = await workItemsService.saveWorkItemsService({
      woi_jc_number,
      woi_work_allot_date,
      woi_pm_id,
      woi_status,
      media_items: normalizedMediaItems,
    });

    return res.status(201).json({
      success: true,
      message: "Work Item Saved Successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Save Work Item Error:", error);

    const isValidationError =
      /Printer is required|Printer media is required|media item is required/i.test(
        error.message,
      );

    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to save work item.",
    });
  }
};

const getAllWorkItemsController = async (req, res) => {
  try {
    const workItems = await workItemsService.getAllWorkItemsService();
    res.status(200).json({
      success: true,
      message: "Fetched work items details successfully.",
      data: workItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// const updateWorkItemsController = async (req, res) => {
//   try {
//     const { woi_id } = req.params;

//     // --------------------------------
//     // PARSE MEDIA ITEMS
//     // --------------------------------

//     let media_items = [];

//     if (req.body.media_items) {
//       try {
//         media_items =
//           typeof req.body.media_items === "string"
//             ? JSON.parse(req.body.media_items)
//             : req.body.media_items;
//       } catch (error) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid media_items JSON format.",
//         });
//       }
//     }

//     // Make sure media_items is an array
//     if (!Array.isArray(media_items)) {
//       media_items = [];
//     }

//     // --------------------------------
//     // GET UPLOADED FILES
//     // --------------------------------

//     const files = req.files || [];

//     // --------------------------------
//     // ASSIGN IMAGES TO MEDIA ITEMS
//     // --------------------------------

//     media_items = media_items.map((media, index) => ({
//       ...media,

//       // If a new image was uploaded for this media
//       woim_creative_image: files[index]
//         ? `/uploads/work-items/${files[index].filename}`
//         : media.woim_creative_image || null,
//     }));

//     // --------------------------------
//     // UPDATE DATA
//     // --------------------------------

//     const updateData = {
//       woi_jc_number: req.body.woi_jc_number,
//       woi_work_allot_date: req.body.woi_work_allot_date,
//       woi_printer_name: req.body.woi_printer_name,
//       woi_status: req.body.woi_status,
//       media_items,
//     };

//     // Remove undefined parent fields
//     Object.keys(updateData).forEach((key) => {
//       if (updateData[key] === undefined) {
//         delete updateData[key];
//       }
//     });

//     // --------------------------------
//     // UPDATE
//     // --------------------------------

//     const result = await workItemsService.updateWorkItemsService(
//       woi_id,
//       updateData,
//     );

//     // --------------------------------
//     // NOT FOUND
//     // --------------------------------

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Work Items record not found.",
//       });
//     }

//     // --------------------------------
//     // SUCCESS
//     // --------------------------------

//     return res.status(200).json({
//       success: true,
//       message: "Work Items record updated successfully.",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Update Work Items Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const updateWorkItemsController = async (req, res) => {
  try {
    const { woi_id } = req.params;

    // --------------------------------
    // PARSE MEDIA ITEMS
    // --------------------------------

    let media_items = [];

    if (req.body.media_items) {
      try {
        media_items =
          typeof req.body.media_items === "string"
            ? JSON.parse(req.body.media_items)
            : req.body.media_items;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid media_items JSON format.",
        });
      }
    }

    if (!Array.isArray(media_items)) {
      media_items = [];
    }

    // --------------------------------
    // GET UPLOADED FILES
    // --------------------------------

    const files = req.files || [];

    // --------------------------------
    // PARSE IMAGE INDEXES
    // --------------------------------

    let imageIndexes = [];

    if (req.body.woi_creative_image_indexes) {
      try {
        imageIndexes =
          typeof req.body.woi_creative_image_indexes === "string"
            ? JSON.parse(req.body.woi_creative_image_indexes)
            : req.body.woi_creative_image_indexes;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid image indexes format.",
        });
      }
    }

    if (!Array.isArray(imageIndexes)) {
      imageIndexes = [];
    }

    // --------------------------------
    // CREATE IMAGE MAP
    // --------------------------------
    // Example:
    //
    // imageIndexes = [1, 3]
    // files = [fileForMedia1, fileForMedia3]
    //
    // Result:
    // {
    //   1: "/uploads/work-items/image1.webp",
    //   3: "/uploads/work-items/image3.webp"
    // }

    const imageMap = {};

    files.forEach((file, fileIndex) => {
      const mediaIndex = Number(imageIndexes[fileIndex]);

      if (
        Number.isInteger(mediaIndex) &&
        mediaIndex >= 0 &&
        mediaIndex < media_items.length
      ) {
        imageMap[mediaIndex] = `/uploads/work-items/${file.filename}`;
      }
    });

    // --------------------------------
    // ASSIGN IMAGES TO MEDIA ITEMS
    // --------------------------------

    media_items = media_items.map((media, index) => {
      const updatedMedia = {
        ...media,
      };

      // Only replace image when a NEW image was uploaded
      if (imageMap[index]) {
        updatedMedia.woim_creative_image = imageMap[index];
      } else {
        // Keep existing image
        updatedMedia.woim_creative_image = media.woim_creative_image || null;
      }

      return updatedMedia;
    });

    // --------------------------------
    // UPDATE DATA
    // --------------------------------

    const updateData = {
      woi_jc_number: req.body.woi_jc_number,
      woi_work_allot_date: req.body.woi_work_allot_date,
      woi_printer_name: req.body.woi_printer_name,
      woi_status: req.body.woi_status,
      media_items,
    };

    // Remove undefined parent fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // --------------------------------
    // UPDATE
    // --------------------------------

    const result = await workItemsService.updateWorkItemsService(
      woi_id,
      updateData,
    );

    // --------------------------------
    // NOT FOUND
    // --------------------------------

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Work Items record not found.",
      });
    }

    // --------------------------------
    // SUCCESS
    // --------------------------------

    return res.status(200).json({
      success: true,
      message: "Work Items record updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update Work Items Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteWorkItemsController = async (req, res) => {
  try {
    const { woi_id } = req.params;

    const result = await workItemsService.deleteWorkItemsService(woi_id);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Work Item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Work Item and related media deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Work Items Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllWorkItemsByPrinterController = async (req, res) => {
  try {
    const { printer_id } = req.params;
    const workItems =
      await workItemsService.getAllWorkItemsByPrinterService(printer_id);
    res.status(200).json({
      success: true,
      message: "Fetched work items details successfully.",
      data: workItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  saveWorkItemsController,
  getAllWorkItemsController,
  updateWorkItemsController,
  deleteWorkItemsController,
  getAllWorkItemsByPrinterController,
};
