import React, { useEffect, useRef, useState, useMemo  } from 'react';
import axios from 'axios';
import { PencilIcon, TrashIcon, ClockIcon,ArrowPathIcon, XMarkIcon  } from '@heroicons/react/24/solid';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-toastify';
import {
Tooltip
} from '@mui/material';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 

const Maintenancedetails = () => {
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null); // 'edit', 'delete', 'history'
  const [machines, setMachines]= useState([]);
  const [users, setUsers]= useState([]);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [filterMaintenanceType, setFilterMaintenanceType] = useState('');
  const [filterTaskName, setFilterTaskName] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [debouncedTaskName, setDebouncedTaskName] = useState('');
  const [modificationHistory, setModificationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [executors, setExecutors] = useState([]);
  const [editFormData, setEditFormData] = useState({
    start_date: null,
    end_date: null,
  });
  const [dateError, setDateError] = React.useState('');
  const formRef = useRef(null);
  const [filteredData, setFilteredData] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const filterRef = useRef(null);
 // Dynamically get unique maintenance types
  const maintenanceTypes = useMemo(() => {
    return Array.from(new Set(data.map(item => item.maintenance_type)));
  }, [data]);

    // Filtered data computation
// const filteredData = data.filter((item) => {
//   const matchesMaintenanceType =
//     !filterMaintenanceType || item.maintenance_type === filterMaintenanceType;

//   const matchesTaskName =
//     !debouncedTaskName || item.task_name?.toLowerCase().includes(debouncedTaskName.toLowerCase());

//   return matchesMaintenanceType && matchesTaskName;
// });


const filteredDataa = useMemo(() => {
  return data.filter((item) => {
    const matchesMaintenanceType =
      !filterMaintenanceType || item.maintenance_type === filterMaintenanceType;

    const matchesTaskName =
      !debouncedTaskName || item.task_name?.toLowerCase().includes(debouncedTaskName.toLowerCase());
    
    // Date filtering logic
    const itemStartDate = new Date(item.start_date);
    const itemEndDate = new Date(item.end_date);
    
    let matchesStartDate = true;
    let matchesEndDate = true;
    
    if (filterStartDate) {
      // Compare only the date part (ignore time)
      const filterStart = new Date(filterStartDate);
      filterStart.setHours(0, 0, 0, 0);
      const itemStart = new Date(itemStartDate);
      itemStart.setHours(0, 0, 0, 0);
      
      matchesStartDate = itemStart >= filterStart;
    }
    
    if (filterEndDate) {
      // Compare only the date part (ignore time)
      const filterEnd = new Date(filterEndDate);
      filterEnd.setHours(23, 59, 59, 999); // End of the day
      const itemEnd = new Date(itemEndDate);
      itemEnd.setHours(23, 59, 59, 999);
      
      matchesEndDate = itemEnd <= filterEnd;
    }

    return matchesMaintenanceType && matchesTaskName && matchesStartDate && matchesEndDate;
  });
}, [data, filterMaintenanceType, debouncedTaskName, filterStartDate, filterEndDate]);
const role = localStorage.getItem('role');
const managerId = localStorage.getItem('user_id');
 const creator = localStorage.getItem('user_id');


  // Close filter menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterOptions(false);
      }
    }

    if (showFilterOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterOptions]);

