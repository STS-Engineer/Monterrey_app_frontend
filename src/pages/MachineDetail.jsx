import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function MachineDetail() {
  const { id } = useParams(); // /machines/:id
  const [machine, setMachine] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!id) return;
  console.log("Fetching machine with ID:", id);

  axios
    .get(`https://machine-backend.azurewebsites.net/ajouter/machines/${id}`)
    .then((res) => {
      console.log("Response received:", res.data);
      setMachine(res.data);
      setError(null);
    })
    .catch((err) => {
      console.error("Error fetching machine details:", err);
      setError("Failed to fetch machine details");
    })
    .finally(() => {
      console.log("Request finished");
      setLoading(false);
    });
}, [id]);


  if (loading) return <p>Loading machine details...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!machine) return <p>No machine details available</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Machine Details</h2>
      <p><strong>ID:</strong> {machine.machine_id}</p>
      <p><strong>Name:</strong> {machine.machine_ref}</p>
      <p><strong>Description:</strong> {machine.machine_name}</p>
      <p><strong>Location:</strong> {machine.brand}</p>
    </div>
  );
}
