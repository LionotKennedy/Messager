// const bcryptjs = require("bcryptjs");
// const User = require("../model/User");
// const { x } = require("../config/connexion");

// const addUsers = async (req, res, next) => {
//   try {
//     const { fullName, email, password } = req.body;

//     if (!fullName || !email || !password) {
//       res.status(400).send("Please fill all required fields");
//     } else {
//       const isAlreadyExist = User.findOne({ email });
//       if (!isAlreadyExist) {
//         res.status(400).send("User already exists");
//       } else {
//         const newUser = new User({ fullName, email });
//         bcryptjs.hash(password, 10, (err, hashedPassword) => {
//           newUser.set("password", hashedPassword);
//           newUser.save();
//           next();
//         });
//         return res.status(200).send("User registered successfully");
//       }
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };



// module.exports = { addUsers };
