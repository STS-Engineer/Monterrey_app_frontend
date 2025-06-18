import { useEffect, useState } from "react";
import axios from "axios";
import { message } from "antd";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Box,
  Avatar,
} from "@mui/material";


const RoleAssignment = () => {
  const [users, setUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:4000/ajouter/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch users");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const currentUser = users.find((user) => user.user_id === userId);

    if (!currentUser) {
      message.error("User not found");
      return;
    }

    if (currentUser.role === newRole) {
      message.info("Role is already set to this value");
      return;
    }

    try {
      await axios.put(`http://localhost:4000/ajouter/update-role/${userId}`, {
        role: newRole,
      });
     setSnackbar({ open: true, message: `Role updated to ${newRole}`, severity: "success" });
      fetchUsers(); // Refresh user list
    } catch (err) {
      console.error(err);
      message.error("Failed to update role");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Roles to Users</h2>
      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.user_id}
            className="flex items-center justify-between p-4 border rounded-lg shadow-sm"
          >
            <div>
              <p className="font-semibold text-gray-700">{user.email}</p>
              <p className="text-sm text-gray-500">Current Role: {user.role}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                className="border px-3 py-2 rounded-md text-sm"
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="EXECUTOR">Executor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
          </div>
        ))}
      </div>
         <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RoleAssignment;
