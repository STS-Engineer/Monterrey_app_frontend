import { useEffect, useState } from "react";
import axios from "axios";

export default function MachineQRCode({ machineId }) {
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!machineId) {
      console.error("No machineId provided to MachineQRCode");
      setError("No machine selected");
      return;
    }

    axios
      .get(`https://machine-backend.azurewebsites.net/ajouter/machines/${machineId}/qrcode`)
      .then((res) => {
        setQrCode(res.data.qrCode);
      })
      .catch((err) => {
        console.error("Error fetching QR code:", err);
        setError("Failed to load QR code");
      });
  }, [machineId]);

  return (
    <div>
      <h2>Machine QR Code</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {qrCode ? (
        <img src={qrCode} alt={`QR Code for machine ${machineId}`} />
      ) : (
        !error && <p>Loading...</p>
      )}
    </div>
  );
}
