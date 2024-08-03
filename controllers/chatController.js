import db from "../db/connection.js";
import "../loadenv.js";

export async function getAllMessages(request, response) {
  const { room } = request.query;
  try {
    if (!room) {
      return response.status(400).send({
        status: "fail",
        message: "room id not found",
      });
    }
    const collection = db.collection("Chats");
    const messages = await collection.find({ roomId: room }).toArray();
    response.status(200).send({
      status: "success",
      data: messages,
    });
  } catch (error) {
    console.log(error);
    response.status(500).send({
      status: "fail",
      message: error | "Something went wrong",
    });
  }
}

export async function addMessageToRoom(roomId, from, message) {
  try {
    const collection = db.collection("Chats");
    const payload = {
      roomId,
      from,
      message,
    };
    await collection.insertOne(payload);
  } catch (error) {
    console.log(error);
  }
}
