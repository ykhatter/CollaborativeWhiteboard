const express = require("express");
const app = express();
require('dotenv').config();

const server = require("http").createServer(app);
const { Server } = require("socket.io");
const db = require("./database.js");

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  }
});

// In-memory store for active users in rooms
const roomUsers = new Map();

//routes
app.get("/", (req, res)=>{
    res.send(
        "This is mern realtime board sharing app official server"
    );  
})

io.on("connection", (socket)=>{
    console.log("User connected:", socket.id);
    
    socket.on("userJoined", async (roomData)=>{
        console.log("User joined data:", roomData);
        const {name, roomCode, userId, presenter, host} = roomData;
        
        socket.join(roomCode);
        
        // Ensure room exists in DB, if not, create it
        await db.query(`INSERT INTO rooms (code) VALUES ($1) ON CONFLICT (code) DO NOTHING`, [roomCode]);
        
        // Add user to in-memory store for the room
        if (!roomUsers.has(roomCode)) {
            roomUsers.set(roomCode, new Map());
        }
        const usersInRoom = roomUsers.get(roomCode);
        usersInRoom.set(userId, { name, presenter, host, socketId: socket.id });
        
        // Send confirmation to user
        socket.emit("userIsJoined", { success: true });
        
        // No more fetching elements from DB, just send empty state
        socket.emit("roomState", { elements: [], history: [] });
        
        // Broadcast user joined to all users in room
        socket.to(roomCode).emit("userJoined", { userId, name, presenter, host });
        
        // Send updated user list to all users in room
        const userList = Array.from(usersInRoom.values()).map((user, index) => ({
            userId: Array.from(usersInRoom.keys())[index],
            name: user.name,
            presenter: user.presenter,
            host: user.host
        }));
        io.to(roomCode).emit("userList", userList);
        
        console.log(`User ${name} joined room ${roomCode}. Total users: ${usersInRoom.size}`);
    });
    
    // Handle drawing events
    socket.on("drawElement", (data) => {
        const { roomCode, element } = data;
        // Just broadcast to others in the room
        socket.to(roomCode).emit("elementDrawn", element);
    });
    
    // Element updates are only broadcasted
    socket.on("updateElement", (data) => {
        const { roomCode, index, element } = data;
        socket.to(roomCode).emit("elementUpdated", { index, element });
    });
    
    // Handle board state updates (undo/redo/clear) from presenter
    socket.on("boardStateUpdate", (data) => {
        const { roomCode, elements, history } = data;
        socket.to(roomCode).emit("boardStateUpdate", { elements, history });
    });
    
    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        
        for (const [roomCode, usersInRoom] of roomUsers.entries()) {
            for (const [userId, user] of usersInRoom.entries()) {
                if (user.socketId === socket.id) {
                    const userName = user.name;
                    usersInRoom.delete(userId);
                    
                    if (usersInRoom.size === 0) {
                        roomUsers.delete(roomCode);
                        console.log(`Room ${roomCode} is now empty in memory.`);
                    } else {
                        const userList = Array.from(usersInRoom.values()).map((u, index) => ({
                            userId: Array.from(usersInRoom.keys())[index],
                            name: u.name,
                            presenter: u.presenter,
                            host: u.host
                        }));
                        io.to(roomCode).emit("userList", userList);
                        socket.to(roomCode).emit("userLeft", { name: userName });
                        console.log(`User ${userName} left room ${roomCode}. Remaining users: ${usersInRoom.size}`);
                    }
                    return; // Exit loop once user is found and handled
                }
            }
        }
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () =>
  console.log(`server is running on http://localhost:${port}`)
);