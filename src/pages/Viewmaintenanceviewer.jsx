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
        const response = await axios.get('http://localhost:4000/ajouter/maintenance');
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
        const response = await axios.get('http://localhost:4000/ajouter/machines');
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
        const response = await axios.get('http://localhost:4000/ajouter/users');
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
        You don’t have permission to consult  the tasks as a viewer account.
      </div>
      <div>
        If this access is required for your role, please contact your manager to request the necessary permissions.
      </div>
    </div>
  </div>
);
};

export default Viewmaintenaceviewer;
