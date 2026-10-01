const workItemsService = require("../services/workItemsService");

const saveWorkItemsController = async (req, res) => {
  try {
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
      woi_status,
    } = req.body;

    // Image converted to WebP by middleware
    const woi_creative_image = req.file
      ? `/uploads/work-items/${req.file.filename}`
      : null;

    await workItemsService.saveWorkItemsService({
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
    });

    res.status(201).json({
      success: true,
      message: "Work Item Saved Successfully.",
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
    const employees = await workItemsService.getAllWorkItemsService();
    res.status(201).json({
      success: true,
      message: "Fetched work items details successfully.",
      data: employees,
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

    const updateData = {
      ...req.body,
    };

    // --------------------------------
    // NEW IMAGE
    // --------------------------------
    if (req.file) {
      updateData.woi_creative_image = `/uploads/work-items/${req.file.filename}`;
    }

    // --------------------------------
    // UPDATE
    // --------------------------------
    const result = await workItemsService.updateWorkItemsService(
      woi_id,
      updateData,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Work Items record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Work Items record updated successfully.",
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
    const result = await workItemsService.deleteWorkItemsService(
      woi_id,
      req.body,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Work Item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Work Item deleted successfully.",
    });
  } catch (error) {
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
