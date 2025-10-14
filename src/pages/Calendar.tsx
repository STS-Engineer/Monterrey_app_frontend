import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "antd";
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
import DatePicker from "react-datepicker";
import axios from "axios";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    maintenance_type: string;
    task_description: string;
    executor: string;
    status: string;
  };
}

interface SelectedEvent {
  id?: string;
  title: string;
  start: string;
  end: string;
  maintenance_type: string;
  task_description: string;
  executor: string;
  status: string;
}

const Calendar: React.FC = () => {

  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState(""); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const [users, setUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

useEffect(() => {
  fetch("https://machine-backend.azurewebsites.net/ajouter/users")
    .then((res) => res.json())
    .then((data) => setUsers(data))
    .catch((err) => console.error("Error fetching users:", err));
}, []);

  useEffect(() => {
    const fetchMaintenanceEvents = async () => {
      try {
        const response = await axios.get("https://machine-backend.azurewebsites.net/ajouter/maintenance");
        console.log("Fetched data:", response.data)
        const fetchedEvents: CalendarEvent[] = response.data.map((event: any) => ({
          id: event.id,
          title: event.task_name || "No Task Name",  // Use task_name here
          start: event.start,
          end: event.end || event.start,
          allDay: true,
          extendedProps: {
            calendar: event.level || "Primary", // or set your logic
            maintenance_type: event.maintenance_type,
            task_description: event.task_description,
            executor: event.executor,
            status: event.status
          }
        }));
        
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Failed to fetch maintenance events:", error);
      }
    };
    
    fetchMaintenanceEvents();
  }, []);
  

  
const openModal = () => setIsModalOpen(true);
const closeModal = () => {
  setIsModalOpen(false);
  setIsEditing(false);
};
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start?.toISOString().split("T")[0] || "",
      end: event.end?.toISOString().split("T")[0] || event.start?.toISOString().split("T")[0] || "",
      maintenance_type: event.extendedProps.maintenance_type,
      task_description: event.extendedProps.task_description,
      executor: event.extendedProps.executor,
      status: event.extendedProps.status,
    });
    openModal();
  };
  
const getUserEmail = (userId: string) => {
  const user = users.find((u: any) => u.user_id === userId);
  if (user && user.email) {
    return user.email.split('@')[0]; // Extract "mootaz" from "mootaz@gmail.com"
  }
  return "Unknown User";
};



  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
  };

  return (
    <>

      <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

        <Snackbar
              open={snackbar.open}
              autoHideDuration={3000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
              <Alert
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                severity={snackbar.severity}
                variant="filled"
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Add Event +",
                click: openModal,
              },
            }}
          />
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
      <p><strong>Task:</strong> {selectedEvent.title}</p>
      <p><strong>Maintenance Type:</strong> {selectedEvent.maintenance_type}</p>
      <p><strong>Task_description:</strong> {selectedEvent.task_description}</p>
    </div>
  ) : (
    <form className="space-y-2 text-sm text-gray-700">
      <div>
        <label className="block font-semibold">Task</label>
        <input
          className="border w-full rounded p-1"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="block font-semibold">Maintenance Type</label>
        <input
          className="border w-full rounded p-1"
          value={selectedEvent?.maintenance_type || ""}
          onChange={(e) =>
            setSelectedEvent((prev: any) => ({
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
            setSelectedEvent((prev: any) => ({
              ...prev,
              task_description: e.target.value,
            }))
          }
        />
      </div>
   <div>
  <label className="block font-semibold">Start Date</label>
  <DatePicker
    selected={eventStartDate ? new Date(eventStartDate) : null}
    onChange={(date) => setEventStartDate(date.toISOString())}
    dateFormat="yyyy-MM-dd"
    placeholderText="Select a start date"
    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
    required
  />
</div>

<div>
  <label className="block font-semibold">End Date</label>
  <DatePicker
    selected={eventEndDate ? new Date(eventEndDate) : null}
    onChange={(date) => setEventEndDate(date.toISOString())}
    dateFormat="yyyy-MM-dd"
    placeholderText="Select an end date"
    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
    required
  />
</div>

     <div className="text-right">
  <button
    onClick={async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${selectedEvent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: eventTitle,
            maintenance_type: selectedEvent.maintenance_type,
            task_description: selectedEvent.task_description,
            start: eventStartDate,
            status: selectedEvent.status,
            executor: selectedEvent.executor,
          }),
        });

        if (response.ok) {
          console.log("Maintenance updated successfully");
          setSnackbar({ open: true, message: `Maintenance updated successfully`, severity: "success" });
        } else {
          console.error("Failed to update maintenance");
        }

        setIsEditing(false);
        closeModal();
      } catch (error) {
        console.error("Error updating maintenance:", error);
      }
    }}
    className="bg-blue-500 text-white px-3 py-1 rounded"
  >
    Save
  </button>
</div>

    </form>
  )}
</Modal>

      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const level = eventInfo.event.extendedProps?.calendar || 'primary';
  const colorClass = `fc-bg-${level.toLowerCase()}`;

  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};


export default Calendar;
