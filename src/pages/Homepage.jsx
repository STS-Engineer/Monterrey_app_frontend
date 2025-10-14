import React, { useState, useEffect, useCallback, useMemo  } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {Layout,  Modal, Steps, Form, Input, Upload, Button, Select, Switch, Row, Col, message, notification  } from "antd";
import { EditOutlined, DeleteOutlined, FileTextOutlined, SettingOutlined, HistoryOutlined, IdcardOutlined, EnvironmentOutlined, ShopOutlined, AppstoreOutlined, CalendarOutlined, ToolOutlined, DashboardOutlined, BarcodeOutlined, UserOutlined, PlusOutlined, EyeOutlined, QrcodeOutlined, PrinterOutlined  } from '@ant-design/icons';
import { 
  SearchOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import TextArea from 'antd/es/input/TextArea';
import { debounce } from 'lodash';
import MachineQRCode from './MachineQRCode'; // Adjust the path as needed

const Homepage = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [machine, setMachine] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [stationCount, setStationCount] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [productIds, setProductIds] = useState([]);
  const [stepValid, setStepValid] = useState(false);
  const [filteredMachines, setFilteredMachines] = useState([]); // Stores filtered results
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();
  const airneededValue = Form.useWatch('air_needed', form);
  const waterCoolingValue = Form.useWatch('water_cooling', form);
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [productOptions, setProductOptions] = useState([]);
  const [modalproductvisible, setModalProducVisible]= useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [formData, setFormData] = useState({
     machine_ref: '',
     machine_name: '',
     brand: '',
     model: '',
     product_line: '',
     production_line: '',
     station: '',
     stationCount: '', // The number of stations, added as a field
     stationNames: [], // Array to store station names
     stationDescriptions: [], // Array to store station descriptions
     stations: [], 
     machineimagefile: [],
     product_id: [],
     product_reference: '',
     product_name: '',
     air_needed: '',
     air_pressure: '',
     air_pressure_unit: '',
     voltage: '',
     consumables: '',
     machine_manual: [],
     phases: '',
     amperage: '',   // Add stationCount to formData
     frequency: '',
     water_cooling: '',
     water_temp: '',
     water_temp_unit: '',
     dust_extraction: '',   // Add stationCount to formData
     fume_extraction: '',
     fixture_number: '',  // Added
     gage_number: '',    // Added
     tooling_number: '',  // Added
     files_3d: [],        // Added for file uploadsdocu
     files_2d: [],        // Added for file uploads
     spare_parts_list: [],
     other_programs: [],// Added for file uploads
     electrical_diagram: [], // Added for file uploads
     plc_program: [],     // Added for file uploads
     hmi_program: [],
     cpk_data: [],
     validation_document: [],

          // Added for file uploads
   });
  const [airNeeded, setAirNeeded] = useState();
  const [watercooling, setWatercooling] = useState();
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [modificationHistory, setModificationHistory] = useState([]);
  const [stepValidity, setStepValidity] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
  });
  const [selectedMachineId, setSelectedMachineId]= useState(null);
    // Add QR code modal state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQrMachine, setCurrentQrMachine] = useState(null);
  // Inside your component
  const [formValues, setFormValues] = useState({}); // State to persist form values
  const user_id = localStorage.getItem('user_id');
  const machinesPerPage = 12; // Fetch 4 cards per page

 const BASE_FILE_URL = 'https://machine-backend.azurewebsites.net/uploads/'; // replace with your actual backend URL

const fileLinks = [
  { label: '3D Files', key: 'files_3d' },
  { label: '2D Files', key: 'files_2d' },
  { label: 'Spare Parts List', key: 'spare_parts_list' },
  { label: 'Other Programs', key: 'other_programs' },
  { label: 'PLC Program', key: 'plc_program' },
  { label: 'HMI Program', key: 'hmi_program' },
  { label: 'electrical_diagram', key: 'electrical_diagram' },
  { label: 'machine_manual', key: 'machine_manual' },
  { label: 'cpk_data', key: 'cpk_data' },
  { label: 'validation_document', key: 'validation_document' },
  { label: 'parameter_studies', key: 'parameter_studies'}
];


