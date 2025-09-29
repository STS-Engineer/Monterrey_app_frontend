import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Alert,
  TextField,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { InformationCircleIcon } from '@heroicons/react/24/solid';



const ManagerReviewPanel = ({ managerId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [alert, setAlert] = useState({ message: '', severity: '' });
  const [feedback, setFeedback] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [feedbackError, setFeedbackError] = useState('');
  const [machineDetails, setMachineDetails] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignedToEmail, setAssignedToEmail] = useState('');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [machines, setMachines] = useState([]);



useEffect(() => {
  const fetchInitialData = async () => {
    try {
      const [usersRes, machinesRes] = await Promise.all([
        axios.get('https://machine-backend.azurewebsites.net/ajouter/users'),
        axios.get('https://machine-backend.azurewebsites.net/ajouter/machines')
      ]);
      
      setUsers(usersRes.data);
      setMachines(machinesRes.data);
    } catch (err) {
      console.error("Error fetching initial data:", err);
    }
  };
  
  fetchInitialData();
}, []);

const userMap = useMemo(() => {
  const map = {};
  users.forEach(user => {
    map[user.user_id] = user.email.split('@')[0]; // Get username part
  });
  return map;
}, [users]);

const machineMap = useMemo(() => {
  const map = {};
  machines.forEach(machine => {
    map[machine.machine_id] = {
      name: machine.machine_name,
      ref: machine.machine_ref
    };
  });
  return map;
}, [machines]);

const fetchReviews = async () => {
      try {
        const res = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/maintenance/reviews/pending/${managerId}`);
        setReviews(res.data);
        console.log('reviews', res.data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setAlert({ message: 'Failed to load reviews.', severity: 'error' });
      } finally {
        setLoading(false);
      }
};

  useEffect(() => {
    fetchReviews();
  }, [managerId]);




useEffect(() => {
  if (selectedReview) {
    fetch('https://machine-backend.azurewebsites.net/ajouter/machines')
      .then(res => res.json())
      .then(data => {
        const matchedMachine = data.find(
          machine => machine.machine_id === selectedReview.machine_id
        );
        console.log("Matched machine:", matchedMachine);
        setMachineDetails(matchedMachine || null);
      })
      .catch(err => {
        console.error("Failed to match machine:", err);
      });
  }
}, [selectedReview]);


useEffect(() => {
  fetch('https://machine-backend.azurewebsites.net/ajouter/users')
    .then((res) => res.json())
    .then((data) => {
      setUsers(data);

      const assignedUser = data.find(user => user.user_id === selectedReview?.assigned_to);
      const creatorUser = data.find(user => user.user_id === selectedReview?.creator);
      
      // Get part before '@'
      const assignedEmail = assignedUser?.email?.split('@')[0] || 'N/A';
      const creatorEmail = creatorUser?.email?.split('@')[0] || 'N/A';
      setAssignedToEmail(assignedEmail);
      setCreatorEmail(creatorEmail);
    })
    .catch((err) => {
      console.error("Error fetching users:", err);
    });
}, [selectedReview]);
 

useEffect(() => {
  if (machineDetails) {
    console.log("Machine Details:", machineDetails);
  }
}, [machineDetails]);

useEffect(() => {
  if (selectedReview?.maintenance_id) {
    fetch('https://machine-backend.azurewebsites.net/ajouter/maintenance')
      .then((res) => res.json())
      .then((data) => {
        const matchedMaintenance = data.find(
          (item) => item.maintenance_id === selectedReview.maintenance_id
        );

        console.log("Matched preventive maintenance:", matchedMaintenance);

        setMaintenanceType(matchedMaintenance?.maintenance_type || 'N/A');
      })
      .catch((err) => {
        console.error("Error fetching preventive maintenance data:", err);
        setMaintenanceType('N/A');
      });
  }
}, [selectedReview]);

  const handleSelectReview = async (demandId) => {
    try {
      const res = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/maintenance/reviews/${demandId}`);
      setSelectedReview(res.data);
      console.log('machine_id', res.data);
      setAlert({ message: '', severity: '' });
      setFeedback('');
    } catch (err) {
      console.error('Error loading review details:', err);
      setAlert({ message: 'Failed to load review details.', severity: 'error' });
    }
  };

  const handleResponse = async (response) => {
    try {
      await axios.patch(`https://machine-backend.azurewebsites.net/ajouter/maintenance/reviews/${selectedReview.demand_id}`, {
        response,
        feedback,
        user_id: managerId,
      });

      setAlert({ message: `Maintenance ${response.toLowerCase()} successfully.`, severity: 'success' });

 
    console.log('[Socket] Sent taskValidated:', {
    executorId: selectedReview.assigned_to,
    taskId: selectedReview.task_id,
    status: response,
    feedback,
    });

      setSelectedReview(null);
      setFeedback('');

      // Refresh the list
      const updated = reviews.filter((r) => r.demand_id !== selectedReview.demand_id);
      setReviews(updated);
    } catch (err) {
      console.error(`Failed to ${response} maintenance:`, err);
      setAlert({ message: `Failed to ${response.toLowerCase()} maintenance.`, severity: 'error' });
      setTimeout(() => {
      setAlert(null);
    }, 3000);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

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
  <Box mt={5} maxWidth="1000px" mx="auto">
    <Typography variant="h5" gutterBottom>Maintenance Tasks Awaiting Review</Typography>

    {alert.message && (
      <Box mb={2}>
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Box>
    )}

    {/* Table of Reviews */}
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Task Name</TableCell>
          <TableCell>Description</TableCell>
          <TableCell>Machine Name</TableCell>
          <TableCell>Machine Reference</TableCell>
          <TableCell>Creator</TableCell>
           <TableCell>Requester</TableCell>
          <TableCell>Requested Date</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.demand_id}>
            <TableCell>{renderTextWithTooltips(review.task_name)}</TableCell>
            <TableCell>{renderTextWithTooltips(review.task_description)}</TableCell>
            <TableCell>
            {renderTextWithTooltips(machineMap[review.machine_id]?.name || 'N/A')}
          </TableCell>
         <TableCell>
           {renderTextWithTooltips(machineMap[review.machine_id]?.ref || 'N/A')}
          </TableCell>

           <TableCell>
            {renderTextWithTooltips(userMap[review.creator] || 'N/A')}
           </TableCell>
           <TableCell>
            {renderTextWithTooltips(userMap[review.assigned_to] || 'N/A')}
           </TableCell>
            <TableCell>{renderTextWithTooltips(new Date(review.demand_date).toLocaleDateString())}</TableCell>
            <TableCell>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleSelectReview(review.demand_id)}
              >
                Review
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Modal for Review Details */}
  <Dialog
  open={!!selectedReview}
  onClose={() => setSelectedReview(null)}
  fullWidth
  maxWidth="sm"
