import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//
import { app, server } from "./server.js";
import "./loadenv.js";
import router from "./routes/apiRoutes.js";
//

// dotenv.config({ path: "./.env.development" });

const PORT = process.env.PORT;

app.use(
  cors({
    origin: [
      "http:localhost:5173",
      "http://localhost:4173",
      "http://localhost:3000",
      process.env.ORIGIN,
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
//
app.use("/", router);

server.listen(PORT, () => {
  console.log("Listening to the port:", PORT);
});
