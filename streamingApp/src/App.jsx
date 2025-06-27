// App.jsx
import React, { useState } from 'react';
import HostView from './HostView';
import ViewerView from './ViewerView';

export default function App() {
  const [role, setRole] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (!role || !roomId) {
      alert('Please enter a room ID and select a role.');
      return;
    }else{
      
    }
  };

  return (
    <div className="p-4">
      {!role ? (
        <div className="flex flex-col items-center space-y-4">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="p-2 border rounded"
          />
          <div className="space-x-4">
            <button
              onClick={() => setRole('host')}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Join as Host
            </button>
            <button
              onClick={() => setRole('viewer')}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Join as Viewer
            </button>
          </div>
        </div>
      ) : (
        <div>
          {role === 'host' && <HostView roomId={roomId} />}
          {role === 'viewer' && <ViewerView roomId={roomId} />}
        </div>
      )}
    </div>
  );
}
