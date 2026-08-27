const express = require("express");
const authController = require("../controller/authController");
const router = express.Router();

router.post("/add-employee", authController.saveEmployeeController);
router.get("/get-employee", authController.getAllEmployeeController);
router.put("/update-employee/:emp_id", authController.updateEmployeeController);
router.delete(
  "/delete-employee/:emp_id",
  authController.deleteEmployeeController,
);
router.post("/login", authController.loginController);
router.put("/reset-password", authController.resetPasswordController);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;
