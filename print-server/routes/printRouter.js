const express = require("express");
const router = express.Router();
const printController = require("../controller/printController");

router.post("/save-print", printController.savePrintController);
router.get("/get-all-print", printController.getAllPrintController);
router.put("/update-print/:print_id", printController.updatePrintController);
router.delete("/delete-print/:print_id", printController.deletePrintController);

module.exports = router;
