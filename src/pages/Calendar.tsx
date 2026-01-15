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
    task_link?: string | null;
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
  task_link?: string | null;
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
  const [linkInput, setLinkInput] = useState("");
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    fetchMaintenanceEvents();
  }, []);

  const fetchMaintenanceEvents = async () => {
    try {
      setLoading(true);

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

      const response = await axios.get('https://machine-backend.azurewebsites.net/ajouter/maintenance');
      const allData = response.data;
      console.log('all data mai', allData);

      console.log('Total events from API:', allData.length);

      let filteredData = allData;

      if (role === 'EXECUTOR') {
        filteredData = allData.filter(item =>
          parseInt(item.assigned_to) === parseInt(userId)
        );
        console.log(`Executor view: Found ${filteredData.length} tasks assigned to user ${userId}`);
      } else if (role === 'MANAGER') {
         filteredData = allData;
        console.log(`Manager view: Found ${filteredData.length} tasks created by user ${userId}`);
      } else if (role === 'ADMIN') {
        filteredData = allData;
        console.log(`Admin view: Showing all ${filteredData.length} tasks`);
      }

      console.log('Final filtered tasks:', filteredData);

      const fetchedEvents = filteredData.map((event) => {
        const recurrence = event.recurrence?.toLowerCase();

        // Parse dates consistently with Addmaintenance.jsx
        const parseDate = (dateString: string) => {
          if (!dateString) return null;

          // Parse date as local time directly
          // The backend should send ISO string (2026-01-15T08:45:00)
          const date = new Date(dateString);

          if (isNaN(date.getTime())) {
            console.error("Invalid date string:", dateString);
            return null;
          }

          return date;
        };

        const startDate = parseDate(event.start_date);
        const endDate = event.end_date ? parseDate(event.end_date) : null;
        const recurrenceEndDate = event.recurrence_end_date ? parseDate(event.recurrence_end_date) : null;

        if (!startDate || isNaN(startDate.getTime())) {
          console.error("Invalid start_date for event:", event);
          return null;
        }

        // Calculate duration in hours (same logic as Addmaintenance.jsx)
        let durationHours = 1;
        if (endDate && !isNaN(endDate.getTime())) {
          const durationMs = endDate.getTime() - startDate.getTime();
          durationHours = Math.max(1, Math.round(durationMs / 3600000));
        }

        // Format date for FullCalendar (YYYY-MM-DDTHH:mm:ss)
        const formatForCalendar = (date: Date) => {
          // Format as local ISO string without timezone offset
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };

        const baseEvent: any = {
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
            task_link: event.task_link || null,
            // ADD THESE: Store the original dates from API
            original_start_date: event.start_date, // Store the raw string
            original_end_date: event.end_date, // Store the raw string
          },
        };

        // Non-recurring event
        if (!recurrence || recurrence === "none" || recurrence === "null") {
          baseEvent.start = formatForCalendar(startDate);
          if (endDate && !isNaN(endDate.getTime())) {
            baseEvent.end = formatForCalendar(endDate);
          } else {
            // Default 1 hour duration (matching Addmaintenance.jsx)
            const defaultEnd = new Date(startDate.getTime() + 3600000);
            baseEvent.end = formatForCalendar(defaultEnd);
          }
        }
        // Daily recurrence
        else if (recurrence === "daily") {
          const rruleConfig: any = {
            freq: "DAILY",
            interval: event.interval || 1,
            dtstart: formatForCalendar(startDate),
          };

          if (recurrenceEndDate) {
            rruleConfig.until = formatForCalendar(recurrenceEndDate);
          }

          baseEvent.rrule = rruleConfig;
          baseEvent.duration = { hours: durationHours };
        }
        // Weekly recurrence
        else if (recurrence === "weekly") {
          let byweekday = [];

          if (event.weekdays && Array.isArray(event.weekdays)) {
            // Convert numeric weekdays to RRule format (0-6, Sunday-Saturday)
            byweekday = event.weekdays
              .map((day) => {
                if (day >= 0 && day <= 6) {
                  return ["su", "mo", "tu", "we", "th", "fr", "sa"][day];
                }
                return null;
              })
              .filter(Boolean);
          }

          // If no valid weekdays, use start date's weekday
          if (byweekday.length === 0) {
            const startDay = startDate.getDay(); // 0-6 (Sunday-Saturday)
            byweekday = [["su", "mo", "tu", "we", "th", "fr", "sa"][startDay]];
          }

          const rruleConfig: any = {
            freq: "WEEKLY",
            interval: event.interval || 1,
            byweekday,
            dtstart: formatForCalendar(startDate),
          };

          if (recurrenceEndDate) {
            rruleConfig.until = formatForCalendar(recurrenceEndDate);
          }

          baseEvent.rrule = rruleConfig;
          baseEvent.duration = { hours: durationHours };
        }
        // Monthly recurrence
        else if (recurrence === "monthly") {
          const rruleConfig: any = {
            freq: "MONTHLY",
            interval: event.interval || 1,
            dtstart: formatForCalendar(startDate),
          };

          // Handle monthly patterns (same as Addmaintenance.jsx)
          if (event.pattern_variant === "specific_day" && event.monthly_day) {
            rruleConfig.bymonthday = parseInt(event.monthly_day);
          }
          else if (event.pattern_variant === "monthly_nth" &&
            event.monthly_ordinal !== undefined &&
            event.monthly_weekday !== undefined) {

            const weekdayMap: { [key: string]: number } = {
              "1": 0, // Monday
              "2": 1, // Tuesday
              "3": 2, // Wednesday
              "4": 3, // Thursday
              "5": 4, // Friday
              "6": 5, // Saturday
              "7": 6, // Sunday
            };

            const ordinalMap: { [key: string]: number } = {
              "1": 1,
              "2": 2,
              "3": 3,
              "4": 4,
              "5": 5,
              "-1": -1
            };

            const weekOfMonth = parseInt(event.monthly_ordinal);
            const weekday = parseInt(event.monthly_weekday);

            if (weekdayMap[weekday.toString()] !== undefined) {
              rruleConfig.byweekday = [weekdayMap[weekday.toString()]];

              if (ordinalMap[weekOfMonth.toString()] !== undefined) {
                rruleConfig.bysetpos = ordinalMap[weekOfMonth.toString()];
              }
            }
          }
          else if (event.monthly_day) {
            rruleConfig.bymonthday = parseInt(event.monthly_day);
          }
          else {
            // Default to day of month from start date
            rruleConfig.bymonthday = startDate.getDate();
          }

          if (recurrenceEndDate) {
            rruleConfig.until = formatForCalendar(recurrenceEndDate);
          }

          baseEvent.rrule = rruleConfig;
          baseEvent.duration = { hours: durationHours };
        }
        // Yearly recurrence
        else if (recurrence === "yearly") {
          const rruleConfig: any = {
            freq: "YEARLY",
            interval: event.interval || 1,
            dtstart: formatForCalendar(startDate),
          };

          // Handle yearly patterns (same as Addmaintenance.jsx)
          if (event.yearly_mode === 'day') {
            // Exact date (month + day)
            if (event.yearly_month !== undefined) {
              rruleConfig.bymonth = parseInt(event.yearly_month) + 1; // Convert 0-11 to 1-12
            }
            if (event.yearly_day) {
              rruleConfig.bymonthday = parseInt(event.yearly_day);
            }
          } else if (event.yearly_mode === 'weekday') {
            // Weekday ordinal in a month
            const weekdayMap: { [key: string]: number } = {
              "1": 0, // Monday
              "2": 1, // Tuesday
              "3": 2, // Wednesday
              "4": 3, // Thursday
              "5": 4, // Friday
              "6": 5, // Saturday
              "7": 6, // Sunday
            };

            const ordinalMap: { [key: string]: number } = {
              "first": 1,
              "second": 2,
              "third": 3,
              "fourth": 4,
              "last": -1
            };

            if (event.yearly_month !== undefined) {
              rruleConfig.bymonth = parseInt(event.yearly_month) + 1;
            }
            if (event.yearly_weekday !== undefined && weekdayMap[event.yearly_weekday.toString()] !== undefined) {
              rruleConfig.byweekday = [weekdayMap[event.yearly_weekday.toString()]];
            }
            if (event.yearly_ordinal && ordinalMap[event.yearly_ordinal]) {
              rruleConfig.bysetpos = ordinalMap[event.yearly_ordinal];
            }
          }

          if (recurrenceEndDate) {
            rruleConfig.until = formatForCalendar(recurrenceEndDate);
          }

          baseEvent.rrule = rruleConfig;
          baseEvent.duration = { hours: durationHours };
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
    const extendedProps = e.extendedProps;

    // Format dates for display in local time
    const formatDisplayDate = (date: Date | null) => {
      if (!date) return "";
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };

    // Use original dates if available, otherwise use event dates
    const getDisplayDate = (dateString: string | null, fallbackDate: Date | null) => {
      if (dateString) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return formatDisplayDate(date);
        }
      }
      return formatDisplayDate(fallbackDate);
    };

    const eventData = {
      id: e.id,
      title: e.title,
      // Use ORIGINAL dates from extendedProps instead of recurrence instance dates
      start: getDisplayDate(extendedProps.original_start_date, e.start),
      end: getDisplayDate(extendedProps.original_end_date, e.end),
      maintenance_type: extendedProps.maintenance_type,
      task_description: extendedProps.task_description,
      executor: extendedProps.executor,
      executor_email: extendedProps.executor_email,
      status: extendedProps.status,
      creator: extendedProps.creator,
      creator_email: extendedProps.creator_email,
      machine_id: extendedProps.machine_id,
      machine_ref: extendedProps.machine_ref,
      completed_date: extendedProps.completed_date ? new Date(extendedProps.completed_date).toLocaleString() : null,
      recurrence: extendedProps.recurrence,
      recurrence_end_date: extendedProps.recurrence_end_date ? new Date(extendedProps.recurrence_end_date).toLocaleDateString() : null,
      task_link: extendedProps.task_link || null,
    };

    // Debug log to see what dates we're using
    console.log('Event clicked details:', {
      eventId: e.id,
      title: e.title,
      recurrence: extendedProps.recurrence,
      originalStart: extendedProps.original_start_date,
      originalEnd: extendedProps.original_end_date,
      instanceStart: e.start,
      instanceEnd: e.end,
      displayStart: eventData.start,
      displayEnd: eventData.end
    });

    setSelectedEvent(eventData);
    setLinkInput(eventData.task_link || "");
    setIsEditingLink(false);
    setIsModalOpen(true);
  };

  const handleSaveLink = async () => {
    if (!selectedEvent?.id) return;

    try {
      setSavingLink(true);

      const response = await axios.put(`https://machine-backend.azurewebsites.net/ajouter/maintenance/${selectedEvent.id}`, {
        task_link: linkInput
      });

      if (response.status === 200) {
        message.success("Task link updated successfully!");

        setSelectedEvent(prev => prev ? { ...prev, task_link: linkInput } : null);

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
        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${event.status?.toLowerCase() === "completed"
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
      <InfoCard label="Start Date" value={event.start} />
      <InfoCard label="End Date" value={event.end} />
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
        {event.completed_date && <InfoCard label="Completed Date" value={event.completed_date} />}
        {event.recurrence && <InfoCard label="Recurrence" value={event.recurrence} />}
        {event.recurrence_end_date && <InfoCard label="Recurrence Ends" value={event.recurrence_end_date} />}
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
