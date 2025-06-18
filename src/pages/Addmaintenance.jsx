import { useState, useRef, useEffect } from "react";
import { message, Modal } from 'antd';
import { useModal } from "../hooks/useModal";
import axios from "axios";
import DatePicker from 'react-datepicker';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Box,
  Avatar,
} from "@mui/material";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';

const Addmaintenance =()=>{
const [users, setUsers] = useState([]);
const [formData, setFormData] = useState({
  maintenance_type: '',
  task_name: '',
  task_description: '',
  task_status: '',
  assigned_to: '',
  start_date: null,
  end_date: null,
  completed_date: null,
  machine_id: '',
});
 const [isEditMode, setIsEditMode] = useState(false);
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'success', // or 'error', 'warning', etc.
});
const [loading, setLoading] = useState(true);
const [events, setEvents] = useState([]);
const [selectedEvent, setSelectedEvent] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false); 
const [isEditing, setIsEditing] = useState(false);
const [eventTitle, setEventTitle] = useState("");
const [eventStartDate, setEventStartDate] = useState(null);
const [eventEndDate, setEventEndDate] = useState(null);
const [successMessage, setSuccessMessage] = useState('');const [openSnackbar, setOpenSnackbar] = useState(false);
const [machines, setMachines] = useState([]);
const [executors, setExecutors] = useState([]);

console.log("Selected event:", selectedEvent);


const role = localStorage.getItem('role');
const managerId = localStorage.getItem('user_id');
 const creator = localStorage.getItem('user_id');

  useEffect(() => {
      axios.get('http://localhost:4000/ajouter/users')
        .then(res => {
          setUsers(res.data);
        })
        .catch(err => console.error('Failed to fetch users:', err));
    }, []);
  
useEffect(() => {
  if (role === 'MANAGER' && managerId) {
    axios
      .get(`http://localhost:4000/ajouter/team-executors/${managerId}`)
      .then((res) => {
        setExecutors(res.data.executors || []);
      })
      .catch((err) => {
        console.error('Failed to fetch executors:', err);
        setExecutors([]);
      });
  } else {
    setExecutors([]);
  }
}, [role, managerId]);


const fetchMaintenanceEvents = async () => {
  try {
    const response = await axios.get('http://localhost:4000/ajouter/maintenance');
    
    const formattedEvents = response.data.map(ev => {
      // Convert to Date objects
      const startDate = new Date(ev.start);
      const endDate = new Date(ev.end);
      
      // Add 1 day to end date for FullCalendar display
      endDate.setDate(endDate.getDate() + 1);

      return {
        id: ev.id,
        title: ev.task_name,
        start: startDate,
        end: endDate,
        allDay: true,
        extendedProps: {
          maintenance_type: ev.maintenance_type,
          task_description: ev.task_description,
          assigned_to: ev.assigned_to,
          task_status: ev.task_status,
          machine_id: ev.machine_id
        }
      };
    });

    setEvents(formattedEvents);
  } catch (error) {
    console.error("Failed to fetch maintenance events:", error);
    setSnackbar({ 
      open: true, 
      message: "Error loading maintenance tasks", 
      severity: "error" 
    });
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchMaintenanceEvents();
}, []);



  useEffect(() => {
  fetch('http://localhost:4000/ajouter/machines')
    .then((response) => response.json())
    .then((data) => setMachines(data))
    .catch((error) => console.error('Error fetching machines:', error));
}, []);

      
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
  


