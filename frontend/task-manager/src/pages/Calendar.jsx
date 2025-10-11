import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useUserAuth } from '../../hooks/useUserAuth.jsx';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../../context/userContext';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

const CalendarPage = () => {
  useUserAuth();

  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = async (start, end) => {
    try {
      const response = await axiosInstance.get(API_PATHS.CALENDAR.GET_EVENTS, {
        params: { start: start.toISOString(), end: end.toISOString() }
      });
      const formattedEvents = response.data.events.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching calendar events', error);
    }
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    fetchEvents(start, end);
  }, []);

  const handleRangeChange = (range) => {
    if (Array.isArray(range)) {
      const start = range[0];
      const end = range[range.length - 1];
      fetchEvents(start, end);
    } else {
      const start = new Date(range.start);
      const end = new Date(range.end);
      fetchEvents(start, end);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleSelectSlot = (slotInfo) => {
    if (user && user.role === 'admin') {
      navigate('/admin/create-task');
    }
  };

  return (
    <DashboardLayout activeMenu="calendar">
      <div className='card my-5'>
        <h2 className='text-xl md:text-2xl'>Calendar</h2>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onRangeChange={handleRangeChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
        />
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEvent ? selectedEvent.title : ''}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <p><strong>Date:</strong> {selectedEvent.start.toLocaleDateString()}</p>
            {(selectedEvent.resource.type === 'task' || selectedEvent.resource.type === 'task-reminder') ? (
              <div>
                <p><strong>Status:</strong> {selectedEvent.resource.status}</p>
                <p><strong>Priority:</strong> {selectedEvent.resource.priority}</p>
                <p><strong>Board:</strong> {selectedEvent.resource.board}</p>
                <p><strong>Assigned To:</strong> {selectedEvent.resource.assignedTo}</p>
                <button
                  className="btn-primary mt-4"
                  onClick={() => {
                    navigate(`/user/task-details/${selectedEvent.resource.id}`);
                    setIsModalOpen(false);
                  }}
                >
                  View Task Details
                </button>
              </div>
            ) : (
              <div>
                <p><strong>Type:</strong> {selectedEvent.resource.reminderType}</p>
                <p><strong>Task:</strong> {selectedEvent.resource.task}</p>
                <p><strong>User:</strong> {selectedEvent.resource.user}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default CalendarPage;
