import { useEffect } from 'react';
import { useSocket } from '../context/socketContext';

const useRealtime = (event, callback) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  }, [socket, event, callback]);
};

export default useRealtime;
