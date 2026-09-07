const printService = require("../services/printService");

const savePrintController = async (req, res) => {
  try {
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
    } = req.body;

    await printService.savePrintService({
      creative,
      media_type,
      width,
      height,
      size_unit,
      quality_print,
      quantity,
      total_area,
      remarks,
    });

    res.status(201).json({
      success: true,
      message: "Print Record Saved Successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPrintController = async (req, res) => {
  try {
    const employees = await printService.getAllPrintService();

    res.status(201).json({
      success: true,
      message: "Fetched print details successfully.",
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

const updatePrintController = async (req, res) => {
  try {
    const { print_id } = req.params;

    const result = await printService.updatePrintService(print_id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "print record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Print record updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deletePrintController = async (req, res) => {
  try {
    const { print_id } = req.params;

    const result = await printService.deletePrintService(print_id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Print not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Print deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  savePrintController,
  getAllPrintController,
  updatePrintController,
  deletePrintController,
};
