import React, { useState } from "react";
import './Modal.css'; // Assuming you will create a CSS file for styling.

const EditMachineModal = ({ visible, onClose, onSubmit, formData, setFormData }) => {
  return (
    <div className={`modal ${visible ? "show" : ""}`}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2>Edit Machine</h2>

        <form onSubmit={onSubmit}>
          {/* Upload Section */}
          <div className="form-group">
            <label>Machine Image</label>
            <input type="file" onChange={(e) => handleFileUpload(e)} />
          </div>

          {/* Machine Reference */}
          <div className="form-group">
            <label>Machine Reference</label>
            <input
              type="text"
              name="machine_ref"
              value={formData.machine_ref}
              onChange={(e) => setFormData({ ...formData, machine_ref: e.target.value })}
              placeholder="Enter machine reference"
            />
          </div>

          {/* Other Input Fields */}
          <div className="form-group">
            <label>Machine Name</label>
            <input
              type="text"
              name="machine_name"
              value={formData.machine_name}
              onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
              placeholder="Enter machine name"
            />
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Enter brand"
            />
          </div>

          <div className="form-group">
            <label>Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Enter model"
            />
          </div>

          {/* Add more fields similarly... */}

          <button type="submit">Update</button>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default EditMachineModal;
