import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import rrulePlugin from "@fullcalendar/rrule";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import { Modal, Input, Button, message } from "antd";
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
    task_link?: string | null; // Added task_link field
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
  task_link?: string | null; // Added task_link field
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });
  const [loading, setLoading] = useState(true);
  const [linkInput, setLinkInput] = useState(""); // State for link input
  const [isEditingLink, setIsEditingLink] = useState(false); // State for edit mode
  const [savingLink, setSavingLink] = useState(false); // State for saving loading
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    fetchMaintenanceEvents();
  }, []);

  const fetchMaintenanceEvents = async () => {
    try {
      setLoading(true);
      
      // Get user info from localStorage
      const userId = localStorage.getItem('user_id');
      const role = localStorage.getItem('role');
      
      console.log('User ID:', userId, 'Role:', role);
      
      if (!userId || !role) {
        setSnackbar({
          open: true,
          message: "Please log in to view maintenance events",
          severity: "error",
        });
        setLoading(false);
        return;
      }

      // Fetch all maintenance data
      const response = await axios.get('https://machine-backend.azurewebsites.net/ajouter/maintenance');
      const allData = response.data;

      console.log('Total events from API:', allData.length);

      // Filter data based on user role
      let filteredData = allData;
      
      if (role === 'EXECUTOR') {
        // Executors only see tasks assigned to them
        filteredData = allData.filter(item => 
          parseInt(item.assigned_to) === parseInt(userId)
        );
        console.log(`Executor view: Found ${filteredData.length} tasks assigned to user ${userId}`);
      } else if (role === 'MANAGER') {
        // Managers see tasks they created
        filteredData = allData;
        console.log(`Manager view: Found ${filteredData.length} tasks created by user ${userId}`);
      } else if (role === 'ADMIN') {
        // ADMIN sees all data (no filtering)
        filteredData = allData;
        console.log(`Admin view: Showing all ${filteredData.length} tasks`);
      }

      console.log('Final filtered tasks:', filteredData);

      const dayMap = {
        sunday: "su",
        monday: "mo",
        tuesday: "tu",
        wednesday: "we",
        thursday: "th",
        friday: "fr",
        saturday: "sa",
      };

      const fetchedEvents = filteredData.map((event, index) => {
        const recurrence = event.recurrence?.toLowerCase();
        const startDate = new Date(event.start_date);
        const endDate = event.end_date ? new Date(event.end_date) : null;
        
        // Validate start date
        if (isNaN(startDate.getTime())) {
          console.error("Invalid start_date for event:", event);
          return null;
        }
        
        // Calculate duration for recurring events
        const durationMs = endDate ? endDate.getTime() - startDate.getTime() : 3600000;
        const durationHours = Math.max(1, Math.round(durationMs / 3600000));

        const baseEvent = {
          id: event.id?.toString(),
          title: event.task_name || "No Task Name",
          allDay: false,
          extendedProps: {
            calendar: event.level || "primary",
            maintenance_type: event.maintenance_type || "",
            task_description: event.task_description || "",
            executor: event.assigned_to_email?.split("@")[0] || "N/A",
            executor_email: event.assigned_to_email || "",
            creator: event.creator_email?.split("@")[0] || "Unknown",
            creator_email: event.creator_email || "",
            machine_id: event.machine_id || "",
            machine_ref: event.machine_ref || "",
            status: event.task_status || "pending",
            completed_date: event.completed_date || null,
            recurrence: event.recurrence || null,
            recurrence_end_date: event.recurrence_end_date || null,
            task_link: event.task_link || null, // Added task_link
          },
        };

        // Check if it's a non-recurring event
        if (!recurrence || recurrence === "none" || recurrence === "null") {
          // Non-recurring event
          baseEvent.start = startDate.toISOString();
          baseEvent.end = endDate ? endDate.toISOString() : new Date(startDate.getTime() + durationMs).toISOString();
        } else if (recurrence === "daily") {
          const rruleConfig = {
            freq: "DAILY",
            interval: event.interval || 1,
            dtstart: startDate.toISOString(),
          };
          
          if (event.recurrence_end_date) {
            rruleConfig.until = new Date(event.recurrence_end_date).toISOString();
          }
          
          baseEvent.rrule = rruleConfig;
          baseEvent.duration = { hours: durationHours };

        } else if (recurrence === "weekly") {
          // Handle weekdays - convert numeric values to RRule format
          let byweekday = [];
          
          if (event.weekdays && Array.isArray(event.weekdays)) {
            // Map numeric weekdays (0=sunday, 1=monday, etc.) to RRule format
            const numericToRRuleMap = {
              0: "su", // Sunday
              1: "mo", // Monday
              2: "tu", // Tuesday
              3: "we", // Wednesday
              4: "th", // Thursday
              5: "fr", // Friday
              6: "sa", // Saturday
            };
            
            byweekday = event.weekdays
              .map((day) => numericToRRuleMap[day])
              .filter(Boolean); // Remove any undefined values
          }
          
          // If no valid weekdays found, default to the start date's weekday
          if (byweekday.length === 0) {
            const startDay = startDate.getDay(); // 0=sunday, 1=monday, etc.
            const defaultDayMap = {
              0: "su", 1: "mo", 2: "tu", 3: "we", 4: "th", 5: "fr", 6: "sa"
            };
            byweekday = [defaultDayMap[startDay] || "mo"];
          }

          const rruleConfig = {
            freq: "WEEKLY",
            interval: event.interval || 1,
            byweekday,
            dtstart: startDate.toISOString(),
          };
          
          if (event.recurrence_end_date) {
            rruleConfig.until = new Date(event.recurrence_end_date).toISOString();
          }
          
          console.log("Weekly event RRule config:", {
            eventId: event.id,
            weekdays: event.weekdays,
            byweekday,
            interval: event.interval,
            startDate: startDate.toISOString(),
            until: event.recurrence_end_date
          });
          
          baseEvent.rrule = rruleConfig;
          baseEvent.duration = { hours: durationHours };

        }else if (recurrence === "monthly") {
    const rruleConfig: any = {
     freq: "MONTHLY",
     interval: event.interval || 1,
     dtstart: new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())).toISOString(),
   };

    // Handle different monthly patterns
    if (event.pattern_variant === "specific_day" && event.monthly_day) {
    rruleConfig.bymonthday = parseInt(event.monthly_day);
  
    } else if (event.pattern_variant === "monthly_nth" && event.monthly_ordinal !== undefined && event.monthly_weekday !== undefined) {
    
     const ordinalMap: { [key: number]: number } = {
      1: 1, 2: 2, 3: 3, 4: 4, 5: 5, "-1": -1
    };
 
    const weekdayMap: { [key: number]: number } = {
    1: 0, // Monday
    2: 1, // Tuesday
    3: 2, // Wednesday
    4: 3, // Thursday
    5: 4, // Friday
    6: 5, // Saturday
    7: 6, // Sunday
    };

    const weekOfMonth = event.monthly_ordinal;
    const weekday = event.monthly_weekday;

    if (weekdayMap[weekday] !== undefined) {
      rruleConfig.byweekday = [weekdayMap[weekday]];
      
      if (ordinalMap[weekOfMonth] !== undefined) {
        rruleConfig.bysetpos = ordinalMap[weekOfMonth];
        }
      }
     } else if (event.monthly_day) {
       rruleConfig.bymonthday = parseInt(event.monthly_day);
     }
  
      if (event.recurrence_end_date) {
       const endDate = new Date(event.recurrence_end_date);
       rruleConfig.until = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59)).toISOString();
      }

        baseEvent.rrule = rruleConfig;
         baseEvent.duration = { hours: durationHours };
         } else if (recurrence === "yearly") {
          const rruleConfig = {
            freq: "YEARLY",
            interval: event.interval || 1,
            dtstart: startDate.toISOString(),
          };

          if (event.yearly_month) {
            rruleConfig.bymonth = parseInt(event.yearly_month);
          }
          if (event.monthly_day) {
            rruleConfig.bymonthday = parseInt(event.monthly_day);
          }
          
          if (event.recurrence_end_date) {
            rruleConfig.until = new Date(event.recurrence_end_date).toISOString();
          }

          baseEvent.rrule = rruleConfig;
          baseEvent.duration = { hours: durationHours };

        } else {
          // Non-recurring event for unknown recurrence types
          baseEvent.start = startDate.toISOString();
          baseEvent.end = endDate ? endDate.toISOString() : new Date(startDate.getTime() + durationMs).toISOString();
        }

        return baseEvent;
      }).filter(Boolean);

      setEvents(fetchedEvents);
      setSnackbar({
        open: true,
        message: `Loaded ${fetchedEvents.length} maintenance events for ${role.toLowerCase()}`,
        severity: "success",
      });
    } catch (err) {
      console.error("Error fetching events:", err);
      setSnackbar({
        open: true,
        message: "Failed to load maintenance events",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const e = clickInfo.event;
    const eventData = {
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
      task_link: e.extendedProps.task_link || null,
    };
    
    setSelectedEvent(eventData);
    setLinkInput(eventData.task_link || ""); // Initialize link input with current value
    setIsEditingLink(false); // Reset edit mode
    setIsModalOpen(true);
  };

  const handleSaveLink = async () => {
    if (!selectedEvent?.id) return;

    try {
      setSavingLink(true);
      
      // Update the task link in the database
      const response = await axios.put(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${selectedEvent.id}`, {
        task_link: linkInput
      });

      if (response.status === 200) {
        message.success("Task link updated successfully!");
        
        // Update the selected event in state
        setSelectedEvent(prev => prev ? { ...prev, task_link: linkInput } : null);
        
        // Update the events in state to reflect the change
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === selectedEvent.id 
              ? { 
                  ...event, 
                  extendedProps: { 
                    ...event.extendedProps, 
                    task_link: linkInput 
                  } 
                } 
              : event
          )
        );
        
        setIsEditingLink(false);
      }
    } catch (error) {
      console.error("Error updating task link:", error);
      message.error("Failed to update task link");
    } finally {
      setSavingLink(false);
    }
  };

  const handleEditLink = () => {
    setIsEditingLink(true);
  };

  const handleCancelEdit = () => {
    setLinkInput(selectedEvent?.task_link || "");
    setIsEditingLink(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setLinkInput("");
    setIsEditingLink(false);
  };

  return (
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
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
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
            refreshButton: { text: "Refresh", click: fetchMaintenanceEvents },
          }}
        />
      </div>

      {selectedEvent && (
        <Modal
          title={null}
          open={isModalOpen}
          onCancel={closeModal}
          footer={null}
          centered
          width={650}
          destroyOnClose
        >
          <EventModalContent 
            event={selectedEvent} 
            linkInput={linkInput}
            setLinkInput={setLinkInput}
            isEditingLink={isEditingLink}
            savingLink={savingLink}
            onSaveLink={handleSaveLink}
            onEditLink={handleEditLink}
            onCancelEdit={handleCancelEdit}
          />
        </Modal>
      )}
    </div>
  );
};

// 🔹 Event content for calendar
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

// 🔹 Modal content with link functionality
interface EventModalContentProps {
  event: SelectedEvent;
  linkInput: string;
  setLinkInput: (value: string) => void;
  isEditingLink: boolean;
  savingLink: boolean;
  onSaveLink: () => void;
  onEditLink: () => void;
  onCancelEdit: () => void;
}

const EventModalContent = ({ 
  event, 
  linkInput, 
  setLinkInput, 
  isEditingLink, 
  savingLink, 
  onSaveLink, 
  onEditLink, 
  onCancelEdit 
}: EventModalContentProps) => (
  <div className="p-6 bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">🛠 Maintenance Details</h2>
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
          event.status?.toLowerCase() === "completed"
            ? "bg-green-100 text-green-700"
            : event.status?.toLowerCase() === "pending review"
            ? "bg-blue-100 text-blue-700"
            : event.status?.toLowerCase() === "in progress"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {event.status?.toUpperCase()}
      </span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-gray-700 dark:text-gray-200">
      <InfoCard label="Task Name" value={event.title} />
      <InfoCard label="Maintenance Type" value={event.maintenance_type} />
      <InfoCard label="Start Date" value={new Date(event.start).toLocaleString()} />
      <InfoCard label="End Date" value={new Date(event.end).toLocaleString()} />
    </div>
    <div className="mb-4">
      <p className="text-sm text-gray-500 mb-1">Task Description</p>
      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
        {event.task_description || "No description provided."}
      </div>
    </div>

    {/* Task Link Section */}
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">Instrucción de Mantenimiento Preventivo</p>
        {!isEditingLink && (
          <Button 
            type="link" 
            size="small" 
            onClick={onEditLink}
            className="text-blue-600 hover:text-blue-800"
          >
            {event.task_link ? "Edit Link" : "Add Link"}
          </Button>
        )}
      </div>
      
      {isEditingLink ? (
        <div className="space-y-2">
          <Input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Enter task link (URL)"
            type="url"
          />
          <div className="flex space-x-2">
            <Button 
              type="primary" 
              onClick={onSaveLink}
              loading={savingLink}
              disabled={!linkInput.trim()}
            >
              Save Link
            </Button>
            <Button onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
          {event.task_link ? (
            <a 
              href={event.task_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-words"
            >
              {event.task_link}
            </a>
          ) : (
            <span className="text-gray-400">No link provided</span>
          )}
        </div>
      )}
    </div>

    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
      <h3 className="text-md font-semibold text-blue-600 dark:text-blue-400 mb-3">📅 Additional Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300 text-sm">
        <InfoCard label="Machine Reference" value={event.machine_ref} />
        <InfoCard label="Executor" value={event.executor_email || "N/A"} />
        <InfoCard label="Creator" value={event.creator_email || "N/A"} />
        {event.completed_date && <InfoCard label="Completed Date" value={new Date(event.completed_date).toLocaleString()} />}
        {event.recurrence && <InfoCard label="Recurrence" value={event.recurrence} />}
        {event.recurrence_end_date && <InfoCard label="Recurrence Ends" value={new Date(event.recurrence_end_date).toLocaleDateString()} />}
      </div>
    </div>
  </div>
);

const InfoCard = ({ label, value }: { label: string; value?: string }) => (
  <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold">{value || "N/A"}</p>
  </div>
);

export default Calendar;
