import { useState, useEffect } from "react";

const FailuresList = () => {
  const [failures, setFailures] = useState([]);
  const [editingFailure, setEditingFailure] = useState(null);
  const [formData, setFormData] = useState({
    failure_desc: "",
    solution: "",
    failure_date: "",
    status: "Pending",
    resolved_date: "",
  });

  // Fetch failures
  const fetchFailures = async () => {
    try {
      const res = await fetch("https://machine-backend.azurewebsites.net/ajouter/failures");
      const data = await res.json();
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
      resolved_date: failure.resolved_date || "",
    });
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`https://machine-backend.azurewebsites.net/ajouter/failure/${editingFailure.failure_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setEditingFailure(null);
      fetchFailures();
    } catch (err) {
      console.error("Error updating failure:", err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Failures List</h1>
      <table className="w-full border border-gray-300 bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Machine</th>
            <th className="p-2 border">Failure</th>
            <th className="p-2 border">Solution</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {failures.map((f) => (
            <tr key={f.id} className="text-center">
              <td className="p-2 border">{f.machine_name}</td>
              <td className="p-2 border">{f.failure_desc}</td>
              <td className="p-2 border">{f.solution}</td>
              <td className="p-2 border">{new Date(f.failure_date).toLocaleString()}</td>
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
              <input
                type="datetime-local"
                value={formData.resolved_date?.slice(0, 16) || ""}
                onChange={(e) =>
                  setFormData({ ...formData, resolved_date: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />

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
