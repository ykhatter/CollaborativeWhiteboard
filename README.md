# Collaborative Whiteboard App

A real-time collaborative whiteboard application built with React, Node.js, and Socket.IO that allows multiple users to draw, collaborate, and share ideas in real-time.

## Features

### 🎯 Core Functionality
- **Real-time Drawing**: Draw together with multiple users simultaneously
- **Multiple Tools**: Pencil, Line, Rectangle, and Circle drawing tools
- **Color Selection**: Choose from any color for your drawings
- **Undo/Redo**: Collaborative undo and redo functionality
- **Clear Board**: Clear the entire whiteboard for all users

### 👥 Collaboration Features
- **Room-based Collaboration**: Create or join rooms with unique codes
- **User Management**: See who's connected and their roles
- **Real-time Notifications**: Get notified when users join or leave
- **Role-based Access**: Presenters can draw, others can view
- **Live User Count**: See how many users are currently in the room

### 🎨 User Interface
- **Modern Design**: Beautiful gradient backgrounds and glass morphism effects
- **Responsive Layout**: Works perfectly on desktop and mobile devices
- **Interactive Elements**: Smooth animations and hover effects
- **Floating Particles**: Animated background particles for visual appeal
- **Loading States**: Smooth loading animations and transitions

### 🔧 Technical Features
- **Real-time Synchronization**: All drawing actions sync instantly across users
- **WebSocket Communication**: Fast and reliable real-time updates
- **State Management**: Proper state handling for collaborative features
- **Error Handling**: Robust error handling and connection management

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Socket.IO Client**: Real-time communication
- **Rough.js**: Hand-drawn style graphics library
- **CSS3**: Modern styling with animations and gradients

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **CORS**: Cross-origin resource sharing support

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 16 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd CollaborativeWhiteboard
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Start the Backend Server

```bash
cd ../backend
npm start
```

The backend server will start on `http://localhost:5000`

### 5. Start the Frontend Development Server

```bash
cd ../frontend
npm run dev
```

The frontend application will start on `http://localhost:5173`

## 🎮 How to Use

### Creating a Room
1. Open the application in your browser
2. Enter your name in the "Create Room" section
3. Click "Generate Code" to create a unique room code
4. Click "Create Room" to enter the whiteboard

### Joining a Room
1. Enter your name in the "Join Room" section
2. Enter the room code provided by the room creator
3. Click "Join Room" to enter the whiteboard

### Drawing and Collaboration
1. **Select a Tool**: Choose from Pencil, Line, Rectangle, or Circle
2. **Choose a Color**: Use the color picker to select your drawing color
3. **Start Drawing**: Click and drag on the whiteboard to draw
4. **Collaborate**: All users in the room will see your drawings in real-time
5. **Use Actions**: Use Undo, Redo, and Clear buttons as needed
