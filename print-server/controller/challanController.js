const challanService = require("../services/challanService");

const saveChallanController = async (req, res) => {
  try {
    const {
      ch_client_id,
      ch_print_id,
      ch_date,
      ch_description,
      ch_creative,
      ch_height,
      ch_width,
      ch_quantity,
      ch_area,
      ch_delivered_to,
      ch_phone,
      ch_remark,
    } = req.body;

    await challanService.saveChallanService({
      ch_client_id,
      ch_print_id,
      ch_date,
      ch_description,
      ch_creative,
      ch_height,
      ch_width,
      ch_quantity,
      ch_area,
      ch_delivered_to,
      ch_phone,
      ch_remark,
    });

    res.status(201).json({
      success: true,
      message: "Challan Record Saved Successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllChallanController = async (req, res) => {
  try {
    const employees = await challanService.getAllChallanService();

    res.status(201).json({
      success: true,
      message: "Fetched Challan details successfully.",
      data: employees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateChallanController = async (req, res) => {
  try {
    const { challan_id } = req.params;

    const result = await challanService.updateChallanService(
      challan_id,
      req.body,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Challan record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Challan record updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteChallanController = async (req, res) => {
  try {
    const { challan_id } = req.params;

    const result = await challanService.deleteChallanService(
      challan_id,
      req.body,
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Challan not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Challan deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  saveChallanController,
  getAllChallanController,
  updateChallanController,
  deleteChallanController,
};
