import React, { useState, useEffect, useCallback, useMemo  } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {Layout,  Modal, Steps, Form, Input, Upload, Button, Select, Switch, Row, Col, message, notification  } from "antd";
import { EditOutlined, DeleteOutlined, FileTextOutlined, SettingOutlined, HistoryOutlined, IdcardOutlined, EnvironmentOutlined, ShopOutlined, AppstoreOutlined, CalendarOutlined, ToolOutlined, DashboardOutlined, BarcodeOutlined, UserOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { 
  SearchOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import TextArea from 'antd/es/input/TextArea';
import { debounce } from 'lodash';


const Homepageviewer = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
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
  const [stepValidity, setStepValidity] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
  });
  const [selectedMachineId, setSelectedMachineId]= useState(null);
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
          // Ensure we're working with strings
          const stringId = typeof id === 'string' ? id : String(id);
          // Clean up string values
          return stringId.trim().replace(/\s+/g, ' ');
        })
        .filter(id => id && id.length > 0 && id !== 'null'); // Filter out 'null' strings

      console.log('Processed string product IDs:', processedProductIds);

      // Set productIds in state
      setProductIds(processedProductIds);

      const updatedMachine = {
        ...machine,
        product_id: processedProductIds,
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
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const { Header, Sider, Content } = Layout;

  const Card = ({ machine, onDelete, onUpdate }) => {
    const navigate = useNavigate();
    
  
    // State for handling modals
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
    const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
    const [updatedMachine, setUpdatedMachine] = useState(machine);

  
    // Function to close delete modal
    const handleDeleteCancel = () => {
      setDeleteModalVisible(false);
    };
  


    
    
  
  
    // Function to close update modal
    const handleUpdateCancel = () => {
      setUpdateModalVisible(false);
    };
  
    // Function to handle update form submission
    const handleUpdateSubmit = () => {
      onUpdate(updatedMachine); // Pass updated machine details
      setUpdateModalVisible(false);
    };
  
    // Handle input changes for updating the machine
    const handleInputChange = useCallback(
      debounce((name, value) => {
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      }, 300), []);

    const handleCardClick = (machine) => {
      setSelectedMachine(machine);
      setIsModalVisible(true);
    };
 
    
    return (
      <div className="card" onClick={handleCardClick} style={{ marginTop: "10px", marginBottom: "10px" }}>
        <div className="card-content" style={{ textAlign: "center", padding: "20px" }}>
          <div className="card-image" style={{ marginBottom: "20px" }}>
            <img
              src={machine.machineimagefile ? `https://machine-backend.azurewebsites.net/uploads/${machine.machineimagefile}` : "/fallback-image.jpg"}
              alt={machine.machine_name || "Machine"}
              onError={(e) => (e.target.src = "/fallback-image.jpg")}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
          <h3 style={{ color: "#2c3e50", fontSize: "1.5rem", fontWeight: "bold", marginBottom: "8px" }}>
            {machine.machine_name || "Unknown Machine"}
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              textAlign: "left",
              maxWidth: "400px",
            }}
          >
            <p><strong>Machine Reference:</strong> {machine.machine_ref || "N/A"}</p>
            <p><strong>Brand:</strong> {machine.brand || "N/A"}</p>
            <p><strong>Model:</strong> {machine.model || "N/A"}</p>
            <p><strong>Product Line:</strong> {machine.product_line || "N/A"}</p>
            <p><strong>Production Line:</strong> {machine.production_line || "N/A"}</p>
          </div>
  
    
  
  

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (machine.facilities.length > 0) {
                const facility = machine.facilities.find(facility => facility.machine_id === machine.machine_id);
                if (facility) {
                  navigate(`/facilities/${facility.id}`);
                } else {
                  alert("No matching facility found for this machine");
                }
              } else {
                alert("No facilities found for this machine");
              }
            }}
            className="details-button"
            style={{ marginTop: "20px" }}
          >
            View Details Facilities
          </button>
  
          {/* Delete Modal */}
          <Modal
            title="Confirm Deletion"
            visible={isDeleteModalVisible}
            onOk={handleDelete}
            onCancel={handleDeleteCancel}
            okText="Yes, Delete"
            cancelText="Cancel"
          >
            <p>Are you sure you want to delete this machine?</p>
          </Modal>
  
          {/* Update Modal */}
          <Modal
            title="Update Machine"
            visible={isUpdateModalVisible}
            onOk={handleUpdateSubmit}
            onCancel={handleUpdateCancel}
            okText="Update"
            cancelText="Cancel"
          >
            <div>
              <label>Machine Name:</label>
              <Input
                name="machine_name"
                value={updatedMachine.machine_name}
                onChange={handleInputChange}
                style={{ marginBottom: "10px" }}
              />
              <label>Brand:</label>
              <Input
                name="brand"
                value={updatedMachine.brand}
                onChange={handleInputChange}
                style={{ marginBottom: "10px" }}
              />
              <label>Model:</label>
              <Input
                name="model"
                value={updatedMachine.model}
                onChange={handleInputChange}
                style={{ marginBottom: "10px" }}
              />
              <label>Product Line:</label>
              <Input
                name="product_line"
                value={updatedMachine.product_line}
                onChange={handleInputChange}
                style={{ marginBottom: "10px" }}
              />
              <label>Production Line:</label>
              <Input
                name="production_line"
                value={updatedMachine.production_line}
                onChange={handleInputChange}
                style={{ marginBottom: "10px" }}
              />
            </div>
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

        
      {machine.machineimagefile ? (
                  <img src={`https://machine-backend.azurewebsites.net/uploads/${machine.machineimagefile}`} alt="Machine" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', display: 'block', marginBottom: '10px' }} onError={handleImageError} />
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
       
          <DetailItem label="Production rate" value={machine.production_rate || 'N/A'} />
         
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
      <DetailItem key={key} label={label} value={machine[key] || 'N/A'} />
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
      const fileName = machine[key];
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
          {machine.machine_name}
        </h3>
        <span style={{
          background: machine.status === 'Active' ? '#e6f7ee' : '#fee2e2',
          color: machine.status === 'Active' ? '#059669' : '#dc2626',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500
        }}>
          {machine.status}
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
        
        <DetailItem label="Machine reference" value={machine.machine_ref} icon={<EnvironmentOutlined />} />
        <DetailItem label="Machine name" value={machine.machine_name || 'N/A'} icon={<ShopOutlined />} />
        <DetailItem label="Brand" value={machine.brand || 'N/A'} icon={<AppstoreOutlined />} />
        <DetailItem label="Model" value={machine.model || 'N/A'} icon={<BarcodeOutlined />} />
        <DetailItem label="Product Line" value={`${machine.product_line}`} icon={<DashboardOutlined />} />
        <DetailItem label="Production Line" value={machine.production_line || 'N/A'} icon={<ToolOutlined />} />
     
      </div>

      <div>
     <h4 style={{ marginTop: '12px', fontSize: '16px', color: '#1e293b' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
       Linked Products
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
          <DetailItem label="Air needed"value={machine.air_needed === true
      ? 'Yes'
      : machine.air_needed === false
      ? 'No'
      : 'N/A'
  }
/>
         
          {machine.air_needed === true && (
              <>
          <DetailItem label="Air pressure unit" value={machine.air_pressure_unit || 'N/A'} />
          <DetailItem label="Air pressure" value={machine.air_pressure || 'N/A'} />
          </>
        )}
          <DetailItem label="Voltage" value={machine.voltage || 'N/A'} />
          <DetailItem label="Phases" value={machine.phases || 'N/A'} />
          <DetailItem label="Amperage" value={machine.amperage || 'N/A'} />
          <DetailItem label="Frequency" value={machine.frequency || 'N/A'} />
       
          <DetailItem label="Water cooling"value={machine.water_cooling === true
      ? 'Yes'
      : machine.water_cooling === false
      ? 'No'
      : 'N/A'
  }
/>
{machine.water_cooling === true && (
  <>
    <DetailItem label="Water temp" value={machine.water_temp || 'N/A'} />
    <DetailItem label="Water_temp_unit" value={machine.water_temp_unit || 'N/A'} />
  </>
)}
          <DetailItem label="Dust extraction"value={machine.dust_extraction === true
      ? 'Yes'
      : machine.dust_extraction === false
      ? 'No'
      : 'N/A'
  }
/>
<DetailItem
  label="Fume extraction"
  value={
    machine.fume_extraction === true
      ? 'Yes'
      : machine.fume_extraction === false
      ? 'No'
      : 'N/A'
  }
/>
        </div>
      </div>


    
    

      {/* Maintenance History */}
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#1e293b' }}>
          <HistoryOutlined style={{ marginRight: '8px' }} />
          Maintenance History
        </h4>
        <div style={{ 
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '12px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {machine.maintenance_history?.length > 0 ? (
            machine.maintenance_history.map((item, index) => (
              <div key={index} style={{ 
                padding: '12px',
                marginBottom: '8px',
                background: 'white',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 500 }}>
                    <CalendarOutlined style={{ marginRight: '6px' }} />
                    {item.date}
                  </span>
                  <span style={{ 
                    color: item.type === 'Preventive' ? '#059669' : '#d97706',
                    fontWeight: 500
                  }}>
                    {item.type}
                  </span>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#475569' }}>
                  {item.notes}
                </p>
                {item.technician && (
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                    <UserOutlined style={{ marginRight: '6px' }} />
                    {item.technician}
                  </p>
                )}
              </div>
            ))
          ) : (
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
          )}
        </div>
      </div>
      <Button key="exit" onClick={()=>setIsModalVisible(false)} type="primary" style={{display:'flex', justifyContent:'center', alignItems:'center', background: '#dc2626', borderColor: '#dc2626', marginTop: '20px' }}>
  Exit
</Button>
    </div>
  </div>
</Modal>

  
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

export default Homepageviewer;
