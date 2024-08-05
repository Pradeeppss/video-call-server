import {
  deleteMessage,
  onMessageRecieved,
} from "../controllers/chatController.js";
import { io } from "../server.js";

const rooms = new Map();
const emailToSocketId = new Map();
const socketIdToEmail = new Map();
let usersOnline = [];
const callsWaiting = new Map();

export function handleIoConnection(socket) {
  console.log("a user connected", socket.id);
  socket.on("user-online", (email) => {
    usersOnline.push(email);
    emailToSocketId.set(email, socket.id);
    socketIdToEmail.set(socket.id, email);
    if (callsWaiting.has(email)) {
      socket.emit("call-request", callsWaiting.get(email));
    }
  });
  socket.on("join-call", (roomId, user, email) => {
    console.log(email, "joining call");

    if (rooms.has(roomId)) {
      rooms.get(roomId).forEach((user) => {
        if (user.email === email) {
          user.onCall = true;
        }
      });
      callsWaiting.delete(email);
      checkForBothUsers(roomId, socket);
    }
  });
  function checkForBothUsers(roomId, socket) {
    let both = true;
    const users = rooms.get(roomId);
    users.forEach((user) => {
      if (!user.onCall) {
        both = false;
      }
    });
    console.log(both);
    if (both) {
      const users = rooms.get(roomId);
      socket.broadcast.to(roomId).emit("new-user");
      io.to(roomId).emit("all-users", users);
    }
  }
  socket.on("make-call", (roomId, email, otherEmail) => {
    if (usersOnline.includes(otherEmail)) {
      console.log("making call reqiest", email);
      const otherUserId = emailToSocketId.get(otherEmail);
      socket.to(otherUserId).emit("call-request", roomId);
    }
    callsWaiting.set(otherEmail, roomId);
  });
  socket.on("cancel-call", (roomId, email) => {
    callsWaiting.delete(email);
  });

  socket.on("join-room", (roomId, uOne, uTwo) => {
    socket.join(roomId);
    if (rooms.has(roomId)) return;
    const userOne = {
      email: uOne.email,
      username: uOne.username,
      online: true,
      onCall: false,
    };
    const userTwo = {
      email: uTwo.email,
      username: uTwo.username,
      online: usersOnline.includes(uTwo.email),
      onCall: false,
    };
    rooms.set(roomId, [userOne, userTwo]);
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

  socket.on("exit-user", (userId, roomId, email) => {
    if (rooms.has(roomId)) {
      rooms.get(roomId).forEach((user) => {
        if (user.email === email) {
          user.onCall = false;
        } else {
          if (usersOnline.includes(user.email)) {
            const userId = emailToSocketId.get(user.email);
            io.to(userId).emit("left-room", roomId);
          }
        }
      });
      socket.leave(roomId);
    }
  });

  socket.on("rtc-connection", (data, user, roomId) => {
    socket.to(roomId).emit("rtc-connection", data, user);
  });

  socket.on("video-toggle", (roomId, value) => {
    socket.broadcast.to(roomId).emit("toggle-video", value);
  });
  socket.on("audio-toggle", (roomId, value) => {
    socket.broadcast.to(roomId).emit("toggle-audio", value);
  });

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
    const userEmail = socketIdToEmail.get(socket.id);
    rooms.forEach((room, id) => {
      if (room[0].email === userEmail) {
        room[0].onCall = false;
        if (usersOnline.includes(room[1].email)) {
          const otherId = emailToSocketId.get(room[1].email);
          io.to(otherId).emit("left-room", id);
        }
      } else if (room[1].email === userEmail) {
        room[1].onCall = false;
        if (usersOnline.includes(room[0].email)) {
          const otherId = emailToSocketId.get(room[0].email);
          io.to(otherId).emit("left-room", id);
        }
      }
    });
    socketIdToEmail.delete(socket.id);
    if (userEmail) {
      usersOnline = usersOnline.filter((email) => email !== userEmail);
    }
  });
  socket.on("message", (room, message, messageId, username, email) => {
    onMessageRecieved(room, email, message, messageId, username);
    io.to(room).emit("message", message, messageId, username, email);
  });

  socket.on("message-delete", (roomId, messageId) => {
    deleteMessage(roomId, messageId);
    io.to(roomId).emit("delete-message", messageId);
  });
}
