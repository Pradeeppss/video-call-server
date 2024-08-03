import express from "express";
import http from "http";
import { Server } from "socket.io";
import { handleIoConnection } from "./socket/socket.js";

export const app = express();

export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  handleIoConnection(socket);
});
