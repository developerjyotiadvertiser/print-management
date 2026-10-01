const printerMasterService = require("../services/printerMasterService");

const savePrinterController = async (req, res) => {
  try {
    const { printer_name, pm_status } = req.body;
    await printerMasterService.savePrinterService({
      printer_name,
      pm_status,
    });

    res.status(201).json({
      success: true,
      message: "Printer Master Record Saved Successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPrinterController = async (req, res) => {
  try {
    const employees = await printerMasterService.getAllPrinterService();
    res.status(201).json({
      success: true,
      message: "Fetched printer master details successfully.",
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updatePrinterController = async (req, res) => {
  try {
    const { pm_id } = req.params;
    const result = await printerMasterService.updatePrinterService(
      pm_id,
      req.body,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "printer record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Printer updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deletePrinterController = async (req, res) => {
  try {
    const { pm_id } = req.params;
    const result = await printerMasterService.deletePrinterService(
      pm_id,
      req.body,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Printer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Printer deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  savePrinterController,
  getAllPrinterController,
  updatePrinterController,
  deletePrinterController,
};