>
<DialogTitle className="text-lg font-semibold flex items-center gap-2">
  <InformationCircleIcon className="w-5 h-5 text-blue-500" />
  Review Details
</DialogTitle>

  <DialogContent dividers>
    {selectedReview && (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <p><strong>Task Name:</strong> {renderTextWithTooltips(selectedReview.task_name)}</p>
          <p><strong>Machine Name:</strong> {renderTextWithTooltips(machineDetails?.machine_name || 'Loading...')}</p>
          <p><strong>Machine Ref:</strong> {renderTextWithTooltips(machineDetails?.machine_ref || 'Loading...')}</p>
        </div>
        <div className="space-y-2">
         <p><strong>Demanded by:</strong> {renderTextWithTooltips(assignedToEmail)}</p>
         <p><strong>Respond by:</strong> {renderTextWithTooltips(creatorEmail)}</p>
          <p><strong>Requested Date:</strong> {renderTextWithTooltips(new Date(selectedReview.demand_date).toLocaleDateString())}</p>
      
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Feedback</label>
         <textarea
            rows={3}
            className={`w-full border ${feedbackError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 focus:outline-none focus:ring-2 ${feedbackError ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              if (feedbackError && e.target.value.trim()) {
                setFeedbackError('');
              }
            }}
          />
          
        </div>
      </div>
    )}
  </DialogContent>

  <DialogActions className="px-4 pb-4">
    <Button variant="contained" color="success" onClick={() => handleResponse('Accepted')}>
      Validate
    </Button>
     <Button
     variant="contained"
     color="error"
     onClick={() => {
     if (!feedback.trim()) {
        window.alert("Feedback is required when rejecting.");
      return;
     }
     handleResponse('Rejected');
     }}
     >
      Reject
     </Button>

    <Button variant="outlined" onClick={() => setSelectedReview(null)}>
      Cancel
    </Button>
  </DialogActions>
</Dialog>


    <Snackbar
  open={snackbar.open}
  autoHideDuration={4000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
>
  <MuiAlert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
    {snackbar.message}
  </MuiAlert>
</Snackbar>

  </Box>
);

};

export default ManagerReviewPanel;
