import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import WhiteBoard from "../../components/WhiteBoard";
import "./index.css";

const RoomPage = ({user, socket}) => {
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { roomId } = useParams();

  // Add notification
  const addNotification = (message, type) => {
    const id = Date.now();
    const newNotification = { id, message, type };
    setNotifications(prev => [...prev, newNotification]);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, removing: true } : n
      ));
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 500);
    }, 4000);
  };

  // Generate floating particles
  const generateParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 6,
        animationDuration: 4 + Math.random() * 4
      });
    }
    return particles;
  };

  const [particles] = useState(generateParticles());

  useEffect(() => {
    if (!socket) return;

    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Listen for user list updates
    socket.on("userList", (userList) => {
      setUsers(userList);
    });

    // Listen for new user joined
    socket.on("userJoined", (newUser) => {
      console.log("New user joined:", newUser.name);
      addNotification(`${newUser.name} joined the room`, 'join');
    });

    // Listen for user left
    socket.on("userLeft", (leftUser) => {
      console.log("User left:", leftUser.name);
      addNotification(`${leftUser.name} left the room`, 'leave');
    });

    return () => {
      clearTimeout(timer);
      socket.off("userList");
      socket.off("userJoined");
      socket.off("userLeft");
    };
  }, [socket, user]);

  const handleToolChange = (newTool) => {
    setTool(newTool);
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleColorChange = (e) => setColor(e.target.value);

  const handleActionClick = (action) => {
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    window.dispatchEvent(new Event(action));
  };

  return (
    <div className="room-container">
      {/* Floating Particles */}
      <div className="floating-particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.animationDelay}s`,
              animationDuration: `${particle.animationDuration}s`
            }}
          />
        ))}
      </div>

      {/* Notification Container */}
      <div className="notification-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type} ${notification.removing ? 'removing' : ''}`}
          >
            <div className={`notification-icon ${notification.type}`}>
              {notification.type === 'join' ? '✓' : '✕'}
            </div>
            <span>{notification.message}</span>
          </div>
        ))}
      </div>

      <h1 className="text-center title">
        🎨 White Board Sharing App{" "}  
        <span className="text-primary">[Users Online: {users.length}]</span>
      </h1>

      {user && user.presenter && (
        <div className="toolbar">
          <div className="tools">
            <button 
              className={tool === "pencil" ? "active" : ""}
              onClick={() => handleToolChange("pencil")}
              title="Freehand drawing tool"
            >
              ✏️ Pencil
            </button>
            <button 
              className={tool === "line" ? "active" : ""}
              onClick={() => handleToolChange("line")}
              title="Draw straight lines"
            >
              📏 Line
            </button>
            <button 
              className={tool === "rectangle" ? "active" : ""}
              onClick={() => handleToolChange("rectangle")}
              title="Draw rectangles"
            >
              ⬛ Rectangle
            </button>
            <button 
              className={tool === "circle" ? "active" : ""}
              onClick={() => handleToolChange("circle")}
              title="Draw circles"
            >
              ⚪ Circle
            </button>
          </div>

          <div className="color-picker">
            <label>🎨 Color:</label>
            <input 
              type="color" 
              value={color} 
              onChange={handleColorChange}
              title="Choose drawing color"
            />
          </div>

          <div className="actions">
            <button 
              onClick={() => handleActionClick("undo")}
              title="Undo last action (Ctrl+Z)"
            >
              ↩️ Undo
            </button>
            <button 
              onClick={() => handleActionClick("redo")}
              title="Redo last action (Ctrl+Y)"
            >
              ↪️ Redo
            </button>
            <button 
              onClick={() => handleActionClick("clear")}
              title="Clear the entire board"
            >
              🧹 Clear
            </button>
          </div>
        </div>
      )}

      <div className="whiteboard-section">
        {/* Display connected users */}
        <div className="users-list">
          <h3>👥 Connected Users ({users.length})</h3>
          <ul>
            {users.length === 0 ? (
              <li style={{ textAlign: 'center', fontStyle: 'italic', opacity: 0.7 }}>
                No users connected yet...
              </li>
            ) : (
              users.map((u, index) => (
                <li key={index}>
                  <span>{u.name}</span>
                  {u.presenter && <span className="user-role presenter">Presenter</span>}
                  {u.host && <span className="user-role host">Host</span>}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="whiteboard-container">
          {isLoading ? (
            <div className="canvas-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <WhiteBoard 
              tool={tool} 
              color={color} 
              user={user} 
              socket={socket}
              roomCode={roomId}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;

