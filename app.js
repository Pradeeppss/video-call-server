const express = require("express");
const cors = require("cors");
const { Socket } = require("socket.io");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3001;

app.use(cors("*"));

server.listen(PORT, () => {
  console.log("Listening to the port:", PORT);
});

const rooms = new Map();
const users = new Map();

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join-room", (roomId, user, initilzation) => {
    if (rooms.has(roomId)) {
      socket.join(roomId);
      rooms.get(roomId).push({ username: user, id: socket.id });
    } else {
      socket.join(roomId);
      rooms.set(roomId, [{ username: user, id: socket.id }]);
    }
    if (users.has(socket.id)) {
      users.get(socket.id).push(roomId);
    } else {
      users.set(socket.id, [roomId]);
    }
    io.to(roomId).emit("joined", rooms.get(roomId), roomId);
  });

  socket.on("message", (room, message, username) => {
    console.log(message, room, "recieved");
    io.to(room).emit("message", message, username);
  });
  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
    removeDisconnectedUser(socket.id);
  });
});

function removeDisconnectedUser(userId) {
  if (users.has(userId)) {
    const roomsWithUser = users.get(userId);
    for (const roomId of roomsWithUser) {
      if (rooms.has(roomId)) {
        const updatedUsers = rooms
          .get(roomId)
          .filter((user) => user.id !== userId);
        rooms.set(roomId, updatedUsers);
      }
    }
    users.delete(userId);
  }
}