useEffect(() => {
  if (role === 'MANAGER' && managerId) {
    axios
      .get(`https://machine-backend.azurewebsites.net/ajouter/team-executors/${managerId}`)
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

useEffect(() => {
  if (searchQuery.trim() === '') {
    setFilteredData(data);
  } else {
    const filtered = data.filter(item => {
      const matchesSearch = 
        item.task_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.task_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.task_status?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesMaintenanceType = !filterMaintenanceType || item.maintenance_type === filterMaintenanceType;
      const matchesTaskName = !debouncedTaskName || item.task_name?.toLowerCase().includes(debouncedTaskName.toLowerCase());
      
      return matchesSearch && matchesMaintenanceType && matchesTaskName;
    });
    setFilteredData(filtered);
  }
}, [searchQuery, data, filterMaintenanceType, debouncedTaskName]);
  // Fetch Maintenance
useEffect(() => {
  let isMounted = true;
  const fetchMaintenance = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const role = localStorage.getItem('role'); 
      const response = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/maintenancee?userId=${userId}&role=${role}`);
      if (isMounted) {
        setData(response.data);
        setFilteredData(response.data); // Initialize filteredData with fetched data
        console.log('Maintenance data:', response.data);
      }
    } catch (error) {
      console.error("Error fetching maintenance data:", error);
    }
  };
  fetchMaintenance();

  return () => {
    isMounted = false;
  };
}, []);



  // Fetch Machines
  useEffect(() => {
    let isMounted = true;
    const fetchMachines = async () => {
      try {
        const response = await axios.get('https://machine-backend.azurewebsites.net/ajouter/machines');
        if (isMounted) {
          setMachines(response.data);
        }
      } catch (error) {
        console.error("Error fetching machines data:", error);
      }
    };
    fetchMachines();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Users
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://machine-backend.azurewebsites.net/ajouter/users');
        if (isMounted) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error("Error fetching users data:", error);
      }
    };
    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedTaskName(filterTaskName);
  }, 300); // 300ms debounce

  return () => clearTimeout(handler);
}, [filterTaskName]);


// Reset history when opening modal


useEffect(() => {
  const fetchHistory = async () => {
    if (modalType === 'history' && selectedItem?.id) {
      setLoadingHistory(true);
      try {
        const response = await axios.get(
          `https://machine-backend.azurewebsites.net/ajouter/maintenance/${selectedItem.id}/history`
        );
        setModificationHistory(response.data);
        console.log('history', response.data);
      } catch (error) {
        console.error("Error fetching history:", error);
        toast.error("Failed to load history");
      }
      setLoadingHistory(false);
    }
  };

  fetchHistory();
}, [modalType, selectedItem?.id]);

  // Populate form when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setEditFormData({
        start_date: selectedItem.start_date ? new Date(selectedItem.start_date) : null,
        end_date: selectedItem.end_date ? new Date(selectedItem.end_date) : null,
      });
    }
  }, [selectedItem]);

    const openModal = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
  };

  


    const openModaldelete = (item, actionType) => {
    if (actionType === 'delete') {
      setItemToDelete(item);
      setShowModal(true);
    }
  };
  // Modified closeModal function
  const closeModal = () => {
    if (modalType !== 'history') {
      setSelectedItem(null);
      setModalType(null);
    } else {
      // Keep selectedItem for history to persist
      setModalType(null);
      setTimeout(() => setSelectedItem(null), 300); // Clear after modal animation
    }
  };

 {/*getmachine_name*/}
   const getMachineName = (id) => {
    const machine = machines.find((m) => m.machine_id === id || m.machine_id=== id);
    return machine ? machine.machine_name || machine.machine_name : 'Unknown';
  };

   {/*getCreatorName*/}
   const getUserName = (id) => {
    const Users = users.find((m) => m.user_id === id || m.user_id=== id);
    return Users ? Users.email || Users.email : 'Unknown';
  };
 
   
   const  handleDelete = async () => {
    try {
      const userId = localStorage.getItem('user_id')
      const response = await axios.delete(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${itemToDelete.id}`, {
        data: { user_id: userId },  // Add the user ID here
      });
      console.log(response.data.message);
      setShowModal(false);
      setData((prevData) =>
      prevData.filter((item) => item.id !== itemToDelete.id)
    );

    } catch (error) {
      console.error('Error deleting task:', error);
      // Handle error (maybe show a toast message)
    }
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  const form = formRef.current;
  const UserId = localStorage.getItem('user_id');

  try {
  const startDate = editFormData.start_date;
  const endDate = editFormData.end_date;


    
  if (!startDate || !endDate) {
    setDateError('Start and End dates are required.');
    return;
  }

    // Check if start date is after end date
   if (startDate > endDate) {
    setDateError('Start date cannot be later than End date.');
    return; // Stop submission
  }

    const status = form.task_status.value;
    const completed_date = status === 'Complete' ? new Date().toISOString().split('T')[0] : null;
   const assignedToValue = form.assigned_to.value || localStorage.getItem("user_id");
   const toLocalISOString = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
    // Step 1: Send the PUT request
    await axios.put(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${selectedItem.id}`, {
      maintenance_type: form.maintenance_type.value,
      task_name: form.task_name.value,
      task_description: form.task_description.value,
      completed_date,
      status,
      assigned_to: assignedToValue ? parseInt(assignedToValue, 10) : null,
      machine_id: form.machine_id.value,
      creator: selectedItem.creator,
      start_date: toLocalISOString(editFormData.start_date),
      end_date: toLocalISOString(editFormData.end_date),
      user_id: UserId
    });

    // Refresh maintenance list and history as before
    const maintenanceResponse = await axios.get('https://machine-backend.azurewebsites.net/ajouter/maintenance');
    setData(maintenanceResponse.data);

    const historyResponse = await axios.get(
      `https://machine-backend.azurewebsites.net/ajouter/maintenance/${selectedItem.id}/history`
    );

    const parsedHistory = historyResponse.data.map(record => ({
      ...record,
      changes: typeof record.changes === 'string'
        ? JSON.parse(record.changes)
        : record.changes,
    }));

    setModificationHistory(parsedHistory);

    closeModal();

    toast.success('Maintenance task updated successfully!', {
      position: "bottom-right",
      style: { marginBottom: '60px' },
    });
  } catch (error) {
    console.error('Failed to update maintenance task:', error);
    setSuccessMessage('Error updating maintenance task');
  }
};



