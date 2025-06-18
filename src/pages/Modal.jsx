import React from 'react';
import './Modal.css';

const Modal = ({ show, onClose, onSave, formData, setFormData }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Edit Machine</h2>
        <label>Machine Name</label>
        <input
          type="text"
          value={formData.machine_name}
          onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
        />

        <label>Brand</label>
        <input
          type="text"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
        />

        <label>Model</label>
        <input
          type="text"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
        />

        <div className="modal-buttons">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={onSave} className="save-btn">Save</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