const textFields = [
  { label: 'Consumables', key: 'consumables' },
  { label: 'Fixture Numbers', key: 'fixture_numbers' },
  { label: 'Gage Numbers', key: 'gage_numbers' },
  { label: 'Tooling Numbers', key: 'tooling_numbers' }
];
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await axios.get("https://machine-backend.azurewebsites.net/ajouter/machines");
        const validatedData = response.data.map(machine => ({
          ...machine,
          machine_ref: String(machine.machine_ref || '') // Ensure string type
        }));
        setMachines(validatedData);
        setFilteredMachines(validatedData);
      } catch (error) {
        console.error("Error fetching machines:", error);
      }
    };
    fetchMachines();
  }, []);

  useEffect(() => {
  if (selectedMachineId) {
    fetch(`https://machine-backend.azurewebsites.net/ajouter/maintenance/history/${selectedMachineId}`)
      .then(res => res.json())
      .then(data => {
        console.log('Fetched maintenance history:', data);
        setMachine(prev => ({ ...prev, maintenance_history: data }));
      })
      .catch(err => console.error('Error fetching history', err));
  }
}, [selectedMachineId]);

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [formData]);
  


  useEffect(() => {
    // Fetch products when the component mounts
    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://machine-backend.azurewebsites.net/ajouter/products');
        setProducts(response.data);
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const convertToFileList = (fileData) => {
    if (!fileData) return [];
    if (!Array.isArray(fileData)) fileData = [fileData];
  
    return fileData.map((file, index) => ({
      uid: `${index}`,
      name: file.name || getFileName(file),
      status: 'done',
      url: typeof file === 'string' ? file : file.url || '', // adjust based on backend
    }));
  };
  
  const getFileName = (url) => {
    try {
      return url.split('/').pop();
    } catch {
      return 'file';
    }
  };
  

// Add this effect to validate current step
useEffect(() => {
  const validateStep = async () => {
    try {
      await form.validateFields(stepValidations[currentStep]);
      setStepValid(true);
    } catch (err) {
      setStepValid(false);
    }
  };
  
  validateStep();
}, [currentStep, form, form.getFieldsValue()]);

useEffect(() => {
  if (modalproductvisible) {
    form.setFieldsValue({
      product_id: '', // Reset input field
      product_description: '' // Reset text area
    });
  }
}, [modalproductvisible]);



const debouncedStationChange = useMemo(() => 
  debounce((value) => {
    handleStationChange(value);
  }, 700), []); // 700ms delay after typing stops




  const onUpdate = async (updatedMachine) => {
    try {
      const formData = new FormData();
  
      // Append text fields
      for (const key in updatedMachine) {
        if (
          key !== "machineimagefile" &&
          key !== "files_3d" &&
          key !== "files_2d" &&
          key !== "spare_parts_list" &&
          key !== "plc_program" &&
          key !== "hmi_program" &&
          key !== "other_programs" &&
          key !== "machine_manual"
        ) {
          formData.append(key, updatedMachine[key]);
        }
      }
  
      // Append files (only first file if you follow your backend logic)
      const fileFields = [
        "machineimagefile",
        "files_3d",
        "files_2d",
        "spare_parts_list",
        "plc_program",
        "hmi_program",
        "other_programs",
        "machine_manual"
      ];
  
      fileFields.forEach(field => {
        if (updatedMachine[field] && updatedMachine[field][0]) {
          formData.append(field, updatedMachine[field][0]);
        }
      });
  
      const response = await axios.put(
        `https://machine-backend.azurewebsites.net/ajouter/machines/${updatedMachine.machine_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
  
      const updated = response.data;
      message.success("Machine updated successfully");
      return updated;
    } catch (error) {
      console.error("Update failed:", error);
      message.error("Failed to update machine");
      return null;
    }
  };

  const handleStationOk = async () => {
    try {
      // Step 1: Validate form values and extract stations
      const values = await form.validateFields();
      const rawStations = values.stations || [];
  
      const stations = rawStations
        .filter(s => s.station?.trim())
        .map(s => ({
          id: s.id,  // Assuming id is included for updating
          station: s.station.trim(),
          description: s.description?.trim() || "",
          machine_id: selectedMachineId,
          user_id: user_id,
        }));
  
      console.log("🚀 Extracted Stations:", stations);
  
      // Step 2: Fetch existing stations for comparison
      const stationFetchRes = await fetch(`https://machine-backend.azurewebsites.net/ajouter/stations/${selectedMachineId}`);
      const existingStations = await stationFetchRes.json();
      console.log("Existing Stations from DB:", existingStations);
  
      // Step 3: Identify new and existing stations
      const existingStationIds = existingStations.map(s => s.id);
      const newStationIds = stations.map(s => s.id).filter(id => !!id);  // Filter only stations with ID
  
      // Determine stations to delete (existing but not in the new list)
      const toDelete = existingStations.filter(existing => !newStationIds.includes(existing.id));
  
      // Determine stations to add (new stations without an ID)
      const toAdd = stations.filter(s => !s.id);  // Stations without an ID are new
  
      // Step 4: Perform deletions for stations that no longer exist
      await Promise.all(toDelete.map(async (station) => {
        const deleteRes = await fetch(`https://machine-backend.azurewebsites.net/ajouter/stations/${station.id}`, {
          method: 'DELETE',
        });
        if (!deleteRes.ok) throw new Error(`Failed to delete station ${station.id}`);
        console.log(`Deleted station ${station.id}`);
      }));
  
      // Step 5: Add new stations that do not have IDs
      await Promise.all(toAdd.map(async (station) => {
        const res = await fetch(`https://machine-backend.azurewebsites.net/ajouter/stations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...station, machine_id: selectedMachineId, user_id: user_id }),
        });
        if (!res.ok) throw new Error(`Failed to add new station`);
        console.log("Added new station:", station);
      }));

// Step 6: Update existing stations
const toUpdate = stations.filter(s => s.id);  // Existing stations with an ID

await Promise.all(toUpdate.map(async (station) => {
  const res = await fetch(`https://machine-backend.azurewebsites.net/ajouter/stations/${station.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      station: station.station,
      description: station.description,
      machine_id: selectedMachineId,
      user_id: user_id,
    }),
  });

  if (!res.ok) throw new Error(`Failed to update station ${station.id}`);
  console.log("Updated station:", station);
   }));


  
      // Close modal and display success message
      setModalVisible(false);
      message.success('Stations updated successfully!');
  
    } catch (error) {
      console.error("Error:", error);
      message.error(error.message || 'Update failed');
    }
  };
  
  
  const handleNext = async () => {
    try {
      // Validate fields in the current step
      const values = await form.validateFields();
      // Merge with existing formValues
      setFormValues(prev => ({
        ...prev,
        ...values,
      }));
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Please fill in all required fields.');
    }
  };
  
  const handleProductChange = (selectedProductIds) => {
    // Convert string values to numbers
    const numericIds = selectedProductIds.map(id => Number(id));
    
    setFormData(prev => ({
      ...prev,
      product_id: numericIds
    }));
  };
  // Handle dstation details description
  const handleStationChange = (value) => {
    const count = parseInt(value, 10);
    if (isNaN(count) || count < 0) return;
  
    setStationCount(count);
  
    // Get the current stations array (may be undefined on first load)
    const existing = form.getFieldValue('stations') || [];
  
    // Build a new array of length `count`, reusing existing entries when possible
    const merged = Array.from({ length: count }, (_, i) => {
      if (existing[i]) {
        // keep the existing station & description & id
        return existing[i];
      } else {
        // new blank row
        return { id: null, station: '', description: '' };
      }
    });
  setModalVisible(true);
    // Update the form with the merged array
    form.setFieldsValue({ stations: merged });
  };
  
  

  const handleEyeClick = () => {
    setModalVisible(true); // Open modal with previous values when clicking the eye icon
  };

    const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleUpdate = async (machineId) => {
    try {
      // Step 1: Validate form values and prepare data
      const finalStepValues = await form.validateFields();
      const values = {
        ...formValues,
        ...finalStepValues,
      };
  
      // Step 2: Prepare form data for update
      const formPayload = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formPayload.append(`${key}[]`, item));
        } else if (value !== undefined && value !== null) {
          formPayload.append(key, value);
        }
      });
  
      // Step 3: Prepare file fields (if any)
      const fileFields = ['machineimagefile', 'files_3d', 'files_2d', 'spare_parts_list', 'plc_program'];
      fileFields.forEach(field => {
        const files = formData[field] || [];
        files.forEach(file => {
          const realFile = file.originFileObj || null;
          if (realFile instanceof File) {
            formPayload.append(field, realFile);
          }
        });
      });
  
      const userId = localStorage.getItem('user_id');
      if (userId) formPayload.append('user_id', userId);
  
      // Step 4: Send update request to the backend
      const response = await fetch(`https://machine-backend.azurewebsites.net/ajouter/machines/${machineId}`, {
        method: 'PUT',
        body: formPayload,
      });
  
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Update failed: ${errText}`);
      }
  
      const updatedMachine = await response.json();
      console.log("Machine updated successfully:", updatedMachine);
  
      // Step 5: Fetch existing machine products
      const existingProductsRes = await fetch(`https://machine-backend.azurewebsites.net/ajouter/machineproducts/${machineId}`);
      const existingProductData = await existingProductsRes.json();
      console.log("Existing products for this machine:", existingProductData);
  
      if (!Array.isArray(existingProductData)) {
        console.error("❌ Invalid machineProduct data:", existingProductData);
        message.error("Failed to fetch machine-product data.");
        return;
      }
  
      // Step 6: Clean existing product IDs
      const cleanedExistingProductIds = [...new Set(existingProductData.filter(id => id && id.trim() !== ''))];
      console.log("Cleaned Existing product IDs:", cleanedExistingProductIds);
  
      // Step 7: Validate selected product IDs
      const selectedProductIds = values.product_id
        .filter(id => id && id.trim() !== '')
        .map(id => id.trim());
      console.log("Selected product IDs:", selectedProductIds);
  
      // Step 8: Determine which products need to be deleted
      const toDelete = cleanedExistingProductIds.filter(id => !selectedProductIds.includes(id));
      console.log("Products to delete:", toDelete);
  
      // Step 9: Delete products that are no longer selected
      await Promise.all(toDelete.map(async (productId) => {
        const deleteResponse = await fetch(`https://machine-backend.azurewebsites.net/ajouter/machineproducts`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machine_id: machineId, product_id: productId, user_id: userId }),
        });
  
        if (!deleteResponse.ok) {
          throw new Error(`Failed to delete product with ID: ${productId}`);
        }
        console.log(`Deleted product with ID: ${productId}`);
      }));
  
      // Step 10: Add new products
      const toAdd = selectedProductIds.filter(id => !cleanedExistingProductIds.includes(id));
      console.log("Products to add:", toAdd);
  
      await Promise.all(toAdd.map(async (productId) => {
        const addResponse = await fetch(`https://machine-backend.azurewebsites.net/ajouter/machineproducts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machine_id: machineId, product_id: productId, user_id: userId }),
        });
  
        if (!addResponse.ok) {
          throw new Error(`Failed to add product with ID: ${productId}`);
        }
        console.log(`Added product with ID: ${productId}`);
      }));
  

  
      // ✅ Refetch machines
      const fetchResponse = await fetch("https://machine-backend.azurewebsites.net/ajouter/machines");
      const fetchedMachines = await fetchResponse.json();
  
      const validatedData = fetchedMachines.map(machine => ({
        ...machine,
        machine_ref: String(machine.machine_ref || '')
      }));
  
      setMachines(validatedData);
      setFilteredMachines(validatedData);
  
      setVisible(false);
       
         // ✅ Show the custom success message
         setShowSuccessMsg(true);
        
         // Auto-hide it after 4 seconds
           // ⏳ Wait 5 seconds, then hide message and navigate
         setTimeout(() => {
         setShowSuccessMsg(false);
         navigate('/machinelist');
         }, 2000);



      // Set form state if updated machine is selected
      if (selectedMachineId === updatedMachine.machine_id) {
        form.setFieldsValue({ ...updatedMachine });
        setFormValues(updatedMachine);
      }

       
    } catch (error) {
      console.error('❌ Update error:', error);
      message.error(error.message || 'Update failed');
    }
  };

const downloadQRCode = () => {
  if (!currentQrMachine) return;

  // Get the QR code canvas from your MachineQRCode component
  const canvas = document.querySelector("#qrcode-canvas canvas");
  
  if (canvas) {
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `machine-${currentQrMachine.machine_ref}-qrcode.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } else {
    // Fallback if canvas not found
    message.error('QR code not ready for download');
  }
};

const handlePrintQRCode = () => {
  console.log('🖨️ Print QR Code button clicked');
  
  if (!currentQrMachine) {
    message.error('No machine selected');
    return;
  }

  // Create the URL that the QR code should redirect to
  const machineUrl = `https://machinery-system.azurewebsites.net/machine/${currentQrMachine.machine_id}`;

  // Use a QR code generator API with the correct URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(machineUrl)}`;

  // Get machine image URL
  const machineImageUrl = currentQrMachine.machineimagefile 
    ? `http://localhost:4000/uploads/${currentQrMachine.machineimagefile}`
    : null;

  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  
  if (!printWindow) {
    message.error('Popup blocked! Please allow popups for this site and try again.');
    return;
  }

  // Format boolean values for display
  const formatBoolean = (value) => {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return 'N/A';
  };

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Machine Details - ${currentQrMachine.machine_name}</title>
      <style>
        body {
          margin: 0;
          padding: 30px;
          background: white;
          font-family: Arial, sans-serif;
          color: #333;
        }
        .print-container {
          max-width: 700px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
          gap: 30px;
        }
        .machine-image {
          width: 200px;
          height: 150px;
          object-fit: cover;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: #f8f9fa;
        }
        .placeholder-image {
          width: 200px;
          height: 150px;
          background: #f8f9fa;
          border: 2px dashed #ddd;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 14px;
        }
        .header-info {
          flex: 1;
        }
        .header h1 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 24px;
        }
        .header .ref {
          font-size: 18px;
          color: #666;
          font-weight: bold;
        }
        .content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          margin: 0 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #ddd;
          color: #333;
          font-size: 16px;
        }
        .info-grid {
          display: grid;
          gap: 8px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }
        .info-label {
          font-weight: bold;
          color: #555;
        }
        .info-value {
          color: #333;
          text-align: right;
        }
        .qr-section {
          grid-column: 1 / -1;
          text-align: center;
          margin: 20px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .qr-image {
          width: 250px;
          height: 250px;
          border: 2px solid #333;
          border-radius: 8px;
          padding: 10px;
          background: white;
        }
        .instructions {
          margin-top: 15px;
          color: #666;
          font-style: italic;
        }
        .url-info {
          margin-top: 10px;
          font-size: 12px;
          color: #888;
          word-break: break-all;
          max-width: 400px;
        }
        .no-print {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
        button {
          padding: 10px 20px;
          margin: 5px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .print-btn {
          background: #1890ff;
          color: white;
        }
        .close-btn {
          background: #6c757d;
          color: white;
        }
        @media print {
          body { 
            margin: 0 !important;
            padding: 15px !important;
          }
          .no-print { 
            display: none !important; 
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <!-- Header with Machine Image -->
        <div class="header">
          ${machineImageUrl ? 
            `<img src="${machineImageUrl}" alt="${currentQrMachine.machine_name}" class="machine-image" 
                 onerror="this.parentNode.innerHTML = '<div class=\\'placeholder-image\\'>No Image Available</div>' + this.parentNode.innerHTML" />` : 
            `<div class="placeholder-image">No Image Available</div>`
          }
          <div class="header-info">
            <h1>${currentQrMachine.machine_name || 'Machine Details'}</h1>
            <div class="ref">Reference: ${currentQrMachine.machine_ref || 'N/A'}</div>
            ${currentQrMachine.status ? `<div style="margin-top: 5px; color: #666;">Status: ${currentQrMachine.status}</div>` : ''}
          </div>
        </div>

        <!-- Main Content -->
        <div class="content">
          <!-- Machine Identification -->
          <div class="section">
            <h3>Machine Identification</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Brand:</span>
                <span class="info-value">${currentQrMachine.brand || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Model:</span>
                <span class="info-value">${currentQrMachine.model || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Product Line:</span>
                <span class="info-value">${currentQrMachine.product_line || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Production Line:</span>
                <span class="info-value">${currentQrMachine.production_line || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Machine ID:</span>
                <span class="info-value">${currentQrMachine.machine_id || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- Technical Specifications -->
          <div class="section">
            <h3>Technical Specifications</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Production Rate:</span>
                <span class="info-value">${currentQrMachine.production_rate || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Voltage:</span>
                <span class="info-value">${currentQrMachine.voltage || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phases:</span>
                <span class="info-value">${currentQrMachine.phases || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Amperage:</span>
                <span class="info-value">${currentQrMachine.amperage || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Frequency:</span>
                <span class="info-value">${currentQrMachine.frequency || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- Facility Requirements -->
          <div class="section">
            <h3>Facility Requirements</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Air Needed:</span>
                <span class="info-value">${formatBoolean(currentQrMachine.air_needed)}</span>
              </div>
              ${currentQrMachine.air_needed ? `
                <div class="info-item">
                  <span class="info-label">Air Pressure:</span>
                  <span class="info-value">${currentQrMachine.air_pressure || 'N/A'} ${currentQrMachine.air_pressure_unit || ''}</span>
                </div>
              ` : ''}
              <div class="info-item">
                <span class="info-label">Water Cooling:</span>
                <span class="info-value">${formatBoolean(currentQrMachine.water_cooling)}</span>
              </div>
              ${currentQrMachine.water_cooling ? `
                <div class="info-item">
                  <span class="info-label">Water Temp:</span>
                  <span class="info-value">${currentQrMachine.water_temp || 'N/A'} ${currentQrMachine.water_temp_unit || ''}</span>
                </div>
              ` : ''}
              <div class="info-item">
                <span class="info-label">Dust Extraction:</span>
                <span class="info-value">${formatBoolean(currentQrMachine.dust_extraction)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fume Extraction:</span>
                <span class="info-value">${formatBoolean(currentQrMachine.fume_extraction)}</span>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="section">
            <h3>Additional Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Consumables:</span>
                <span class="info-value">${currentQrMachine.consumables || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fixture Numbers:</span>
                <span class="info-value">${currentQrMachine.fixture_numbers || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Gage Numbers:</span>
                <span class="info-value">${currentQrMachine.gage_numbers || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tooling Numbers:</span>
                <span class="info-value">${currentQrMachine.tooling_numbers || 'N/A'}</span>
              </div>
            </div>
          </div>

          <!-- QR Code Section -->
          <div class="qr-section">
            <h3>Quick Access QR Code</h3>
            <img src="${qrCodeUrl}" alt="QR Code for ${currentQrMachine.machine_name}" class="qr-image" 
                 onerror="this.src='https://via.placeholder.com/250x250/ffffff/000000?text=QR+Error'" />
            <p class="instructions">Scan this QR code to view complete machine details online</p>
            <p class="url-info">
              <strong>URL:</strong> ${machineUrl}
            </p>
          </div>
        </div>

        <!-- Footer with timestamp -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </div>

        <!-- Print Buttons -->
        <div class="no-print">
          <button class="print-btn" onclick="window.print()">Print Document</button>
          <button class="close-btn" onclick="window.close()">Close Window</button>
        </div>
      </div>

      <script>
        // Auto-print after images load
        let imagesLoaded = 0;
        const totalImages = ${machineImageUrl ? 2 : 1}; // QR code + machine image (if exists)
        
        function checkAllImagesLoaded() {
          imagesLoaded++;
          if (imagesLoaded >= totalImages) {
            console.log('All images loaded successfully');
            setTimeout(() => {
              window.print();
            }, 1000);
          }
        }
        
        // Wait for QR code image to load
        const qrImage = document.querySelector('.qr-image');
        qrImage.onload = checkAllImagesLoaded;
        qrImage.onerror = function() {
          console.error('Failed to load QR image');
          checkAllImagesLoaded(); // Continue even if QR fails
        };
        
        // Wait for machine image to load (if exists)
        ${machineImageUrl ? `
          const machineImg = document.querySelector('.machine-image');
          if (machineImg) {
            machineImg.onload = checkAllImagesLoaded;
            machineImg.onerror = function() {
              console.error('Failed to load machine image');
              checkAllImagesLoaded(); // Continue even if machine image fails
            };
          }
        ` : 'checkAllImagesLoaded();'} // If no machine image, start counting from 1
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  
  console.log('Print window opened with machine image and complete details');
};
  
  const fetchStationsByMachineId = async (machineId) => {
    try {
      const res = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/stations/${machineId}`);
      const stations = res.data;
      console.log('stationiddd', stations);
  
      setStationCount(stations.length); // dynamically generate that many forms
  
      // Prefill the form
      form.setFieldsValue({
        stations: stations.map((s) => ({
          id: s.id,
          station: s.station,
          description: s.description,
        })),
      });
  
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };
  
  const handleProductOk = async () => {
    try {
      const values = await form.validateFields();
      const userId = localStorage.getItem('user_id');
      const parsedUserId = parseInt(userId, 10);
  
      // ... existing validation code ...
  
      const response = await axios.post('https://machine-backend.azurewebsites.net/ajouter/Products', {
        ...values,
        user_id: parsedUserId,
      });
  
      message.success('Product added successfully!');
      
      // Update products state with new product
      setProducts(prev => [
        ...prev, 
        {
          ...response.data.product,
          // Ensure ID is string to match Select expectations
          product_id: response.data.product.product_id.toString()
        }
      ]);
  
      // Clear ONLY the products selection
      form.setFieldsValue({
        product_id: [] // Reset to empty array
      });
  
      setModalProducVisible(false);
  
    } catch (error) {
      console.error('Error adding product:', error);
      message.error('Failed to add product!');
    }
  };
  

  
  const fetchMachineDetails = async (machineId) => {
    try {
      const response = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/machines/${machineId}`);
      const data = response.data;

      console.log('data', data);
  
      // 2. Fetch only product_ids
      const productRes = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/machines/${machineId}/product-ids`);
      const selectedProductIds = productRes.data.product_ids;
  
      // Optional: fetch all product options for the dropdown
      const allProductsRes = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/products`);
      const productOptions = allProductsRes.data.map(product => ({
        label: product.product_description,
        value: product.product_id,
      }));
      setProductOptions(productOptions);
  
      const updatedFormData = {
        ...data,
        dust_extraction: data.dust_extraction ? 'Yes' : 'No',
        fume_extraction: data.fume_extraction ? 'Yes' : 'No',
        product_id: selectedProductIds,
        machineimagefile: data.machineimagefile
          ? [{ uid: '-1', name: data.machineimagefile, url: `https://machine-backend.azurewebsites.net/uploads/${data.machineimagefile}` }]
          : [],
        machine_manual: data.machine_manual
          ? [{ uid: '-2', name: data.machine_manual, url: `https://machine-backend.azurewebsites.net/uploads/${data.machine_manual}` }]
          : [],
        files_3d: data.files_3d
          ? [{ uid: '-3', name: data.files_3d, url: `https://machine-backend.azurewebsites.net/uploads/${data.files_3d}` }]
          : [],
        files_2d: data.files_2d
          ? [{ uid: '-4', name: data.files_2d, url: `https://machine-backend.azurewebsites.net/uploads/${data.files_2d}` }]
          : [],
        spare_parts_list: data.spare_parts_list
          ? [{ uid: '-5', name: data.spare_parts_list, url: `https://machine-backend.azurewebsites.net/uploads/${data.spare_parts_list}` }]
          : [],
        other_programs: data.other_programs
          ? [{ uid: '-6', name: data.other_programs, url: `https://machine-backend.azurewebsites.net/uploads/${data.other_programs}` }]
          : [],
        electrical_diagram: data.electrical_diagram
          ? [{ uid: '-7', name: data.electrical_diagram, url: `https://machine-backend.azurewebsites.net/uploads/${data.electrical_diagram}` }]
          : [],
        plc_program: data.plc_program
          ? [{ uid: '-8', name: data.plc_program, url: `https://machine-backend.azurewebsites.net/uploads/${data.plc_program}` }]
          : [],
        hmi_program: data.hmi_program
          ? [{ uid: '-9', name: data.hmi_program, url: `https://machine-backend.azurewebsites.net/uploads/${data.hmi_program}` }]
          : [],
        cpk_data: data.cpk_data
          ? [{ uid: '-10', name: data.cpk_data, url: `https://machine-backend.azurewebsites.net/uploads/${data.cpk_data}` }]
          : [],
        validation_document: data.validation_document
          ? [{ uid: '-11', name: data.validation_document, url: `https://machine-backend.azurewebsites.net/uploads/${data.validation_document}` }]
          : [],
      };
  
      // Update form state
      setFormData(updatedFormData);
      form.setFieldsValue(updatedFormData); // ✅ explicitly update form fields
      await fetchStationsByMachineId(machineId); // ⬅️ Call this here
      setSelectedMachineId(machineId);
       // Fetch maintenance history
      const historyResponse = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${machineId}/history`);
      setModificationHistory(historyResponse.data);
      setLoadingHistory(false);
      setVisible(true);

      // 👇 FORCING FIELD SYNC IMMEDIATELY
      setTimeout(() => {
      form.setFieldsValue(updatedFormData);
      }, 100); // short delay ensures modal is mounted

    } catch (error) {
      console.error("Error fetching machine details:", error);
    }
  };
  

  const steps = [
    { title: 'Machine Identification' },
    { title: 'Facility Requirements' },
    { title: 'Documents & Manuals' },
    { title: 'Validation & Specifications' },
  ];

  const handleFileUpload = (field) => ({ fileList }) => {
    // Explicitly validate and sanitize fileList
    let sanitizedFileList = [];
    if (Array.isArray(fileList)) {
      sanitizedFileList = fileList.filter(
        (file) => file && typeof file === 'object'
      );
    }
  
    // Force array type to prevent any edge cases
    if (!Array.isArray(sanitizedFileList)) {
      console.error('Sanitized fileList is not an array:', sanitizedFileList);
      sanitizedFileList = [];
    }
  
    setFormData((prev) => ({
      ...prev,
      [field]: sanitizedFileList,
    }));
    
    form.setFieldsValue({ [field]: sanitizedFileList });
  };
  
const showModal = async (machine) => {
  try {
    const response = await axios.get(
      `https://machine-backend.azurewebsites.net/ajouter/machineproducts/${machine.machine_id}`
    );

    // Validate and process string IDs
    const processedProductIds = (Array.isArray(response.data) ? response.data : [])
      .map(id => {
        const stringId = typeof id === 'string' ? id : String(id);
        return stringId.trim().replace(/\s+/g, ' ');
      })
      .filter(id => id && id.length > 0 && id !== 'null');

    console.log('Processed string product IDs:', processedProductIds);
    
    // ✅ Fetch maintenance history
    const historyRes = await axios.get(
      `https://machine-backend.azurewebsites.net/ajouter/maintenance/${machine.machine_id}/history`
    );
    const maintenanceHistory = historyRes.data || [];

    console.log('Maintenance history:', maintenanceHistory);
    
    // Set productIds in state
    setProductIds(processedProductIds);

    // ✅ Create complete machine object with ALL data including maintenance history
    const updatedMachine = {
      ...machine,
      product_id: processedProductIds,
      maintenance_history: maintenanceHistory // Add maintenance history here
    };

    setSelectedMachine(updatedMachine);
    setIsModalVisible(true);
  } catch (error) {
    console.error('Failed to process string product IDs:', {
      error: error.response?.data || error.message,
      machineId: machine?.machine_id,
      rawData: error.response?.data,
    });

    notification.error({
      message: 'Product ID Error',
      description: `Error processing product IDs for machine ${machine.machine_id}: ${
        error.response?.data?.message || 'Invalid string format in product IDs'
      }`,
    });
  }
};
  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedMachine(null);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const { Header, Sider, Content } = Layout;

const Card = ({ machine, onDelete, onUpdate }) => {
  const navigate = useNavigate();

  // States
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
  const [updatedMachine, setUpdatedMachine] = useState(machine);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQrMachine, setCurrentQrMachine] = useState(null);

  // QR Modal handlers
  const handleQrCodeClick = (e) => {
    e.stopPropagation();
    setCurrentQrMachine(machine);
    setQrModalVisible(true);
  };

  const handleQrModalClose = () => {
    setQrModalVisible(false);
    setCurrentQrMachine(null);
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qrcode-canvas");
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `machine-${machine.machine_ref}-qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  // Delete handlers
  const handleDeleteCancel = () => setDeleteModalVisible(false);

  // Update handlers
  const handleUpdateCancel = () => setUpdateModalVisible(false);

  const handleUpdateSubmit = () => {
    onUpdate(updatedMachine);
    setUpdateModalVisible(false);
  };

  const handleInputChange = useCallback(
    debounce((e) => {
      const { name, value } = e.target;
      setUpdatedMachine((prev) => ({
        ...prev,
        [name]: value,
      }));
    }, 300),
    []
  );

  // Card click
  const handleCardClick = () => {
    // open machine details modal (if you have it elsewhere)
  };

  return (
    <div
      className="card"
      onClick={handleCardClick}
      style={{ marginTop: "10px", marginBottom: "10px" }}
    >
      <div
        className="card-content"
        style={{ textAlign: "center", padding: "20px" }}
      >
        {/* Machine Image */}
        <div className="card-image" style={{ marginBottom: "20px" }}>
          <img
            src={
              machine.machineimagefile
                ? `https://machine-backend.azurewebsites.net/uploads/${machine.machineimagefile}`
                : "/fallback-image.jpg"
            }
            alt={machine.machine_name || "Machine"}
            onError={(e) => (e.target.src = "/fallback-image.jpg")}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        {/* Title */}
        <h3
          style={{
            color: "#2c3e50",
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          {machine.machine_name || "Unknown Machine"}
        </h3>

        {/* Machine Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            textAlign: "left",
            maxWidth: "400px",
            margin: "auto",
          }}
        >
          <p>
            <strong>Machine Reference:</strong> {machine.machine_ref || "N/A"}
          </p>
          <p>
            <strong>Brand:</strong> {machine.brand || "N/A"}
          </p>
          <p>
            <strong>Model:</strong> {machine.model || "N/A"}
          </p>
          <p>
            <strong>Product Line:</strong> {machine.product_line || "N/A"}
          </p>
          <p>
            <strong>Production Line:</strong> {machine.production_line || "N/A"}
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            marginTop: "15px",
            display: "flex",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <Button
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setUpdateModalVisible(true);
            }}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModalVisible(true);
            }}
          />
        </div>

        

        {/* Delete Modal */}
        <Modal
          title="Confirm Deletion"
          open={isDeleteModalVisible}
          onOk={onDelete}
          onCancel={handleDeleteCancel}
          okText="Yes, Delete"
          cancelText="Cancel"
        >
          <p>Are you sure you want to delete this machine?</p>
        </Modal>

        {/* Update Modal */}
        <Modal
          title="Update Machine"
          open={isUpdateModalVisible}
          onOk={handleUpdateSubmit}
          onCancel={handleUpdateCancel}
          okText="Update"
          cancelText="Cancel"
        >
          <div>
            <label>Machine Name:</label>
            <Input
              name="machine_name"
              defaultValue={updatedMachine.machine_name}
              onChange={handleInputChange}
              style={{ marginBottom: "10px" }}
            />
            <label>Brand:</label>
            <Input
              name="brand"
              defaultValue={updatedMachine.brand}
              onChange={handleInputChange}
              style={{ marginBottom: "10px" }}
            />
            <label>Model:</label>
            <Input
              name="model"
              defaultValue={updatedMachine.model}
              onChange={handleInputChange}
              style={{ marginBottom: "10px" }}
            />
            <label>Product Line:</label>
            <Input
              name="product_line"
              defaultValue={updatedMachine.product_line}
              onChange={handleInputChange}
              style={{ marginBottom: "10px" }}
            />
            <label>Production Line:</label>
            <Input
              name="production_line"
              defaultValue={updatedMachine.production_line}
              onChange={handleInputChange}
              style={{ marginBottom: "10px" }}
            />
          </div>
        </Modal>

        {/* QR Code Modal */}
        <Modal
          title={`QR Code - ${currentQrMachine?.machine_name || "Machine"}`}
          open={qrModalVisible}
          onCancel={handleQrModalClose}
          footer={[
            <Button key="close" onClick={handleQrModalClose}>
              Close
            </Button>,
          ]}
          width={400}
        >
          {currentQrMachine && (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div
                style={{
                  marginBottom: "20px",
                  padding: "10px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                }}
              >
                <p style={{ margin: 0, fontWeight: "bold" }}>
                  Machine Reference: {currentQrMachine.machine_ref}
                </p>
                <p style={{ margin: 0 }}>{currentQrMachine.machine_name}</p>
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "20px",
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <QRCode
                  id="qrcode-canvas"
                  value={JSON.stringify({
                    machine_id: currentQrMachine.machine_id,
                    machine_ref: currentQrMachine.machine_ref,
                    machine_name: currentQrMachine.machine_name,
                    brand: currentQrMachine.brand,
                    model: currentQrMachine.model,
                    type: "machine",
                  })}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>

              <p
                style={{
                  marginTop: "15px",
                  color: "#666",
                  fontSize: "14px",
                }}
              >
                Scan this QR code to view machine details
              </p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};
  
  const indexOfLastMachine = currentPage * machinesPerPage;
  const indexOfFirstMachine = indexOfLastMachine - machinesPerPage;
  const currentMachines = filteredMachines.slice(indexOfFirstMachine, indexOfLastMachine);
  const totalPages = Math.max(1, Math.ceil(filteredMachines.length / machinesPerPage));
  const DetailItem = ({ label, value, icon }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      {icon && <span style={{ color: '#6366f1' }}>{icon}</span>}
      <div>
        <p style={{ 
          margin: 0, 
          fontSize: '12px', 
          color: '#64748b',
          marginBottom: '4px'
        }}>{label}</p>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: 500,
          color: '#334155'
        }}>{value}</p>
      </div>
    </div>
  );

  const handleDelete = async (machineId) => {
    // Ask the user for confirmation before deleting
    const isConfirmed = window.confirm('Are you sure you want to delete this machine?');
    
    if (isConfirmed) {
      // Get user_id from localStorage
      const userId = localStorage.getItem('user_id');
      
      // Check if user_id exists
      if (!userId) {
        alert('User not logged in or user_id not found');
        return;
      }
      
      try {
        // Make the delete request to the backend, passing the user_id
        const response = await axios.delete(`https://machine-backend.azurewebsites.net/ajouter/machines/${machineId}`, {
          data: {
            user_id: userId // Pass the user_id in the body of the delete request
          }
        });
  
        // Check if the deletion was successful
        if (response.status === 200) {
          // Filter out the machine with the given ID from the current list of machines
          const updatedMachines = currentMachines.filter(machine => machine.machine_id !== machineId);
          
          // Update the state with the new list
          setMachines(updatedMachines);
          setFilteredMachines(updatedMachines);
          
          // Optionally, display a success message
          alert('This Machine has been deleted');
        } else {
          // Handle case where deletion was not successful (e.g., server returned error)
          alert('Error deleting machine');
        }
      } catch (error) {
        // Handle errors in the delete request
        console.error('Error deleting machine:', error);
        alert('Error deleting machine');
      }
    } else {
      // Optionally, log if the user cancels the deletion
      console.log('Machine deletion canceled');
    }
  };
  


  const ModernLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);

    
    return (
      <Layout style={{ minHeight: '100vh' }}>
 
  
        <Layout style={{ 
          marginLeft: collapsed ? 80 : 240,
          transition: 'margin-left 0.3s',
          
          
        }}>
         
         <div>

         </div>
  
          {/* Content Area */}
          <Content >
            {children}
          </Content>
        </Layout>
      </Layout>
    );
  };
  
  return (
    <div className="homepage">
     
      <div className="main-content">
        <div style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
        <Input
  placeholder="Search by machine reference..."
  prefix={<SearchOutlined style={{ color: '#64748b' }} />}
  style={{ 
    width: 300,
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s'
  }}
  value={searchTerm}
  onChange={(e) => {
    const value = e.target.value;
    setSearchTerm(value);
  
    const filtered = machines.filter(machine => {
      const searchLower = value.toLowerCase();
      return (
        machine.machine_ref.toLowerCase().includes(searchLower) ||
        (machine.model && machine.model.toLowerCase().includes(searchLower)) ||
        (machine.product_line && machine.product_line.toLowerCase().includes(searchLower)) ||
        (machine.production_line && machine.production_line.toLowerCase().includes(searchLower)) ||
        (machine.brand && machine.brand.toLowerCase().includes(searchLower))
      );
    });
    
    console.log('Filtering with:', value);
    console.log('Filtered results:', filtered);
    
    setFilteredMachines(filtered);
  }}
/>
        </div>


<style>{`
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .machine-card {
    animation: fadeInUp 2.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
    opacity: 0;
  }

  .card-container {
    perspective: 1000px;
  }

  /* Staggered animation delays */
  .machine-card:nth-child(1) { animation-delay: 0.1s; }
  .machine-card:nth-child(2) { animation-delay: 0.2s; }
  .machine-card:nth-child(3) { animation-delay: 0.3s; }
  .machine-card:nth-child(4) { animation-delay: 0.4s; }
  .machine-card:nth-child(5) { animation-delay: 0.5s; }
  .machine-card:nth-child(n+6) { animation-delay: 0.6s; }
`}</style>

<div className="card-container"   style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '20px',
  padding: '16px',
  overflow: 'hidden'
}}>
  
  {currentMachines.length > 0 ? (
    currentMachines.map((machine) => (
      <div 
        key={machine.machine_id}
        className="machine-card"
    
        style={{
         
          borderRadius: '12px',
          padding: '18px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          cursor: 'pointer',
          ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
            borderColor: 'rgba(99, 102, 241, 0.3)'
          }
        }}
      >

       {machine.machineimagefile ? (
                  <img src={`https://machine-backend.azurewebsites.net/uploads/${machine.machineimagefile}`} alt="Machine" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', display: 'block', marginBottom: '10px' }} onError={handleImageError} />
                ) : imageError ? (
                  <p style={{ color: 'red', marginTop: '10px' }}>Image not available</p>
                ) : (
                  <p style={{ color: 'gray', marginTop: '10px' }}>No image provided</p>
                )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#1e293b',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {machine.machine_name}
          </h3>
          <span style={{
            background: machine.status === 'Active' ? '#e6f7ee' : '#fee2e2',
            color: machine.status === 'Active' ? '#059669' : '#dc2626',
            padding: '4px 8px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500
          }}>
            {machine.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '4px'
            }}>Machine Reference</p>
            <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155'
            }}>{machine.machine_ref}</p>
          </div>
          
          <div>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '4px'
            }}>Model</p>
            <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{machine.model}</p>
          </div>
          
          <div>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '4px'
            }}>Brand</p>
            <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155'
            }}>{machine.brand|| 'N/A'}</p>
          </div>
          
          <div>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '4px'
            }}>Production_line</p>
            <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155'
            }}>{machine.production_line}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div>
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '4px'
            }}>Product Line</p>
            <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 500,
              color: '#334155'
            }}>{machine.product_line}</p>
          </div>
          
   
    
        </div>

        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button onClick={() => showModal(machine)} style={{
            background: 'transparent',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#6366f1',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ':hover': {
              background: 'rgba(99, 102, 241, 0.1)'
            }
          }}>
            View Details
          </button>
          
         
        {/* Machine Details Modal */}
<Modal
  title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Machine Details</span>}
  visible={isModalVisible}
  onCancel={handleCancel}
  footer={null}
  width={800}
  style={{ top: 20 }}
  bodyStyle={{ padding: '24px' }}
>
  <div style={{ display: 'flex', gap: '24px' }}>
    
    {/* Machine Image Section */}
    <div style={{ flex: 1 }}>
      <div style={{
        width: '300px',
        height: '200px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {selectedMachine?.machineimagefile ? (
          <img src={`https://machine-backend.azurewebsites.net/uploads/${selectedMachine.machineimagefile}`} alt="Machine" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', display: 'block', marginBottom: '10px' }} onError={handleImageError} />
        ) : imageError ? (
          <p style={{ color: 'red', marginTop: '10px' }}>Image not available</p>
        ) : (
          <p style={{ color: 'gray', marginTop: '10px' }}>No image provided</p>
        )} 
      </div>

      <div style={{ marginTop: '40px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#1e293b' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Specifications
        </h4>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px'
        }}>
          <DetailItem label="Production rate" value={selectedMachine?.production_rate || 'N/A'} />
        </div>
      </div>

      {/* Text Fields */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginTop: '20px',
        padding: '20px 40px',
        background: '#f1f5f9',
        borderRadius: '8px'
      }}>
        {textFields.map(({ label, key }) => (
          <DetailItem key={key} label={label} value={selectedMachine?.[key] || 'N/A'} />
        ))}
      </div>

      <div style={{ marginTop: '40px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#1e293b' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Documents & Manuals
        </h4>

        {/* File Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          padding: '40px',
          background: '#f8fafc',
          borderRadius: '8px'
        }}>
          {fileLinks.map(({ label, key }) => {
            const fileName = selectedMachine?.[key];
            const fileUrl = fileName ? `${BASE_FILE_URL}${encodeURIComponent(fileName)}` : null;
            return (
              <div key={key}>
                {fileUrl ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {label}
                  </a>
                ) : (
                  <span style={{ color: '#94a3b8' }}>{label}: N/A</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Machine Details Section */}
    <div style={{ flex: 2 }}>
      {/* Header with Name and Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#1e293b' }}>
          {selectedMachine?.machine_name}
        </h3>
        <span style={{
          background: selectedMachine?.status === 'Active' ? '#e6f7ee' : '#fee2e2',
          color: selectedMachine?.status === 'Active' ? '#059669' : '#dc2626',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500
        }}>
          {selectedMachine?.status}
        </span>
      </div>
      
      <div>
        <h4 style={{ marginTop: '12px', fontSize: '16px', color: '#1e293b' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Machine Identification
        </h4>
      </div>
      
      {/* Machine Specifications */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        margin: '20px 0',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '8px'
      }}>
        <DetailItem label="Machine reference" value={selectedMachine?.machine_ref} icon={<EnvironmentOutlined />} />
        <DetailItem label="Machine name" value={selectedMachine?.machine_name || 'N/A'} icon={<ShopOutlined />} />
        <DetailItem label="Brand" value={selectedMachine?.brand || 'N/A'} icon={<AppstoreOutlined />} />
        <DetailItem label="Model" value={selectedMachine?.model || 'N/A'} icon={<BarcodeOutlined />} />
        <DetailItem label="Product Line" value={`${selectedMachine?.product_line}`} icon={<DashboardOutlined />} />
        <DetailItem label="Production Line" value={selectedMachine?.production_line || 'N/A'} icon={<ToolOutlined />} />
      </div>

      <div>
        <h4 style={{ marginTop: '12px', fontSize: '16px', color: '#1e293b' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Linked Products
        </h4>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        margin: '20px 0',
        padding: '16px',
        background: '#f8fafc',
        borderRadius: '8px'
      }}>
        <p>{productIds.length > 0 ? productIds.join(', ') : 'No products available'}</p>
      </div>

      {/* Technical Specifications Section */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#1e293b' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          Facilities Requirements
        </h4>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px'
        }}>
          <DetailItem label="Air needed" value={selectedMachine?.air_needed === true ? 'Yes' : selectedMachine?.air_needed === false ? 'No' : 'N/A'} />
         
          {selectedMachine?.air_needed === true && (
            <>
              <DetailItem label="Air pressure unit" value={selectedMachine?.air_pressure_unit || 'N/A'} />
              <DetailItem label="Air pressure" value={selectedMachine?.air_pressure || 'N/A'} />
            </>
          )}
          <DetailItem label="Voltage" value={selectedMachine?.voltage || 'N/A'} />
          <DetailItem label="Phases" value={selectedMachine?.phases || 'N/A'} />
          <DetailItem label="Amperage" value={selectedMachine?.amperage || 'N/A'} />
          <DetailItem label="Frequency" value={selectedMachine?.frequency || 'N/A'} />
       
          <DetailItem label="Water cooling" value={selectedMachine?.water_cooling === true ? 'Yes' : selectedMachine?.water_cooling === false ? 'No' : 'N/A'} />
          
          {selectedMachine?.water_cooling === true && (
            <>
              <DetailItem label="Water temp" value={selectedMachine?.water_temp || 'N/A'} />
              <DetailItem label="Water_temp_unit" value={selectedMachine?.water_temp_unit || 'N/A'} />
            </>
          )}
          <DetailItem label="Dust extraction" value={selectedMachine?.dust_extraction === true ? 'Yes' : selectedMachine?.dust_extraction === false ? 'No' : 'N/A'} />
          <DetailItem label="Fume extraction" value={selectedMachine?.fume_extraction === true ? 'Yes' : selectedMachine?.fume_extraction === false ? 'No' : 'N/A'} />
        </div>
      </div>

      {/* Maintenance History */}
      <div style={{ marginTop: '40px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#1e293b' }}>
          <HistoryOutlined style={{ marginRight: '8px' }} />
          Maintenance History
        </h4>
        
        <div style={{ 
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '12px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {selectedMachine?.maintenance_history?.length === 0 ? (
            <div style={{ 
              padding: '16px', 
              textAlign: 'center', 
              color: '#64748b',
              background: 'white',
              borderRadius: '6px'
            }}>
              <FileTextOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />
              <p style={{ margin: 0 }}>No maintenance records found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {selectedMachine?.maintenance_history?.map((record, index) => {
                // Filter out unchanged fields
                const changedFields = Object.entries(record.changes || {})
                  .filter(([field, values]) => values.old !== values.new);
                  
                if (changedFields.length === 0) return null;
                  
                return (
                  <div key={index} style={{ 
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '8px',
                    padding: '12px',
                    background: 'white'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#64748b',
                      marginBottom: '8px'
                    }}>
                      <span>
                        {formatDate(record.action_date)}
                      </span>
                      <span>Modified by: {record.modified_by}</span>
                    </div>
                    
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      {changedFields.map(([field, values]) => {
                        const formatValue = (value) => {
                          if (field.endsWith('_date') || field === 'action_date') {
                            return formatDate(value);
                          }
                          return value || 'N/A';
                        };

                        return (
                          <div key={field} style={{ 
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            alignItems: 'baseline'
                          }}>
                            <span style={{ 
                              fontWeight: 500,
                              textTransform: 'capitalize'
                            }}>
                              {field.replace(/_/g, ' ')}:
                            </span>
                            {values.old !== null && (
                              <span style={{ 
                                color: '#64748b',
                                textDecoration: 'line-through',
                                paddingRight: '8px'
                              }}>
                                {formatValue(values.old)}
                              </span>
                            )}
                            <span style={{ 
                              fontWeight: 500,
                              color: '#1e293b'
                            }}>
                              {formatValue(values.new)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <Button key="exit" onClick={()=>setIsModalVisible(false)} type="primary" style={{display:'flex', justifyContent:'center', alignItems:'center', background: '#dc2626', borderColor: '#dc2626', marginTop: '20px' }}>
        Exit
      </Button>
    </div>
  </div>
</Modal>
          
          <div style={{ display: 'flex', gap: '8px' }}>
           {/* QR Code Button - Maximized Size */}
  <div style={{
    width: '40px',
    height: '40px',
   
 
  }}>
    <QrcodeOutlined 
      style={{ 
        fontSize: '20px',
        color: '#242926ff',
        fontWeight: 'bold'
      }} 
      onClick={(e) => {
        e.stopPropagation();
        setCurrentQrMachine(machine);
        setQrModalVisible(true);
      }}
    />
  </div>

  {/* QR Code Modal */}
   <Modal
  title={`QR Code - ${currentQrMachine?.machine_name || "Machine"}`}
  open={qrModalVisible}
  onCancel={() => setQrModalVisible(false)}
  footer={[
    <Button key="print" onClick={handlePrintQRCode} icon={<PrinterOutlined />}>
      Print QR Code
    </Button>,
    <Button key="download" type="primary" onClick={downloadQRCode}>
      Download QR Code
    </Button>,
    <Button key="close" onClick={() => setQrModalVisible(false)}>
      Close
    </Button>,
  ]}
  width={450}
>
  {currentQrMachine && (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e8e8e8",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}>
          {currentQrMachine.machine_name}
        </p>
        <p style={{ margin: "5px 0 0 0", color: "#666" }}>
          Reference: {currentQrMachine.machine_ref}
        </p>
      </div>

      {/* Your MachineQRCode component - make sure it has an id for download */}
      <div id="qrcode-canvas">
        <MachineQRCode machineId={currentQrMachine.machine_id} />
      </div>
      
      <p
        style={{
          marginTop: "20px",
          color: "#666",
          fontSize: "14px",
          fontStyle: "italic",
        }}
      >
        Scan to view machine details
      </p>
    </div>
  )}
</Modal>
         <div    onClick={(e) => {
            e.stopPropagation(); // prevent modal click conflict
          fetchMachineDetails(machine.machine_id);
          }} style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              ':hover': {
                background: 'rgba(99, 102, 241, 0.2)'
              }
            }}>
              <EditOutlined style={{ fontSize: '12px', color: '#6366f1' }} />
            </div>

     
    {showSuccessMsg && (
    <div
    style={{
      position: "fixed",
      top: "14%", // Vertical positioning key
      left: "50%",
      transform: "translateX(-50%)",
      background: "linear-gradient(145deg, #b2f0e8, #8ce4d9)",
      color: "#005a64",
      padding: "20px 45px",
      borderRadius: "14px",
      fontSize: "17px",
      fontWeight: "600",
      textAlign: "center",
      zIndex: 1000,
      boxShadow: "0 8px 30px rgba(0, 109, 117, 0.25)",
      animation: "softPulse 1.2s ease-in-out, floatUp 0.6s ease-out",
      minWidth: "320px",
      maxWidth: "90%",
      letterSpacing: "0.3px",
      border: "2px solid rgba(255, 255, 255, 0.2)",
      display: "flex",
      alignItems: "center",
      gap: "15px",
      backdropFilter: "blur(8px)",
      transformOrigin: "center center",
    }}
  >
    <div style={{
      animation: "gentleFlip 0.8s both",
      fontSize: "28px"
    }}>
      ✅
    </div>
    <div>
      Machine Updated Successfully!
      <div style={{
        height: "4px",
        background: "rgba(0, 109, 117, 0.2)",
        position: "absolute",
        bottom: "-10px",
        left: "50%",
        width: "80%",
        transform: "translateX(-50%)",
        borderRadius: "4px",
        animation: "middleExpand 3.5s ease-in-out forwards"
      }} />
    </div>
  </div>
)}

<style>
{`
  @keyframes floatUp {
    0% {
      opacity: 0;
      transform: translate(-50%, 20px) scale(0.96);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, 0) scale(1);
    }
  }

  @keyframes softPulse {
    0% { transform: translate(-50%, 0) scale(1); }
    50% { transform: translate(-50%, 0) scale(1.03); }
    100% { transform: translate(-50%, 0) scale(1); }
  }

  @keyframes gentleFlip {
    0% { transform: rotateY(90deg) scale(0.5); }
    70% { transform: rotateY(-10deg) scale(1.1); }
    100% { transform: rotateY(0) scale(1); }
  }

  @keyframes middleExpand {
    0% { width: 0%; opacity: 0; }
    15% { width: 80%; opacity: 1; }
    85% { width: 80%; opacity: 1; }
    100% { width: 0%; opacity: 0; }
  }

  /* Hover effect */
  @media (hover: hover) {
    div[style*="position: fixed"]:hover {
      transform: translate(-50%, 0) scale(1.02) !important;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
  }
`}
</style>
                    
             <Modal
          title="Edit Machine"
          width={1000}
          visible={visible}
          onCancel={() => {
            setVisible(false)
            setCurrentStep(0);          // reset to first step
          }}
          afterClose={() => {
            setCurrentStep(0); // ensure it's reset even on outside click
          }}
         footer={null}
           >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => <Steps.Step key={item.title} title={item.title} />)}
        </Steps>

        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          {currentStep === 0 && (
            <>
              <Form.Item
                label="Machine Image"
                valuePropName="fileList"
                getValueFromEvent={e => e?.fileList || []}
              >
                <Upload
                  listType="picture-card"
                  fileList={formData.machineimagefile}
                  beforeUpload={() => false}
                  onChange={handleFileUpload('machineimagefile')}
                >
                  {formData.machineimagefile?.length ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item name="machine_ref">
             <Input placeholder="Enter machine reference" />
              </Form.Item>


              <Form.Item label="Machine Name" name="machine_name">
                <Input  placeholder="Enter machine name" />
              </Form.Item>

              <Form.Item label="Brand" name="brand" >
                <Input  placeholder="Enter brand" />
              </Form.Item>

              <Form.Item label="Model" name="model" >
                <Input  placeholder="Enter model" />
              </Form.Item>

              <Form.Item label="Product Line" name="product_line" >
                <Input  placeholder="Enter product line" />
              </Form.Item>

              <Form.Item label="Production Line" name="production_line" >
                <Input  placeholder="Enter production line" />
              </Form.Item>

              <Form.Item label="Number of Stations" name="station">
  <Input
    type="number"
    onChange={(e) => debouncedStationChange(e.target.value)}
    placeholder="Enter the stations"
    suffix={
      <EyeOutlined
        onClick={handleEyeClick}
        style={{
          cursor: "pointer",
          fontSize: "16px",
          color: "#1890ff",
        }}
      />
    }
  />
</Form.Item>

  <Form.Item
  label="Products"
  name="product_id"

>
  <Select
    mode="multiple"
    placeholder="Select products"
    allowClear
    maxTagCount="responsive"
    style={{ width: '100%' }}
    options={products.map(product => ({
      label: `${product.product_id}: ${product.product_description}`,
      value: product.product_id.toString(), // Ensure string type match
    }))}
    key={products.length} // Force re-render when products change
    filterOption={(input, option) => 
      option.label.toLowerCase().includes(input.toLowerCase())
    }
  />
</Form.Item>
       <Button
        icon={<PlusOutlined />}
        onClick={() => setModalProducVisible(true)}
        style={{ marginTop: 8 }}
        >
        Add New Product
        </Button>

            </>
          )}

          {currentStep === 1 && (
            <>
                  <Form.Item
                     label="Air Needed"
                     name="air_needed"
                     valuePropName="checked"
                   >
                     <Switch
                       checkedChildren="yes"
                       unCheckedChildren="no"
                     />
                   </Form.Item>

              {airneededValue && (
                    <>
                    <Form.Item shouldUpdate={(prev, curr) => prev.air_needed !== curr.air_needed}>
              {({ getFieldValue }) =>
                getFieldValue('air_needed') && (
                  <>
                    <Form.Item
                      label="Air Pressure"
                      name="air_pressure"
                      rules={[
                      
                        { pattern: /^\d+$/, message: 'Must be a number' },
                      ]}
                    >
                      <Input placeholder="Enter Air Pressure" />
                    </Form.Item>
            
                    <Form.Item
                      label="Air Pressure Unit"
                      name="air_pressure_unit"
             
                    >
                      <Select placeholder="Select unit" allowClear>
                        <Option value="Bar">Bar</Option>
                        <Option value="Kpa">Kpa</Option>
                        <Option value="Pa">Pa</Option>
                        <Option value="Psi">Psi</Option>
                      </Select>
                    </Form.Item>
                  </>
                )
              }
            </Form.Item>
                    
                    </>
                               )}
             

              <Form.Item label="Voltage" name="voltage"  rules={[{ pattern: /^\d+$/, message: 'Voltage must be a number' }]}>
                <Input  placeholder="Enter voltage" />
              </Form.Item>

              <Form.Item label="Phases" name="phases" rules={[{ pattern: /^\d+$/, message: 'phases must be a number' }]}>
                <Input  placeholder="Enter phases" />
              </Form.Item>

              <Form.Item label="Amperage" name="amperage" rules={[{ pattern: /^\d+$/, message: 'amperage must be a number' }]}>
                <Input  placeholder="Enter amperage" />
              </Form.Item>

              <Form.Item label="Frequency" name="frequency" rules={[{ pattern: /^\d+$/, message: 'frequency must be a number' }]}>
                <Input  placeholder="Enter frequency" />
              </Form.Item>

                   {/* Dropdown for Water Cooling (Yes/No) */}
                                  <Form.Item
                                   label="Water Cooling"
                                    name="water_cooling"
                                   valuePropName="checked"
                         >
                          <Switch
                          checkedChildren="yes"
                          unCheckedChildren="no"
                          />
                           </Form.Item>
              
            {waterCoolingValue && (
              <>
            
            <Form.Item shouldUpdate={(prev, curr) => prev.water_cooling !== curr.water_cooling}>
              {({ getFieldValue }) =>
                getFieldValue('water_cooling') && (
                  <>
                    <Form.Item
                      label="Water Temperature"
                      name="water_temp"
                      rules={[
                        
                        { pattern: /^\d+$/, message: 'Must be a number' },
                      ]}
                    >
                      <Input placeholder="Enter Water Temperature" />
                    </Form.Item>
            
                    <Form.Item
                      label="Water Temperature Unit"
                      name="water_temp_unit"
                     
                    >
                      <Select placeholder="Select unit" allowClear>
                        <Option value="°C">°C</Option>
                        <Option value="°F">°F</Option>
                        <Option value="K">K</Option>
                      </Select>
                    </Form.Item>
                  </>
                )
              }
            </Form.Item>
            
              </>
            )}
              
              <Form.Item label="Dust Extraction" name="dust_extraction">
                <Select  placeholder="Select Yes or No">
                  <Option value="Yes">Yes</Option>
                  <Option value="No">No</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Fume Extraction" name="fume_extraction" > 
                <Select  placeholder="Select Yes or No">
                  <Option value="Yes">Yes</Option>
                  <Option value="No">No</Option>
                </Select>
              </Form.Item>
            </>
          )}

         {currentStep === 2 && (
           <>
         <Row gutter={16}>
         {['files_3d', 'files_2d', 'spare_parts_list', 'electrical_diagram'].map((field) => (
        <Col span={6} key={field}>
          <Form.Item
            label={field.replace(/_/g, ' ').toUpperCase()}
            name={field}
            valuePropName="fileList"
            getValueFromEvent={(e) => e?.fileList || []}
            
          >
            <Upload
              listType="picture-card"
              fileList={Array.isArray(formData[field]) ? formData[field] : []}
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                setFormData((prevData) => ({
                  ...prevData,
                  [field]: fileList, // update only the current field
                }));
              }}
            >
              {formData[field]?.length ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Col>
      ))}
    </Row>

    <Row gutter={16}>
      {['machine_manual', 'plc_program', 'hmi_program',  'other_programs'].map((field, index) => (
        <Col span={6} key={field}>
          <Form.Item
            label={field.replace(/_/g, ' ').toUpperCase()}
            name={field}
            valuePropName="fileList"
            getValueFromEvent={e => e?.fileList || []}
       
          >
            <Upload
              listType="picture-card"
              fileList={Array.isArray(formData[field]) ? formData[field] : []}
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                setFormData((prevData) => ({
                  ...prevData,
                  [field]: fileList, // update the specific field with the new file list
                }));
              }}
            >
              {formData[field]?.length ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>{field.replace(/_/g, ' ')}</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Col>
      ))}
    </Row>

    <Row gutter={16}>
      {['consumables', 'fixture_numbers', 'gage_numbers', 'tooling_numbers'].map(field => (
        <Col span={8} key={field}>
          <Form.Item
            label={field.replace(/_/g, ' ').toUpperCase()}
            name={field}
           
          >
            <Input
              placeholder={`Enter ${field.replace(/_/g, ' ')}`}
            />
          </Form.Item>
        </Col>
      ))}
    </Row>
       </>
          )}


          {currentStep === 3 && (
            <>
              <Row gutter={[32, 32]}>
                {['cpk_data', 'validation_document'].map(field => (
                  <Col span={12} key={field}>
          <Form.Item
  label={field.replace(/_/g, ' ').toUpperCase()}
  name={field}
 
>
  <Upload
    listType="picture-card"
    fileList={Array.isArray(formData[field]) ? formData[field] : []}
    beforeUpload={() => false}
    onChange={({ fileList }) => {
      setFormData((prevData) => ({
        ...prevData,
        [field]: Array.isArray(fileList) ? fileList : [],
      }));
    }}
  >
    {Array.isArray(formData[field]) && formData[field].length > 0 ? null : (
      <div>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>{field.replace(/_/g, ' ')}</div>
      </div>
    )}
  </Upload>
</Form.Item>

                  </Col>
                ))}
              </Row>

              <Form.Item label="Production Rate" name="production_rate"  rules={[{ pattern: /^\d+$/, message: ' must be a number' }]}>
                <Input  placeholder="Enter production rate" />
              </Form.Item>
            </>
          )}
         <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
           {currentStep > 0 && (
           <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
            )}

         {currentStep < 3 ? (
         <Button
         type="primary"
    htmlType="button"
     onClick={handleNext}
  >
    Next
  </Button>
) : (
  <Button
  type="primary"
  onClick={() => handleUpdate(selectedMachineId)}

>
  Update
</Button>
  
)

}
    
</div>
        </Form>
            </Modal>


            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              ':hover': {
                background: 'rgba(239, 68, 68, 0.2)'
              }
            }}>
              <DeleteOutlined style={{ fontSize: '12px', color: '#ef4444' }} onClick={() => handleDelete(machine.machine_id)} />
            </div>
          </div>
        </div>
      </div>
      
    ))
  ) : (
    <div style={{
      gridColumn: '1 / -1',
      textAlign: 'center',
      padding: '40px 0',
      color: '#64748b',
      fontSize: '14px'
    }}>
      <img 
        src="/empty-state.svg" 
        alt="No machines" 
        style={{ width: '120px', opacity: 0.6, marginBottom: '16px' }}
      />
      <p style={{ margin: 0 }}>No machines available</p>
      <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Add a new machine to get started</p>
    </div>
  )}

        {/* Product Details Modal */}
        <Modal
          title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Product Details</span>}
          visible={modalproductvisible}
          onOk={handleProductOk}
          onCancel={() => setModalProducVisible(false)}
          okText="Save"
          cancelText="Cancel"
          okButtonProps={{
            style: {
              borderRadius: '6px',
              height: '40px',
              padding: '0 20px'
            }
          }}
          cancelButtonProps={{
            style: {
              borderRadius: '6px',
              height: '40px',
              padding: '0 20px'
            }
          }}
          width={600}
          bodyStyle={{ padding: '24px' }}
        >
          <Form form={form} layout="vertical">
          <Form.Item
  label={<span style={{ fontWeight: 500 }}>Product ID</span>}
  name="product_id"
  rules={[
    { required: true, message: 'Please enter product id' },
    {
      validator: async (_, value) => {
        if (!value) return Promise.resolve();

        // 👇 Replace this with your actual fetch to check product existence
        const res = await fetch(`https://machine-backend.azurewebsites.net/ajouter/products/check-id/${value}`);
        const data = await res.json();

        if (data.exists) {
          return Promise.reject(new Error('Product ID already exists'));
        }
        return Promise.resolve();
      },
    },
  ]}
