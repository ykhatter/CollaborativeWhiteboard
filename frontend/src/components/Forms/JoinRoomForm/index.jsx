import { useState } from 'react';
import './index.css';

const JoinRoomForm = () => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const joinRoom = () => {
    if (!name || !roomCode) return alert('Please fill in all fields.');
    console.log(`Joining room: Name=${name}, Code=${roomCode}`);
  };

  return (
    <div className="join-room-form">
      <h2>Join Room</h2>
      <div className="input-group">
        <label>Your Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="input-group">
        <label>Room Code</label>
        <input value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} />
      </div>
      <button className="submit-button" onClick={joinRoom}>
        Join Room
      </button>
    </div>
  );
};

export default JoinRoomForm;
