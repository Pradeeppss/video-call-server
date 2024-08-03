import { MongoClient } from "mongodb";
import "../loadenv.js";

const connectionString = process.env.MONGO_URL || "";
const client = new MongoClient(connectionString);
let conn;

try {
  conn = await client.connect();
  console.log("connected to db");
} catch (e) {
  console.error(e);
}
let db = conn.db("ChatAppData");
export default db;
