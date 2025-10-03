import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Addfailure = () => {
  const [formData, setFormData] = useState({
    failure_desc: "",
    solution: "",
    failure_date: null,
    status: "Pending",
    executor: 0,
    creator: localStorage.getItem("user_id") || "",
    machine_id: 0, 
  });
  const [machines, setMachines] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetch("https://machine-backend.azurewebsites.net/ajouter/machines")
      .then((response) => response.json())
      .then((data) => setMachines(data))
      .catch((error) => console.error("Error fetching machines:", error));
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const payload = {
      ...formData,
      failure_date: formData.failure_date
        ? formData.failure_date.toISOString()
        : null,
      user_id: localStorage.getItem("user_id"), // logged-in user
      role: localStorage.getItem("role"),       // store role in localStorage at login
    };

    console.log("Submitting payload:", payload);

    const response = await fetch("https://machine-backend.azurewebsites.net/ajouter/failure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("Failure reported successfully ✅");
      setFormData({
        failure_desc: "",
        solution: "",
        failure_date: null,
        status: "Pending",
        machine_id: 0,
        executor: 0,
        creator: 0,
      });
    } else {
      console.error("Failed to submit failure");
    }
  } catch (err) {
    console.error("Error:", err);
  }
};


  return (
    <div className="flex justify-center py-10 px-4 bg-gray-50 min-h-screen">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Report Failure
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Machine Dropdown */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Select Machine
            </label>
            <select
              name="machine_id"
              value={formData.machine_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              required
            >
              <option value="">-- Choose a machine --</option>
              {machines.map((machine) => (
                <option key={machine.machine_id} value={machine.machine_id}>
                  {machine.machine_name}
                </option>
              ))}
            </select>
          </div>

          {/* Failure Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Failure Description
            </label>
            <textarea
              name="failure_desc"
              value={formData.failure_desc}
              onChange={handleChange}
              rows="4"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Describe the failure..."
              required
            />
          </div>

          {/* Solution */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Solution
            </label>
            <textarea
              name="solution"
              value={formData.solution}
              onChange={handleChange}
              rows="4"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Enter the proposed solution..."
              required
            />
          </div>

          {/* Failure Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Failure Date
            </label>
            <DatePicker
              selected={formData.failure_date}
              onChange={(date) =>
                setFormData((prev) => ({ ...prev, failure_date: date }))
              }
              showTimeSelect
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              placeholderText="Select failure date"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-md"
          >
            Submit Failure
          </button>
        </form>
      </div>
    </div>
  );
};

export default Addfailure;
