import { useEffect, useState } from "react";
import axios from "axios";
import {
  Typography,
  Snackbar,
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Divider,
} from "@mui/material";

const TeamAssignmentForManager = () => {
  const [assignedExecutors, setAssignedExecutors] = useState([]);
  const [availableExecutors, setAvailableExecutors] = useState([]);
  const [selectedExecutors, setSelectedExecutors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const managerId = localStorage.getItem("user_id");

  useEffect(() => {
    fetchExecutors();
  }, []);

  const fetchExecutors = async () => {
    try {
      // Get executors already assigned to this manager
      const assignedRes = await axios.get(
        `http://localhost:4000/ajouter/manager-executors/${managerId}`
      );
      setAssignedExecutors(assignedRes.data);

      // Get available executors (not assigned to any manager)
      const availableRes = await axios.get(
        "http://localhost:4000/ajouter/available-executors"
      );
      setAvailableExecutors(availableRes.data);

      // Initialize selected state for already assigned executors
      const initialSelected = {};
      assignedRes.data.forEach(executor => {
        initialSelected[executor.user_id] = true;
      });
      setSelectedExecutors(initialSelected);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to fetch executors", severity: "error" });
    }
  };

  const handleCheckboxChange = (executorId) => {
    setSelectedExecutors((prev) => ({
      ...prev,
      [executorId]: !prev[executorId],
    }));
  };

  const handleAssignTeam = async () => {
    const selectedIds = Object.keys(selectedExecutors).filter((id) => selectedExecutors[id]);
    try {
      await axios.post("http://localhost:4000/ajouter/assign-team", {
        managerId,
        executorIds: selectedIds,
      });
      setSnackbar({ open: true, message: "Team successfully updated!", severity: "success" });
      fetchExecutors(); // Refresh the list
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to update team", severity: "error" });
    }
  };
  const ExecutorCard = ({ executor, isSelected, onChange }) => (
    <div className="group relative">
      <label className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onChange}
          className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2 transition-all duration-200"
        />
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
        <span className="text-gray-900 font-medium text-lg">{executor.email.split('@')[0]}</span>
          </div>
        </div>
        <svg 
          className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manage Your Team
          </h1>
          <p className="text-xl text-gray-600">
            Assign and manage team members with ease
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Current Team Section */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Current Team</h2>
                <p className="text-gray-600">Members currently assigned to your team</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {assignedExecutors.length > 0 ? (
                assignedExecutors.map((executor) => (
                  <ExecutorCard
                    key={executor.user_id}
                    executor={executor}
                    isSelected={!!selectedExecutors[executor.user_id]}
                    onChange={() => handleCheckboxChange(executor.user_id)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No executors currently assigned to your team</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Executors Section */}
          <div className="p-8">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Available Executors</h2>
                <p className="text-gray-600">Select members to add to your team</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {availableExecutors.length > 0 ? (
                availableExecutors.map((executor) => (
                  <ExecutorCard
                    key={executor.user_id}
                    executor={executor}
                    isSelected={!!selectedExecutors[executor.user_id]}
                    onChange={() => handleCheckboxChange(executor.user_id)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No available executors</p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleAssignTeam}
                disabled={Object.values(selectedExecutors).every((val) => !val)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:transform-none text-lg min-w-[200px]"
              >
                {Object.values(selectedExecutors).some(Boolean) ? 'Update Team' : 'Select Members'}
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Notification */}
        {snackbar.open && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3 animate-in slide-in-from-bottom duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{snackbar.message}</span>
              <button
                onClick={() => setSnackbar({ ...snackbar, open: false })}
                className="ml-4 text-white hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamAssignmentForManager;