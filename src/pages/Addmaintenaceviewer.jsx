import React from 'react';
import { Alert } from 'antd';

const Addmaintenanceviewer = () => {
  return (
  <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
    <div
      style={{
        backgroundColor: '#fff1f0',
        border: '1px solid #ffa39e',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        fontSize: '16px',
        color: '#cf1322',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        ❌ Access Denied
      </div>
      <div style={{ marginBottom: '4px' }}>
        You don’t have permission to create a task as a viewer account.
      </div>
      <div>
        If this access is required for your role, please contact your manager to request the necessary permissions.
      </div>
    </div>
  </div>
  );
};

export default Addmaintenanceviewer;
