import db from "../db/connection.js";
import "../loadenv.js";

export async function getAllUsers(_, response) {
  try {
    const collection = db.collection("ChatUsers");
    const users = await collection.find({}).project({ password: 0 }).toArray();
    response.status(200).send({
      status: "success",
      data: users,
    });
  } catch (error) {
    console.log(error);
    response.status(500).send({
      status: "fail",
      message: error | "Something went wrong",
    });
  }
}
