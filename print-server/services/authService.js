const pool = require("../config/db");
const moment = require("moment-timezone");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saveEmployeeService = async (data) => {
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
  } = data;

  // Hash password
  const hashedPassword = await bcrypt.hash(emp_password, 10);

  const createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  const sql = `
        INSERT INTO user_data
        (emp_name, emp_email, emp_phone, emp_password, emp_role, emp_designation, emp_status, device_id, fcm_token, emp_created_at)
        VALUES (?, ?, ?, ?, ?,?,?, ?, ?, ?)
    `;

  const [result] = await pool.query(sql, [
    emp_name,
    emp_email,
    emp_phone,
    hashedPassword,
    emp_role,
    emp_designation,
    emp_status,
    device_id,
    fcm_token,
    createdAt,
  ]);

  return result;
};

const getAllEmployeesService = async () => {
  const sql = `
    SELECT
      emp_id,
      emp_name,
      emp_email,
      emp_phone,
      emp_role,
      emp_designation,
      emp_status,
      device_id,
      fcm_token,
      emp_created_at
    FROM user_data
    WHERE emp_role = ?
    ORDER BY emp_created_at DESC
  `;

  const [rows] = await pool.query(sql, ["employee"]);

  return rows;
};

const updateEmployeeService = async (emp_id, data) => {
  const fields = [];
  const values = [];

  if (data.emp_name !== undefined) {
    fields.push("emp_name = ?");
    values.push(data.emp_name);
  }

  if (data.emp_email !== undefined) {
    fields.push("emp_email = ?");
    values.push(data.emp_email);
  }

  if (data.emp_password !== undefined) {
    const hashedPassword = await bcrypt.hash(data.emp_password, 10);

    fields.push("emp_password = ?");
    values.push(hashedPassword);
  }

  if (data.emp_role !== undefined) {
    fields.push("emp_role = ?");
    values.push(data.emp_role);
  }

  if (data.emp_designation !== undefined) {
    fields.push("emp_designation = ?");
    values.push(data.emp_designation);
  }

  if (data.emp_status !== undefined) {
    fields.push("emp_status = ?");
    values.push(data.emp_status);
  }

  if (data.device_id !== undefined) {
    fields.push("device_id = ?");
    values.push(data.device_id);
  }

  if (data.fcm_token !== undefined) {
    fields.push("fcm_token = ?");
    values.push(data.fcm_token);
  }

  // Nothing to update
  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  values.push(emp_id);

  const sql = `
    UPDATE user_data
    SET ${fields.join(", ")}
    WHERE emp_id = ?
  `;

  const [result] = await pool.query(sql, values);

  return result;
};

const deleteEmployeeService = async (emp_id) => {
  try {
    const sql = `
      DELETE FROM user_data
      WHERE emp_id = ?
    `;

    const [result] = await pool.query(sql, [emp_id]);

    return result;
  } catch (error) {
    throw error;
  }
};

const loginService = async (emp_phone, emp_password) => {
  try {
    const sql = `SELECT * FROM user_data WHERE emp_phone = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [emp_phone]);

    if (rows.length === 0) {
      return {
        success: false,
        message: "Invalid phone or password.",
      };
    }

    const user = rows[0];

    // Check employee status
    if (user.emp_status !== "active") {
      return {
        success: false,
        message: "Your account is inactive.",
      };
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(
      emp_password,
      user.emp_password,
    );

    if (!isPasswordMatch) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        emp_id: user.emp_id,
        emp_name: user.emp_name,
        emp_email: user.emp_email,
        emp_phone: user.emp_phone,
        emp_role: user.emp_role,
        emp_status: user.emp_status,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "60d",
      },
    );

    // Remove password before sending response
    delete user.emp_password;

    return {
      success: true,
      message: "Login successful.",
      token,
      user,
    };
  } catch (error) {
    throw error;
  }
};

const resetPasswordService = async (emp_id, new_password) => {
  try {
    const [rows] = await pool.query(
      "SELECT emp_id FROM user_data WHERE emp_id = ?",
      [emp_id],
    );

    if (rows.length === 0) {
      return {
        success: false,
        message: "Employee not found.",
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query("UPDATE user_data SET emp_password = ? WHERE emp_id = ?", [
      hashedPassword,
      emp_id,
    ]);

    return {
      success: true,
      message: "Password reset successfully.",
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveEmployeeService,
  getAllEmployeesService,
  updateEmployeeService,
  deleteEmployeeService,
  loginService,
  resetPasswordService,
};
