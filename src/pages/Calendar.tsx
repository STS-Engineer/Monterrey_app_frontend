import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "antd";
import { Snackbar, Alert } from "@mui/material";
import axios from "axios";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    maintenance_type: string;
    task_description: string;
    executor: string;
    executor_email: string;
    creator: string;
    creator_email: string;
    machine_id: string;
    machine_ref: string;
    status: string;
    completed_date?: string | null;
    recurrence?: string | null;
    recurrence_end_date?: string | null;
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
  executor_email: string;
  status: string;
  creator: string;
  creator_email: string;
  machine_id: string;
  machine_ref: string;
  completed_date?: string | null;
  recurrence?: string | null;
  recurrence_end_date?: string | null;
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
   const [users, setUsers] = useState([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });
  const [loading, setLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);


    // Fetch users
  useEffect(() => {
    fetch("https://machine-backend.azurewebsites.net/ajouter/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);
  
  // 🔹 Fetch maintenance events
  useEffect(() => {
    fetchMaintenanceEvents();
  }, []);

  const fetchMaintenanceEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://machine-backend.azurewebsites.net/ajouter/maintenance");
      const data = response.data;

      if (!Array.isArray(data)) throw new Error("Invalid data format");

      const fetchedEvents: CalendarEvent[] = data.map((event: any) => ({
        id: event.id?.toString(),
        title: event.task_name || "No Task Name",
        start: event.start_date,
        end: event.end_date || event.start_date,
        allDay: false,
        extendedProps: {
          calendar: event.level || "primary",
          maintenance_type: event.maintenance_type || "",
          task_description: event.task_description || "",
          executor: event.assigned_to_name || event.assigned_to || "N/A",
          executor_email: event.assigned_to_email || "Not provided",
          creator: event.creator_name || event.creator || "Unknown",
          creator_email: event.creator_email || "Not provided",
          machine_id: event.machine_id || "N/A",
          machine_ref: event.machine_ref || "Unknown Ref",
          status: event.task_status || "pending",
          completed_date: event.completed_date || null,
          recurrence: event.recurrence || null,
          recurrence_end_date: event.recurrence_end_date || null,
        },
      }));

      setEvents(fetchedEvents);
      setSnackbar({ open: true, message: `Loaded ${fetchedEvents.length} events`, severity: "success" });
    } catch (err) {
      console.error("Error fetching events:", err);
      setSnackbar({ open: true, message: "Failed to load events", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Refresh button handler
  const refreshEvents = async () => {
    await fetchMaintenanceEvents();
  };

  // 🔹 Event click handler
  const handleEventClick = (clickInfo: EventClickArg) => {
    const e = clickInfo.event;
    setSelectedEvent({
      id: e.id,
      title: e.title,
      start: e.start?.toISOString() || "",
      end: e.end?.toISOString() || e.start?.toISOString() || "",
      maintenance_type: e.extendedProps.maintenance_type,
      task_description: e.extendedProps.task_description,
      executor: e.extendedProps.executor,
      executor_email: e.extendedProps.executor_email,
      status: e.extendedProps.status,
      creator: e.extendedProps.creator,
      creator_email: e.extendedProps.creator_email,
      machine_id: e.extendedProps.machine_id,
      machine_ref: e.extendedProps.machine_ref,
      completed_date: e.extendedProps.completed_date,
      recurrence: e.extendedProps.recurrence,
      recurrence_end_date: e.extendedProps.recurrence_end_date,
    });
    setIsModalOpen(true);
  };

  // 🔹 Modal close
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading && <div className="p-4 text-center">Loading events...</div>}

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
              left: "prev,next refreshButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              refreshButton: {
                text: "Refresh",
                click: refreshEvents,
              },
            }}
            loading={(isLoading) => setLoading(isLoading)}
          />
        </div>

        {/* 🔹 Modal for Event Details */}
        <Modal
          title={null}
          open={isModalOpen}
          onCancel={closeModal}
          footer={null}
          centered
          width={650}
          destroyOnClose
        >
          {selectedEvent && (
            <div className="p-6 bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  🛠 Maintenance Details
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                    selectedEvent.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : selectedEvent.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedEvent.status?.toUpperCase()}
                </span>
              </div>

              {/* 🧩 Task Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-gray-700 dark:text-gray-200">
                <InfoCard label="Task Name" value={selectedEvent.title} />
                <InfoCard label="Maintenance Type" value={selectedEvent.maintenance_type} />
                <InfoCard label="Executor" value={selectedEvent.executor_email} />
                <InfoCard label="Start Date" value={new Date(selectedEvent.start).toLocaleString()} />
                <InfoCard label="End Date" value={new Date(selectedEvent.end).toLocaleString()} />
              </div>

              {/* 🧾 Description */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Task Description</p>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                  {selectedEvent.task_description || "No description provided."}
                </div>
              </div>

              {/* 🧩 Additional Info */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                <h3 className="text-md font-semibold text-blue-600 dark:text-blue-400 mb-3">
                  📅 Additional Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300 text-sm">
                  <InfoCard label="Machine Reference" value={selectedEvent.machine_ref} />
                  <InfoCard label="Machine ID" value={selectedEvent.machine_id} />
                  <InfoCard label="Creator" value={selectedEvent.creator_email} />
                  {selectedEvent.completed_date && (
                    <InfoCard
                      label="Completed Date"
                      value={new Date(selectedEvent.completed_date).toLocaleString()}
                    />
                  )}
                  {selectedEvent.recurrence && <InfoCard label="Recurrence" value={selectedEvent.recurrence} />}
                  {selectedEvent.recurrence_end_date && (
                    <InfoCard
                      label="Recurrence Ends"
                      value={new Date(selectedEvent.recurrence_end_date).toLocaleDateString()}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

// 🔹 Helper component for info fields
const InfoCard = ({ label, value }: { label: string; value?: string }) => (
  <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold">{value || "N/A"}</p>
  </div>
);

// 🔹 Custom event render in calendar
const renderEventContent = (eventInfo: any) => {
  const level = eventInfo.event.extendedProps?.calendar || "primary";
  const colorClass = `fc-bg-${level.toLowerCase()}`;

  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