const fetchHistory = async (id) => {
  if (!id) return;
  setLoadingHistory(true);
  try {
    const response = await axios.get(
      `http://localhost:4000/ajouter/maintenance/${id}/history`
    );
    setModificationHistory(response.data);
  } catch (error) {
    toast.error("Failed to load history");
  }
  setLoadingHistory(false);
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const user_id = localStorage.getItem('user_id');

const payload = {
  ...formData,
  creator: user_id,
  user_id: user_id,
  start_date: formData.start_date,
  end_date: formData.end_date,
};


  try {
    const response = await fetch('http://localhost:4000/ajouter/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
 console.log('response', response.data);
    const result = await response.json();

    // Update UI
    setEvents((prev) => [
      ...prev,
      {
        id: result._id, // assuming backend returns the created event with _id
        title: formData.task_name,
        start: formData.start_date,
        end: new Date(new Date(formData.end_date).setDate(new Date(formData.end_date).getDate() + 1)),
        allDay: true, 
        extendedProps: {
          maintenance_type: formData.maintenance_type,
          task_description: formData.task_description,
          assigned_to: formData.assigned_to,
          task_status: formData.task_status,
        }
      }
    ]);
 toast.success('Maintenance task added successfully!', {
    position: "bottom-right",
    style: { marginBottom: '60px' } // adjust distance from bottom
   });
    // ✅ Reset form fields directly
    setFormData({
      maintenance_type: '',
      task_name: '',
      task_description: '',
      task_status: '',
      assigned_to: '',
      start_date: null,
      end_date: null,
      completed_date: null,
      machine_id: '',
    });


  } catch (err) {
    console.error(err);
    setSnackbar({ open: true, message: "Error submitting maintenance task", severity: "error" });
  }
};

  // Handle success messages
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close the Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

const handleEventClick = (clickInfo) => {
  const event = clickInfo.event;
  const endDate = new Date(event.end);
  endDate.setDate(endDate.getDate() - 1); // Subtract 1 day for display

  setSelectedEvent({
    id: event.id,
    title: event.title,
    start: event.start?.toISOString().split("T")[0] || "",
    end: endDate.toISOString().split("T")[0], // Show original end date
    maintenance_type: event.extendedProps.maintenance_type,   
    task_name: event.extendedProps.task_name,
    task_description: event.extendedProps.task_description,
    assigned_to: event.extendedProps.assigned_to,
    task_status: event.extendedProps.task_status,
  });
  setIsModalOpen(true);
};
    
    const resetModalFields = () => {
      setEventTitle("");
      setEventStartDate("");
      setEventEndDate("");
      setEventLevel("");
      setSelectedEvent(null);
    };
  

    //open the modal 
      
const openModal = () => setIsModalOpen(true);
const closeModal = () => {
  setIsModalOpen(false);
  setIsEditing(false);
};

const getUserEmail = (userId) => {
  const user = users.find(u => u.user_id === userId);
  if (user && user.email) {
    return user.email.split('@')[0]; 
  }
  return "Unknown User";
};


const adjustedEvents = events.map(ev => ({
  ...ev,
  end: ev.end
    ? new Date(new Date(ev.end).setDate(new Date(ev.end).getDate() + 1)).toISOString().split('T')[0]
    : undefined,
}));


  if (loading) {
    return <div>Loading maintenance calendar...</div>; // ✅ block calendar until events are ready
  }

return (
  <div style={{ display: 'flex', gap: '0.4rem', padding: '1rem', maxWidth: '100%' }}>

{/* Calendar Section */}
  <div style={{
    flex: 3, // Increase this to make calendar bigger
    backgroundColor: '#fff',
    padding: '1rem',
    borderRadius: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }}>
  <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#1f2937' }}>
        Calendar
  </h3>
      

<FullCalendar
  plugins={[dayGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  selectable={true}
  firstDay={1}
  locale="en-GB"
  eventTimeFormat={false}
  events={events} // Use the directly fetched and adjusted events
  eventDisplay="block"
  eventDidMount={(info) => {
    info.el.style.backgroundColor = '#3b82f6';
    info.el.style.borderColor = '#2563eb';
  }}
  eventClick={handleEventClick}
  dateClick={info => {
    const clickedDate = new Date(info.date);
    clickedDate.setHours(0, 0, 0, 0);

    if (!formData.start_date || (formData.start_date && formData.end_date)) {
      setFormData({
        start_date: clickedDate,
        end_date: null,
        // ... other form fields
      });
    } else if (clickedDate >= formData.start_date) {
      setFormData(prev => ({
        ...prev,
        end_date: clickedDate,
      }));
    }
  }}
/>



    </div>
    
{/* Form Section */}
<div style={{
  flex: 1,
  maxWidth: 300,
  backgroundColor: '#fff',
  width: '100%',
  maxWidth: '900px', // Optional max width
  margin: '0 auto', // Center the form horizontally
  padding: '1rem',
  borderRadius: 16,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}}>
  <form onSubmit={handleSubmit}>
    <h1
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        paddingBottom: '2.5rem',
      }}
    >
      Add Maintenance
    </h1>

    {/* Date Pickers */}
 <div
  className="flex items-end space-x-4 p-2 bg-white shadow rounded-lg"
  style={{ position: 'relative', zIndex: 50, marginBottom: '1rem' }}
>
  {/* Start DateTime Picker */}
  <div className="flex flex-col" style={{ zIndex: 100 }}>
    <label className="text-gray-700 font-medium mb-1">Start Date & Time</label>
    <DatePicker
      selected={formData.start_date}
      onChange={(date) => setFormData((prev) => ({ ...prev, start_date: date }))}
      showTimeSelect
      showTimeSelectOnly={false} // Ensures both date and time
      timeIntervals={15}
      timeCaption="Time"
      dateFormat="MMMM d, yyyy h:mm aa"
      placeholderText="Select start date & time"
      className="w-60 px-2 py-1 border rounded focus:outline-none focus:ring"
     
      autoComplete="off"
    />
  </div>

  {/* End DateTime Picker */}
  <div className="flex flex-col" style={{ zIndex: 100 }}>
    <label className="text-gray-700 font-medium mb-1">End Date & Time</label>
    <DatePicker
      selected={formData.end_date}
      onChange={(date) => setFormData((prev) => ({ ...prev, end_date: date }))}
      showTimeSelect
      showTimeSelectOnly={false}
      timeIntervals={15}
      timeCaption="Time"
      dateFormat="MMMM d, yyyy h:mm aa"
      placeholderText="Select end date & time"
      className="w-60 px-2 py-1 border rounded focus:outline-none focus:ring"
      autoComplete="off"
    />
  </div>
</div>


    {/* Form Fields Grid */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        padding: '0.5rem 0',
      }}
    >
      {/* Task Name */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}>
          Task Name
        </label>
        <input
          type="text"
          name="task_name"
          value={formData.task_name}
          onChange={handleChange}
          required
          style={{
            marginTop: '0.2rem',
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '0.3rem 0.5rem',
            fontSize: '0.875rem',
          }}
        />
      </div>

      {/* Maintenance Type */}
      <div style={{ position: 'relative', overflow: 'visible', zIndex: 10 }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}>
          Maintenance Type
        </label>
        <select
          name="maintenance_type"
          value={formData.maintenance_type}
          onChange={handleChange}
          required
          style={{
            marginTop: '0.3rem',
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '0.3rem 0.5rem',
            fontSize: '0.875rem',
            backgroundColor: '#fff',
            zIndex: 1000,
          }}
        >
          <option value="">Select type</option>
          <option value="MechanicalInspection">Mechanical Inspection</option>
          <option value="Electrical Inspection">Electrical Inspection</option>
          <option value="Lubrication">Lubrication</option>
          <option value="Calibration">Calibration</option>
          <option value="Cleaning">Cleaning</option>
          <option value="SoftwareUpdate">Software Update</option>
          <option value="FilterReplacement">Filter Replacement</option>
          <option value="CoolantSystemCheck">Coolant System Check</option>
          <option value="Vibration Analysis">Vibration Analysis</option>
          <option value="CarbonDustExtractionSystemCheck">Carbon Dust Extraction System Check</option>
          <option value="ConveyorSystemCheck">Conveyor System Check</option>
          <option value="SafetySensorCheck">Safety Sensor Check</option>
          <option value="TemperatureControlSystemInspection">Temperature Control System Inspection</option>
        </select>
      </div>

      {/* Machine Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}>
          Machine
        </label>
        <select
          name="machine_id"
          value={formData.machine_id}
          onChange={handleChange}
          required
          style={{
            marginTop: '0.3rem',
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '0.3rem 0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <option value="">Select machine</option>
          {machines.map((machine) => (
            <option key={machine.machine_id} value={machine.machine_id}>
              {machine.machine_name} {machine.machine_ref}
            </option>
          ))}
        </select>
      </div>

      {/* Executor */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}>
          Assigned To
        </label>
      <select
      name="assigned_to"
     value={formData.assigned_to}
     onChange={handleChange}
     required
  style={{
    marginTop: '0.3rem',
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0.3rem 0.5rem',
    fontSize: '0.875rem',
  }}
>
  <option value="">Select</option>
  {executors.map((user) => (
    <option key={user.user_id} value={user.user_id}>
      {user.email.split('@')[0]}
    </option>
  ))}
</select>

      </div>

      {/* Task Description */}
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: '#374151' }}>
          Task Description
        </label>
        <textarea
          name="task_description"
          value={formData.task_description}
          onChange={handleChange}
          rows="6"
          style={{
            marginTop: '0.3rem',
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '0.5rem',
            fontSize: '0.875rem',
            resize: 'vertical',
          }}
          required
        />
      </div>
    </div>

    {/* Submit Button */}
    <button
      type="submit"
      style={{
        marginTop: '1.5rem',
        width: '100%',
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '0.6rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        border: 'none',
        transition: 'background-color 0.3s ease',
      }}
      onMouseOver={(e) => (e.target.style.backgroundColor = '#1e40af')}
      onMouseOut={(e) => (e.target.style.backgroundColor = '#2563eb')}
    >
      Submit Task
    </button>
  </form>
