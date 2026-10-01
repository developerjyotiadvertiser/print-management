const express = require("express");
const router = express.Router();
const printerMasterController = require("../controller/printerMasterController");

router.post(
  "/save-printer-master",
  printerMasterController.savePrinterController,
);
router.get(
  "/get-all-printer-master",
  printerMasterController.getAllPrinterController,
);
router.put(
  "/update-printer-master/:pm_id",
  printerMasterController.updatePrinterController,
);
router.delete(
  "/delete-printer-master/:pm_id",
  printerMasterController.deletePrinterController,
);

module.exports = router;
