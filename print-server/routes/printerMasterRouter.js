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

//media

router.post(
  "/save-printer-media",
  printerMasterController.savePrinterMediaController,
);
router.get(
  "/get-printer-media/:printer_id",
  printerMasterController.getAllPrinterMediaController,
);
router.put(
  "/update-printer-media/:pmm_id",
  printerMasterController.updatePrinterMediaController,
);
router.delete(
  "/delete-printer-media/:pmm_id",
  printerMasterController.deletePrinterMediaController,
);

module.exports = router;
