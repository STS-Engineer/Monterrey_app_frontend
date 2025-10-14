import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "antd";
import {
  Snackbar,
  Alert,
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
  const [loading, setLoading] = useState(true);

  // Fetch users
  useEffect(() => {
    fetch("https://machine-backend.azurewebsites.net/ajouter/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  // Fetch maintenance events - FIXED VERSION
  useEffect(() => {
    const fetchMaintenanceEvents = async () => {
      try {
        setLoading(true);
        console.log("Fetching maintenance events...");
        
        const response = await axios.get("https://machine-backend.azurewebsites.net/ajouter/maintenance");
        console.log("Fetched data:", response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error("Invalid data format:", response.data);
          setSnackbar({ open: true, message: "Invalid data format received", severity: "error" });
          return;
        }

        const fetchedEvents: CalendarEvent[] = response.data.map((event: any) => {
          // Use start_date and end_date from the API response
          const startDate = event.start_date;
          const endDate = event.end_date;

          // Validate required fields
          if (!startDate) {
            console.warn("Event missing start date:", event);
            return null;
          }

          return {
            id: event.id?.toString(),
            title: event.task_name || "No Task Name",
            start: startDate, // Use start_date from API
            end: endDate || startDate, // Use end_date from API, fallback to start_date
            allDay: false, // Set to false since you have time components
            extendedProps: {
              calendar: event.level || "primary",
              maintenance_type: event.maintenance_type || "",
              task_description: event.task_description || "",
              executor: event.executor || "",
              status: event.status || "pending"
            }
          };
        }).filter((event): event is CalendarEvent => event !== null);

        console.log("Processed events:", fetchedEvents);
        setEvents(fetchedEvents);
        setSnackbar({ 
          open: true, 
          message: `Loaded ${fetchedEvents.length} events`, 
          severity: "success" 
        });
        
      } catch (error) {
        console.error("Failed to fetch maintenance events:", error);
        setSnackbar({ open: true, message: "Failed to load events", severity: "error" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaintenanceEvents();
  }, []);

  const openModal = () => setIsModalOpen(true);
  
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedEvent(null);
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
      start: event.start?.toISOString() || "",
      end: event.end?.toISOString() || event.start?.toISOString() || "",
      maintenance_type: event.extendedProps.maintenance_type,
      task_description: event.extendedProps.task_description,
      executor: event.extendedProps.executor,
      status: event.extendedProps.status,
    });
    setIsEditing(true);
    openModal();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
  };

  // Refresh events function
  const refreshEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://machine-backend.azurewebsites.net/ajouter/maintenance");
      
      const fetchedEvents: CalendarEvent[] = response.data.map((event: any) => ({
        id: event.id?.toString(),
        title: event.task_name || "No Task Name",
        start: event.start_date, // Use start_date from API
        end: event.end_date || event.start_date, // Use end_date from API
        allDay: false,
        extendedProps: {
          calendar: event.level || "primary",
          maintenance_type: event.maintenance_type,
          task_description: event.task_description,
          executor: event.executor,
          status: event.status
        }
      })).filter((event: CalendarEvent | null): event is CalendarEvent => event !== null);
      
      setEvents(fetchedEvents);
      console.log("Events refreshed:", fetchedEvents);
      setSnackbar({ open: true, message: "Events refreshed", severity: "success" });
    } catch (error) {
      console.error("Failed to refresh events:", error);
      setSnackbar({ open: true, message: "Failed to refresh events", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading && (
          <div className="p-4 text-center">Loading events...</div>
        )}

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
              right: "dayGridMonth,timeGridWeek,timeGridDay refreshButton",
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
              refreshButton: {
                text: "Refresh",
                click: refreshEvents,
              },
            }}
            loading={(isLoading) => setLoading(isLoading)}
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
              <p><strong>Task Description:</strong> {selectedEvent.task_description}</p>
              <p><strong>Start Date:</strong> {new Date(selectedEvent.start).toLocaleString()}</p>
              <p><strong>End Date:</strong> {new Date(selectedEvent.end).toLocaleString()}</p>
              <p><strong>Status:</strong> {selectedEvent.status}</p>
              <p><strong>Executor:</strong> {selectedEvent.executor}</p>
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
                <label className="block font-semibold">Task Description</label>
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
                  onChange={(date) => setEventStartDate(date ? date.toISOString() : "")}
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  timeFormat="HH:mm"
                  placeholderText="Select a start date"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold">End Date</label>
                <DatePicker
                  selected={eventEndDate ? new Date(eventEndDate) : null}
                  onChange={(date) => setEventEndDate(date ? date.toISOString() : "")}
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  timeFormat="HH:mm"
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
                      const response = await fetch(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${selectedEvent?.id}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          task_name: eventTitle,
                          maintenance_type: selectedEvent?.maintenance_type,
                          task_description: selectedEvent?.task_description,
                          start_date: eventStartDate,
                          end_date: eventEndDate,
                          status: selectedEvent?.status,
                          executor: selectedEvent?.executor,
                        }),
                      });

                      if (response.ok) {
                        console.log("Maintenance updated successfully");
                        setSnackbar({ open: true, message: `Maintenance updated successfully`, severity: "success" });
                        refreshEvents(); // Refresh events after update
                      } else {
                        console.error("Failed to update maintenance");
                        setSnackbar({ open: true, message: `Failed to update maintenance`, severity: "error" });
                      }

                      setIsEditing(false);
                      closeModal();
                    } catch (error) {
                      console.error("Error updating maintenance:", error);
                      setSnackbar({ open: true, message: `Error updating maintenance`, severity: "error" });
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
