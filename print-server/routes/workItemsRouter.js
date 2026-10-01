const express = require("express");
const router = express.Router();
const workItemsController = require("../controller/workItemsController");
const {
  uploadWorkItem,
  processWorkItemImage,
} = require("../middleware/uploadWorkItems");

router.post(
  "/save-work-items",
  uploadWorkItem.single("woi_creative_image"),
  processWorkItemImage,
  workItemsController.saveWorkItemsController,
);
router.get(
  "/get-all-work-items",
  workItemsController.getAllWorkItemsController,
);
// router.put(
//   "/update-work-items/:woi_id",
//   workItemsController.updateWorkItemsController,
// );

router.put(
  "/update-work-items/:woi_id",
  uploadWorkItem.single("woi_creative_image"),
  processWorkItemImage,
  workItemsController.updateWorkItemsController,
);

router.delete(
  "/delete-work-items/:woi_id",
  workItemsController.deleteWorkItemsController,
);

module.exports = router;
