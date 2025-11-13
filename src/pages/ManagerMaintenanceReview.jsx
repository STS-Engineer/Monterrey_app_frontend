import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Alert,
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [feedbackError, setFeedbackError] = useState('');
  const [users, setUsers] = useState([]);
  const [machines, setMachines] = useState([]);

  // Use useCallback to memoize the fetch function
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/maintenance/reviews/pending/${managerId}`);
      setReviews(res.data);
      console.log('Fetched reviews:', res.data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setAlert({ message: 'Failed to load reviews.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [usersRes, machinesRes, reviewsRes] = await Promise.all([
          axios.get('https://machine-backend.azurewebsites.net/ajouter/users'),
          axios.get('https://machine-backend.azurewebsites.net/ajouter/machines'),
          axios.get(`https://machine-backend.azurewebsites.net/ajouter/maintenance/reviews/pending/${managerId}`)
        ]);
        
        setUsers(usersRes.data);
        setMachines(machinesRes.data);
        setReviews(reviewsRes.data);
        console.log('Initial data loaded');
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setAlert({ message: 'Failed to load data.', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [managerId]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach(user => {
      map[user.user_id] = user.email.split('@')[0];
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

  const handleSelectReview = async (demandId) => {
    try {
      const res = await axios.get(`https://machine-backend.azurewebsites.net/ajouter/maintenance/reviews/${demandId}`);
      setSelectedReview(res.data);
      setAlert({ message: '', severity: '' });
      setFeedback('');
      setFeedbackError('');
    } catch (err) {
      console.error('Error loading review details:', err);
      setAlert({ message: 'Failed to load review details.', severity: 'error' });
    }
  };

  const handleResponse = async (response) => {
    // Validation for rejection
    if (response === 'Rejected' && !feedback.trim()) {
      setFeedbackError('Feedback is required when rejecting.');
      return;
    }

    try {
      await axios.patch(`https://machine-backend.azurewebsites.net/ajouter/maintenance/reviews/${selectedReview.demand_id}`, {
        response,
        feedback: feedback.trim(),
        user_id: managerId,
      });

      // Show success message
      setSnackbar({ 
        open: true, 
        message: `Maintenance ${response.toLowerCase()} successfully.`, 
        severity: 'success' 
      });

      console.log('[Socket] Sent taskValidated:', {
        executorId: selectedReview.assigned_to,
        taskId: selectedReview.task_id,
        status: response,
        feedback,
      });

      // Close modal and reset form
      setSelectedReview(null);
      setFeedback('');
      setFeedbackError('');

      // Refresh the reviews list immediately
      await fetchReviews();

    } catch (err) {
      console.error(`Failed to ${response} maintenance:`, err);
      setSnackbar({ 
        open: true, 
        message: `Failed to ${response.toLowerCase()} maintenance.`, 
        severity: 'error' 
      });
    }
  };

  const renderTextWithTooltips = (text) => {
    if (!text) return null;
    return text.split(" ").map((word, index) => (
      <Tooltip key={index} title={word} arrow>
        <span style={{ marginRight: 4, display: "inline-block" }}>{word}</span>
      </Tooltip>
    ));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" mt={5} height="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading reviews...</Typography>
      </Box>
    );
  }

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
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body1" color="textSecondary">
                  No pending reviews found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            reviews.map((review) => (
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
            ))
          )}
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
                <p><strong>Machine Name:</strong> {renderTextWithTooltips(machineMap[selectedReview.machine_id]?.name || 'N/A')}</p>
                <p><strong>Machine Ref:</strong> {renderTextWithTooltips(machineMap[selectedReview.machine_id]?.ref || 'N/A')}</p>
                <p><strong> Executor Comment:</strong> {renderTextWithTooltips(selectedReview.executor_feedback)}</p>
              </div>
              <div className="space-y-2">
                <p><strong>Demanded by:</strong> {renderTextWithTooltips(userMap[selectedReview.assigned_to] || 'N/A')}</p>
                <p><strong>Respond by:</strong> {renderTextWithTooltips(userMap[selectedReview.creator] || 'N/A')}</p>
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
                  placeholder="Enter your feedback here..."
                />
                {feedbackError && (
                  <p className="text-red-500 text-sm mt-1">{feedbackError}</p>
                )}
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
            onClick={() => handleResponse('Rejected')}
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
        <MuiAlert 
          elevation={6} 
          variant="filled" 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ManagerReviewPanel;
