const express = require("express");
const router = express.Router();
const finalWorkOrderController = require("../controller/finalWorkOrderController");

router.post(
  "/save-final-work-order",
  finalWorkOrderController.saveFinalWorkOrderController,
);

router.get(
  "/get-final-work-orders",
  finalWorkOrderController.getAllFinalWorkItemsController,
);

router.put(
  "/update-final-work-order/:fwo_id",
  finalWorkOrderController.updateFinalWorkOrderController,
);

router.delete(
  "/delete-final-work-order/:fwo_id",
  finalWorkOrderController.deleteFinalWorkOrderController,
);

module.exports = router;
