import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import socket from './socket'; // adjust path
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import {Tooltip} from '@mui/material';
import './MaintenanceWorkflow.css'

const CustomAlert = React.forwardRef(function CustomAlert(props, ref) {
  return <Alert elevation={6} ref={ref} variant="filled" {...props} />;
});


const MaintenanceWorkflow = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [myTasks, setMyTasks] = useState([]);
  const [inbox, setInbox] = useState([]);
  const userId = localStorage.getItem('user_id');
  const role = localStorage.getItem('role');
  const [notifications, setNotifications] = useState([]);
  const [feedbacks, setFeedbacks] = useState({}); 
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [users, setUsers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [rawTasks, setRawTasks] = useState([]);
  const [rawInbox, setRawInbox] = useState([]);
  const [sentForReviewTasks, setSentForReviewTasks] = useState(new Set());


  // Fetch executor's tasks and inbox
useEffect(() => {
  const fetchData = async () => {
    try {
      if (role === 'EXECUTOR' || role === 'MANAGER') {
        const [tasksRes, inboxRes] = await Promise.all([
          axios.get(`http://localhost:4000/api/tasks/executor/${userId}`),
          axios.get(`http://localhost:4000/api/inbox/executor/${userId}`)
        ]);

        setRawTasks(tasksRes.data); // Keep original machine_id and assigned_to
        console.log('inboxres',inboxRes);
        setRawInbox(inboxRes.data);
      }
    } catch (error) {
      toast.error('Error loading data');
    }
  };

  if (role === 'EXECUTOR' || role === 'MANAGER') {
    fetchData();
  }
}, [userId, role]);


useEffect(() => {
  if (users.length > 0 && machines.length > 0 && rawTasks.length > 0) {
    const enrichedTasks = rawTasks.map(task => {
      const machine = machines.find(m => m.machine_id === task.machine_id);
      const user = users.find(u => u.user_id === task.assigned_to);

      return {
        ...task,
        machine_ref: machine?.machine_ref || 'N/A',
        machine_name: machine?.machine_name || 'N/A',
        assigned_user_email: user?.email.split('@')[0] || 'N/A',
      };
    });

    setMyTasks(enrichedTasks);
  }
}, [users, machines, rawTasks]);


// Update feedback useEffect to handle real-time updates
useEffect(() => {
  const fetchFeedbacks = async () => {
    try {
      const feedbackMap = {};

      for (const item of inbox) {
        console.log(`Checking item ${item.maintenance_id} with status: ${item.task_status}`);

        if (item.task_status !== 'Rejected' && item.task_status !== 'Accepted') {
          console.log(`Skipping item ${item.maintenance_id} — status is ${item.task_status}`);
          continue;
        }

        if (!item.maintenance_id) {
          console.warn(`⚠️ Missing maintenance_id for item, skipping.`);
          feedbackMap[item.maintenance_id] = 'Missing maintenance ID';
          continue;
        }

        console.log(`Fetching feedback for maintenance_id: ${item.maintenance_id}`);

        try {
          const res = await axios.get(
            `http://localhost:4000/ajouter/maintenance/reviews/by-maintenance/${item.maintenance_id}`
          );
          const feedback = res.data?.feedback || 'No feedback provided';
          console.log(`✅ Feedback for maintenance_id ${item.maintenance_id}:`, feedback);
          feedbackMap[item.maintenance_id] = feedback;
        } catch (innerErr) {
          console.error(`❌ Error fetching feedback for ${item.maintenance_id}:`, innerErr);
          feedbackMap[item.maintenance_id] = 'Error fetching feedback';
        }
      }

      setFeedbacks(feedbackMap);
      console.log('✅ Final Feedback Map:', feedbackMap);
    } catch (err) {
      console.error('❌ Feedback fetch error:', err);
    }
  };

  console.log('📬 useEffect triggered. Inbox length:', inbox.length);
  if (inbox.length > 0) {
    console.log('🚀 Starting feedback fetch...');
    fetchFeedbacks();
  }
}, [inbox]);


 // Run whenever inbox changes

useEffect(() => {
  socket.emit('join', { role, userId });

  socket.on('notifyExecutor', (data) => {
    if (data.executorId === userId) {
      setSnackbar({ open: true, message: `Task ${data.status}: ${data.feedback}`, severity: 'info' });
    }
  });

  return () => {
    socket.off('notifyExecutor');
  };
}, [userId, role]);

    useEffect(() => {
      axios.get('http://localhost:4000/ajouter/users')
        .then(res => {
          setUsers(res.data);
        })
        .catch(err => console.error('Failed to fetch users:', err));
    }, []);
   useEffect(() => {
  fetch('http://localhost:4000/ajouter/machines')
    .then((response) => response.json())
    .then((data) => setMachines(data))
    .catch((error) => console.error('Error fetching machines:', error));
}, []);

useEffect(() => {
  socket.on('taskValidated', ({ taskId, status, feedback }) => {
    console.log('[Socket] Received taskValidated:', { taskId, status, feedback });

    setInbox((prevInbox) =>
      prevInbox.map(item =>
        item.maintenance_id === taskId
          ? { ...item, task_status: status }  // Update status
          : item
      )
    );

    setFeedbacks((prevFeedbacks) => ({
      ...prevFeedbacks,
      [taskId]: feedback, // Update feedback
    }));
  });

  return () => {
    socket.off('taskValidated');
  };
}, []);

useEffect(() => {
  if (users.length > 0 && machines.length > 0 && rawInbox.length > 0) {
    const enrichedInbox = rawInbox.map(item => {
      const machine = machines.find(m => m.machine_id === item.machine_id);
      const user = users.find(u => u.user_id === item.assigned_to);

      return {
        ...item,
        machine_ref: machine?.machine_ref || 'N/A',
        machine_name: machine?.machine_name || 'N/A',
        assigned_user_email: user?.email?.split('@')[0] || 'N/A',
      };
    });

    setInbox(enrichedInbox);
  }
}, [rawInbox, users, machines]);

// Update socket listeners in useEffect
useEffect(() => {
  const handleTaskValidation = ({ maintenance_id, status, feedback }) => {
    console.log('[Socket] Received task validation update:', { maintenance_id, status, feedback });

    // Update inbox
    setInbox(prev => prev.map(item => 
      item.maintenance_id === maintenance_id ? {
        ...item,
        task_status: status,
        feedback: feedback
      } : item
    ));

    // Update tasks list if needed
    setMyTasks(prev => prev.map(task =>
      task.maintenance_id === maintenance_id ? {
        ...task,
        task_status: status
      } : task
    ));

    // Show snackbar notification
    setSnackbar({
      open: true,
      message: `Task ${status === 'Accepted' ? 'approved' : 'rejected'}: ${feedback}`,
      severity: status === 'Accepted' ? 'success' : 'error'
    });
  };

  socket.on('new-notification', handleTaskValidation);
  return () => socket.off('new-notification', handleTaskValidation);
}, []);
  // Send task for review - fixed to use task.id
// Update handleSendReview function
const handleSendReview = async (taskId) => {
  try {
    // Optimistic update
    setMyTasks(prev => prev.map(task => 
      task.maintenance_id === taskId ? 
      { ...task, task_status: 'Pending Review' } : 
      task
    ));

    const response = await axios.post(
      `http://localhost:4000/ajouter/maintenance/${taskId}/review`,
      { user_id: userId, demanded_by: userId }
    );

    // Update inbox after successful submission
    const inboxRes = await axios.get(`http://localhost:4000/api/inbox/executor/${userId}`);
    setRawInbox(inboxRes.data);

    socket.emit('taskSubmitted', {
      maintenance_id: taskId,
      executorId: userId,
      message: `Task ${taskId} submitted for review`,
    });
         // Then mark task as sent for review in local state
     setSentForReviewTasks(prev => new Set(prev).add(taskId));

      toast.success('Request sent for review successfully!', {
         position: "bottom-right",
         style: { marginBottom: '60px' },
       });
  } catch (error) {
    // Rollback on error
    setMyTasks(prev => prev.map(task => 
      task.maintenance_id === taskId ? 
      { ...task, task_status: 'In progress' } : 
      task
    ));
    toast.error(error.response?.data?.message || 'Submission failed');
  }
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

{/*filteruniquetasks*/}
function filterUniqueTasks(tasks) {
  const unique = [];

  tasks.forEach(task => {
    // Check if an identical task is already in unique
    const isDuplicate = unique.some(t => 
      t.machine_ref === task.machine_ref &&
      t.machine_name === task.machine_name &&
      t.task_name === task.task_name &&
      t.task_description === task.task_description &&
      t.maintenance_type === task.maintenance_type &&
      new Date(t.start_date).toLocaleDateString() === new Date(task.start_date).toLocaleDateString() &&
      new Date(t.end_date).toLocaleDateString() === new Date(task.end_date).toLocaleDateString() &&
      t.assigned_user_email === task.assigned_user_email &&
      t.task_status === task.task_status &&
      t.review_status === task.review_status
    );

    if (!isDuplicate) {
      unique.push(task);
    }
  });

  return unique;
}

const statusConfig = {
  'In progress': { color: 'bg-yellow-100', text: 'text-yellow-800' },
  'Pending Review': { color: 'bg-blue-100', text: 'text-blue-800' },
  'Accepted': { color: 'bg-green-100', text: 'text-green-800' },
  'Rejected': { color: 'bg-red-100', text: 'text-red-800' }
};

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex gap-4 mb-6 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'tasks' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          My Tasks ({myTasks.length})
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'inbox' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox ({inbox.length})
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Machine Reference</th>
                <th className="p-3 text-left">Machine Name</th>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Task Description</th>
                <th className="p-3 text-left">Maintenance Type</th>
                <th className="p-3 text-left">Start Date</th>
                <th className="p-3 text-left">End Date</th>
                <th className="p-3 text-left">Assigned Person</th>
                <th className="p-3 text-left">Task Status</th>
                <th className="p-3 text-left">Review Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterUniqueTasks(myTasks).map(task => (
                <tr key={task.maintenance_id || task.id}   className={`border-t transition-colors ${
            task.task_status === 'Pending Review' ? 'bg-gray-100 cursor-not-allowed opacity-80' : 'hover:bg-gray-50'
           }`}>
                 <td className="p-3">{renderTextWithTooltips(task.machine_ref)}</td>
                  <td className="p-3">{renderTextWithTooltips(task.machine_name)}</td>
                  <td className="p-3">{renderTextWithTooltips(task.task_name)}</td>
                  <td className="p-3">{renderTextWithTooltips(task.task_description)}</td>
                  <td className="p-3">{renderTextWithTooltips(task.maintenance_type)}</td>
                  <td className="p-3">{renderTextWithTooltips(new Date(task.start_date).toLocaleDateString())}</td>
                  <td className="p-3">{renderTextWithTooltips(new Date(task.end_date).toLocaleDateString())}</td>
                  <td className="p-3">{renderTextWithTooltips(task.assigned_user_email)}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-yellow-100 rounded-full text-sm">
                      {renderTextWithTooltips(task.task_status)}
                    </span>
                  </td>
                <td className="p-3">{renderTextWithTooltips(task.review_status || '-')}</td>

                <td className="p-3">
{(['In progress', 'Rejected'].includes(task.task_status) || 
  (task.task_status === 'Pending Review' && task.review_status === 'Responded')) && 
  !sentForReviewTasks.has(task.maintenance_id) ? (
    <button
      onClick={() => handleSendReview(task.maintenance_id)}
      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Send for Review
    </button>
) : task.task_status === 'Completed' ? (
  null
) : sentForReviewTasks.has(task.maintenance_id) ? (
  <span className="text-sm text-gray-500 italic">🔒 Locked – Awaiting Review</span>
) : (
  <span className="text-sm text-gray-500 italic">🔒 Locked – Awaiting Review</span>
)}






             </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myTasks.length === 0 && <div className="p-4 text-center text-gray-500">No tasks found</div>}
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Machine Reference</th>
                <th className="p-3 text-left">Machine Name</th>
                <th className="p-3 text-left">Task</th>
                <th className="p-3 text-left">Task Description</th>
                <th className="p-3 text-left">Maintenance Type</th>
                <th className="p-3 text-left">Start Date</th>
                <th className="p-3 text-left">End Date</th>
                <th className="p-3 text-left">Assigned Person</th>
                <th className="p-3 text-left">Response</th>
                <th className="p-3 text-left">Feedback</th>
              </tr>
            </thead>
            <tbody>
        {inbox.map((item, index) => (
        <tr key={`${item.maintenance_id}-${index}-${Date.now()}`} className="border-t hover:bg-gray-50">
        <td className="p-3">{renderTextWithTooltips(item.machine_ref)}</td>
        <td className="p-3">{renderTextWithTooltips(item.machine_name)}</td>
        <td className="p-3">{renderTextWithTooltips(item.task_name)}</td>
        <td className="p-3">{renderTextWithTooltips(item.task_description)}</td>
        <td className="p-3">{renderTextWithTooltips(item.maintenance_type)}</td>
        <td className="p-3">{renderTextWithTooltips(new Date(item.start_date).toLocaleDateString())}</td>
        <td className="p-3">{renderTextWithTooltips(new Date(item.end_date).toLocaleDateString())}</td>
        <td className="p-3">{renderTextWithTooltips(item.assigned_user_email)}</td>

<td className="p-3">
  <span
    className={`px-2 py-1 rounded-full text-sm font-medium
      ${
        item.response === 'Accepted'
          ? 'bg-green-500 text-white'
          : item.response === 'Rejected'
          ? 'bg-red-500 text-white'
          : 'bg-gray-300 text-gray-800'
      }
    `}
  >
    {item.response || '–'}
  </span>
</td>

   <td className="p-3">{renderTextWithTooltips(item.feedback || '-')}</td>
  </tr>
))}
            </tbody>
          </table>
          {inbox.length === 0 && <div className="p-4 text-center text-gray-500">Inbox is empty</div>}
        </div>
      )}

  <Snackbar
  open={snackbar.open}
  autoHideDuration={4000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
>
  <CustomAlert
    onClose={() => setSnackbar({ ...snackbar, open: false })}
    severity={snackbar.severity}
    sx={{ width: '100%' }}
  >
    {snackbar.message}
  </CustomAlert>
</Snackbar>


    </div>
  );
};

export default MaintenanceWorkflow;
