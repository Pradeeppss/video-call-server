import { addMessageToRoom } from "../controllers/chatController.js";
import { io } from "../server.js";

const rooms = new Map();
const users = new Map();

export function handleIoConnection(socket) {
  console.log("a user connected", socket.id);
  socket.on("join-call", (roomId, user, email) => {
    if (rooms.has(roomId)) {
      const members = rooms.get(roomId);
      if (members.size <= 1 || members.has(socket.id)) {
        socket.join(roomId);
        rooms
          .get(roomId)
          .set(socket.id, { username: user, id: socket.id, email });
        if (members.size === 2) {
          socket.broadcast.to(roomId).emit("new-user");
          const memArr = [];
          members.forEach((user, _) => {
            memArr.push(user);
          });
          io.to(roomId).emit("all-users", memArr);
        }
      } else {
        socket.emit("room-full");
        return;
      }
    } else {
      socket.join(roomId);
      rooms.set(
        roomId,
        new Map().set(socket.id, { username: user, id: socket.id, email })
      );
    }
    io.to(roomId).emit("joined", rooms.get(roomId), roomId);
  });
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("message", (room, message, messageId, username, email) => {
    addMessageToRoom(room, email, message);
    io.to(room).emit("message", message, messageId, username, email);
  });

  socket.on("message-delete", (roomId, messageId) => {
    io.to(roomId).emit("delete-message", messageId);
  });

  socket.on("start-connection", (roomId) => {
    if (rooms.get(roomId).length > 1) {
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
    io.to(roomId).emit("rtc-finish");
  });

  socket.on("exit-user", (userId, roomId) => {
    socket.broadcast.to(roomId).emit("left-room", socket.id);
    if (rooms.has(roomId)) {
      rooms.get(roomId).delete(userId);
      socket.leave(roomId);
    }
  });

  socket.on("rtc-connection", (data, user, roomId) => {
    socket.to(roomId).emit("rtc-connection", data, user);
  });
  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
    rooms.forEach((users) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
      }
    });
  });
}
