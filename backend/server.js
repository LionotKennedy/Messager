// const routerUser = require("./route/router");
// app.use("/api", routerUser);

const express = require("express");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const io = require("socket.io")(8080, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const User = require("./model/User");
const { x } = require("./config/connexion");
const Conversation = require("./model/Conversation");
const Message = require("./model/Message");

const app = express();
const port = process.env.PORT || 9876;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());




// Socket.io
let users = [];
io.on("connection", (socket) => {
  console.log("User connected", socket.id);
  socket.on("addUser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);
    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getUsers", users);
    }
  });

  socket.on(
    "sendMessage",
    async ({ senderId, receiverId, message, conversationId }) => {
      const receiver = users.find((user) => user.userId === receiverId);
      const sender = users.find((user) => user.userId === senderId);
      const user = await User.findById(senderId);
      console.log("sender :>> ", sender, receiver);
      if (receiver) {
        io.to(receiver.socketId)
          .to(sender.socketId)
          .emit("getMessage", {
            senderId,
            message,
            conversationId,
            receiverId,
            user: { id: user._id, fullName: user.fullName, email: user.email },
          });
      } else {
        io.to(sender.socketId).emit("getMessage", {
          senderId,
          message,
          conversationId,
          receiverId,
          user: { id: user._id, fullName: user.fullName, email: user.email },
        });
      }
    }
  );

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
  // io.emit('getUsers', socket.userId);
});




if (x == null) {
  console.log("Connexion Failed...");
} else {
  console.log("Connexion have been successfully..."); 
}

app.get("/", (req, res) => {
  res.send("Hello Friends, I am Chat...");
});

// ############################## REGISTER #################################//
app.post("/api/register", async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).send("Please fill all required fields");
    } else {
      const isAlreadyExist = await User.findOne({ email });
      if (isAlreadyExist) {
        res.status(400).send("User already exists");
      } else {
        const newUser = new User({ fullName, email });
        bcryptjs.hash(password, 10, (err, hashedPassword) => {
          newUser.set("password", hashedPassword);
          newUser.save();
          next();
        });
        return res.status(200).send("User registered successfully");
      }
    }
  } catch (error) {
    console.log(error);
  }
});
// ############################## ENDING #################################//

// ############################## LOGIN #################################//
app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).send("Please fill all required fields");
    } else {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(400).send("User email or password is incorrect");
      } else {
        const validateUser = await bcryptjs.compare(password, user.password);
        if (!validateUser) {
          res.status(400).send("User email or password is incorrect");
        } else {
          const payload = {
            userId: user._id,
            email: user.email,
          };
          const JWT_SECRET_KEY =
            process.env.JWT_SECRET_KEY || "THIS_IS_A_JWT_SECRET_KEY";

          jwt.sign(
            payload,
            JWT_SECRET_KEY,
            { expiresIn: 84600 },
            async (err, token) => {
              await User.updateOne(
                { _id: user._id },
                {
                  $set: { token },
                }
              );
              user.save();
              return res.status(200).json({
                status: 200,
                user: {
                  id: user._id,
                  email: user.email,
                  fullName: user.fullName,
                },
                token: token,
              });
            }
          );
        }
      }
    }
  } catch (error) {
    console.log(error, "Error");
  }
});
// ############################## ENDING #################################//

// ############################## CONVERSATION #################################//
app.post("/api/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const newCoversation = new Conversation({
      members: [senderId, receiverId],
    });
    await newCoversation.save();
    res.status(200).send("Conversation created successfully");
  } catch (error) {
    console.log(error, "Error");
  }
});
// ############################## ENDING #################################//

