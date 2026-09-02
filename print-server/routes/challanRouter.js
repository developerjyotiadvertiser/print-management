const express = require("express");
const router = express.Router();
const challanController = require("../controller/challanController");

router.post("/save-challan", challanController.saveChallanController);
router.get("/get-all-challan", challanController.getAllChallanController);
router.put(
  "/update-challan/:challan_id",
  challanController.updateChallanController,
);
router.delete(
  "/delete-challan/:challan_id",
  challanController.deleteChallanController,
);

module.exports = router;
