const express = require("express");
const app = express();
require('dotenv').config();

const server = require("http").createServer(app);
const { Server } = require("socket.io");
const db = require("./database.js");

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
        
        // Fetch existing elements from DB and send to the new user
        try {
            const { rows } = await db.query(`SELECT element_data FROM elements WHERE room_code = $1 AND is_undone = 0 ORDER BY id ASC`, [roomCode]);
            const elements = rows.map(row => JSON.parse(row.element_data));
            socket.emit("roomState", { elements, history: [] });
        } catch (err) {
            console.error("Failed to fetch elements:", err);
        }
        
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
    socket.on("drawElement", async (data) => {
        const { roomCode, element } = data;
        
        const elementJson = JSON.stringify(element);
        try {
            // Clear redo history by deleting undone elements
            await db.query(`DELETE FROM elements WHERE room_code = $1 AND is_undone = 1`, [roomCode]);
            await db.query(`INSERT INTO elements (room_code, element_data) VALUES ($1, $2)`, [roomCode, elementJson]);
            console.log("Broadcasting elementDrawn to room:", roomCode);
            socket.to(roomCode).emit("elementDrawn", element);
        } catch (err) {
            console.error("Failed to save element:", err);
        }
    });
    
    // Element updates are not persisted, only broadcasted
    socket.on("updateElement", (data) => {
        const { roomCode, index, element } = data;
        socket.to(roomCode).emit("elementUpdated", { index, element });
    });
    
    // Handle undo
    socket.on("undo", async (data) => {
        const { roomCode } = data;
        try {
            // Find the last active element and mark it as undone
            const { rowCount } = await db.query(`
                UPDATE elements 
                SET is_undone = 1 
                WHERE id = (
                    SELECT id FROM elements 
                    WHERE room_code = $1 AND is_undone = 0 
                    ORDER BY id DESC 
                    LIMIT 1
                )`, [roomCode]);

            if (rowCount > 0) {
                // Refetch and broadcast the new state
                const { rows } = await db.query(`SELECT element_data FROM elements WHERE room_code = $1 AND is_undone = 0 ORDER BY id ASC`, [roomCode]);
                const elements = rows.map(row => JSON.parse(row.element_data));
                io.to(roomCode).emit("roomState", { elements, history: [] });
            }
        } catch (err) {
            console.error("Failed to undo element:", err);
        }
    });
    
    // Handle redo
    socket.on("redo", async (data) => {
        const { roomCode } = data;
        try {
            // Find the last undone element and mark it as active
            const { rowCount } = await db.query(`
                UPDATE elements 
                SET is_undone = 0 
                WHERE id = (
                    SELECT id FROM elements 
                    WHERE room_code = $1 AND is_undone = 1 
                    ORDER BY id DESC 
                    LIMIT 1
                )`, [roomCode]);

            if (rowCount > 0) {
                // Refetch and broadcast the new state
                const { rows } = await db.query(`SELECT element_data FROM elements WHERE room_code = $1 AND is_undone = 0 ORDER BY id ASC`, [roomCode]);
                const elements = rows.map(row => JSON.parse(row.element_data));
                io.to(roomCode).emit("roomState", { elements, history: [] });
            }
        } catch (err) {
            console.error("Failed to redo element:", err);
        }
    });
    
    // Handle clear
    socket.on("clear", async (data) => {
        const { roomCode } = data;
        try {
            await db.query(`DELETE FROM elements WHERE room_code = $1`, [roomCode]);
            io.to(roomCode).emit("boardCleared");
        } catch (err) {
            console.error("Failed to clear board:", err);
        }
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