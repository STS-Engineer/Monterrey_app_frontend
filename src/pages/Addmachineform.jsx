import React, { useContext, useState, useEffect } from 'react';
import { Layout, Menu, Form, Input, Upload, Button, message, Select, Modal, Row, Col, Steps, Switch, Space, Avatar, Dropdown, Badge   } from 'antd';
import { UploadOutlined, PlusOutlined, SettingOutlined, UserOutlined, HomeOutlined, MenuUnfoldOutlined, MenuFoldOutlined, LogoutOutlined, DownOutlined, BellOutlined } from '@ant-design/icons';
import axios from 'axios';
import TextArea from 'antd/es/input/TextArea';
import { AnimatePresence, motion } from 'framer-motion';

import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from 'react-router';

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const AddMachineForm = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const airneededValue = Form.useWatch('air_needed', form);
  const waterCoolingValue = Form.useWatch('water_cooling', form);
  const [step, setStep] = useState(0); // Manage current step
  const [machines, setMachines] = useState([]); // State to store machines
  const [isFormValid, setIsFormValid] = useState(false); // Track form validity
  const [stationCount, setStationCount] = useState(0);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([])
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [airNeeded, setAirNeeded] = useState(false);
  const [watercooling, setWatercooling] = useState(false);
  // State for product selection and dynamic inputs
  const [showProductFields, setShowProductFields] = useState(false);
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
    air_needed: 'no',
    air_pressure: 0,
    air_pressure_unit: null,
    voltage: '',
    consumables: '',
    machine_manual: '',
    phases: '',
    amperage: '',   // Add stationCount to formData
    frequency: '',
    water_cooling: 'no',
    water_temp: 0,
    water_temp_unit: null,
    dust_extraction: '',   // Add stationCount to formData
    fume_extraction: '',
    fixture_number: '',  // Added
    gage_number: '',    // Added
    tooling_number: '',  // Added
    files_3d: [],        // Added for file uploads
    files_2d: [],        // Added for file uploads
    spare_parts_list: [],// Added for file uploads
    electrical_diagram: [], // Added for file uploads
    plc_program: [],     // Added for file uploads
    hmi_program: [],  
    cpk_data: [],  
    validation_document: [],
    parameter_studies: [],      // Added for file uploads
    operation_instruction: [],
    powerunits: '',
  });
  
  const [stations, setStations]= useState([]);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalproductvisible, setModalProducVisible]= useState(false);
  const [machineImage, setMachineImage] = useState([]); 
  const [lastMachineId, setLastMachineId] = useState(null);
   const user_id = localStorage.getItem('user_id');


  
  const { Step } = Steps;

  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);
  const steps = [
    'Machine Identification',
    'Facility Requirements',
    'Documents & Manuals',
    'Validation & Specifications',
    
  ];
  const [stepValidations, setStepValidations] = useState({
    0: false, // Step 0 validation state
    1: false, // Step 1 validation state
    2: false, // Step 2 validation state
    3: false  // Step 3 validation state
  });
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


  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await axios.get("https://machine-backend.azurewebsites.net/ajouter/machines");
        setMachines(response.data || []); // Ensure the response is not null
        console.log('fetched', response.data);
      } catch (error) {
        console.error("Error fetching machines:", error);  
        message.error("Failed to load machines.");
      }
    };

    fetchMachines();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await axios.get("https://machine-backend.azurewebsites.net/ajouter/machines");
        setLastMachineId(response.data.machine_id);
        console.log('fetched machine', response.data);
      } catch (error) {
        console.error("Error fetching machines:", error);  
        message.error("Failed to load machines.");
      }
    };

    fetch();
  }, []);

  useEffect(() => {
    form.setFieldsValue({ machine_id: lastMachineId})
  }, [lastMachineId, form]);

   const validateForm = () => {
    // Check if the form fields have errors or not
    const fieldsError = form.getFieldsError();
    const isValid = fieldsError.every(field => field.errors.length === 0) && form.isFieldsTouched();
    setIsFormValid(isValid);
  };

  useEffect(() => {
    // Trigger validation on form changes
    form?.validateFields();
    validateForm();
  }, [form]);

  const navigate = useNavigate();


  const handleEyeClick = () => {
    setModalVisible(true); // Open modal with previous values when clicking the eye icon
  };
  // Handle dynamic station rows
  const handleStationChange = (value) => {
    const count = parseInt(value, 10);
    setStationCount(count);

    // Initialize form with empty stations
    form.setFieldsValue({
      stations: Array.from({ length: count }, () => ({
        station: '',
        description: ''
      }))
    });
    setModalVisible(true);
  };
  const handleFormChange = (changedValues) => {
    setFormData({
      ...formData,
      ...changedValues,
    });
  };

  const showSuccessModal = () => {
    Modal.success({
      title: '🎉 Machine Created Successfully!',
      content: (
        <div>
          <p>Your machine and stations were saved successfully.</p>
        </div>
      ),
      okText: 'Great!',
      centered: true,
    });
  };

  const handleAirNeededChange = (checked) => {
    setAirNeeded(checked);
  
   
  };
  
   // Handle Form 1 Submission
   const handleForm1Submit = (values) => {
    const updatedFormData = {
      ...formData, // Merge existing data
      ...values,   // Add current form values
      // machineimagefile: machineImage[0]?.originFileObj || null, // Handle image file
    };
    setFormData(updatedFormData);
    message.success("Form 1 saved");
    setStep(1);
  };
  
  const handleForm2Submit = (values) => {
    const updatedFormData = {
      ...formData, // Merge existing data
      ...values,   // Add current form values
    };
    setFormData(updatedFormData);
    message.success("Form 2 saved");
    setStep(2);
  };
  
  const handleForm3Submit = (values) => {
    const updatedFormData = {
      ...formData, // Merge existing data
      ...values,   // Add current form values
    };
    setFormData(updatedFormData);
    message.success("Form 3 saved");
    setStep(3);
  };
  
  // Handle Form 3 Submission
  const onFinish = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const user_id = localStorage.getItem('user_id');
    const formDataToSend = new FormData();
  
    // Await station modal values (returns an array of station objects)
    const stationsFromModal = await handleStationOk();
  
    // Append normal fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value != null && typeof value !== 'object' && key !== 'product_id') {
        formDataToSend.append(key, value);
      }
    });
  
    // Append file fields
    const fileFields = [
      'machineimagefile', 'files_3d', 'files_2d', 'spare_parts_list',
      'electrical_diagram', 'plc_program', 'hmi_program', 'cpk_data',
      'validation_document', 'parameter_studies', 'other_programs', 'machine_manual', 'operation_instruction'
    ];
  
    fileFields.forEach(field => {
      const value = formData[field];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(file => {
            if (file?.originFileObj) {
              formDataToSend.append(field, file.originFileObj);
            }
          });
        } else if (value?.originFileObj) {
          formDataToSend.append(field, value.originFileObj);
        }
      }
    });
  
    formDataToSend.append("user_id", Number(user_id));
    formDataToSend.append("action_type", "CREATE");
  
    try {
      // Step 1: Create Machine
      const response = await axios.post("https://machine-backend.azurewebsites.net/ajouter/machines", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      });
  
      if (response.status === 201) {
        const createdMachineId = response.data.machine_id;
        console.log("🆔 Machine Created:", createdMachineId);
  
        // Step 2: Small delay to ensure files/backend are ready
        await new Promise(resolve => setTimeout(resolve, 500));
  
        // Step 3: Create MachineProduct entries
     // Step 3: Create MachineProduct entries
     const productIds = form.getFieldValue('product_id') || [];


if (productIds.length > 0) {
console.log("⚙️ Creating MachineProducts for:", productIds);
await Promise.all(
  productIds.map(async (productId) => {
    try {
      console.log("➡️ Sending product ID:", productId);
      const res = await axios.post("https://machine-backend.azurewebsites.net/ajouter/machineproducts", {
        machine_id: createdMachineId,
        product_id: productId, // Ensure this is a number
        user_id: Number(user_id),
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      console.log("✅ MachineProduct added:", res.data);
    } catch (err) {
      console.error("❌ Error adding machineProduct:", err.response?.data || err.message);
    }
  })
);
} else {
console.warn("⚠️ No products selected.");
message.warning("No products selected.");
}
  
        // Step 4: Create Stations
        if (stationsFromModal?.length > 0) {
          const stationsToCreate = stationsFromModal.map(station => ({
            ...station,
            machine_id: createdMachineId,
            user_id: Number(user_id),
          }));
  
          await Promise.all(
            stationsToCreate.map(station =>
              axios.post("https://machine-backend.azurewebsites.net/ajouter/stations", station, {
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                }
              })
            )
          );
        }
  
        // Final steps
        form.resetFields();
        setShowSuccessMsg(true);
        setTimeout(() => {
          setShowSuccessMsg(false);
          navigate("/machinelist");
        }, 3000);
      }
  
    } catch (error) {
      console.error("❌ Submission Error:", error.response?.data?.message || error.message);
      message.error(error.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };
  
  
  

  const handleWaterChange = (checked) => {
    setWatercooling(checked);
   
  };


  const handleUpdate = async (values, machineId) => {
    try {
      // Prepare form data to send to the server
      const formData = new FormData();
      formData.append('production_rate', values.production_rate);
      formData.append('fixture_number', values.fixture_number);
      formData.append('gage_number', values.gage_number);
      formData.append('tooling_number', values.tooling_number);
  
      // Append files to form data

      if (values.machineimagefile && values.machineimagefile.length > 0) {
        values.machineimagefile.forEach(file => {
          formData.append('machineimagefile', file.originFileObj);
        });
      }
      if (values.files_3d && values.files_3d.length > 0) {
        values.files_3d.forEach(file => {
          formData.append('files_3d', file.originFileObj);
        });
      }
      if (values.files_2d && values.files_2d.length > 0) {
        values.files_2d.forEach(file => {
          formData.append('files_2d', file.originFileObj);
        });
      }
      if (values.spare_parts_list && values.spare_parts_list.length > 0) {
        values.spare_parts_list.forEach(file => {
          formData.append('spare_parts_list', file.originFileObj);
        });
      }
      if (values.electrical_diagram && values.electrical_diagram.length > 0) {
        values.electrical_diagram.forEach(file => {
          formData.append('electrical_diagram', file.originFileObj);
        });
      }
      if (values.plc_program && values.plc_program.length > 0) {
        values.plc_program.forEach(file => {
          formData.append('plc_program', file.originFileObj);
        });
      }
      if (values.hmi_program && values.hmi_program.length > 0) {
        values.hmi_program.forEach(file => {
          formData.append('hmi_program', file.originFileObj);
        });
      }
      if (values.cpk_data && values.cpk_data.length > 0) {
        values.cpk_data.forEach(file => {
          formData.append('cpk_data', file.originFileObj);
        });
      }
      if (values.validation_document && values.validation_document.length > 0) {
        values.validation_document.forEach(file => {
          formData.append('validation_document', file.originFileObj);
        });
      }
      if (values.parameter_studies && values.parameter_studies.length > 0) {
        values.parameter_studies.forEach(file => {
          formData.append('parameter_studies', file.originFileObj);
        });
      }
      
      if (values.operation_instruction && values.operation_instruction.length > 0) {
        values.operation_instruction.forEach(file => {
          formData.append('operation_instruction', file.originFileObj);
        });
      }
  
      // Send data to API (use your specific endpoint here)
      const response = await axios.put(`https://machine-backend.azurewebsites.net/ajouter/machines/${machineId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
  
      // Handle the response from the API
      if (response.status === 200) {
        // Successfully updated
        setStep(step + 1);  // Proceed to next step if desired
        message.success('Form updated successfully!');
      } else {
        message.error('Failed to update. Please try again.');
      }
    } catch (error) {
      console.error('Error updating form data:', error);
      message.error('Form update failed. Please check all required fields.');
    }
  };


  const handleStationOk = async () => {
    try {
      const values = await form.validateFields();
      console.log("📋 Form Values:", values);

      // Process stations
      const rawStations = values.stations || [];
      const stations = rawStations
        .filter(s => s.station?.trim())
        .map(s => ({
          station: s.station.trim(),
          description: s.description?.trim() || ""
        }));

      console.log("🚀 Stations:", stations);
      setModalVisible(false);
      return stations;


    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };
  
  const handleProductChange = (value) => {
    setFormData({
      ...formData,
      product_id: value, // Ensure this is an array of valid product IDs
    });
  };
  

  const handleProductOk = async () => {
    try {
      const values = await form.validateFields();
      const userId = localStorage.getItem('user_id');
      const parsedUserId = parseInt(userId, 10);
  
      if (!userId || isNaN(parsedUserId)) {
        message.error('Invalid User ID.');
        return;
      }
  
      const response = await axios.post('https://machine-backend.azurewebsites.net/ajouter/Products', {
        ...values,
        user_id: parsedUserId,
      });
  
      const newProduct = response.data.product;
  
      // Update products list
      setProducts(prev => [...prev, newProduct]);
      
      // Close modal and reset form (clears selected values)
      setModalProducVisible(false);
         // Reset just the product_id field to empty array (for multi-select)
    form.setFieldsValue({
      product_id: [] // Empty array for multi-select
    });
    
      
      message.success('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      message.error('Failed to add product!');
    }
  };
  
  
  
 

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Form form={form} onFinish={handleForm1Submit} onValuesChange={handleFormChange} layout="vertical">
          {/* Machine Image Upload */}
          <Form.Item
  label="Machine Image"
  name="machineimagefile"  // Must match backend expectation
 
  valuePropName="fileList"
  getValueFromEvent={(e) => e?.fileList || []}
>
  <Upload
    listType="picture-card"
    beforeUpload={() => false}
    maxCount={1}
    onChange={({ fileList }) => {
      setFormData((prevData) => ({
        ...prevData,
        machineimagefile: fileList,
      }));
    }}
  >
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  </Upload>
        </Form.Item>


          {/* Machine Info */}
          <Form.Item label="Machine Reference" name=" machine_ref" >
       <Input value={formData.machine_ref} onChange={(e) => setFormData({...formData,  machine_ref: e.target.value})} placeholder='Enter the machine reference' />
       </Form.Item>
       <Form.Item label="Machine Name" name="machine_name" >
       <Input value={formData.machine_name} onChange={(e) => setFormData({...formData, machine_name: e.target.value})} placeholder='Enter the machine name' />
       </Form.Item>


          <Form.Item label="Brand" name="brand" >
            <Input  value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})}  placeholder='Enter the brand'/>
          </Form.Item>

          <Form.Item label="Model" name="model" >
            <Input  value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})}  placeholder='Enter the model'/>
          </Form.Item>

          <Form.Item label="Product Line" name="product_line" >
            <Input value={formData.product_line} onChange={(e) => setFormData({...formData, product_line: e.target.value})}  placeholder='Enter the product line'/>
          </Form.Item>

          <Form.Item label="Production Line" name="production_line"   >
            <Input value={formData.production_line} onChange={(e) => setFormData({...formData, production_line: e.target.value})} placeholder='Enter the production line'/>
          </Form.Item>

          {/* Station Input */}
          <Form.Item label="Number of Stations" name="station" >
            <Input type="number" value={formData.station} onChange={(e) => handleStationChange(e.target.value)} placeholder='Enter the stations'  suffix={
            <EyeOutlined
              onClick={handleEyeClick}
              style={{ cursor: "pointer", fontSize: "16px", color: "#1890ff" }} // Eye icon styling
            />
          } />
          </Form.Item>

          {/* Product Dropdown and Add Product Details */}
          <Row gutter={16} align="middle">
       <Col span={22}>
       <Form.Item label="Products" name="product_id">
  <Select
    mode="multiple"
    placeholder="Select products"
    allowClear
    maxTagCount="responsive"
    style={{ width: '100%' }}
  >
    {products.map((product) => (
      <Option key={product.product_id} value={product.product_id}>
        {product.product_id}: {product.product_description}
      </Option>
    ))}
  </Select>
</Form.Item>

 

       </Col>
  <Col span={2} style={{ textAlign: 'right' }}>
    <Button 
      icon={<PlusOutlined />} 
      onClick={() => setModalProducVisible(true)}
    />
  </Col>
</Row>


          {showProductFields && (
            <>
              <Form.Item label="Product Reference" name="product_reference" rules={[{ required: true, message: 'Please enter product reference' }]}>
                <Input value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} />
              </Form.Item>
              <Form.Item label="Product Name" name="product_name" rules={[{ required: true, message: 'Please enter product name' }]}>
                <Input value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} />
              </Form.Item>
          
            </>
          )}
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
  <Button
    type="primary"
    htmlType="submit"
    disabled={
      !formData.machine_ref || 
      !formData.machine_name || 
      !formData.brand || 
      !formData.model || 
      !formData.product_line || 
      !formData.production_line || 
      !formData.station || 
      formData.product_id.length === 0  // Ensures at least one product is selected
    }
  >
    Next
  </Button>
</div>


        </Form>
        );


        case 1:
          return (
                 <Form form={form} onFinish={handleForm2Submit} onValuesChange={handleFormChange} initialValues={{ water_cooling: false, air_needed: false  }} layout="vertical">
  
   

                         {/* Dropdown for Air Needed (Yes/No) */}
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
          normalize={(value) => (value ? Number(value) : value)}
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

           <Form.Item label="Voltage" name="voltage">
           <Input placeholder="Enter voltage" />
           </Form.Item>
            <Form.Item label="Phases" name="phases"    rules={[
           { pattern: /^\d+$/, message: 'Phases must be a number' }
         ]}>
            <Input placeholder="Enter phases" />
             </Form.Item>
             <Form.Item label="Amperage" name="amperage" rules={[
    { pattern: /^\d+$/, message: 'Amperage must be a number' }
  ]}>
             <Input placeholder="Enter amperage" />
      </Form.Item>
     <Form.Item label="Frequency" name="frequency"   rules={[
    { pattern: /^\d+$/, message: 'Frequency must be a number' }
       ]}
        >
             <Input placeholder="Enter frequency" />
             </Form.Item>
           
                      {/* Dropdown for Water Cooling (Yes/No) */}
            <Form.Item
              label="Water Cooling"
             name="water_cooling"
            valuePropName="checked"
            >
  <Switch checkedChildren="Yes" unCheckedChildren="No" />
</Form.Item>

{waterCoolingValue && (
  <>
<Form.Item shouldUpdate={(prev, curr) => prev.water_cooling !== curr.water_cooling}>
  {({ getFieldValue }) =>
    getFieldValue('water_cooling') && (
      <>
        <Form.Item
          label="Water Temperature"
          normalize={(value) => (value ? Number(value) : value)}
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



                    
                         <Form.Item label="Dust Extraction" name="dust_extraction" >
                           <Select placeholder="Select Yes or No">
                             <Option value="Yes">Yes</Option>
                             <Option value="No">No</Option>
                           </Select>
                         </Form.Item>
                         <Form.Item label="Fume Extraction" name="fume_extraction" >
                           <Select placeholder="Select Yes or No">
                             <Option value="Yes">Yes</Option>
                             <Option value="No">No</Option>
                           </Select>
                         </Form.Item>
           
                         <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
  <Button
    type="default" // You can use "default" for the "Previous" button style
    htmlType="button" // It's not a submit button
    onClick={()=>setStep(0)} // Replace with your logic for the previous action
  >
    Previous
  </Button>
  
  <Button
    type="primary"
    htmlType="submit"
    disabled={
      !formData.voltage ||
      !formData.phases ||
      !formData.amperage ||
      !formData.frequency ||
      !formData.dust_extraction ||
      !formData.fume_extraction  ||
      form.getFieldsError().some(({ errors }) => errors.length)
    }
  >
    Next
  </Button>
</div>

                       </Form> 
          );
       
      case 2:
        return (
          <Form
          form={form}
          onFinish={handleForm3Submit}
          onValuesChange={handleFormChange}
          layout="vertical"
        >
          <Row gutter={16}>
            {/* 3D File Upload */}
            <Col span={6}>
              <Form.Item
                label="3D File"
                name="files_3d"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      files_3d: fileList,
                    }));
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
    
            {/* 2D File Upload */}
            <Col span={6}>
              <Form.Item
                label="2D File"
                name="files_2d"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      files_2d: fileList,
                    }));
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
    
            {/* Spare Parts List Upload */}
            <Col span={6}>
              <Form.Item
                label="Spare Parts List"
                name="spare_parts_list"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      spare_parts_list: fileList,
                    }));
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>


    
            {/* Other Programs Upload */}
            <Col span={6}>
              <Form.Item
                label="Other Programs"
                name="other_programs"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      other_programs: fileList,
                    }));
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
    
          <Row gutter={16}>
          
          <Col span={6}>
              <Form.Item
                label="Electrical diagram"
                name="electrical_diagram"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      electrical_diagram: fileList,
                    }));
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>

            {/* Electrical Diagram Upload */}
            <Col span={6}>
              <Form.Item
                label="Machine Manual"
                name="machine_manual"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      machine_manual: fileList,
                    }));
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
    
            {/* PLC Programs Upload */}
            <Col span={6}>
              <Form.Item
                label="PLC Programs"
                name="plc_program"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      plc_program: fileList,
                    }));
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
    
            {/* HMI Program Upload */}
            <Col span={6}>
              <Form.Item
                label="HMI Program"
                name="hmi_program"
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList || []}
                rules={[]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={({ fileList }) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      hmi_program: fileList,
                    }));
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
    
          <Row gutter={16}>
          <Col span={8}>
              <Form.Item
                label="Consumables"
                name="consumables"
              >
                <Input
                  value={formData.consumables}
                  onChange={(e) =>
                    setFormData({ ...formData, consumables: e.target.value })
                  }
                  placeholder="Enter fixture number"
                />
              </Form.Item>
            </Col>
    
            {/* Fixture Number Input */}
            <Col span={8}>
              <Form.Item
                label="Fixture Number"
                name="fixture_numbers"
              >
                <Input
                  value={formData.fixture_number}
                  onChange={(e) =>
                    setFormData({ ...formData, fixture_number: e.target.value })
                  }
                  placeholder="Enter fixture number"
                />
              </Form.Item>
            </Col>


    
            {/* Gage Number Input */}
            <Col span={8}>
              <Form.Item
                label="Gage Number"
                name="gage_numbers"
              >
                <Input
                  value={formData.gage_number}
                  onChange={(e) =>
                    setFormData({ ...formData, gage_number: e.target.value })
                  }
                  placeholder="Enter gage number"
                />
              </Form.Item>
            </Col>
    
            {/* Tooling Number Input */}
            <Col span={8}>
              <Form.Item
                label="Tooling Number"
                name="tooling_numbers"
              >
                <Input
                  value={formData.tooling_number}
                  onChange={(e) =>
                    setFormData({ ...formData, tooling_number: e.target.value })
                  }
                  placeholder="Enter tooling number"
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
  <Button
    type="default" // You can use "default" for the "Previous" button style
    htmlType="button" // It's not a submit button
    onClick={()=>setStep(1)} // Replace with your logic for the previous action
  >
    Previous
  </Button>
  
  <Button
            type="primary"
            htmlType="submit"
            disabled={
              !formData.fixture_number ||
              !formData.gage_number ||
              !formData.tooling_number
            }
          >
            Next
          </Button>
</div>
        </Form>

        );
    
        
    case 3:
          return (
            <Form
            form={form}

            onValuesChange={handleFormChange}
            layout="vertical"
          >
  <Row gutter={[32, 32]} justify="start">
  {/* CPK Data Upload */}
  <Col span={12} style={{ paddingRight: 20 }}>
    <Form.Item
      label="CPK Data"
      name="cpk_data"
      valuePropName="fileList"
      getValueFromEvent={(e) => e?.fileList || []}
    >
      <Upload listType="picture-card" beforeUpload={() => false} maxCount={1}>
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>CPK</div>
        </div>
      </Upload>
    </Form.Item>
  </Col>

  {/* Validation Document Upload */}
  <Col span={12} style={{ paddingLeft: 20 }}>
    <Form.Item
      label="Validation Document"
      name="validation_document"
      valuePropName="fileList"
      getValueFromEvent={(e) => e?.fileList || []}
    >
      <Upload listType="picture-card" beforeUpload={() => false} maxCount={1}>
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Validation Document</div>
        </div>
      </Upload>
    </Form.Item>
  </Col>

  <Col span={12} style={{ paddingRight: 20 }}>
    <Form.Item
      label="Parameter Studies"
      name="parameter_studies"
      valuePropName="fileList"
      getValueFromEvent={(e) => e?.fileList || []}
    >
      <Upload listType="picture-card" beforeUpload={() => false} maxCount={1}>
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Parameter Studies</div>
        </div>
      </Upload>
    </Form.Item>
  </Col>


    <Col span={12} style={{ paddingRight: 20 }}>
    <Form.Item
      label="Operational Instruction"
      name="operation_instruction"
      valuePropName="fileList"
      getValueFromEvent={(e) => e?.fileList || []}
    >
      <Upload listType="picture-card" beforeUpload={() => false} maxCount={1}>
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Operational Instruction</div>
        </div>
      </Upload>
    </Form.Item>
  </Col>


           
            {/* Production Rate */}
            <Form.Item
              label="Production Rate"
              name="production_rate"
              style={{ flex: 1 }}
            >
              <Input
                type="text"
                value={formData.production_rate}
                onChange={(e) =>
                  setFormData({ ...formData, production_rate: e.target.value })
                }
                placeholder="Enter production rate"
              />
            </Form.Item>

            {/* Power Units */}
            <Form.Item
              label="Power Units"
              name="powerunits"
           
            >
              <Input
                type="text"
                value={formData.powerunits}
                onChange={(e) =>
                  setFormData({ ...formData, powerunits: e.target.value })
                }
                placeholder="Enter Power Units"
              />
            </Form.Item>
          
            </Row>

            {/* Buttons Section */}
<Form.Item>
  <Row justify="space-between" style={{ marginTop: '20px' }}>
    {/* Previous Page Button */}
    <Col>
      <Button type="primary" onClick={() => setStep(2)}>
        Previous Page
      </Button>
    </Col>

    {/* Validate Button */}
    <Col>
      <Button
        type="primary"
        htmlType="submit"
        onClick={async () => {

            try {
              await onFinish(); // 👈 Remove the parameter
              message.success("Form submitted successfully");
              setStep(3);
            } catch (error) {
              console.error("Form validation failed:", error);
              message.error("Please fill out all required fields.");
            }
          
        }}
      >
        Validate
      </Button>
      {showSuccessMsg && (
      <div
        style={{
          position: "fixed",
          top: "90px",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#e6fffb",
          border: "1px solid #87e8de",
          color: "#08979c",
          padding: "20px 30px",
          borderRadius: "12px",
          fontSize: "18px",
          fontWeight: "600",
          textAlign: "center",
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        ✅ Machine inserted successfully!
      </div>
    )}

    </Col>
  </Row>
</Form.Item>




          </Form>
          
          );
 
        

      default:
        return null;
    }
  };


  const next = () => {
    if (step < steps.length - 1) {
      setStep(prevStep => prevStep + 1);
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(prevStep => prevStep - 1);
    }
  };  
  return (

     
  <div>
      {/* Centered Card Container */}
      <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: 'calc(100vh - 112px)',
          }}>
            {/* Modern Card Design */}
            <div style={{ 
              width: '100%', 
              maxWidth: '800px',
           
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              padding: '32px',
              transition: 'all 0.3s',
              ':hover': {
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)'
              }
            }}>
              {/* Custom Step Indicator */}
              <Steps
                current={step}
                style={{
                  marginBottom: 48,
                }}
                responsive={false}
              >
                {steps.map((label, index) => (
                  <Step
                    key={label}
                    title={
                      <span style={{
                        fontSize: '14px',
                        fontWeight: index === step ? 600 : 400,
                        color: index <= step ? '#1890ff' : 'rgba(0, 0, 0, 0.45)'
                      }}>
                        {label}
                      </span>
                    }
                    status={
                      index < step
                        ? 'finish'
                        : index === step
                        ? 'process'
                        : 'wait'
                    }
                    icon={
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: index <= step ? '#1890ff' : 'rgba(0, 0, 0, 0.06)',
                          color: 'white',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          boxShadow: index === step ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
                          transition: 'all 0.3s'
                        }}
                      >
                        {index + 1}
                      </div>
                    }
                  />
                ))}
              </Steps>
  
              {/* Animated Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
  
             
            </div>
          </div>
     
      
  
      {/* Modern Modal for Station Details */}
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
        <Form.Item
          label={`Station ${index + 1}`}
          name={["stations", index, "station"]}
          rules={[{ required: true }]}
        >
          <TextArea />
        </Form.Item>
        <Form.Item
          label={`Description ${index + 1}`}
          name={["stations", index, "description"]}
        >
          <TextArea />
        </Form.Item>
        </div>
       ))}
      </Form> {/* 👆 Close Form component */}
     </Modal>
  
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
         rules={[{ required: true, message: 'Please enter product id' }]}
         >
        <Input 
        value={formData.product_id}
         onChange={e =>
          setFormData(prev => ({ ...prev, product_id: e.target.value }))
           }
         style={{ height: '40px', borderRadius: '6px' }} 
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
      <div key={index} style={{ /* your styles */ }}>
        <Form.Item
          label={`Station ${index + 1}`}
          name={["stations", index, "station"]}
          rules={[{ required: true }]}
        >
          <TextArea />
        </Form.Item>
        <Form.Item
          label={`Description ${index + 1}`}
          name={["stations", index, "description"]}
        >
          <TextArea />
        </Form.Item>
        </div>
       ))}
      </Form> {/* 👆 Close Form component */}
     </Modal>
  </div>
    
   
  );
};



export default AddMachineForm;

