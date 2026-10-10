const finalWorkOrderService = require("../services/finalWorkOrderService");

const saveFinalWorkOrderController = async (req, res) => {
  try {
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
      woi_ids, // Selected work order item IDs
    } = req.body;

    // Validate work order item IDs
    if (!Array.isArray(woi_ids) || woi_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide work order item IDs.",
      });
    }

    // Save final work order and update selected items
    const result = await finalWorkOrderService.saveFinalWorkOrderService({
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
      woi_ids,
    });

    return res.status(201).json({
      success: true,
      message: "Final work order saved successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Save Final Work Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllFinalWorkItemsController = async (req, res) => {
  try {
    const workItems = await finalWorkOrderService.getAllFinalWorkOrderService();
    res.status(200).json({
      success: true,
      message: "Fetched final work orders details successfully.",
      data: workItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateFinalWorkOrderController = async (req, res) => {
  try {
    const { fwo_id } = req.params;
    const result = await finalWorkOrderService.updateFinalWorkOrderService(
      fwo_id,
      req.body,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Final work order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Final work order updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteFinalWorkOrderController = async (req, res) => {
  try {
    const { fwo_id } = req.params;
    const result = await finalWorkOrderService.deleteFinalWorkOrderService(
      fwo_id,
      req.body,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Final Work order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Final Work order deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  saveFinalWorkOrderController,
  getAllFinalWorkItemsController,
  updateFinalWorkOrderController,
  deleteFinalWorkOrderController,
};
