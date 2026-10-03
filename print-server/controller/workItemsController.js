const workItemsService = require("../services/workItemsService");

const saveWorkItemsController = async (req, res) => {
  try {
    const {
      woi_serial_number,
      woi_jc_number,
      woi_work_allot_date,
      woi_printer_name,
      woi_status,
    } = req.body;

    // -----------------------------------------
    // PARSE MEDIA ITEMS
    // -----------------------------------------
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

    // -----------------------------------------
    // HANDLE UPLOADED IMAGES
    // -----------------------------------------
    const files = req.files || [];

    media_items = media_items.map((media, index) => ({
      ...media,

      woim_creative_image: files[index]
        ? `/uploads/work-items/${files[index].filename}`
        : null,
    }));

    // -----------------------------------------
    // SAVE WORK ITEM + MEDIA
    // -----------------------------------------
    const result = await workItemsService.saveWorkItemsService({
      woi_serial_number,
      woi_jc_number,
      woi_work_allot_date,
      woi_printer_name,
      woi_status,
      media_items,
    });

    res.status(201).json({
      success: true,
      message: "Work Item Saved Successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Save Work Item Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
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

    // Make sure media_items is an array
    if (!Array.isArray(media_items)) {
      media_items = [];
    }

    // --------------------------------
    // GET UPLOADED FILES
    // --------------------------------

    const files = req.files || [];

    // --------------------------------
    // ASSIGN IMAGES TO MEDIA ITEMS
    // --------------------------------

    media_items = media_items.map((media, index) => ({
      ...media,

      // If a new image was uploaded for this media
      woim_creative_image: files[index]
        ? `/uploads/work-items/${files[index].filename}`
        : media.woim_creative_image || null,
    }));

    // --------------------------------
    // UPDATE DATA
    // --------------------------------

    const updateData = {
      woi_serial_number: req.body.woi_serial_number,
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

module.exports = {
  saveWorkItemsController,
  getAllWorkItemsController,
  updateWorkItemsController,
  deleteWorkItemsController,
};
