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
    const unuploadedMessages = freshMessages.filter(
      (message) => message.roomId === room
    );
    response.status(200).send({
      status: "success",
      data: {
        old: messages,
        latest: unuploadedMessages,
      },
    });
  } catch (error) {
    console.log(error);
    response.status(500).send({
      status: "fail",
      message: error | "Something went wrong",
    });
  }
}

//
let messageUpdateInterval;
let freshMessages = [];
let oldMessages = [];
const statusUpdateInterval = 3 * 60 * 1000;

export function onMessageRecieved(roomId, email, message, messageId, username) {
  if (!messageUpdateInterval) {
    messageUpdateInterval = setInterval(() => {
      messageStatusUpdation();
    }, statusUpdateInterval);
  }
  //
  const payload = {
    roomId,
    email,
    message,
    messageId,
    username,
    exp: Date.now() + statusUpdateInterval,
  };
  freshMessages.push(payload);
}

export function deleteMessage(roomId, messageId) {
  let delteIndex;
  for (let i = 0; i < freshMessages.length; i++) {
    const message = freshMessages[i];
    if (message.roomId === roomId && message.messageId === messageId) {
      delteIndex = i;
      break;
    }
  }
  if (delteIndex !== undefined) {
    freshMessages.splice(delteIndex, 1);
  }
  checkIntervalRequirement();
}

function messageStatusUpdation() {
  let expiredCount = 0;
  for (let i = 0; i < freshMessages.length; i++) {
    const message = freshMessages[i];
    if (message.exp < Date.now()) {
      expiredCount++;
    }
  }
  const expired = freshMessages.splice(0, expiredCount);
  oldMessages.push(...expired);
  sendOldMessagesToRoom();
}

async function sendOldMessagesToRoom() {
  try {
    const collection = db.collection("Chats");
    const payload = [];
    for (const message of oldMessages) {
      const item = {
        roomId: message.roomId,
        from: message.email,
        message: message.message,
      };
      payload.push(item);
    }
    const result = await collection.insertMany(payload);
    if (result.acknowledged) {
      oldMessages = [];
      checkIntervalRequirement();
    }
  } catch (error) {
    console.log(error);
  }
}
function checkIntervalRequirement() {
  if (freshMessages.length === 0 && oldMessages.length === 0) {
    clearInterval(messageUpdateInterval);
    messageUpdateInterval = undefined;
  }
}
