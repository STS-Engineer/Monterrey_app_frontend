import { useState, useRef, useEffect } from "react";
import { message, Modal } from 'antd';
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
} from "@mui/material";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import { Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

const Addmaintenance = () => {
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
    recurrence: 'none',
    interval: 1,
    recurrence_days: [],
    recurrence_end_date: null,

    // Use underscores to match your backend expectations
    monthly_mode: 'day',
    monthly_day: 1,
    monthly_ordinal: 'first',
    monthly_weekday: 1,

    yearly_mode: 'weekday',
    yearly_month: 0,
    yearly_day: 1,
    yearly_ordinal: 'first',
    yearly_weekday: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState(null);
  const [eventEndDate, setEventEndDate] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [machines, setMachines] = useState([]);
  const [executors, setExecutors] = useState([]);
  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
  const [tempRecurrenceConfig, setTempRecurrenceConfig] = useState({
    interval: 1,
    days: [],
    endDate: null,
    monthlyMode: "day",         // "day" | "weekday"
    monthlyDay: 1,              // used when monthlyMode === "day"
    monthlyOrdinal: "first",    // "first" | "second" | "third" | "fourth" | "last"
    monthlyWeekday: 1,

    // Yearly settings
    yearlyMode: "weekday",          // "day" | "weekday"
    yearlyMonth: 0,             // 0=January, ... 11=December
    yearlyDay: 1,               // used when yearlyMode === "day"
    yearlyOrdinal: "first",     // "first" | "second" | "third" | "fourth" | "last"
    yearlyWeekday: 1                // 0=Sunday, 1=Monday, ... 6=Saturday
  });

  const [prevRecurrence, setPrevRecurrence] = useState('none');

  const calendarRef = useRef(null);

  const role = localStorage.getItem('role');
  const managerId = localStorage.getItem('user_id');
  const creator = localStorage.getItem('user_id');

  useEffect(() => {
    axios.get('https://machine-backend.azurewebsites.net/ajouter/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Failed to fetch users:', err));
  }, []);

  useEffect(() => {
    if (role === 'MANAGER' && managerId) {
      axios.get(`https://machine-backend.azurewebsites.net/ajouter/team-executors/${managerId}`)
        .then(res => setExecutors(res.data.executors || []))
        .catch(err => {
          console.error('Failed to fetch executors:', err);
          setExecutors([]);
        });
    } else {
      setExecutors([]);
    }
  }, [role, managerId]);

  useEffect(() => {
    if (formData.recurrence === 'yearly' && formData.start_date && !formData.end_date) {
      const endDate = new Date(formData.start_date);
      endDate.setFullYear(endDate.getFullYear() + 1);
      setFormData(prev => ({ ...prev, end_date: endDate }));
    }
  }, [formData.start_date, formData.recurrence]);

  const fetchMaintenanceEvents = async () => {
    try {
      const userId = parseInt(localStorage.getItem('user_id'), 10);
      const role = localStorage.getItem('role');

      console.log(`Fetching maintenance for ${role} user ID: ${userId}`);

      // Fetch all maintenance data
      const response = await axios.get('https://machine-backend.azurewebsites.net/ajouter/maintenance');

      // Filter data based on user role
      let filteredData = response.data;

      if (role === 'EXECUTOR') {
        // Executors only see tasks assigned to them
        filteredData = response.data.filter(item =>
          parseInt(item.assigned_to) === userId
        );
        console.log(`Executor view: Found ${filteredData.length} tasks assigned to user ${userId}`);
      } else if (role === 'MANAGER') {
        // Managers see tasks they created
        filteredData = response.data.filter(item =>
          parseInt(item.creator) === userId
        );
        console.log(`Manager view: Found ${filteredData.length} tasks created by user ${userId}`);
      }
      // ADMIN sees all data (no filtering)

      console.log('Final filtered tasks:', filteredData);

      const formattedEvents = filteredData.flatMap(ev => {
        try {
          // Convert ISO strings to Date objects for the base event
          const startDate = new Date(ev.start_date);
          const endDate = new Date(ev.end_date);

          if (ev.recurrence === 'none') {
            // Single event
            return [{
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
                machine_id: ev.machine_id,
                isRecurring: false,
              },
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
            }];
          } else {
            // Recurring events - prepare the base event for generateRecurringEvents
            const baseEvent = {
              ...ev,
              start_date: new Date(ev.start_date),
              end_date: new Date(ev.end_date),
              interval: ev.interval || 1,
              weekdays: Array.isArray(ev.weekdays) ? ev.weekdays : [],

              recurrence_end_date: ev.recurrence_end_date ? new Date(ev.recurrence_end_date) : null,

              // ---- Monthly (both modes) ----
              monthly_mode: ev.pattern_variant === 'monthly_nth' ? 'weekday' : 'day',
              monthly_day: ev.monthly_day ?? null,
              monthly_ordinal: ev.monthly_ordinal ?? null,
              monthly_weekday: ev.monthly_weekday ?? null,

              // ---- Yearly (both modes) ----
              yearly_mode: ev.recurrence === 'yearly' && ev.pattern_variant === 'monthly_nth' ? 'weekday' : 'day',
              yearly_month: (ev.yearly_month != null ? ev.yearly_month - 1 : new Date(ev.start_date).getMonth()),
              yearly_day: ev.yearly_day ?? new Date(ev.start_date).getDate(),
              yearly_ordinal: ev.yearly_ordinal ?? 'first',
              yearly_weekday: ev.yearly_weekday ?? new Date(ev.start_date).getDay(),

              recurrence: ev.recurrence,
              pattern_variant: ev.pattern_variant || null,
            };

            const instances = generateRecurringEvents(baseEvent);
            return instances.map(instance => ({
              id: `${ev.id}-${instance.start_date.getTime()}`,
              title: ev.task_name,
              start: instance.start_date,
              end: instance.end_date,
              allDay: true,
              extendedProps: {
                maintenance_type: ev.maintenance_type,
                task_description: ev.task_description,
                assigned_to: ev.assigned_to,
                task_status: ev.task_status,
                machine_id: ev.machine_id,
                isRecurring: true,
              },
              backgroundColor: '#6b7280',
              borderColor: '#4b5563',
            }));
          }
        } catch (error) {
          console.error('Error processing event:', ev, error);
          return [];
        }
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
    fetch('https://machine-backend.azurewebsites.net/ajouter/machines')
      .then(response => response.json())
      .then(data => setMachines(data))
      .catch(error => console.error('Error fetching machines:', error));
  }, []);



  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} from ${formData[name]} to ${value}`); // Debug log
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecurrenceChange = (e) => {
    const value = e.target.value;

    // Check if we're changing to the same recurrence type
    const isSameRecurrenceType = value === formData.recurrence;

    // If it's the same type and not "none", open modal with existing data
    if (isSameRecurrenceType && value !== "none") {
      // Populate tempRecurrenceConfig with existing formData
      setTempRecurrenceConfig({
        interval: formData.interval || 1,
        days: formData.recurrence_days || [],
        endDate: formData.recurrence_end_date || null,
        monthlyMode: formData.monthly_mode || 'day',
        monthlyDay: formData.monthly_day || 1,
        monthlyOrdinal: formData.monthly_ordinal || 'first',
        monthlyWeekday: formData.monthly_weekday || 1,
        yearlyMode: formData.yearly_mode || 'day',
        yearlyMonth: formData.yearly_month || 0,
        yearlyDay: formData.yearly_day || 1,
        yearlyOrdinal: formData.yearly_ordinal || 'first',
        yearlyWeekday: formData.yearly_weekday || 1,
      });

      setIsRecurrenceModalOpen(true);
      return; // Exit early since we're just reopening the modal
    }

    // For different recurrence types, reset appropriate fields
    const newFormData = {
      ...formData,
      recurrence: value,
    };

    // Only reset these fields when changing to a different recurrence type
    if (value !== formData.recurrence) {
      newFormData.recurrence_days = [];
      newFormData.recurrence_end_date = null;

      if (value === "yearly") {
        // Force interval to 1 when yearly
        newFormData.interval = 1;

        if (formData.start_date) {
          const startDate = new Date(formData.start_date);
          const endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          newFormData.recurrence_end_date = endDate;
        }
      }
    }

    setFormData(newFormData);

    // Set up temp config for the modal
    setTempRecurrenceConfig({
      interval: newFormData.interval || 1,
      days: newFormData.recurrence_days || [],
      endDate: newFormData.recurrence_end_date || null,
      monthlyMode: formData.monthly_mode || 'day',
      monthlyDay: formData.monthly_day || 1,
      monthlyOrdinal: formData.monthly_ordinal || 'first',
      monthlyWeekday: formData.monthly_weekday || 1,
      yearlyMode: formData.yearly_mode || 'day',
      yearlyMonth: formData.yearly_month || 0,
      yearlyDay: formData.yearly_day || 1,
      yearlyOrdinal: formData.yearly_ordinal || 'first',
      yearlyWeekday: formData.yearly_weekday || 1,
    });

    // Open modal only for recurrence types other than "none"
    setIsRecurrenceModalOpen(value !== "none");
  };

  const handleSaveRecurrence = () => {
    if (formData.recurrence === 'weekly' && tempRecurrenceConfig.days.length === 0) {
      message.error('Please select at least one day for weekly recurrence.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      interval: tempRecurrenceConfig.interval || 1,
      recurrence_days: tempRecurrenceConfig.days,
      recurrence_end_date: tempRecurrenceConfig.endDate,
      monthly_mode: tempRecurrenceConfig.monthlyMode,
      monthly_day: tempRecurrenceConfig.monthlyDay,
      monthly_ordinal: tempRecurrenceConfig.monthlyOrdinal,
      monthly_weekday: tempRecurrenceConfig.monthlyWeekday,
      yearly_mode: tempRecurrenceConfig.yearlyMode,
      yearly_month: tempRecurrenceConfig.yearlyMonth,
      yearly_day: tempRecurrenceConfig.yearlyDay,
      yearly_ordinal: tempRecurrenceConfig.yearlyOrdinal,
      yearly_weekday: tempRecurrenceConfig.yearlyWeekday,
    }));

    setIsRecurrenceModalOpen(false);
  };

  const handleCancelRecurrence = () => {
    setFormData(prev => ({ ...prev, recurrence: prevRecurrence }));
    setIsRecurrenceModalOpen(false);
  };


  // Update your handleSubmit function to use loading
 const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  if (!formData.start_date) {
    toast.error("Please select a start date", { position: "bottom-right" });
    setIsSubmitting(false);
    return;
  }

  // ✅ Validate machine_id is selected
  if (!formData.machine_id) {
    toast.error("Please select a machine", { position: "bottom-right" });
    setIsSubmitting(false);
    return;
  }

  try {
    const user_id = parseInt(localStorage.getItem('user_id'), 10);
    const startDate = new Date(formData.start_date);
    const endDate = formData.end_date
      ? new Date(formData.end_date)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("Invalid start or end date", { position: "bottom-right" });
      setIsSubmitting(false);
      return;
    }

    const untilDate = formData.recurrence_end_date
      ? new Date(formData.recurrence_end_date)
      : null;

    if (formData.recurrence !== 'none' && !untilDate) {
      toast.error("Please select an end date for recurrence", { position: "bottom-right" });
      setIsSubmitting(false);
      return;
    }

    // Build payload with machine_id
    const payload = {
      maintenance_type: formData.maintenance_type,
      task_name: formData.task_name,
      task_description: formData.task_description,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      assigned_to: formData.assigned_to,
      creator: user_id,
      user_id: user_id,
      machine_id: parseInt(formData.machine_id, 10), // ✅ Include machine_id as integer
      task_status: formData.task_status || 'In progress',

      // Recurrence fields
      recurrence: formData.recurrence || 'none',
      interval: formData.interval,
      weekdays: formData.recurrence_days || [],
      recurrence_end_date: untilDate ? untilDate.toISOString() : null,

      // Monthly
      monthlyDay: tempRecurrenceConfig.monthlyMode === 'day' ? tempRecurrenceConfig.monthlyDay : null,
      monthlyOrdinal: tempRecurrenceConfig.monthlyMode === 'weekday' ? tempRecurrenceConfig.monthlyOrdinal : null,
      monthlyWeekday: tempRecurrenceConfig.monthlyMode === 'weekday' ? tempRecurrenceConfig.monthlyWeekday : null,

      // Yearly specific
      yearlyMode: tempRecurrenceConfig.yearlyMode,
      yearlyMonth: tempRecurrenceConfig.yearlyMonth,
      yearlyDay: tempRecurrenceConfig.yearlyDay,
      yearlyOrdinal: tempRecurrenceConfig.yearlyOrdinal,
      yearlyWeekday: tempRecurrenceConfig.yearlyWeekday,
    };

    console.log('Submitting payload:', payload); // ✅ Debug log

    // Always POST just once
    const response = await axios.post('https://machine-backend.azurewebsites.net/ajouter/maintenance', payload);

    // Just refresh from backend to stay consistent
    await fetchMaintenanceEvents();
    toast.success("Maintenance task added!", { position: "bottom-right" });

    resetForm();

  } catch (err) {
    console.error('Submit error:', err);
    toast.error(err.response?.data?.message || "Error submitting task", { position: "bottom-right" });
  } finally {
    setIsSubmitting(false);
  }
};

  // Ensure createEventObject handles the data structure correctly
  const createEventObject = (eventData) => {
    const startDate = eventData.start_date || eventData.start;
    return {
      id: eventData._id || eventData.id,
      title: eventData.task_name,
      start: startDate, // Already a Date object
      end: eventData.end_date || new Date(startDate.getTime() + 24 * 60 * 60 * 1000),
      allDay: true,
      extendedProps: {
        maintenance_type: eventData.maintenance_type,
        task_description: eventData.task_description,
        assigned_to: eventData.assigned_to,
        task_status: eventData.task_status,
        machine_id: eventData.machine_id,
        isRecurring: eventData.is_recurring || eventData.recurrence !== 'none',
      },
      backgroundColor: eventData.is_recurring ? '#6b7280' : '#3b82f6',
      borderColor: eventData.is_recurring ? '#4b5563' : '#2563eb',
    };
  };


  function getOrdinalWeek(date) {
    const day = date.getDate();
    if (day <= 7) return "First";
    if (day <= 14) return "Second";
    if (day <= 21) return "Third";
    if (day <= 28) return "Fourth";
    return "Last";
  }

  function generateRecurringEvents(baseEvent) {
    const instances = [];
    const { recurrence, interval, recurrence_end_date } = baseEvent;

    const startDate = new Date(baseEvent.start_date);
    const endDate = new Date(baseEvent.end_date);
    const until = recurrence_end_date || new Date(startDate.getFullYear() + 5, 11, 31); // fallback max 5 years

    let cursor = new Date(startDate);

    // Helper for nth weekday logic
    function nthWeekdayOfMonth(year, month, weekday, ordinal) {
      const firstDay = new Date(year, month, 1);
      const firstWeekday = firstDay.getDay();
      let day = 1 + ((7 + weekday - firstWeekday) % 7);

      if (ordinal > 0) {
        day += (ordinal - 1) * 7;
      } else if (ordinal === -1) {
        // last weekday of month
        const lastDay = new Date(year, month + 1, 0).getDate();
        const lastDate = new Date(year, month, lastDay);
        const lastWeekday = lastDate.getDay();
        day = lastDay - ((7 + lastWeekday - weekday) % 7);
      }

      return new Date(year, month, day);
    }

    while (cursor <= until) {
      let nextStart = null;

      if (recurrence === 'daily') {
        nextStart = new Date(cursor);
        cursor.setDate(cursor.getDate() + interval);

      } else if (recurrence === 'weekly') {
        baseEvent.weekdays.forEach(weekday => {
          const temp = new Date(cursor);
          temp.setDate(temp.getDate() + ((7 + weekday - temp.getDay()) % 7));
          if (temp >= startDate && temp <= until) {
            instances.push({
              ...baseEvent,
              start_date: temp,
              end_date: new Date(temp.getTime() + (endDate - startDate)),
            });
          }
        });
        cursor.setDate(cursor.getDate() + interval * 7);
        continue;

      } else if (recurrence === 'monthly') {
        if (baseEvent.monthly_mode === 'day') {
          // e.g., 5th of every month
          nextStart = new Date(cursor.getFullYear(), cursor.getMonth(), baseEvent.monthly_day);

        } else if (baseEvent.monthly_mode === 'weekday') {
          // e.g., first Monday of every month
          nextStart = nthWeekdayOfMonth(
            cursor.getFullYear(),
            cursor.getMonth(),
            baseEvent.monthly_weekday,
            baseEvent.monthly_ordinal
          );
        }
        cursor.setMonth(cursor.getMonth() + interval);

      } else if (recurrence === 'yearly') {
        if (baseEvent.yearly_mode === 'day') {
          // e.g., Jan 5 every year
          nextStart = new Date(cursor.getFullYear(), baseEvent.yearly_month, baseEvent.yearly_day);

        } else if (baseEvent.yearly_mode === 'weekday') {
          // e.g., second Tuesday of January
          nextStart = nthWeekdayOfMonth(
            cursor.getFullYear(),
            baseEvent.yearly_month,
            baseEvent.yearly_weekday,
            baseEvent.yearly_ordinal
          );
        }
        cursor.setFullYear(cursor.getFullYear() + interval);
      }

      if (nextStart && nextStart >= startDate && nextStart <= until) {
        instances.push({
          ...baseEvent,
          start_date: nextStart,
          end_date: new Date(nextStart.getTime() + (endDate - startDate)),
        });
      }
    }

    return instances;
  }



  const resetForm = () => {
    setFormData({
      maintenance_type: '',
      task_name: '',
      task_description: '',
      task_status: 'Pending',
      assigned_to: '',
      start_date: null,
      end_date: null,
      completed_date: null,
      machine_id: '', // This is the important fix
      recurrence: 'none',
      interval: 1,
      recurrence_days: [],
      recurrence_end_date: null,
      monthly_mode: 'day',
      monthly_day: 1,
      monthly_ordinal: 'first',
      monthly_weekday: 1,
      yearly_mode: 'weekday',
      yearly_month: 0,
      yearly_day: 1,
      yearly_ordinal: 'first',
      yearly_weekday: 1,
    });

    // Also reset the temporary recurrence config
    setTempRecurrenceConfig({
      interval: 1,
      days: [],
      endDate: null,
      monthlyMode: "day",
      monthlyDay: 1,
      monthlyOrdinal: "first",
      monthlyWeekday: 1,
      yearlyMode: "weekday",
      yearlyMonth: 0,
      yearlyDay: 1,
      yearlyOrdinal: "first",
      yearlyWeekday: 1,
    });
  };
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const endDate = new Date(event.end);
    endDate.setDate(endDate.getDate() - 1);
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start?.toISOString().split("T")[0] || "",
      end: endDate.toISOString().split("T")[0],
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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.user_id === userId);
    return user && user.email ? user.email.split('@')[0] : "Unknown User";
  };

  const formatEvents = (events) => {
    return events.map(ev => {
      try {
        const startDate = new Date(ev.start);
        let endDate = ev.end ? new Date(ev.end) : null;
        if (endDate) endDate.setDate(endDate.getDate() + 1);
        return { ...ev, start: startDate, end: endDate };
      } catch (error) {
        console.error('Error processing event:', ev, error);
        return null;
      }
    }).filter(ev => ev !== null);
  };

  const adjustedEvents = formatEvents(events);

  if (loading) {
    return <div>Loading maintenance calendar...</div>;
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayValues = [1, 2, 3, 4, 5, 6, 0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const units = {
    daily: 'day(s)',
    weekly: 'week(s)',
    monthly: 'month(s)',
    yearly: 'year(s)',
  };

  const getRecurrenceDescription = () => {
    if (!formData.recurrence || formData.recurrence === "none") return "Does not repeat";
    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2); // take last 2 digits
      return `${month}/${day}/${year}`;
    };
    const interval = tempRecurrenceConfig.interval || formData.interval || 1;
    const startDate = formData.start_date ? formatDate(formData.start_date) : "";
    const endDate = tempRecurrenceConfig.endDate
      ? formatDate(tempRecurrenceConfig.endDate)
      : formData.recurrence_end_date
        ? formatDate(formData.recurrence_end_date)
        : "";

    let desc = "";
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    switch (formData.recurrence) {
      case "daily":
        desc = `Occurs every ${interval} day${interval > 1 ? "s" : ""} starting ${startDate}`;
        break;

      case "weekly": {
        const selectedDays = tempRecurrenceConfig.days.length > 0
          ? tempRecurrenceConfig.days
          : (formData.recurrence_days && formData.recurrence_days.length > 0 ? formData.recurrence_days : []);

        const selectedDayNames = selectedDays
          .sort()
          .map(d => weekdays[d])
          .join(", ");

        desc = selectedDayNames
          ? `Occurs every ${interval} week${interval > 1 ? "s" : ""} on ${selectedDayNames} starting ${startDate}`
          : `Occurs every ${interval} week${interval > 1 ? "s" : ""} starting ${startDate}`;
        break;
      }

      case "monthly":
        // Check tempRecurrenceConfig first (for modal), then fall back to formData
        const monthlyMode = tempRecurrenceConfig.monthlyMode || formData.monthly_mode || 'day';

        if (monthlyMode === "day") {
          const day = tempRecurrenceConfig.monthlyDay || formData.monthly_day || 1;
          desc = `Occurs every ${interval} month${interval > 1 ? "s" : ""} on day ${day} starting from ${startDate}`;
        } else {
          const ordinal = tempRecurrenceConfig.monthlyOrdinal || formData.monthly_ordinal || 'first';
          const weekday = tempRecurrenceConfig.monthlyWeekday !== undefined
            ? tempRecurrenceConfig.monthlyWeekday
            : (formData.monthly_weekday !== undefined ? formData.monthly_weekday : 1);

          desc = `Occurs every ${interval} month${interval > 1 ? "s" : ""} on the ${ordinal} ${weekdays[weekday]} starting ${startDate}`;
        }
        break;
      case "yearly":
        // Check tempRecurrenceConfig first (for modal), then fall back to formData
        const yearlyMode = tempRecurrenceConfig.yearlyMode || formData.yearly_mode || 'day';

        if (yearlyMode === "day") {
          const month = tempRecurrenceConfig.yearlyMonth !== undefined ? tempRecurrenceConfig.yearlyMonth : (formData.yearly_month !== undefined ? formData.yearly_month : 0);
          const day = tempRecurrenceConfig.yearlyDay || formData.yearly_day || 1;
          const monthName = new Date(2000, month, 1).toLocaleDateString('en-US', { month: "long" });
          desc = `Occurs every ${interval} year${interval > 1 ? "s" : ""} on ${monthName} ${day} starting from ${startDate}`;
        } else {
          const month = tempRecurrenceConfig.yearlyMonth !== undefined ? tempRecurrenceConfig.yearlyMonth : (formData.yearly_month !== undefined ? formData.yearly_month : 0);
          const ordinal = tempRecurrenceConfig.yearlyOrdinal || formData.yearly_ordinal || 'first';
          const weekday = tempRecurrenceConfig.yearlyWeekday !== undefined
            ? tempRecurrenceConfig.yearlyWeekday
            : (formData.yearly_weekday !== undefined ? formData.yearly_weekday : 1);
          const monthName = new Date(2000, month, 1).toLocaleDateString('en-US', { month: "long" });
          desc = `Occurs every ${interval} year${interval > 1 ? "s" : ""} on the ${ordinal} ${weekdays[weekday]} of ${monthName} starting ${startDate}`;
        }
        break;


      default:
        desc = "Does not repeat";
    }

    if (endDate) desc += ` until ${endDate}`;

    return desc;
  };



  return (
    <div style={{ display: 'flex', gap: '0.4rem', padding: '1rem', maxWidth: '100%' }}>
      <div style={{ flex: 3, backgroundColor: '#fff', padding: '1rem', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#1f2937' }}>Calendar</h3>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          selectable={true}
          firstDay={1}
          locale="en-GB"
          eventTimeFormat={false}
          events={events}
          eventDisplay="block"
          eventDidMount={(info) => {
            if (info.event.id.startsWith('temp-')) {
              info.el.style.backgroundColor = 'rgba(59, 130, 246, 0.7)';
              info.el.style.border = '2px dashed #2563eb';
            } else {
              info.el.style.backgroundColor = '#3b82f6';
              info.el.style.borderColor = '#2563eb';
            }
          }}
          eventClick={handleEventClick}
          dateClick={(info) => {
            const clickedDate = new Date(info.date);
            clickedDate.setHours(0, 0, 0, 0);
            if (formData.start_date && formData.end_date) {
              setFormData({ ...formData, start_date: clickedDate, end_date: null });
              return;
            }
            if (!formData.start_date) {
              setFormData(prev => ({ ...prev, start_date: clickedDate }));
              return;
            }
            if (clickedDate >= formData.start_date) {
              setFormData(prev => ({ ...prev, end_date: clickedDate }));
            } else {
              setFormData(prev => ({ ...prev, start_date: clickedDate, end_date: null }));
            }
          }}
          eventContent={(eventInfo) => (
            <div className="fc-event-content">
              <div className="fc-event-title">{eventInfo.event.title}</div>
              <div className="fc-event-time">{eventInfo.timeText}</div>
            </div>
          )}
        />
      </div>
      <div
        style={{
          flex: 1,
          maxWidth: 900,
          width: '100%',
          margin: '0 auto',
          padding: '2rem',
          borderRadius: 16,
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <form onSubmit={handleSubmit}>
          <h1
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '22px',
              fontWeight: 'bold',
              marginBottom: '3rem',
            }}
          >
            Add Maintenance
          </h1>

          <div
            className="flex items-end space-x-6 p-4 bg-white shadow rounded-lg"
            style={{ position: 'relative', zIndex: 50, marginBottom: '2rem' }}
          >
            <div className="flex flex-col" style={{ zIndex: 100 }}>
              <label className="text-gray-700 font-medium mb-2">Start Date & Time</label>
              <DatePicker
                selected={formData.start_date}
                onChange={(date) => setFormData((prev) => ({ ...prev, start_date: date }))}
                showTimeSelect
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select start date & time"
                className="w-64 px-3 py-2 border rounded focus:outline-none focus:ring"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col" style={{ zIndex: 100 }}>
              <label className="text-gray-700 font-medium mb-2">End Date & Time</label>
              <DatePicker
                selected={formData.end_date}
                onChange={(date) => setFormData((prev) => ({ ...prev, end_date: date }))}
                showTimeSelect
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end date & time"
                className="w-64 px-3 py-2 border rounded focus:outline-none focus:ring"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-field" style={{ marginBottom: '2rem' }}>
            <select
              name="recurrence"
              value={formData.recurrence}
              onChange={handleRecurrenceChange}
              onClick={(e) => {
                // If clicking the already selected option, open modal with existing data
                if (e.target.value === formData.recurrence && formData.recurrence !== 'none') {
                  setTempRecurrenceConfig({
                    interval: formData.interval || 1,
                    days: formData.recurrence_days || [],
                    endDate: formData.recurrence_end_date || null,
                    monthlyMode: formData.monthly_mode || 'day',
                    monthlyDay: formData.monthly_day || 1,
                    monthlyOrdinal: formData.monthly_ordinal || 'first',
                    monthlyWeekday: formData.monthly_weekday || 1,
                    yearlyMode: formData.yearly_mode || 'day',
                    yearlyMonth: formData.yearly_month || 0,
                    yearlyDay: formData.yearly_day || 1,
                    yearlyOrdinal: formData.yearly_ordinal || 'first',
                    yearlyWeekday: formData.yearly_weekday || 1,
                  });
                  setIsRecurrenceModalOpen(true);
                }
              }}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '0.5rem',
                fontSize: '0.95rem',
              }}
            >
              <option value="none">Do Not Repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem',
              padding: '0.5rem 0',
            }}
          >
            {/* Task Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Task Name
              </label>
              <input
                type="text"
                name="task_name"
                value={formData.task_name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            {/* Maintenance Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Maintenance Type
              </label>
              <select
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  fontSize: '0.95rem',
                  backgroundColor: '#fff',
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

            {/* Machine */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Machine
              </label>
              <select
                name="machine_id"
                value={formData.machine_id}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  fontSize: '0.95rem',
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

            {/* Assigned To */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Assigned To
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  fontSize: '0.95rem',
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

            {/* Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Notes
              </label>
              <textarea
                name="task_description"
                value={formData.task_description}
                onChange={handleChange}
                rows="6"
                required
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '2rem',
              width: '100%',
              backgroundColor: isSubmitting ? '#94a3b8' : '#2563eb',
              color: 'white',
              padding: '0.7rem',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              border: 'none',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseOver={(e) => {
              if (!isSubmitting) {
                e.target.style.backgroundColor = '#1e40af';
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitting) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Adding Task...
              </>
            ) : (
              'Submit Task'
            )}
          </button>
        </form>
      </div>


      <Modal title="Maintenance Task Details" open={isModalOpen} onCancel={closeModal} footer={null} destroyOnClose>
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
              <div className="flex flex-row gap-6">
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
                value={selectedEvent?.task_name || ""}
                onChange={(e) => setSelectedEvent(prev => ({ ...prev, task_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block font-semibold">Maintenance Type</label>
              <input
                className="border w-full rounded p-1"
                value={selectedEvent?.maintenance_type || ""}
                onChange={(e) => setSelectedEvent(prev => ({ ...prev, maintenance_type: e.target.value }))}
              />
            </div>
            <div>
              <label className="block font-semibold">Task_description</label>
              <textarea
                className="border w-full rounded p-1"
                value={selectedEvent?.task_description || ""}
                onChange={(e) => setSelectedEvent(prev => ({ ...prev, task_description: e.target.value }))}
              />
            </div>
            <div className="text-right">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const parsedCreator = parseInt(creator, 10);
                    if (!Number.isInteger(parsedCreator) || !eventStartDate || !eventEndDate) return;
                    const payload = {
                      title: eventTitle,
                      maintenance_type: selectedEvent.maintenance_type,
                      task_name: selectedEvent.task_name,
                      task_description: selectedEvent.task_description,
                      start_date: new Date(eventStartDate).toISOString(),
                      end_date: new Date(eventEndDate).toISOString(),
                      task_status: selectedEvent.task_status,
                      assigned_to: selectedEvent.assigned_to,
                      creator: parsedCreator,
                      completed_date: null,
                      user_id: parsedCreator,
                    };
                    const response = await fetch(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${selectedEvent.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    if (response.ok) {
                      setSnackbar({ open: true, message: `Maintenance updated successfully`, severity: "success" });
                      await fetchMaintenanceEvents();
                    } else console.error("Failed to update maintenance:", await response.text());
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

      <Modal
        title="Define Recurrence"
        open={isRecurrenceModalOpen}
        onOk={handleSaveRecurrence}
        onCancel={handleCancelRecurrence}
        okText="Save"
        cancelText="Cancel"
      >
        <div className="space-y-4">
          <div><label>Start: </label><span>{formData.start_date ? formData.start_date.toLocaleDateString() : 'Select start date'}</span></div>
          <div className="flex items-center">
            <label>Repeat every: </label>
            <input
              type="number"
              min="1"
              value={formData.recurrence === "yearly" ? 1 : (formData.interval ?? "")}
              disabled={formData.recurrence === "yearly"} // yearly is fixed to 1
              onChange={(e) => {
                const val = e.target.value === "" ? null : Math.max(1, parseInt(e.target.value, 10));
                setFormData(prev => ({ ...prev, interval: val }));
                if (formData.recurrence === "monthly" || formData.recurrence === "weekly" || formData.recurrence === "daily") {
                  setTempRecurrenceConfig(prev => ({ ...prev, interval: val }));
                }
              }}
              className="w-16 mx-2 border rounded p-1"
            />
            <span>{units[formData.recurrence]}</span>
          </div>

          {formData.recurrence === 'weekly' && (
            <div>
              <label className="block font-medium mb-2">Select days:</label>
              <div className="flex justify-between mb-4">
                {dayLabels.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`w-8 h-8 rounded-full ${tempRecurrenceConfig.days.includes(dayValues[idx]) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => {
                      const newDays = tempRecurrenceConfig.days.includes(dayValues[idx])
                        ? tempRecurrenceConfig.days.filter(d => d !== dayValues[idx])
                        : [...tempRecurrenceConfig.days, dayValues[idx]];

                      setTempRecurrenceConfig(prev => ({
                        ...prev,
                        days: newDays
                      }));

                      // Also update formData to reflect the change immediately
                      setFormData(prev => ({
                        ...prev,
                        recurrence_days: newDays
                      }));
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                {getRecurrenceDescription()}
              </div>
            </div>
          )}
          {formData.recurrence === 'monthly' && (
            <div className="space-y-3">
              <label className="block font-medium">Repeat on:</label>

              {/* Option 1: Day number */}
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={tempRecurrenceConfig.monthlyMode === 'day'}
                  onChange={() => setTempRecurrenceConfig(prev => ({
                    ...prev,
                    monthlyMode: 'day'
                  }))}
                />
                <span>Day</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={tempRecurrenceConfig.monthlyDay}
                  onChange={(e) =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      monthlyDay: parseInt(e.target.value)
                    }))
                  }
                  disabled={tempRecurrenceConfig.monthlyMode !== 'day'}
                  className="w-16 border rounded p-1"
                />
              </div>

              {/* Option 2: Weekday ordinal */}
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={tempRecurrenceConfig.monthlyMode === 'weekday'}
                  onChange={() => setTempRecurrenceConfig(prev => ({
                    ...prev,
                    monthlyMode: 'weekday',
                    monthlyOrdinal: prev.monthlyOrdinal || 'first',
                    monthlyWeekday: prev.monthlyWeekday || 1
                  }))}
                />
                <span>On the</span>

                <select
                  value={tempRecurrenceConfig.monthlyOrdinal || 'first'}
                  onChange={(e) =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      monthlyOrdinal: e.target.value
                    }))
                  }
                  disabled={tempRecurrenceConfig.monthlyMode !== 'weekday'}
                  className="border rounded p-1"
                >
                  <option value="first">First</option>
                  <option value="second">Second</option>
                  <option value="third">Third</option>
                  <option value="fourth">Fourth</option>
                  <option value="last">Last</option>
                </select>

                <select
                  value={tempRecurrenceConfig.monthlyWeekday || 1}
                  onChange={(e) =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      monthlyWeekday: parseInt(e.target.value)
                    }))
                  }
                  disabled={tempRecurrenceConfig.monthlyMode !== 'weekday'}
                  className="border rounded p-1"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>

              {/* Display the monthly recurrence description */}
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
                {getRecurrenceDescription()}
              </div>
            </div>
          )}

          {formData.recurrence === 'yearly' && (
            <div className="space-y-3">
              <label className="block font-medium">Repeat on:</label>

              {/* Option 1: Exact date (month + day) */}
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={tempRecurrenceConfig.yearlyMode === 'day'}
                  onChange={() =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      yearlyMode: 'day',
                    }))
                  }
                />
                <span>Day</span>

                <select
                  value={tempRecurrenceConfig.yearlyMonth ?? 0}
                  onChange={(e) =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      yearlyMonth: parseInt(e.target.value),
                    }))
                  }
                  disabled={tempRecurrenceConfig.yearlyMode !== 'day'}
                  className="border rounded p-1"
                >
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  max={31}
                  value={tempRecurrenceConfig.yearlyDay ?? 1}
                  onChange={(e) =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      yearlyDay: parseInt(e.target.value),
                    }))
                  }
                  disabled={tempRecurrenceConfig.yearlyMode !== 'day'}
                  className="w-16 border rounded p-1"
                />
              </div>

              {/* Option 2: Weekday ordinal in a month */}
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={tempRecurrenceConfig.yearlyMode === 'weekday'}
                  onChange={() =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      yearlyMode: 'weekday',
                    }))
                  }
                />
                <span>On the</span>

                <select
                  value={tempRecurrenceConfig.yearlyOrdinal ?? "first"}
                  onChange={(e) =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      yearlyOrdinal: e.target.value,
                    }))
                  }
                  disabled={tempRecurrenceConfig.yearlyMode !== 'weekday'}
                  className="border rounded p-1"
                >
                  <option value="first">First</option>
                  <option value="second">Second</option>
                  <option value="third">Third</option>
                  <option value="fourth">Fourth</option>
                  <option value="last">Last</option>
                </select>

                <select
                  value={tempRecurrenceConfig.yearlyWeekday ?? 1}
                  onChange={(e) =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      yearlyWeekday: parseInt(e.target.value),
                    }))
                  }
                  disabled={tempRecurrenceConfig.yearlyMode !== 'weekday'}
                  className="border rounded p-1"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>

                <select
                  value={tempRecurrenceConfig.yearlyMonth ?? 0}
                  onChange={(e) =>
                    setTempRecurrenceConfig(prev => ({
                      ...prev,
                      yearlyMonth: parseInt(e.target.value),
                    }))
                  }
                  disabled={tempRecurrenceConfig.yearlyMode !== 'weekday'}
                  className="border rounded p-1"
                >
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}


          <div>
            <label>End: </label>
            <DatePicker
              selected={tempRecurrenceConfig.endDate}
              onChange={(date) => setTempRecurrenceConfig(prev => ({ ...prev, endDate: date }))}
              minDate={formData.start_date}
              placeholderText="Select a date"
              className="border rounded p-1"
            />
          </div>
          <p className="text-sm text-gray-500">{getRecurrenceDescription()}</p>
        </div>
      </Modal>
    </div>
  );
};

export default Addmaintenance;
