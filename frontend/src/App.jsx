import Forms from './components/Forms';
import { Route, Routes } from "react-router-dom";
import RoomPage from './pages/RoomPage'; 
import './App.css';
import { io } from 'socket.io-client';
import { useState, useEffect } from 'react';

const server = 'http://localhost:5000';
const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  transports: ['websocket'],
};

const socket = io(server, connectionOptions);

const App = () => {
  const [user, setUser] = useState('');

  useEffect(() => {
    socket.on("userIsJoined", (data) => {
      console.log(data);
      if(data.success){
        console.log("User joined");
      } else {
        console.log("User not joined, error");
      }
    });
  }, []);

  const uuid = () => {
    let s4 = () => {
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
  };


  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Forms uuid={uuid()} socket={socket} setUser={setUser} />} />
        <Route path="/:roomId" element={<RoomPage user={user} socket={socket} />} />
      </Routes>
    </div>
  );
};

export default App;

