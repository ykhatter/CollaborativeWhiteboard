import { useState } from 'react';
import './index.css';
import { useNavigate } from 'react-router-dom';

const CreateRoomForm = ({uuid, socket, setUser}) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();
  const generateRoomCode = () => {
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setRoomCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room code copied!');
  };

  const createRoom = (e) => {
    console.log("Creating room");
    e.preventDefault();
    if (!name || !roomCode) return alert('Please fill in all fields.');
    const roomData = {
      name,
      roomCode,
      userId: uuid,
      presenter: true,
      host: true,
    };
    setUser(roomData);
    navigate(`/${roomCode}`);
    console.log(roomData);
    socket.emit('userJoined', roomData);
  };

  return (
    <div className="create-room-form">
      <h2>Create Room</h2>
      <div className="input-group">
        <label>Your Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="input-group">
        <label>Room Code</label>
        <input value={roomCode} readOnly />
      </div>
      <div className="button-group">
        <button onClick={generateRoomCode}>Generate Code</button>
        <button onClick={copyToClipboard}>Copy</button>
      </div>
      <button className="submit-button" onClick={createRoom}>
        Create Room
      </button>
    </div>
  );
};

export default CreateRoomForm;
