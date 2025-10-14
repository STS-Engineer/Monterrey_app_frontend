import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const FailuresList = () => {
  const [failures, setFailures] = useState([]);
  const [editingFailure, setEditingFailure] = useState(null);
  const [viewingFailure, setViewingFailure] = useState(false);
  const [detailedFailure, setDetailedFailure] = useState(null);
  const [machines, setMachines] = useState([]);
  const [formData, setFormData] = useState({
     machine_id: "", 
    failure_desc: "",
    solution: "",
    failure_date: "",
    status: "Pending",
  });

  const [searchMachine, setSearchMachine] = useState("");
  const [searchMachineRef, setSearchMachineRef] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Fetch all failures
  const fetchFailures = async () => {
    try {
      const res = await fetch("https://machine-backend.azurewebsites.net/ajouter/failures");
      const data = await res.json();
      setFailures(data);
    } catch (err) {
      console.error("Error fetching failures:", err);
    }
  };

 const fetchMachines = async () => {
  try {
    const res = await fetch("https://machine-backend.azurewebsites.net/ajouter/machines");
    const data = await res.json();
    setMachines(data); // expect [{machine_id, machine_name}]
  } catch (err) {
    console.error("Error fetching machines:", err);
  }
};

useEffect(() => {
  fetchFailures();
  fetchMachines();  // <— add this
}, []);


  // Delete a failure
  const handleDelete = async (failure_id) => {
    if (!window.confirm("Are you sure you want to delete this failure?")) return;
    try {
      await fetch(`https://machine-backend.azurewebsites.net/ajouter/failure/${failure_id}`, {
        method: "DELETE",
      });
      fetchFailures();
    } catch (err) {
      console.error("Error deleting failure:", err);
    }
  };

  // Open edit modal
const openEdit = (failure) => {
  setEditingFailure(failure);
  setFormData({
    machine_id: failure.machine_id ?? "",         // <— add this
    failure_desc: failure.failure_desc,
    solution: failure.solution,
    failure_date: failure.failure_date,
    status: failure.status,
  });
};


  // Submit edit form
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

  // 🆕 Open view details modal
  const openViewDetails = async (failure_id) => {
    setViewingFailure(true);
    setDetailedFailure(null);
    try {
      const res = await fetch(`https://machine-backend.azurewebsites.net/ajouter/failure/${failure_id}`);
      const data = await res.json();
      console.log('ff',data);
      setDetailedFailure(data);
    } catch (err) {
      console.error("Error fetching failure details:", err);
    }
  };

  // Filter logic
  const filteredFailures = failures.filter((f) => {
    const machineName = String(f.machine_name || "").toLowerCase();
    const machineRef = String(f.machine_ref || f.machine_reference || "").toLowerCase();
    const sName = searchMachine.trim().toLowerCase();
    const sRef = searchMachineRef.trim().toLowerCase();
    const matchesName = sName ? machineName.includes(sName) : true;
    const matchesRef = sRef ? machineRef.includes(sRef) : true;
    const matchesMachine = matchesName && matchesRef;

    const failureDate = f.failure_date ? new Date(f.failure_date) : null;
    const withinRange =
      (!startDate || (failureDate && failureDate >= startDate)) &&
      (!endDate || (failureDate && failureDate <= endDate));

    return matchesMachine && withinRange;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Failures List</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by machine name"
          value={searchMachine}
          onChange={(e) => setSearchMachine(e.target.value)}
          className="border px-3 py-2 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Search by machine reference"
          value={searchMachineRef}
          onChange={(e) => setSearchMachineRef(e.target.value)}
          className="border px-3 py-2 rounded w-1/4"
        />
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

      {/* Table */}
      <table className="w-full border border-gray-300 bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Machine Reference</th>
            <th className="p-2 border">Machine Name</th>
            <th className="p-2 border">Root cause</th>
            <th className="p-2 border">Solution</th>
            <th className="p-2 border">Date of ocurence</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredFailures.map((f) => (
            <tr key={f.failure_id} className="text-center hover:bg-gray-50">
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
                  onClick={() => openViewDetails(f.failure_id)}
                  className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                >
                  View
                </button>
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

      {/* 🟣 View Details Modal */}
      {viewingFailure && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[450px]">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Failure Details</h2>

            {!detailedFailure ? (
              <p className="text-gray-500">Loading details...</p>
            ) : (
              <div className="space-y-2 text-gray-700">
                <p><strong>Machine Name:</strong> {detailedFailure.machine_name}</p>
                <p><strong>Machine Reference:</strong> {detailedFailure.machine_ref}</p>
                <p><strong>Failure Description:</strong> {detailedFailure.failure_desc}</p>
                <p><strong>Solution:</strong> {detailedFailure.solution}</p>
                <p><strong>Status:</strong> {detailedFailure.status}</p>
                <p>
                  <strong>Date:</strong>{" "}
                  {detailedFailure.failure_date
                    ? new Date(detailedFailure.failure_date).toLocaleString()
                    : "-"}
                </p>
              </div>
            )}

            <div className="mt-5 text-right">
              <button
                onClick={() => setViewingFailure(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Edit Modal */}
      {editingFailure && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Failure</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">

                      {/* Machine select (by name) */}
        <label className="block text-sm font-medium text-gray-700">Machine</label>
        <select
          value={formData.machine_id}
          onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
          className="w-full border px-3 py-2 rounded"
          required
        >
          <option value="" disabled>Select a machine</option>
          {machines.map((m) => (
            <option key={m.machine_id} value={m.machine_id}>
              {m.machine_name}
            </option>
          ))}
        </select>

  

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
