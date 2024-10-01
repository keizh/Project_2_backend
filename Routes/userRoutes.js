const express = require(`express`);
const router = express.Router();
const { userModel } = require(`../models/user.model`);
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const auth = require(`../auth.js`);

router.get(`/sign-in`, (req, res) => {
  res.status(200).json({ message: "user sign-in endpoint was hit" });
});

router.get(`/sign-up`, (req, res) => {
  res.status(200).json({ message: "user sign-up endpoint was hit" });
});

router.post(`/sign-up`, async (req, res) => {
  const { name, email, password, userName } = req.body;
  try {
    const encrypted_password = await bcrypt.hash(password, 5);
    const newUser = userModel({
      name,
      email,
      password: encrypted_password,
      userName,
    });
    const newUserCreated = await newUser.save();
    if (newUserCreated) {
      res.status(201).json({
        message: "New User created",
        endpoint: `sign-up post`,
        newUserCreated,
      });
    } else {
      res.status(400).json({
        message: "Failed to create new User",
        endpoint: `sign-up post`,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: `${err.message}`, endPoint: `sign-up post` });
  }
});

router.post(`/sign-in`, async (req, res) => {
  const { email, password } = req.body;
  try {
    const userFetchedFromDB = await userModel.findOne({ email });
    if (userFetchedFromDB) {
      const result = await bcrypt.compare(password, userFetchedFromDB.password);
      if (result) {
        var token = JWT.sign(
          { userId: userFetchedFromDB._id, name: userFetchedFromDB.name },
          process.env.JWT_Password,
          { expiresIn: "5h" }
        );
        res.status(200).json({
          message: "you have successfully sign-in",
          token,
          endpoint: `sign-in post`,
        });
      } else {
        res
          .status(404)
          .json({ message: "Incorrect Password", endpoint: `sign-in post` });
      }
    } else {
      res.status(404).json({ message: "No Account", endpoint: `sign-in post` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `sign-in post` });
  }
});

router.get(`/list`, async (req, res) => {
  try {
    const data = await userModel.find().select("name userName email");
    if (data && data.length > 0) {
      res
        .status(200)
        .json({ message: "list of all the users retrieved", data });
    } else {
      res.status(400).json({ message: "No users" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `list of user post` });
  }
});

router.post(`/addFollower`, auth, async (req, res) => {
  try {
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: ` / addFollower` });
  }
});

module.exports = router;
