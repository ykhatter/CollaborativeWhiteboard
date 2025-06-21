const express = require("express");
const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server);

//routes
app.get("/", (req, res)=>{
    res.send(
        "This is mern realtime board sharing app official server"
    );
})

const port = process.env.PORT || 5000;
server.listen(port, ()=>
    console.log("server is running on http://localhost:5000")
)