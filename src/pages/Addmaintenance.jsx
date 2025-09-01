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
    const response = await axios.get('https://machine-backend.azurewebsites.net/ajouter/maintenance');

    const formattedEvents = response.data.flatMap(ev => {
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
            start_date: startDate, // Use Date object, not string
            end_date: endDate,     // Use Date object, not string
            interval: ev.interval || 1,
            weekdays: ev.weekdays || [],
            recurrence_end_date: ev.recurrence_end_date ? new Date(ev.recurrence_end_date) : null,
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleRecurrenceChange = (e) => {
  const value = e.target.value;

  const newFormData = { 
    ...formData, 
    recurrence: value,
    recurrence_days: [],
    recurrence_end_date: null,
  };

  if (value === "yearly") {
    // Force interval to 1 when yearly
    newFormData.interval = 1;

    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      newFormData.recurrence_end_date = endDate;
    }
  } else {
    // Keep whatever interval user already typed for daily/weekly/monthly
    newFormData.interval = formData.interval ?? null;
  }

  setFormData(newFormData);

  setPrevRecurrence(formData.recurrence);
  setTempRecurrenceConfig({
    interval: newFormData.interval,
    days: [],
    endDate: newFormData.recurrence_end_date,
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


  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.start_date) {
    toast.error("Please select a start date", { position: "bottom-right" });
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
      return;
    }

    const untilDate = formData.recurrence_end_date
      ? new Date(formData.recurrence_end_date)
      : null;

    if (formData.recurrence !== 'none' && !untilDate) {
      toast.error("Please select an end date for recurrence", { position: "bottom-right" });
      return;
    }

    // Build payload
    const payload = {
      maintenance_type: formData.maintenance_type,
      task_name: formData.task_name,
      task_description: formData.task_description,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      assigned_to: formData.assigned_to,
      creator: user_id,
      user_id: user_id,
      machine_id: formData.machine_id,
      task_status: formData.task_status,

      // Recurrence fields
      recurrence: formData.recurrence || 'none',
      interval: formData.interval,
      weekdays: formData.recurrence_days || [],
      recurrence_end_date: untilDate ? untilDate.toISOString() : null,

      // Monthly specific
      monthlyDay: tempRecurrenceConfig.monthlyDay,
      monthlyOrdinal: tempRecurrenceConfig.monthlyOrdinal,
      monthlyWeekday: tempRecurrenceConfig.monthlyWeekday,

      // Yearly specific
      yearlyMode: tempRecurrenceConfig.yearlyMode,
      yearlyMonth: tempRecurrenceConfig.yearlyMonth,
      yearlyDay: tempRecurrenceConfig.yearlyDay,
      yearlyOrdinal: tempRecurrenceConfig.yearlyOrdinal,
      yearlyWeekday: tempRecurrenceConfig.yearlyWeekday,

    };

    // Always POST just once
    const response = await axios.post('https://machine-backend.azurewebsites.net/ajouter/maintenance', payload);

    // Expand events locally for calendar display
    const baseEvent = response.data;
    let eventsToDisplay = [];

    if (baseEvent.recurrence === 'none') {
      eventsToDisplay = [createEventObject(baseEvent)];
    } else {
      const instances = generateRecurringEvents(baseEvent); // this handles interval logic
      eventsToDisplay = instances.map(createEventObject);
    }

    setEvents(prev => [...prev, ...eventsToDisplay]);
    toast.success("Maintenance task added!", { position: "bottom-right" });

    resetForm();
  } catch (err) {
    console.error(err);
    toast.error("Error submitting task", { position: "bottom-right" });
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

const generateRecurringEvents = (baseEvent) => {
  const instances = [];
  const startDate = new Date(baseEvent.start_date);
  const recurrenceEndDate = baseEvent.recurrence_end_date 
    ? new Date(baseEvent.recurrence_end_date)
    : null;

  const maxInstances = 100;
  let instanceCount = 0;

  const getNthWeekdayOfMonth = (year, month, weekday, ordinal) => {
    if (ordinal === 'last') {
      let d = new Date(year, month + 1, 0);
      while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
      return d;
    } else {
      const ordinalMap = { first: 1, second: 2, third: 3, fourth: 4 };
      let targetOrdinal = ordinalMap[ordinal] || 1;
      let d = new Date(year, month, 1);
      let count = 0;
      while (d.getMonth() === month) {
        if (d.getDay() === weekday) count++;
        if (count === targetOrdinal) return d;
        d.setDate(d.getDate() + 1);
      }
    }
  };

  switch (baseEvent.recurrence) {
    case 'daily': {
      let d = new Date(startDate);
      while ((!recurrenceEndDate || d <= recurrenceEndDate) && instanceCount < maxInstances) {
        instances.push(new Date(d));
        d.setDate(d.getDate() + (baseEvent.interval || 1));
        instanceCount++;
      }
      break;
    }

    case 'weekly': {
      const days = baseEvent.weekdays.length ? baseEvent.weekdays : [startDate.getDay()];
      const interval = baseEvent.interval || 1;

      days.forEach(weekday => {
        let d = new Date(startDate);
        let diff = (weekday - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + diff);

        let weeklyCount = 0;
        while ((!recurrenceEndDate || d <= recurrenceEndDate) && weeklyCount < maxInstances) {
          instances.push(new Date(d));
          d.setDate(d.getDate() + 7 * interval);
          weeklyCount++;
        }
      });
      break;
    }

    case 'monthly': {
      let d = new Date(startDate);
      const interval = baseEvent.interval || 1;

      while ((!recurrenceEndDate || d <= recurrenceEndDate) && instanceCount < maxInstances) {
        let chosen = null;

        if (baseEvent.monthly_mode === 'day') {
          const day = baseEvent.monthly_day || startDate.getDate();
          const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
          chosen = new Date(d.getFullYear(), d.getMonth(), Math.min(day, daysInMonth));
        } else if (baseEvent.monthly_mode === 'weekday') {
          chosen = getNthWeekdayOfMonth(
            d.getFullYear(),
            d.getMonth(),
            baseEvent.monthly_weekday,
            baseEvent.monthly_ordinal
          );
        }

        if (chosen) instances.push(chosen);

        d.setMonth(d.getMonth() + interval);
        instanceCount++;
      }
      break;
    }

case 'yearly': {
  const interval = baseEvent.interval || 1;

  const getNthWeekdayOfMonth = (year, month, weekday, ordinal) => {
    // Convert weekday to 0-6 (Sunday-Saturday)
    const targetWeekday = parseInt(weekday);
    
    if (ordinal === 'last') {
      // Start from the last day of the month and go backwards
      let d = new Date(year, month + 1, 0);
      while (d.getDay() !== targetWeekday) {
        d.setDate(d.getDate() - 1);
      }
      return d;
    } else {
      // For "first", "second", "third", "fourth"
      const ordinalMap = { first: 1, second: 2, third: 3, fourth: 4 };
      const targetOccurrence = ordinalMap[ordinal] || 1;
      
      // Start from the first day of the month
      let d = new Date(year, month, 1);
      let occurrenceCount = 0;
      
      // Find the target occurrence of the weekday
      while (d.getMonth() === month) {
        if (d.getDay() === targetWeekday) {
          occurrenceCount++;
          if (occurrenceCount === targetOccurrence) {
            return d;
          }
        }
        d.setDate(d.getDate() + 1);
      }
      
      // If we didn't find the exact occurrence (e.g., asking for 5th Monday),
      // return the last found occurrence
      return occurrenceCount > 0 ? new Date(year, month, d.getDate() - 1) : null;
    }
  };

  const buildYearlyDate = (year) => {
    // Use the values from the event, fall back to defaults if not provided
    const mode = baseEvent.yearly_mode || 'weekday'; // Default to weekday
    const month = baseEvent.yearly_month !== undefined ? baseEvent.yearly_month : 0; // Default to January
    const day = baseEvent.yearly_day || 1;
    const ordinal = baseEvent.yearly_ordinal || 'first'; // Default to first
    const weekday = baseEvent.yearly_weekday !== undefined ? baseEvent.yearly_weekday : 1; // Default to Monday

    if (mode === 'day') {
      // Exact date (month + day)
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const actualDay = Math.min(day, daysInMonth);
      return new Date(year, month, actualDay);
    } else if (mode === 'weekday') {
      // Nth weekday in month
      return getNthWeekdayOfMonth(year, month, weekday, ordinal);
    }
    return null;
  };

  let year = startDate.getFullYear();
  let currentDate = buildYearlyDate(year);

  // If the generated date is before the start date, move to next year
  if (currentDate && currentDate < startDate) {
    year += interval;
    currentDate = buildYearlyDate(year);
  }

  while (currentDate && (!recurrenceEndDate || currentDate <= recurrenceEndDate) && instanceCount < maxInstances) {
    instances.push(new Date(currentDate));
    instanceCount++;
    
    year += interval;
    currentDate = buildYearlyDate(year);
    
    // Safety check to prevent infinite loop
    if (!currentDate || instanceCount >= maxInstances) break;
  }
  break;
}

    default:
      instances.push(new Date(startDate));
      break;
  }

  // Calculate duration of original event
  const duration = new Date(baseEvent.end_date) - new Date(baseEvent.start_date);

  return instances.map(date => ({
   ...baseEvent,
   start_date: date,                                // Date object
   end_date: new Date(date.getTime() + duration),   // Preserve duration
   is_recurring: baseEvent.recurrence !== 'none'
  }));
  };


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
      machine_id: '',
      recurrence: 'none',
      interval: 1,
      recurrence_days: [],
      recurrence_end_date: null,
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

  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
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

  const interval = tempRecurrenceConfig.interval || formData.interval || 1;
  const startDate = formData.start_date ? new Date(formData.start_date).toLocaleDateString() : "";
  const endDate = tempRecurrenceConfig.endDate || formData.recurrence_end_date 
    ? new Date(tempRecurrenceConfig.endDate || formData.recurrence_end_date).toLocaleDateString() 
    : null;

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
        const monthName = new Date(2000, month, 1).toLocaleDateString(undefined, { month: "long" });
        desc = `Occurs every ${interval} year${interval > 1 ? "s" : ""} on ${monthName} ${day} starting from ${startDate}`;
      } else {
        const month = tempRecurrenceConfig.yearlyMonth !== undefined ? tempRecurrenceConfig.yearlyMonth : (formData.yearly_month !== undefined ? formData.yearly_month : 0);
        const ordinal = tempRecurrenceConfig.yearlyOrdinal || formData.yearly_ordinal || 'first';
        const weekday = tempRecurrenceConfig.yearlyWeekday !== undefined 
          ? tempRecurrenceConfig.yearlyWeekday 
          : (formData.yearly_weekday !== undefined ? formData.yearly_weekday : 1);
        const monthName = new Date(2000, month, 1).toLocaleDateString(undefined, { month: "long" });
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
      style={{
        marginTop: '2rem',
        width: '100%',
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '0.7rem',
        borderRadius: '8px',
        fontSize: '0.95rem',
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
          'January','February','March','April','May','June',
          'July','August','September','October','November','December'
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
          'January','February','March','April','May','June',
          'July','August','September','October','November','December'
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