</div>


      <Modal
           title="Maintenance Task Details"
           open={isModalOpen}
           onCancel={closeModal}
           footer={null}
           destroyOnClose
         >
      {selectedEvent && !isEditing ? (
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Task:</strong> {selectedEvent.task_name}</p>
          <p><strong>Task_description:</strong> {selectedEvent.task_description}</p>
          <p><strong>Maintenance Type:</strong> {selectedEvent.maintenance_type}</p>
          <p><strong>Scheduled:</strong> {selectedEvent.start}</p>
        </div>
      ) : (
        <form className="space-y-2 text-sm text-gray-700">

   <div className="flex flex-col gap-4">
      {/* Start & End Date Pickers in one row */}
      <div className="flex flex-row gap-6">
        {/* Start Date */}
        <div className="flex-1">
          <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
          <DatePicker
            selected={eventStartDate ? new Date(eventStartDate) : null}
            onChange={(date) => setEventStartDate(date.toISOString())}
            dateFormat="dd MMM yyyy"
            placeholderText="Select start date"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* End Date */}
  <div className="flex-1">
  <label className="block font-medium text-gray-600 mb-1 text-sm">End Date</label>
  <DatePicker
    selected={eventEndDate ? new Date(eventEndDate) : null}
    onChange={(date) => setEventEndDate(date.toISOString())}
    dateFormat="dd MMM yyyy"
    placeholderText="Select end date"
    className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
    required
  />
</div>

      </div>
    </div>
    
          <div>
            <label className="block font-semibold">Task</label>
            <input
              className="border w-full rounded p-1"
               value={selectedEvent?.task_name|| ""}
              onChange={(e) =>
                setSelectedEvent((prev) => ({
                  ...prev,
                  task_name: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="block font-semibold">Maintenance Type</label>
            <input
              className="border w-full rounded p-1"
              value={selectedEvent?.maintenance_type || ""}
              onChange={(e) =>
                setSelectedEvent((prev) => ({
                  ...prev,
                  maintenance_type: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="block font-semibold">Task_description</label>
            <textarea
              className="border w-full rounded p-1"
              value={selectedEvent?.task_description || ""}
              onChange={(e) =>
                setSelectedEvent((prev) => ({
                  ...prev,
                  task_description: e.target.value,
                }))
              }
            />
          </div>

         <div className="text-right">
<button
  onClick={async (e) => {
    e.preventDefault();

    try {
      console.log("Selected Event ID:", selectedEvent?.id);

      const parsedCreator = parseInt(creator, 10);
      if (!Number.isInteger(parsedCreator)) {
        console.error("Invalid creator ID:", creator);
        return;
      }

      if (!eventStartDate || !eventEndDate) {
        console.error("Start date or end date is missing");
        return;
      }

      // Convert to ISO format if needed
      const formattedStartDate = new Date(eventStartDate).toISOString();
      const formattedEndDate = new Date(eventEndDate).toISOString();

      const payload = {
        title: eventTitle,
        maintenance_type: selectedEvent.maintenance_type,
        task_name: selectedEvent.task_name,
        task_description: selectedEvent.task_description,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        task_status: selectedEvent.task_status,
        assigned_to: selectedEvent.assigned_to,
        creator: parsedCreator,
        completed_date: null,
        user_id: parsedCreator,
      };

      console.log("Payload being sent:", payload);

      const response = await fetch(
        `http://localhost:4000/ajouter/maintenance/${selectedEvent.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        console.log("Maintenance updated successfully");

        setSnackbar({
          open: true,
          message: `Maintenance updated successfully`,
          severity: "success",
        });
          await fetchMaintenanceEvents(); 
      } else {
        const errorText = await response.text();
        console.error("Failed to update maintenance:", errorText);
      }
       
      setIsEditing(false);
      closeModal();

      
    } catch (error) {
      console.error("Error updating maintenance:", error);
    }
  }}
  className="bg-blue-500 text-white px-3 py-1 rounded"
>
  Update
</button>


    </div>
    
        </form>
      )}
    </Modal>

      <Snackbar
  open={snackbar.open}
  autoHideDuration={3000}
  onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
>
  <Alert
    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
    severity={snackbar.severity}
    sx={{ width: '100%' }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>

  </div>
);





}
 
  

export default Addmaintenance;
