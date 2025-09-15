import { useEffect, useState } from "react";
import axios from "axios";
import MachineQRCode from "./MachineQRCode";

export default function AllMachinesQR() {
  const [machines, setMachines] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("https://machine-backend.azurewebsites.net/ajouter/machines") // your backend endpoint to fetch all machines
      .then((res) => {
        setMachines(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching machines:", err);
        setError("Failed to fetch machines");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading machines...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Machines QR Codes</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
        {machines.map((machine) => (
          <div
            key={machine.machine_id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <h4>{machine.name}</h4>
            <MachineQRCode machineId={machine.machine_id} />
          </div>
        ))}
      </div>
    </div>
  );
}
