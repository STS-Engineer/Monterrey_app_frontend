import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const FailuresList = () => {
  const [failures, setFailures] = useState([]);
  const [editingFailure, setEditingFailure] = useState(null);
  const [formData, setFormData] = useState({
    failure_desc: "",
    solution: "",
    failure_date: "",
    status: "Pending",
  });

  // New state for search
  const [searchMachine, setSearchMachine] = useState("");
  const [searchMachineRef, setSearchMachineRef] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Fetch failures
  const fetchFailures = async () => {
    try {
      const res = await fetch("https://machine-backend.azurewebsites.net/ajouter/failures");
      const data = await res.json();
      // console.log("failure data", data);
      setFailures(data);
    } catch (err) {
      console.error("Error fetching failures:", err);
    }
  };

  useEffect(() => {
    fetchFailures();
  }, []);

  // Handle delete
  const handleDelete = async (failure_id) => {
    if (!window.confirm("Are you sure you want to delete this failure?")) return;

    try {
      await fetch(`https://machine-backend.azurewebsites.net/ajouter/failure/${failure_id}`, {
        method: "DELETE",
      });
      fetchFailures(); // refresh
    } catch (err) {
      console.error("Error deleting failure:", err);
    }
  };

  // Open edit modal
  const openEdit = (failure) => {
    setEditingFailure(failure);
    setFormData({
      failure_desc: failure.failure_desc,
      solution: failure.solution,
      failure_date: failure.failure_date,
      status: failure.status,
    });
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(
        `https://machine-backend.azurewebsites.net/ajouter/failure/${editingFailure.failure_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      setEditingFailure(null);
      fetchFailures();
    } catch (err) {
      console.error("Error updating failure:", err);
    }
  };

  // Filtered failures based on search
  const filteredFailures = failures.filter((f) => {
    const machineName = String(f.machine_name || "").toLowerCase();
    // Accept either machine_ref or machine_reference if backend naming varies
    const machineRef = String(f.machine_ref || f.machine_reference || "").toLowerCase();

    const sName = String(searchMachine || "").trim().toLowerCase();
    const sRef = String(searchMachineRef || "").trim().toLowerCase();

    // Only apply name filter if user typed something in name input
    const matchesName = sName ? machineName.includes(sName) : true;
    // Only apply ref filter if user typed something in ref input
    const matchesRef = sRef ? machineRef.includes(sRef) : true;

    // Both filters must pass (if provided). This allows searching by ref alone or name alone.
    const matchesMachine = matchesName && matchesRef;

    // Date checks (safe if failure_date missing)
    const failureDate = f.failure_date ? new Date(f.failure_date) : null;
    const withinRange =
      (!startDate || (failureDate && failureDate >= startDate)) &&
      (!endDate || (failureDate && failureDate <= endDate));

    return matchesMachine && withinRange;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Failures List</h1>

      {/* Search Bar */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        {/* Machine name filter */}
        <input
          type="text"
          placeholder="Search by machine name"
          value={searchMachine}
          onChange={(e) => setSearchMachine(e.target.value)}
          className="border px-3 py-2 rounded w-1/3"
        />

        {/* Machine reference filter */}
        <input
          type="text"
          placeholder="Search by machine reference"
          value={searchMachineRef}
          onChange={(e) => setSearchMachineRef(e.target.value)}
          className="border px-3 py-2 rounded w-1/4"
        />

        {/* Start date filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium">Start Date:</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            className="border px-3 py-2 rounded"
            placeholderText="Select start date"
            dateFormat="yyyy-MM-dd"
            isClearable
          />
        </div>

        {/* End date filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium">End Date:</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            className="border px-3 py-2 rounded"
            placeholderText="Select end date"
            dateFormat="yyyy-MM-dd"
            isClearable
          />
        </div>
      </div>

      <table className="w-full border border-gray-300 bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Machine Reference</th>
            <th className="p-2 border">Machine Name</th>
            <th className="p-2 border">Failure</th>
            <th className="p-2 border">Solution</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFailures.map((f) => (
            <tr key={f.failure_id} className="text-center">
              <td className="p-2 border">{f.machine_ref}</td>
              <td className="p-2 border">{f.machine_name}</td>
              <td className="p-2 border">{f.failure_desc}</td>
              <td className="p-2 border">{f.solution}</td>
              <td className="p-2 border">
                {f.failure_date ? new Date(f.failure_date).toLocaleString() : "-"}
              </td>
              <td className="p-2 border">{f.status}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => openEdit(f)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(f.failure_id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingFailure && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit Failure</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                type="text"
                value={formData.failure_desc}
                onChange={(e) =>
                  setFormData({ ...formData, failure_desc: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
                placeholder="Failure description"
                required
              />
              <input
                type="text"
                value={formData.solution}
                onChange={(e) =>
                  setFormData({ ...formData, solution: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
                placeholder="Solution"
                required
              />
              <input
                type="datetime-local"
                value={formData.failure_date?.slice(0, 16)}
                onChange={(e) =>
                  setFormData({ ...formData, failure_date: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setEditingFailure(null)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailuresList;
