import React, { useEffect, useRef, useState, useMemo  } from 'react';
import axios from 'axios';
import { PencilIcon, TrashIcon, ClockIcon,ArrowPathIcon, XMarkIcon  } from '@heroicons/react/24/solid';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-toastify';
import {
Tooltip
} from '@mui/material';


const Viewmaintenaceviewer = () => {
  const [data, setData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null); // 'edit', 'delete', 'history'
  const [machines, setMachines]= useState([]);
  const [users, setUsers]= useState([]);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
    // Filter state
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [filterMaintenanceType, setFilterMaintenanceType] = useState('');
  const [filterTaskName, setFilterTaskName] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [debouncedTaskName, setDebouncedTaskName] = useState('');
  const [modificationHistory, setModificationHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const formRef = useRef(null);

 // Dynamically get unique maintenance types
  const maintenanceTypes = useMemo(() => {
    return Array.from(new Set(data.map(item => item.maintenance_type)));
  }, [data]);

    // Filtered data computation
const filteredData = data.filter((item) => {
  const matchesMaintenanceType =
    !filterMaintenanceType || item.maintenance_type === filterMaintenanceType;

  const matchesTaskName =
    !debouncedTaskName || item.task_name?.toLowerCase().includes(debouncedTaskName.toLowerCase());

  return matchesMaintenanceType && matchesTaskName;
});



  // Fetch Maintenance
  useEffect(() => {
    let isMounted = true;
    const fetchMaintenance = async () => {
      try {
        const response = await axios.get('https://machine-backend.azurewebsites.net/ajouter/maintenance');
        if (isMounted) {
          setData(response.data);
          console.log('Maintenance data:', response.data);
        }
      } catch (error) {
        console.error("Error fetching maintenance data:", error);
      }
    };
    fetchMaintenance();

    return () => {
      isMounted = false; // Cleanup
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
  if (modalType === 'history') {
    setModificationHistory([]); // Force clear old data
  }
}, [modalType]);



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
 


const getUserEmail = (userId) => {
  const user = users.find(u => u.user_id === userId);
  if (user && user.email) {
    return user.email.split('@')[0]; 
  }
  return "Unknown User";
};
 
  {/*Tooltip*/}
  const renderTextWithTooltips = (text) => {
  if (!text) return null;
  return text.split(" ").map((word, index) => (
    <Tooltip key={index} title={word} arrow>
      <span style={{ marginRight: 4, display: "inline-block" }}>{word}</span>
    </Tooltip>
  ));
};
return (
  <div className="p-6 bg-gray-50 min-h-screen">
   
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Maintenance Records</h2>
        <div className="flex items-center gap-2 text-gray-600">
               <div className="flex items-center gap-3">
                 <button
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <svg
                  className="stroke-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* SVG paths from original code */}
                </svg>
                Filter
              </button>
            
  {showFilterOptions && (
    <div className="absolute mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-4 z-50">
      {/* Filter Type Select */}
      <label className="block mb-2 font-semibold text-gray-700">Filter By:</label>
      <select
        value={filterType}
        onChange={(e) => {
          setFilterType(e.target.value);
          setFilterValue(''); // reset value when filter changes
        }}
        className="w-full mb-3 rounded border-gray-300 px-3 py-2"
      >
        <option value="all">All</option>
        <option value="task_name">Task Name</option>
        <option value="maintenance_type">Maintenance Type</option>
      </select>

      {/* Conditional input based on filterType */}
{filterType === 'task_name' && (
  <>
    <label className="block mb-1 text-gray-600">Task Name Contains:</label>
    <input
      type="text"
      value={filterTaskName}
      onChange={(e) => setFilterTaskName(e.target.value)}
      className="w-full rounded border border-gray-300 px-3 py-2"
      placeholder="Enter task name"
    />
  </>
)}


      {filterType === 'maintenance_type' && (
        <>
          <label className="block mb-1 text-gray-600">Select Maintenance Type:</label>
                <select
            value={filterMaintenanceType}
            onChange={(e) => setFilterMaintenanceType(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 mb-4"
          >
            <option value="">-- All Types --</option>
            {maintenanceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

        </>
      )}

      {/* Add a reset filter button */}
      <button
        onClick={() => {
          setFilterType('all');
          setFilterValue('');
          setShowFilterOptions(false);
        }}
        className="mt-3 w-full rounded bg-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-300"
      >
        Clear Filter
      </button>
    </div>
  )}

              
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
         
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {["Maintenance Type", "Task Name", "Task Description", "Completed Date", "Status", "Assigned Person", "Creator", "Start Date", "End Date", "Machine Details"].map((header) => (
                <th key={header} className="px-2 py-2 text-left font-medium text-gray-900 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
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
                <td className="px-2 py-1 text-gray-600">{new Date(item.start_date).toLocaleDateString()}</td>
                <td className="px-2 py-1 text-gray-600">{new Date(item.end_date).toLocaleDateString()}</td>
                <td className="px-2 py-1 text-gray-600 truncate max-w-[100px]">{getMachineName(item.machine_id)}</td>
                <td className="px-2 py-1 text-gray-600">
            
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

             
      
  </div>
);
};

export default Viewmaintenaceviewer;
