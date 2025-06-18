import React, { useEffect, useState } from "react";
import axios from "axios";

const styles = {
  container: {
    padding: 20,
    maxWidth: 900,
    margin: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    borderBottom: "2px solid #ccc",
    padding: 8,
    textAlign: "left",
    backgroundColor: "#f5f5f5",
  },
  td: {
    borderBottom: "1px solid #ddd",
    padding: 8,
  },
  noData: {
    marginTop: 20,
    fontStyle: "italic",
    color: "#666",
  },
};

const AlertTable = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 useEffect(() => {
  axios
    .get("http://localhost:4000/ajouter/alerts")
    .then((res) => {
      console.log("Fetched alerts data:", res.data);  // <-- log data here
      setAlerts(res.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching alerts:", err);  // <-- log error here
      setError("Error fetching alerts");
      setLoading(false);
    });
}, []);


  if (loading) return <div style={{ padding: 20 }}>Loading alerts...</div>;

  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  if (alerts.length === 0)
    return <div style={styles.noData}>No alerts found.</div>;

  return (
    <div style={styles.container}>
      <h2>System Alerts</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Creation Date</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Maintenance ID</th>
            <th style={styles.th}>Task Name</th>
            <th style={styles.th}>Assigned To</th>
            <th style={styles.th}>Creator</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, idx) => (
            <tr key={idx}>
              <td style={styles.td}>
                {new Date(alert.creation_date).toLocaleString()}
              </td>
              <td style={styles.td}>{alert.Type}</td>
              <td style={styles.td}>{alert.maintenance_id}</td>
              <td style={styles.td}>
                {alert.task_name || <em style={{ color: "#999" }}>N/A</em>}
              </td>
              <td style={styles.td}>
                {alert.assigned_to_email || <em style={{ color: "#999" }}>N/A</em>}
              </td>
              <td style={styles.td}>
                {alert.creator_email || <em style={{ color: "#999" }}>N/A</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AlertTable;
