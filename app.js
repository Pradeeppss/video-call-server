const express = require("express");
const cors = require("cors");
const { Socket } = require("socket.io");
const app = express();
const router = require("./routes/userRoutes");
const dotenv = require("dotenv");
//
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const PORT = process.env.PORT || 3001;

dotenv.config({ path: "./.env" });

app.use(cors("*"));
app.use(express.json());
// app.use("/", router);

server.listen(PORT, () => {
  console.log("Listening to the port:", PORT);
});

const rooms = new Map();
const users = new Map();

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join-room", (roomId, user) => {
    if (rooms.has(roomId)) {
      socket.join(roomId);
      rooms.get(roomId).push({ username: user, id: socket.id });
      socket.broadcast.to(roomId).emit("new-user");
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

  socket.on("message", (room, message, messageId, username) => {
    io.to(room).emit("message", message, messageId, username);
  });

  socket.on("message-delete", (roomId, messageId) => {
    io.to(roomId).emit("delete-message", messageId);
  });

  socket.on("start-connection", (roomId) => {
    if (rooms.get(roomId).length > 1) {
      socket.broadcast.to(roomId).emit("start-rtc");
    }
  });

  socket.on("send-offer", (offer, roomId) => {
    socket.broadcast.to(roomId).emit("recieve-offer", offer);
  });

  socket.on("send-answer", (answer, roomId) => {
    socket.broadcast.to(roomId).emit("recieve-answer", answer);
  });

  socket.on("send-candidate", (candidate, roomId) => {
    socket.broadcast.to(roomId).emit("recieve-candidate", candidate);
  });

  socket.on("connection-finish", (roomId) => {
    socket.broadcast.to(roomId).emit("rtc-finish");
  });

  socket.on("rtc-connection", (data, user, roomId) => {
    console.log("rtc-connection", data, user);
    socket.to(roomId).emit("rtc-connection", data, user);
  });
  socket.on("disconnect", () => {
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
