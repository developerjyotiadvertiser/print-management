const express = require("express");
const router = express.Router();
const clientController = require("../controller/clientController");

router.post("/save-client", clientController.saveClientController);
router.get("/get-all-client", clientController.getAllClientController);
router.put(
  "/update-client/:client_id",
  clientController.updateClientController,
);
router.delete(
  "/delete-client/:client_id",
  clientController.deleteClientController,
);

router.post("/fetch-gst-details", clientController.fetchGSTDetailsController);

module.exports = router;
