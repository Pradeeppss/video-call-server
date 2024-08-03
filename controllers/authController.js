import db from "../db/connection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "../loadenv.js";

// login
export async function login(request, response) {
  const { email, password } = request.body;
  try {
    if (!email || !password) {
      return response.status(400).send({
        status: "fail",
        message: "Input field missing",
      });
    }
    const collection = db.collection("ChatUsers");
    const user = await collection.findOne({ email: email });
    if (!user) {
      return response.status(404).send({
        status: "fail",
        message: "User does not exit",
      });
    }
    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return response.status(401).send({
        status: "fail",
        message: "Wrong password",
      });
    }
    const accessToken = createJWTToken(user);
    return response
      .cookie("Authorization", `Bearer ${accessToken}`, { httpOnly: true })
      .status(200)
      .send({
        status: "success",
        user,
        accessToken,
      });
  } catch (error) {
    console.log(error);
    response.status(401).send({
      status: "fail",
      message: error.message | "Something went wrong",
    });
  }
}

// logout
export async function logout(_, response) {
  try {
    response.clearCookie("Authorization").status(200).send({
      status: "success",
    });
  } catch (error) {
    console.log(error);
    response.status(401).send({
      status: "fail",
      message: error.message | "Something went wrong",
    });
  }
}

// signup
export async function signup(request, response) {
  const { email, username, password } = request.body;
  try {
    if (!email || !username || !password) {
      return response.status(400).send({
        status: "fail",
        message: "Input field missing",
      });
    }
    //
    const collection = db.collection("ChatUsers");
    const user = await collection.findOne({ email: email });
    if (user) {
      return response.status(403).send({
        status: "fail",
        message: "Email already exists",
      });
    }
    const hashedPass = await bcrypt.hash(password, 10);
    const result = await collection.insertOne({
      email,
      username,
      password: hashedPass,
    });
    if (result) {
      return response.status(200).send({
        status: "success",
        data: result,
      });
    } else {
      throw new Error("Unable to signup, please try again");
    }
  } catch (error) {
    console.log(error);
    response.status(500).send({
      status: "fail",
      message: error.message | "Something went wrong",
    });
  }
}

export async function authenticate(request, response, next) {
  const { Authorization } = request.cookies;
  if (!Authorization || !Authorization.startsWith("Bearer")) {
    return response.status(401).send({
      status: "fail",
      message: "No Bearer token found",
    });
  }
  const token = Authorization.split(" ")[1];
  try {
    const verifiedToken = verifyJWTToken(token);
    if (verifiedToken.exp < Date.now()) {
      return response.status(401).send({
        status: "fail",
        message: "Expired Bearer token",
      });
    }
    // valid
    next();
  } catch (error) {
    console.log(error);
    response.status(401).send({
      status: "fail",
      message: "Invalid Bearer token",
    });
  }
}

function createJWTToken(data) {
  const secret = process.env.JWT_SECRET;
  const payload = {
    iat: Date.now(),
    exp: Date.now() + 86400000,
    ...data,
  };
  return jwt.sign(payload, secret);
}

function verifyJWTToken(token) {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}
