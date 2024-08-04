import db from "../db/connection.js";
import "../loadenv.js";

export async function createRoom(request, response) {
  const { emailOne, emailTwo } = request.body;
  try {
    const collection = db.collection("ChatUsers");
    const roomCollection = db.collection("ChatRooms");
    const [userOne, userTwo] = await collection
      .find({
        $or: [{ email: emailOne }, { email: emailTwo }],
      })
      .project({ password: 0 })
      .toArray();
    if (!userOne || !userTwo) {
      throw new Error("User not found");
    }
    const payload = {
      userOne: userOne,
      emailOne: userOne.email,
      userOneId: userOne._id,
      userTwo: userTwo,
      emailTwo: userTwo.email,
      userTwoId: userTwo._id,
    };
    const result = await roomCollection.insertOne(payload);
    if (!result) {
      throw new Error("Unable to create room");
    }
    return response.status(200).send({
      status: "success",
      data: { ...payload, _id: result.insertedId },
    });
  } catch (error) {
    console.log(error);
    response.status(500).send({
      status: "fail",
      message: error | "Something went wrong",
    });
  }
}

export async function getAllRooms(request, response) {
  const { email } = request.query;
  try {
    if (!email) {
      return response.status(400).send({
        status: "fail",
        message: "Email id not found",
      });
    }
    const collection = db.collection("ChatRooms");
    const rooms = await collection
      .find({ $or: [{ emailOne: email }, { emailTwo: email }] })
      .toArray();
    response.status(200).send({
      status: "success",
      data: rooms,
    });
  } catch (error) {
    console.log(error);
    response.status(500).send({
      status: "fail",
      message: error | "Something went wrong",
    });
  }
}

// export async function checkUserRoom
