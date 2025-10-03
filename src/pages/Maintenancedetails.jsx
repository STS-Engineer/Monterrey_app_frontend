import React, { useEffect, useRef, useState, useMemo } from 'react';
import axios from 'axios';
import { PencilIcon, TrashIcon, ClockIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/solid';
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
  const [modalType, setModalType] = useState(null);
  const [machines, setMachines] = useState([]);
  const [users, setUsers] = useState([]);
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

  // Recurrence state
  const [recurrence, setRecurrence] = useState({
    frequency: '',
    interval: 1,
    weekdays: [],
    monthly_day: null,
    monthly_ordinal: null,
    monthly_weekday: null,
    yearly_mode: null,
    yearly_day: null,
    yearly_month: null,
    yearly_ordinal: null,
    yearly_weekday: null,
    recurrence_end_date: null
  });

  const maintenanceTypes = useMemo(() => {
    return Array.from(new Set(data.map(item => item.maintenance_type)));
  }, [data]);

  const filteredDataa = useMemo(() => {
    return data.filter((item) => {
      const matchesMaintenanceType =
        !filterMaintenanceType || item.maintenance_type === filterMaintenanceType;

      const matchesTaskName =
        !debouncedTaskName || item.task_name?.toLowerCase().includes(debouncedTaskName.toLowerCase());
      
      const itemStartDate = new Date(item.start_date);
      const itemEndDate = new Date(item.end_date);
      
      let matchesStartDate = true;
      let matchesEndDate = true;
      
      if (filterStartDate) {
        const filterStart = new Date(filterStartDate);
        filterStart.setHours(0, 0, 0, 0);
        const itemStart = new Date(itemStartDate);
        itemStart.setHours(0, 0, 0, 0);
        matchesStartDate = itemStart >= filterStart;
      }
      
      if (filterEndDate) {
        const filterEnd = new Date(filterEndDate);
        filterEnd.setHours(23, 59, 59, 999);
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
          setFilteredData(response.data);
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
    }, 300);

    return () => clearTimeout(handler);
  }, [filterTaskName]);

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
 // Update this useEffect in your frontend component
// Update this in your useEffect that initializes recurrence
// Update the recurrence initialization
useEffect(() => {
  if (selectedItem) {
    setEditFormData({
      start_date: selectedItem.start_date ? new Date(selectedItem.start_date) : null,
      end_date: selectedItem.end_date ? new Date(selectedItem.end_date) : null,
    });
    
    // Determine yearly_mode based on existing data
    let yearly_mode = null;
    if (selectedItem.recurrence === 'yearly') {
      if (selectedItem.yearly_ordinal && selectedItem.yearly_weekday) {
        yearly_mode = 'weekday';
      } else {
        yearly_mode = 'day';
      }
    }
    
    const recurrenceData = selectedItem.recurrence ? {
      frequency: selectedItem.recurrence || '',
      interval: selectedItem.interval || 1,
      weekdays: selectedItem.weekdays || [],
      monthly_day: selectedItem.monthly_day || null,
      monthly_ordinal: selectedItem.monthly_ordinal || null,
      monthly_weekday: selectedItem.monthly_weekday || null,
      yearly_mode: yearly_mode,
      yearly_month: selectedItem.yearly_month !== null && selectedItem.yearly_month !== undefined 
        ? selectedItem.yearly_month - 1 
        : null,
      yearly_day: selectedItem.yearly_day || null,
      yearly_ordinal: selectedItem.yearly_ordinal || null,
      yearly_weekday: selectedItem.yearly_weekday || null,
      recurrence_end_date: selectedItem.recurrence_end_date ? new Date(selectedItem.recurrence_end_date) : null
    } : {
      frequency: '',
      interval: 1,
      weekdays: [],
      monthly_day: null,
      monthly_ordinal: null,
      monthly_weekday: null,
      yearly_mode: null,
      yearly_month: null,
      yearly_day: null,
      yearly_ordinal: null,
      yearly_weekday: null,
      recurrence_end_date: null
    };
    
    setRecurrence(recurrenceData);
    console.log('Initialized recurrence:', recurrenceData);
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

  const closeModal = () => {
    if (modalType !== 'history') {
      setSelectedItem(null);
      setModalType(null);
    } else {
      setModalType(null);
      setTimeout(() => setSelectedItem(null), 300);
    }
  };

  const getMachineName = (id) => {
    const machine = machines.find((m) => m.machine_id === id || m.machine_id === id);
    return machine ? machine.machine_name || machine.machine_name : 'Unknown';
  };

  const getUserName = (id) => {
    const Users = users.find((m) => m.user_id === id || m.user_id === id);
    return Users ? Users.email || Users.email : 'Unknown';
  };

  const handleDelete = async () => {
    try {
      const userId = localStorage.getItem('user_id')
      const response = await axios.delete(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${itemToDelete.id}`, {
        data: { user_id: userId },
      });
      console.log(response.data.message);
      setShowModal(false);
      setData((prevData) =>
        prevData.filter((item) => item.id !== itemToDelete.id)
      );
      toast.success('Maintenance task deleted successfully!');

    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete maintenance task');
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

      if (startDate > endDate) {
        setDateError('Start date cannot be later than End date.');
        return;
      }

      const status = form.task_status.value;
      const completed_date = status === 'Complete' ? new Date().toISOString().split('T')[0] : null;
      const assignedToValue = form.assigned_to.value || localStorage.getItem("user_id");
      const toLocalISOString = (date) =>
        new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

      // Prepare recurrence data
      const recurrenceData = {
        frequency: recurrence.frequency,
        interval: recurrence.interval,
        weekdays: recurrence.weekdays || [],
        monthly_day: recurrence.monthly_day || null,
        monthly_ordinal: recurrence.monthly_ordinal || null,
        monthly_weekday: recurrence.monthly_weekday || null,
        yearly_mode: recurrence.yearly_mode || null,
        yearly_day: recurrence.yearly_day || null,
        yearly_month: recurrence.yearly_month || null,
        yearly_ordinal: recurrence.yearly_ordinal || null,
        yearly_weekday: recurrence.yearly_weekday || null,
        recurrence_end_date: recurrence.recurrence_end_date ? toLocalISOString(recurrence.recurrence_end_date) : null
      };

      // Send the PUT request including recurrence
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
        user_id: UserId,
        recurrence: recurrenceData,
      });

      // Refresh maintenance list
      const maintenanceResponse = await axios.get('https://machine-backend.azurewebsites.net/ajouter/maintenance');
      setData(maintenanceResponse.data);

      // Refresh history
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
      toast.error('Error updating maintenance task');
    }
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.user_id === userId);
    if (user && user.email) {
      return user.email.split('@')[0]; 
    }
    return "Unknown User";
  };

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
              backgroundColor: '#f5f5f5',
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
              backgroundColor: 'transparent',
              boxShadow: 'none',
              padding: 0,
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
          <Dialog.Panel className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
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
                              const changedFields = Object.entries(record.changes).filter(
                                ([field, values]) => values.old !== values.new
                              );
                              
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
                    <form className="space-y-4" ref={formRef} onSubmit={handleSubmit}>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Start Date & Time */}
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
                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring"
                            autoComplete="off"
                            placeholderText="Select start date & time"
                          />
                        </div>

                        {/* End Date & Time */}
                        <div className="flex flex-col" style={{ zIndex: 100 }}>
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
                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring"
                            autoComplete="off"
                            placeholderText="Select end date & time"
                          />
                        </div>

                        {/* Maintenance Type */}
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

                        {/* Task Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Task Name</label>
                          <input
                            name="task_name"
                            type="text"
                            defaultValue={selectedItem.task_name}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                          />
                        </div>

                        {/* Task Description */}
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Task Description</label>
                          <textarea
                            name="task_description"
                            defaultValue={selectedItem.task_description}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            rows="3"
                          />
                        </div>

                        {/* Task Status */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Task Status</label>
                          <select
                            name="task_status"
                            defaultValue={selectedItem.task_status}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In progress">In progress</option>
                            <option value="Complete">Complete</option>
                          </select>
                        </div>

                        {/* Machine */}
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

                        {/* Assigned To */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                          <select
                            name="assigned_to"
                            defaultValue={selectedItem.assigned_to?.toString() ?? localStorage.getItem("user_id")}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                          >
                            {executors.map(user => (
                              <option key={user.user_id} value={user.user_id}>
                                {user.email.split('@')[0]}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 🔄 Recurrence Section */}
                        <div className="col-span-2 mt-6 border-t pt-4">
                          <h3 className="text-lg font-medium text-gray-700 mb-4">Recurrence Settings</h3>
                          
                          {/* Frequency and Interval */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                              <select
                                value={recurrence.frequency}
                                onChange={(e) => setRecurrence(prev => ({ 
                                  ...prev, 
                                  frequency: e.target.value,
                                  weekdays: [],
                                  monthly_day: null,
                                  monthly_ordinal: null,
                                  monthly_weekday: null,
                                  yearly_mode: null,
                                  yearly_day: null,
                                  yearly_month: null,
                                  yearly_ordinal: null,
                                  yearly_weekday: null
                                }))}
                                className="w-full rounded-md border border-gray-300 p-2"
                              >
                                <option value="">No Recurrence</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                              <input
                                type="number"
                                min="1"
                                value={recurrence.interval}
                                onChange={(e) => setRecurrence(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                                className="w-full rounded-md border border-gray-300 p-2"
                                disabled={!recurrence.frequency}
                              />
                            </div>
                          </div>

                          {/* Weekly Options */}
                          {recurrence.frequency === 'weekly' && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Repeat on</label>
                              <div className="flex gap-2 flex-wrap">
                                {[
                                  { value: 0, label: 'Sun' },
                                  { value: 1, label: 'Mon' },
                                  { value: 2, label: 'Tue' },
                                  { value: 3, label: 'Wed' },
                                  { value: 4, label: 'Thu' },
                                  { value: 5, label: 'Fri' },
                                  { value: 6, label: 'Sat' }
                                ].map(day => (
                                  <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => {
                                      const newWeekdays = recurrence.weekdays?.includes(day.value)
                                        ? recurrence.weekdays.filter(d => d !== day.value)
                                        : [...(recurrence.weekdays || []), day.value];
                                      setRecurrence(prev => ({ ...prev, weekdays: newWeekdays }));
                                    }}
                                    className={`px-3 py-2 rounded-md text-sm ${
                                      recurrence.weekdays?.includes(day.value)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                  >
                                    {day.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Monthly Options */}
                      {/* Monthly Options */}
{recurrence.frequency === 'monthly' && (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Pattern</label>
    <div className="space-y-3">
      {/* Day of Month */}
      <div className="flex items-center gap-3">
        <input
          type="radio"
          id="monthly-day"
          name="monthly-mode"
          checked={!recurrence.monthly_ordinal && !recurrence.monthly_weekday}
          onChange={() => setRecurrence(prev => ({ 
            ...prev, 
            monthly_ordinal: null,
            monthly_weekday: null,
            monthly_day: prev.monthly_day || 1 // Default to day 1 if not set
          }))}
          className="text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="monthly-day" className="text-sm text-gray-700 cursor-pointer">
          On day
        </label>
        <input
          type="number"
          min="1"
          max="31"
          value={recurrence.monthly_day || ''}
          onChange={(e) => setRecurrence(prev => ({ 
            ...prev, 
            monthly_day: parseInt(e.target.value) || 1 
          }))}
          className="w-20 rounded-md border border-gray-300 p-1"
          disabled={!!recurrence.monthly_ordinal || !!recurrence.monthly_weekday}
        />
        <span className="text-sm text-gray-500">of the month</span>
      </div>

      {/* Weekday of Month */}
      <div className="flex items-center gap-3">
        <input
          type="radio"
          id="monthly-weekday"
          name="monthly-mode"
          checked={!!recurrence.monthly_ordinal || !!recurrence.monthly_weekday}
          onChange={() => setRecurrence(prev => ({ 
            ...prev, 
            monthly_day: null,
            monthly_ordinal: prev.monthly_ordinal || 'first', // Default to first if not set
            monthly_weekday: prev.monthly_weekday || 1 // Default to Monday if not set
          }))}
          className="text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="monthly-weekday" className="text-sm text-gray-700 cursor-pointer">
          On the
        </label>
        <select
          value={recurrence.monthly_ordinal || ''}
          onChange={(e) => setRecurrence(prev => ({ 
            ...prev, 
            monthly_ordinal: e.target.value 
          }))}
          className="rounded-md border border-gray-300 p-1"
          disabled={!recurrence.monthly_ordinal && !recurrence.monthly_weekday}
        >
          <option value="">Select</option>
          <option value="first">First</option>
          <option value="second">Second</option>
          <option value="third">Third</option>
          <option value="fourth">Fourth</option>
          <option value="last">Last</option>
        </select>
        <select
          value={recurrence.monthly_weekday || ''}
          onChange={(e) => setRecurrence(prev => ({ 
            ...prev, 
            monthly_weekday: parseInt(e.target.value) 
          }))}
          className="rounded-md border border-gray-300 p-1"
          disabled={!recurrence.monthly_ordinal && !recurrence.monthly_weekday}
        >
          <option value="">Day</option>
          <option value="0">Sunday</option>
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
        </select>
        <span className="text-sm text-gray-500">of the month</span>
      </div>
    </div>
    
    {/* Debug info - remove in production */}
    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
      <p>Debug - Monthly State:</p>
      <p>Ordinal: {recurrence.monthly_ordinal || 'null'}</p>
      <p>Weekday: {recurrence.monthly_weekday || 'null'}</p>
      <p>Day: {recurrence.monthly_day || 'null'}</p>
    </div>
  </div>
)}

                          {/* Yearly Options */}
                    {/* Yearly Options */}
{/* Yearly Options */}
{/* Yearly Options */}
{recurrence.frequency === 'yearly' && (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Pattern</label>
    
    {/* Yearly Interval */}
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Repeat every</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="10"
          value={recurrence.interval || 1}
          onChange={(e) => setRecurrence(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
          className="w-20 rounded-md border border-gray-300 p-2"
        />
        <span className="text-sm text-gray-600">year(s)</span>
      </div>
    </div>

    <div className="space-y-4">
      {/* Option 1: Specific Date */}
      <div className="flex items-start gap-3">
        <input
          type="radio"
          id="yearly-date"
          name="yearly-mode"
          checked={recurrence.yearly_mode === 'day'}
          onChange={() => setRecurrence(prev => ({ 
            ...prev, 
            yearly_mode: 'day',
            yearly_ordinal: null,
            yearly_weekday: null,
            yearly_day: prev.yearly_day || 1,
            yearly_month: prev.yearly_month !== null && prev.yearly_month !== undefined ? prev.yearly_month : 0
          }))}
          className="mt-1 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="yearly-date" className="block text-sm text-gray-700 cursor-pointer mb-2">
            On a specific date
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={recurrence.yearly_mode === 'day' ? (recurrence.yearly_month !== null && recurrence.yearly_month !== undefined ? recurrence.yearly_month : 0) : 0}
              onChange={(e) => setRecurrence(prev => ({ 
                ...prev, 
                yearly_month: parseInt(e.target.value),
                yearly_mode: 'day' // Ensure mode is set when changing month
              }))}
              className="rounded-md border border-gray-300 p-2"
              disabled={recurrence.yearly_mode !== 'day'}
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="31"
              value={recurrence.yearly_mode === 'day' ? (recurrence.yearly_day || 1) : 1}
              onChange={(e) => setRecurrence(prev => ({ 
                ...prev, 
                yearly_day: parseInt(e.target.value) || 1,
                yearly_mode: 'day' // Ensure mode is set when changing day
              }))}
              className="w-20 rounded-md border border-gray-300 p-2"
              disabled={recurrence.yearly_mode !== 'day'}
              placeholder="Day"
            />
            <span className="text-sm text-gray-500">of every year</span>
          </div>
        </div>
      </div>

      {/* Option 2: Weekday Pattern */}
      <div className="flex items-start gap-3">
        <input
          type="radio"
          id="yearly-weekday"
          name="yearly-mode"
          checked={recurrence.yearly_mode === 'weekday'}
          onChange={() => setRecurrence(prev => ({ 
            ...prev, 
            yearly_mode: 'weekday',
            yearly_day: null,
            yearly_ordinal: prev.yearly_ordinal || 'first',
            yearly_weekday: prev.yearly_weekday || 1,
            yearly_month: prev.yearly_month !== null && prev.yearly_month !== undefined ? prev.yearly_month : 0
          }))}
          className="mt-1 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="yearly-weekday" className="block text-sm text-gray-700 cursor-pointer mb-2">
            On a specific weekday
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-700">On the</span>
            <select
              value={recurrence.yearly_mode === 'weekday' ? (recurrence.yearly_ordinal || 'first') : 'first'}
              onChange={(e) => setRecurrence(prev => ({ 
                ...prev, 
                yearly_ordinal: e.target.value,
                yearly_mode: 'weekday' // Ensure mode is set
              }))}
              className="rounded-md border border-gray-300 p-2"
              disabled={recurrence.yearly_mode !== 'weekday'}
            >
              <option value="first">First</option>
              <option value="second">Second</option>
              <option value="third">Third</option>
              <option value="fourth">Fourth</option>
              <option value="last">Last</option>
            </select>
            <select
              value={recurrence.yearly_mode === 'weekday' ? (recurrence.yearly_weekday || 1) : 1}
              onChange={(e) => setRecurrence(prev => ({ 
                ...prev, 
                yearly_weekday: parseInt(e.target.value),
                yearly_mode: 'weekday' // Ensure mode is set
              }))}
              className="rounded-md border border-gray-300 p-2"
              disabled={recurrence.yearly_mode !== 'weekday'}
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </select>
            <span className="text-sm text-gray-700">of</span>
            <select
              value={recurrence.yearly_mode === 'weekday' ? (recurrence.yearly_month !== null && recurrence.yearly_month !== undefined ? recurrence.yearly_month : 0) : 0}
              onChange={(e) => setRecurrence(prev => ({ 
                ...prev, 
                yearly_month: parseInt(e.target.value),
                yearly_mode: 'weekday' // Ensure mode is set
              }))}
              className="rounded-md border border-gray-300 p-2"
              disabled={recurrence.yearly_mode !== 'weekday'}
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">every year</span>
          </div>
        </div>
      </div>
    </div>

    {/* Debug info */}
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
      <p className="font-medium text-yellow-800">Debug - Yearly State:</p>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div>
          <p>Mode: <span className="font-mono">{recurrence.yearly_mode || 'null'}</span></p>
          <p>Month: <span className="font-mono">{recurrence.yearly_month !== null && recurrence.yearly_month !== undefined ? recurrence.yearly_month : 'null'}</span></p>
          <p>Day: <span className="font-mono">{recurrence.yearly_day || 'null'}</span></p>
        </div>
        <div>
          <p>Ordinal: <span className="font-mono">{recurrence.yearly_ordinal || 'null'}</span></p>
          <p>Weekday: <span className="font-mono">{recurrence.yearly_weekday !== null && recurrence.yearly_weekday !== undefined ? recurrence.yearly_weekday : 'null'}</span></p>
        </div>
      </div>
    </div>
  </div>
)}
                          {/* Recurrence End Date */}
                          {(recurrence.frequency && recurrence.frequency !== 'none') && (
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                              <DatePicker
                                selected={recurrence.recurrence_end_date}
                                onChange={(date) => setRecurrence(prev => ({ ...prev, recurrence_end_date: date }))}
                                className="w-full rounded-md border border-gray-300 p-2"
                                placeholderText="No end date"
                                isClearable
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Buttons */}
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm">
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            <p>Are you sure you want to delete this maintenance task?</p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
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
