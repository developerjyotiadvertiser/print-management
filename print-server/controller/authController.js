const authService = require("../services/authService");

const saveEmployeeController = async (req, res) => {
  try {
    const {
      emp_name,
      emp_email,
      emp_phone,
      emp_password,
      emp_role,
      emp_designation,
      emp_status,
      device_id,
      fcm_token,
    } = req.body;

    if (
      !emp_name ||
      !emp_phone ||
      !emp_email ||
      !emp_password ||
      !emp_role ||
      !emp_designation ||
      !emp_status
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
    }

    await authService.saveEmployeeService({
      emp_name,
      emp_email,
      emp_phone,
      emp_password,
      emp_role,
      emp_designation,
      emp_status,
      device_id,
      fcm_token,
    });

    res.status(201).json({
      success: true,
      message: "Employee details saved successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllEmployeeController = async (req, res) => {
  try {
    const employees = await authService.getAllEmployeesService();

    res.status(201).json({
      success: true,
      message: "Fethced employee details successfully.",
      data: employees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateEmployeeController = async (req, res) => {
  try {
    const { emp_id } = req.params;

    const result = await authService.updateEmployeeService(emp_id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteEmployeeController = async (req, res) => {
  try {
    const { emp_id } = req.params;

    const result = await authService.deleteEmployeeService(emp_id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const loginController = async (req, res) => {
  try {
    const { emp_phone, emp_password } = req.body;

    // Validate required fields
    if (!emp_phone || !emp_password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const result = await authService.loginService(emp_phone, emp_password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { emp_id, new_password } = req.body;

    if (!emp_id || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and new password are required.",
      });
    }

    const result = await authService.resetPasswordService(emp_id, new_password);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  saveEmployeeController,
  getAllEmployeeController,
  updateEmployeeController,
  deleteEmployeeController,
  loginController,
  resetPasswordController,
};