// ############################## GETCONVERSATION #################################//
app.get("/api/conversation/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const conversations = await Conversation.find({
      members: { $in: [userId] },
    });
    const conversationUserData = Promise.all(
      conversations.map(async (conversation) => {
        const receiverId = conversation.members.find(
          (member) => member !== userId
        );
        const user = await User.findById(receiverId);
        return {
          user: {
            receiverId: user._id,
            email: user.email,
            fullName: user.fullName,
          },
          conversationId: conversation._id,
        };
      })
    );
    res.status(200).json(await conversationUserData);
  } catch (error) {
    console.log(error, "Error");
  }
});
// ############################## ENDING #################################//

// ############################## SEND A MESSAGE #################################//
app.post("/api/message", async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId = "" } = req.body;
    if (!senderId || !message)
      return res.status(400).send("Please fill all required fields");
    if (conversationId === "new" && receiverId) {
      const newCoversation = new Conversation({
        members: [senderId, receiverId],
      });
      await newCoversation.save();
      const newMessage = new Message({
        conversationId: newCoversation._id,
        senderId,
        message,
      });
      await newMessage.save();
      return res.status(200).send("Message sent successfully");
    } else if (!conversationId && !receiverId) {
      return res.status(400).send("Please fill all required fields");
    }
    const newMessage = new Message({ conversationId, senderId, message });
    await newMessage.save();
    res.status(200).send("Message sent successfully");
  } catch (error) {
    console.log(error, "Error");
  }
});
// ############################## ENDING #################################//

// ############################## GET MESSAGE #################################//
app.get("/api/message/:conversationId", async (req, res) => {
  try {
    const checkMessages = async (conversationId) => {
      console.log(conversationId, "conversationId");
      const messages = await Message.find({ conversationId });
      const messageUserData = Promise.all(
        messages.map(async (message) => {
          const user = await User.findById(message.senderId);
          return {
            user: { id: user._id, email: user.email, fullName: user.fullName },
            message: message.message,
          };
        })
      );
      res.status(200).json(await messageUserData);
    };
    const conversationId = req.params.conversationId;
    if (conversationId === "new") {
      const checkConversation = await Conversation.find({
        members: { $all: [req.query.senderId, req.query.receiverId] },
      });
      console.log(req.query.receiverId);
      if (checkConversation.length > 0) {
        checkMessages(checkConversation[0]._id);
      } else {
        return res.status(200).json([]);
      }
    } else {
      checkMessages(conversationId);
    }
  } catch (error) {
    console.log("Error", error);
  }
});
// ############################## ENDING #################################//

// ############################## GET ALL USERS FROM THE DATABASE #################################//
app.get("/api/user", async (req, res) => {
  // try {
  //   const users = await User.find();
  //   res.status(200).json({
  //     status: 200,
  //     message: "Fetch all users from database",
  //     data: users,
  //   });
  // } catch (error) {
  //   console.log(error);
  // }
  try {
    const users = await User.find();
    const usersData = Promise.all(users.map(async (user) => {
      return { user: { email: user.email, fullName: user.fullName }, userId: user._id }
    }))
  } catch (error) {
    console.log(error);
  }
});
// ############################## ENDING #################################//

// ############################## GET USER FROM THE DATABASE #################################//
app.get("/api/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await User.find({ _id: { $ne: userId } });
    const usersData = Promise.all(
      users.map(async (user) => {
        return {
          user: {
            email: user.email,
            fullName: user.fullName,
            receiverId: user._id,
          },
        };
      })
    );
    res.status(200).json(await usersData);
  } catch (error) {
    console.log("Error", error);
  }
});
// ############################## ENDING #################################//

// ##############################  #################################//
app.get("/api/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const users = await User.find({ _id: { $ne: userId } });
    const usersData = Promise.all(
      users.map(async (user) => {
        return {
          user: {
            email: user.email,
            fullName: user.fullName,
            receiverId: user._id,
          },
        };
      })
    );
    res.status(200).json(await usersData);
  } catch (error) {
    console.log("Error", error);
  }
});
// ############################## ENDING #################################//


// ##############################  #################################//

// ############################## ENDING #################################//
app.listen(port, () => {
  console.log(`listening on port http://127.0.0.1:${port}`);
});
