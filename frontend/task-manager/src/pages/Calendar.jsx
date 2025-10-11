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

  const [events, setEvents] = useState([]);

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
        />
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
