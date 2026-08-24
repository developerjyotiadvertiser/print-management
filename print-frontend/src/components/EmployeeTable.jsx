import { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus, FiEdit, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { useSelector } from "react-redux";
import AddEmployeeModel from "./PopupWindows/AddEmployeeModel";
import UpdateEmployeeModel from "./PopupWindows/UpdateEmployeeModel";

const EmployeeTable = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModel, setAddModel] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [updateModel, setUpdateModel] = useState(false);
  const [selected, setSelected] = useState();

  const handleUpdate = (data) => {
    setUpdateModel(true);
    setSelected(data);
  };

  // Fetch all employees
  const getEmployees = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${apiUrl}/api/auth/get-employee`);

      if (response.data?.success) {
        setEmployees(response.data.data || []);
      } else {
        setEmployees(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getEmployees();
  }, []);

  // Delete employee
  const handleDelete = async (emp_id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this employee?",
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${apiUrl}/api/auth/delete-employee/${emp_id}`);

      // Remove deleted employee from UI
      setEmployees((prev) =>
        prev.filter((employee) => employee.emp_id !== emp_id),
      );

      alert("Employee deleted successfully");
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee");
    }
  };

  return (
    <>
      <div className="p-6 bg-white rounded-xl shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Employees Details
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Total Employees: {employees.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh */}
            <button
              onClick={getEmployees}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            {/* Add Employee */}
            {user?.user?.emp_role !== "employee" && (
              <>
                <button
                  onClick={() => setAddModel(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  <FiPlus />
                  Add Employee
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Sr. No.
                </th>

                {/* <th className="px-5 py-3 font-semibold text-gray-600">
                  Employee ID
                </th> */}

                <th className="px-5 py-3 font-semibold text-gray-600">Name</th>

                {/* <th className="px-5 py-3 font-semibold text-gray-600">Email</th> */}

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Mobile
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Designation
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Status
                </th>

                {user?.user?.emp_role === "admin" && (
                  <>
                    <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                      Action
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees?.map((employee, index) => (
                  <tr
                    key={employee?.emp_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                    {/* <td className="px-5 py-4 font-medium text-gray-800">
                      {employee?.emp_id}
                    </td> */}

                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {employee?.emp_name || "-"}
                      </div>
                    </td>

                    {/* <td className="px-5 py-4 text-gray-600">
                      {employee?.emp_email || "-"}
                    </td> */}

                    <td className="px-5 py-4 text-gray-600">
                      {employee?.emp_phone || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {employee?.emp_designation || "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          employee?.emp_status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {employee?.status || "Active"}
                      </span>
                    </td>

                    {user?.user?.emp_role !== "employee" && (
                      <>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Update */}
                            <button
                              onClick={() => handleUpdate(employee)}
                              className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                              title="Update Employee"
                            >
                              <FiEdit size={16} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(employee.emp_id)}
                              className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                              title="Delete Employee"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AddEmployeeModel
        isOpen={addModel}
        onClose={() => setAddModel(false)}
        getEmployees={getEmployees}
      />
      <UpdateEmployeeModel
        isOpen={updateModel}
        onClose={() => setUpdateModel(false)}
        getEmployees={getEmployees}
        selected={selected}
      />
    </>
  );
};

export default EmployeeTable;