const getUserEmail = (userId) => {
  const user = users.find(u => u.user_id === userId);
  if (user && user.email) {
    return user.email.split('@')[0]; 
  }
  return "Unknown User";
};
 
  {/*Tooltip*/}
// Update the renderTextWithTooltips function
const renderTextWithTooltips = (text) => {
  if (!text) return null;

  return (
    <Tooltip
      title={
        <div
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: '0.875rem',
            maxWidth: '300px',
            padding: '0.5rem',
            lineHeight: 1.4,
            backgroundColor: '#f5f5f5', // your custom gray
            borderRadius: '8px',
            color: '#333',
          }}
        >
          {text}
        </div>
      }
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: 'transparent', // removes MUI default dark background
            boxShadow: 'none', // removes default shadow
            padding: 0, // prevent extra space
          },
        },
      }}
    >
      <span className="truncate max-w-[150px] inline-block cursor-pointer">
        {text}
      </span>
    </Tooltip>
  );
};


const formatDateLocal = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};


return (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="relative flex-1 mx-4 pb-9 ">
  <input
    type="text"
    placeholder="Search tasks..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  <svg
    className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
</div>
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Maintenance Records</h2>
<div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">

  <div className="flex items-center gap-4">
    
    {/* Start Date */}
    <div>
      <label className="block mb-1 text-gray-600">Start Date:</label>
      <DatePicker
        selected={filterStartDate}
        onChange={(date) => setFilterStartDate(date)}
        selectsStart
        startDate={filterStartDate}
        endDate={filterEndDate}
        className="w-full rounded border border-gray-300 px-3 py-2"
        placeholderText="Select start date"
      />
    </div>

    {/* End Date */}
    <div>
      <label className="block mb-1 text-gray-600">End Date:</label>
      <DatePicker
        selected={filterEndDate}
        onChange={(date) => setFilterEndDate(date)}
        selectsEnd
        startDate={filterStartDate}
        endDate={filterEndDate}
        minDate={filterStartDate}
        className="w-full rounded border border-gray-300 px-3 py-2"
        placeholderText="Select end date"
      />
    </div>

  </div>
</div>

  </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {["Maintenance Type", "Task Name", "Task Description", "Completed Date", "Task Status", "Assigned Person", "Creator", "Start Date", "End Date", "Machine Details", "Actions"].map((header) => (
                <th key={header} className="px-2 py-2 text-left font-medium text-gray-900 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDataa.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1 text-gray-900 font-medium">{item.maintenance_type}</td>
                <td className="px-2 py-1 text-gray-900 font-medium truncate max-w-[120px]">{item.task_name}</td>
                <td className="px-2 py-1 text-gray-600 truncate max-w-[150px]">{renderTextWithTooltips(item.task_description)}</td>
                <td className="px-2 py-1 text-gray-600">
                  {item.completed_date ? new Date(item.completed_date).toLocaleDateString() : '-'}
                </td>
                <td className="px-2 py-1">
                  <span className={`inline-flex items-center px-1.5 py-0.3 rounded-full text-[0.75rem] ${
                    item.task_status === 'Complete' ? 'bg-green-100 text-green-800' :
                    item.task_status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.task_status}
                  </span>
                </td>
                <td className="px-2 py-1 text-gray-600 truncate max-w-[100px]">{getUserName(item.assigned_to)}</td>
                <td className="px-2 py-1 text-gray-600 truncate max-w-[100px]">{getUserName(item.creator)}</td>
                <td className="px-2 py-1 text-gray-600">{new Date(item.start_date).toLocaleString()}</td>
                <td className="px-2 py-1 text-gray-600">{new Date(item.end_date).toLocaleString()}</td>
                <td className="px-2 py-1 text-gray-600 truncate max-w-[100px]">{getMachineName(item.machine_id)}</td>
                <td className="px-2 py-1 text-gray-600">
                  <div className="flex items-center gap-1">
               {item.task_status !== 'Completed' && (
           <button 
             onClick={() => openModal(item, 'edit')}
             className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-50"
            >
             <PencilIcon className="w-4 h-4" />
            </button>
             )}
                  {item.task_status !== 'Completed' && (
                  <button
        onClick={() => openModaldelete(item, 'delete')}
        className="text-red-600 hover:text-red-800 p-0.5 rounded hover:bg-red-50"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
           )}
         <button
                      onClick={() => openModal(item, 'history')}
                      className="text-gray-600 hover:text-gray-800 p-0.5 rounded hover:bg-gray-50"
                    >
                      <ClockIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

             
     <Dialog open={!!modalType} onClose={closeModal} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold flex items-center gap-2">
              {modalType === 'edit' && <PencilIcon className="w-5 h-5 text-blue-600" />}
              {modalType === 'history' && <ClockIcon className="w-5 h-5 text-gray-600" />}
              {modalType} Maintenance Task
            </Dialog.Title>
            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {selectedItem && (
              <>
                {modalType === 'history' && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><strong>Task Name:</strong> {selectedItem.task_name}</p>
                      <p><strong>Description:</strong> {selectedItem.task_description}</p>
                      <p><strong>Maintenance Type:</strong> {selectedItem.maintenance_type}</p>
                      <p><strong>Task Status:</strong> {selectedItem.task_status}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Start Date:</strong> {new Date(selectedItem.start_date).toLocaleDateString()}</p>
                      <p><strong>End Date:</strong> {new Date(selectedItem.end_date).toLocaleDateString()}</p>
                      <p><strong>Completed Date:</strong> {selectedItem.completed_date ? new Date(selectedItem.completed_date).toLocaleDateString() : '-'}</p>
                      <p><strong>Machine:</strong> {getMachineName(selectedItem.machine_id)}</p>
                    </div>
                    <div className="col-span-2">
                      <p><strong>Assigned To:</strong> {getUserName(selectedItem.assigned_to)}</p>
                      <p><strong>Created By:</strong> {getUserName(selectedItem.creator)}</p>
                    </div>
                   {/* Modification History Section */}
 <div className="col-span-2 border-t pt-4">
      <h3 className="font-medium mb-3">Modification History</h3>
      
      {loadingHistory ? (
        <div className="text-center py-4">
          <ArrowPathIcon className="w-5 h-5 animate-spin inline-block" />
        </div>
      ) : modificationHistory.length === 0 ? (
        <p className="text-gray-500 text-sm">No modification history found</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {modificationHistory.map((record, index) => {
            // Filter out unchanged fields
            const changedFields = Object.entries(record.changes).filter(
              ([field, values]) => values.old !== values.new
            );
            
            // Skip rendering if no actual changes
            if (changedFields.length === 0) return null;
            
            return (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>
                    {new Date(record.action_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>Modified by: {record.modified_by}</span>
                </div>
                
                <div className="space-y-1 text-sm">
                  {changedFields.map(([field, values]) => {
             const formatValue = (value, field) => {
  if (field === 'machine_id') return getMachineName(value);
  if (field === 'assigned_to' || field === 'creator') return getUserName(value);
  if (field.endsWith('_date')) {
    return value
      ? new Date(value).toLocaleString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';
  }
  return value;
};


                    return (
                      <div key={field} className="flex flex-wrap gap-2 items-baseline">
                        <span className="font-medium capitalize">
                          {field.replace(/_/g, ' ')}:
                        </span>
                        {values.old !== null && (
                          <span className="text-gray-600 line-through pr-2">
                            {formatValue(values.old, field) || 'N/A'}
                          </span>
                        )}
                        <span className="text-gray-900 font-medium">
                          {formatValue(values.new, field)}
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
                )}

                {modalType === 'edit' && (
                  <form className="space-y-4"  ref={formRef} onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col" style={{ zIndex: 100 }}>
        <label className="text-gray-700 font-medium mb-1">Start Date & Time</label>
        <DatePicker
          selected={editFormData.start_date}
          onChange={(date) =>
            setEditFormData((prev) => ({ ...prev, start_date: date }))
          }
          showTimeSelect
          timeIntervals={15}
          timeCaption="Time"
          dateFormat="MMMM d, yyyy h:mm aa"
          className="w-60 px-2 py-1 border rounded focus:outline-none focus:ring"
          autoComplete="off"
          placeholderText="Select start date & time"
        />
      </div>

      <div className="flex flex-col mt-4" style={{ zIndex: 100 }}>
        <label className="text-gray-700 font-medium mb-1">End Date & Time</label>
        <DatePicker
          selected={editFormData.end_date}
          onChange={(date) =>
            setEditFormData((prev) => ({ ...prev, end_date: date }))
          }
          showTimeSelect
          timeIntervals={15}
          timeCaption="Time"
          dateFormat="MMMM d, yyyy h:mm aa"
          className="w-60 px-2 py-1 border rounded focus:outline-none focus:ring"
          autoComplete="off"
          placeholderText="Select end date & time"
        />
      </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">Maintenance Type</label>
                   <select
                    name="maintenance_type"
                   defaultValue={selectedItem.maintenance_type}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
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
                  <option value="AlignmentCheck">Alignment Check</option>
                   <option value="EmergencyStopFunctionTest">Emergency Stop Function Test</option>
                  <option value="PneumaticSystemInspection">Pneumatic System Inspection</option>
                  <option value="HydraulicSystemInspection">Hydraulic System Inspection</option>
                  <option value="PowerSupplyCheck">Power Supply Check</option>
                   </select>
                   </div>
                   <div>
                        <label className="block text-sm font-medium text-gray-700">Task Name</label>
                        <input
                          name="task_name"
                          type="text"
                          defaultValue={selectedItem.task_name}
                          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        />
                      </div>

                       <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Task Description</label>
                        <textarea
                           name="task_description"
                          defaultValue={selectedItem.task_description}
                          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                          rows="8"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Task Status</label>
                        <select
                          name="task_status"  
                          defaultValue={selectedItem.task_status}
                           disabled
                          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        >
                          <option value="Pending">Pending</option>
                          <option value="escalated">Escalated</option>
                          <option value="Complete">Complete</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Machine</label>
                        <select
                          name="machine_id" 
                          defaultValue={selectedItem.machine_id}
                          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        >
                          {machines.map(machine => (
                            <option key={machine.machine_id} value={machine.machine_id}>
                              {machine.machine_name}
                            </option>
                          ))}
                        </select>
                      </div>
                           <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                        <select
                         name="assigned_to"
                         defaultValue={selectedItem.assigned_to?.toString() ?? localStorage.getItem("user_id")}
                          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                        >
                           {executors.map((user) => (
                          <option key={user.user_id} value={user.user_id}>
                          {user.email.split('@')[0]}
                          </option>
                         ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        Update
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  {successMessage && (
    <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
      {successMessage}
    </div>
  )}
    
      {/* Delete Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            <p>Are you sure you want to delete this maintenance task?</p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => handleDelete(item)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      
  </div>
);
};

export default Maintenancedetails;
