const express = require("express");
const app = express();

const server = require("http").createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

// Store room data
const rooms = new Map();

//routes
app.get("/", (req, res)=>{
    res.send(
        "This is mern realtime board sharing app official server"
    );  
})

io.on("connection", (socket)=>{
    console.log("User connected:", socket.id);
    
    socket.on("userJoined", (roomData)=>{
        console.log("User joined");
        console.log(roomData);
        const {name, roomCode, userId, presenter, host} = roomData;
        
        socket.join(roomCode);
        
        // Initialize room if it doesn't exist
        if (!rooms.has(roomCode)) {
            rooms.set(roomCode, {
                users: new Map(),
                elements: [],
                history: []
            });
        }
        
        const room = rooms.get(roomCode);
        room.users.set(userId, { name, presenter, host, socketId: socket.id });
        
        // Send confirmation to user
        socket.emit("userIsJoined", { success: true });
        
        // Send current room state to the new user
        socket.emit("roomState", {
            elements: room.elements,
            history: room.history
        });
        
        // Broadcast user joined to all users in room
        socket.to(roomCode).emit("userJoined", {
            userId,
            name,
            presenter,
            host
        });
        
        // Send updated user list to all users in room
        const userList = Array.from(room.users.values()).map(user => ({
            userId: user.userId,
            name: user.name,
            presenter: user.presenter,
            host: user.host
        }));
        io.to(roomCode).emit("userList", userList);
        
        console.log(`User ${name} joined room ${roomCode}. Total users: ${room.users.size}`);
    });
    
    // Handle drawing events
    socket.on("drawElement", (data) => {
        console.log("Server received drawElement event:", data);
        const { roomCode, element } = data;
        const room = rooms.get(roomCode);
        
        if (room) {
            room.elements.push(element);
            room.history = []; // Clear redo history when new element is drawn
            
            console.log("Broadcasting elementDrawn to room:", roomCode);
            // Broadcast to all users in room except sender
            socket.to(roomCode).emit("elementDrawn", element);
        }
    });
    
    // Handle element updates (for line, rectangle, circle while drawing)
    socket.on("updateElement", (data) => {
        console.log("Server received updateElement event:", data);
        const { roomCode, index, element } = data;
        const room = rooms.get(roomCode);
        
        if (room && room.elements[index]) {
            room.elements[index] = element;
            
            console.log("Broadcasting elementUpdated to room:", roomCode);
            // Broadcast to all users in room except sender
            socket.to(roomCode).emit("elementUpdated", { index, element });
        }
    });
    
    // Handle undo
    socket.on("undo", (data) => {
        console.log("Server received undo event:", data);
        const { roomCode } = data;
        const room = rooms.get(roomCode);
        
        if (room && room.elements.length > 0) {
            const poppedElement = room.elements.pop();
            room.history.push(poppedElement);
            
            console.log("Broadcasting undo to room:", roomCode);
            // Broadcast to all users in room except sender
            socket.to(roomCode).emit("elementUndone", { element: poppedElement });
        }
    });
    
    // Handle redo
    socket.on("redo", (data) => {
        console.log("Server received redo event:", data);
        const { roomCode } = data;
        const room = rooms.get(roomCode);
        
        if (room && room.history.length > 0) {
            const restoredElement = room.history.pop();
            room.elements.push(restoredElement);
            
            console.log("Broadcasting redo to room:", roomCode);
            // Broadcast to all users in room except sender
            socket.to(roomCode).emit("elementRedone", { element: restoredElement });
        }
    });
    
    // Handle clear
    socket.on("clear", (data) => {
        const { roomCode } = data;
        const room = rooms.get(roomCode);
        
        if (room) {
            room.elements = [];
            room.history = [];
            
            // Broadcast to all users in room except sender
            socket.to(roomCode).emit("boardCleared");
        }
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        
        // Find and remove user from room
        for (const [roomCode, room] of rooms.entries()) {
            for (const [userId, user] of room.users.entries()) {
                if (user.socketId === socket.id) {
                    const userName = user.name;
                    room.users.delete(userId);
                    
                    // If room is empty, delete it
                    if (room.users.size === 0) {
                        rooms.delete(roomCode);
                        console.log(`Room ${roomCode} deleted - no users left`);
                    } else {
                        // Send updated user list to remaining users
                        const userList = Array.from(room.users.values()).map(user => ({
                            userId: user.userId,
                            name: user.name,
                            presenter: user.presenter,
                            host: user.host
                        }));
                        io.to(roomCode).emit("userList", userList);
                        
                        // Broadcast user left event
                        socket.to(roomCode).emit("userLeft", { name: userName });
                        
                        console.log(`User ${userName} left room ${roomCode}. Remaining users: ${room.users.size}`);
                    }
                    break;
                }
            }
        }
    });
});

const port = process.env.PORT || 5000;
server.listen(port, ()=>
    console.log("server is running on http://localhost:5000")
)