>
  <Input 
    style={{ 
      height: '40px',
      borderRadius: '6px'
    }} 
  />
</Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Product Description</span>}
              name="product_description"
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input.TextArea 
                rows={4}
                style={{ 
                  borderRadius: '6px',
                  resize: 'vertical'
                }} 
              />
            </Form.Item>
          </Form>
        </Modal>
</div> 


      {/* station modal*/}
      <Modal
  title="Station Details"
  visible={modalVisible}
  onOk={handleStationOk}
  onCancel={() => setModalVisible(false)}
  // ... other props
>
  {/* 👇 Wrap content in Form component */}
  <Form form={form}>
  {Array.from({ length: stationCount }, (_, index) => (
    <div key={index} style={{ marginBottom: 16 }}>
      {/* Hidden field for ID */}
      <Form.Item name={["stations", index, "id"]} style={{ display: "none" }}>
        <Input />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={`Station ${index + 1}`}
            name={["stations", index, "station"]}
            rules={[{ required: true, message: 'Please enter station name' }]}
          >
            <Input placeholder="Enter station name" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label={`Description ${index + 1}`}
            name={["stations", index, "description"]}
          >
            <Input placeholder="Enter description" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  ))}
</Form>

     </Modal>



        {machines.length > machinesPerPage && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="pagination-button">
              Previous
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="pagination-button">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
