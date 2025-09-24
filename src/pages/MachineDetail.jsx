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

    axios
      .get(`https://machine-backend.azurewebsites.net/ajouter/machines/${id}`)
      .then((res) => {
        console.log("Machine data:", res.data);
        setMachine(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching machine details:", err);
        setError("Failed to fetch machine details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Loading machine details...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!machine) return <p>No machine details available</p>;

  // Helper to safely generate file URLs
  const getFileUrl = (filename) => {
    if (!filename) return null;
    const safePath = filename.split("\\").join("/"); // fix backslashes
    return `https://machine-backend.azurewebsites.net/uploads/${encodeURIComponent(safePath)}`;
  };

  if (!machine) return <p>No machine details available</p>;

// Log the final image URL
console.log("Machine image URL:", getFileUrl(machine.machineimagefile));


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-6 mb-6">
          <img
            src={getFileUrl(machine.machineimagefile) || "https://via.placeholder.com/150"}
            alt={machine.machine_name}
            className="w-32 h-32 object-cover rounded-xl shadow-md border"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{machine.machine_ref}</h2>
            <p className="text-gray-600">{machine.machine_name}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {machine.product_line}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard label="Machine ID" value={machine.machine_id} />
          <InfoCard label="Brand" value={machine.brand} />
          <InfoCard label="Model" value={machine.model} />
          <InfoCard label="Station" value={machine.station} />
          <InfoCard label="Phases" value={machine.phases} />
          <InfoCard label="Voltage" value={`${machine.voltage} V`} />
          <InfoCard label="Amperage" value={`${machine.amperage} A`} />
          <InfoCard label="Frequency" value={`${machine.frequency} Hz`} />
          <InfoCard label="Production Line" value={machine.production_line} />
          <InfoCard label="Production Rate" value={machine.production_rate} />
          <InfoCard label="Fixture Numbers" value={machine.fixture_numbers} />
          <InfoCard label="Tooling Numbers" value={machine.tooling_numbers} />
          <InfoCard label="Gage Numbers" value={machine.gage_numbers} />
          <InfoCard label="Consumables" value={machine.consumables} />
          <InfoCard label="Dust Extraction" value={machine.dust_extraction ? "Yes" : "No"} />
          <InfoCard label="Fume Extraction" value={machine.fume_extraction ? "Yes" : "No"} />
          <InfoCard label="Water Cooling" value={machine.water_cooling ? "Yes" : "No"} />
          <InfoCard
            label="Water Temp"
            value={machine.water_temp ? `${machine.water_temp} ${machine.water_temp_unit || ""}` : "N/A"}
          />
          <InfoCard label="Air Needed" value={machine.air_needed ? "Yes" : "No"} />
          <InfoCard
            label="Air Pressure"
            value={machine.air_pressure ? `${machine.air_pressure} ${machine.air_pressure_unit || ""}` : "N/A"}
          />
        </div>

        {/* Files Section */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileLink label="Machine Manual" file={machine.machine_manual} />
            <FileLink label="Electrical Diagram" file={machine.electrical_diagram} />
            <FileLink label="HMI Program" file={machine.hmi_program} />
            <FileLink label="PLC Program" file={machine.plc_program} />
            <FileLink label="Other Programs" file={machine.other_programs} />
            <FileLink label="Validation Document" file={machine.validation_document} />
            <FileLink label="Parameter Studies" file={machine.parameter_studies} />
            <FileLink label="CPK Data" file={machine.cpk_data} />
            <FileLink label="Files 2D" file={machine.files_2d} />
            <FileLink label="Files 3D" file={machine.files_3d} />
            <FileLink label="Spare Parts List" file={machine.spare_parts_list} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-100 rounded-xl p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-gray-800 font-medium">{value || "N/A"}</p>
    </div>
  );
}

function FileLink({ label, file }) {
  if (!file) return null;

  const safeFile = file.split("\\").join("/"); // fix backslashes
  const fileUrl = `https://machine-backend.azurewebsites.net/uploads/${encodeURIComponent(safeFile)}`;

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border rounded-xl shadow-sm hover:shadow-md transition bg-white"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-blue-600 font-medium truncate">{file}</p>
    </a>
  );
}
