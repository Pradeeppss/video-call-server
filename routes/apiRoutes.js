import express from "express";
const router = express.Router();
import {
  authenticate,
  login,
  logout,
  signup,
} from "../controllers/authController.js";
import { getAllUsers } from "../controllers/userController.js";
import { createRoom, getAllRooms } from "../controllers/roomController.js";
import { getAllMessages } from "../controllers/chatController.js";

//auth
router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", authenticate, logout);

//user
router.get("/users", authenticate, getAllUsers);

//room
router.post("/create", authenticate, createRoom);
router.get("/rooms", authenticate, getAllRooms);

//messages
router.get("/messages", authenticate, getAllMessages);

export default router;
