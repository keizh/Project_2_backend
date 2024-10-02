const express = require(`express`);
const router = express.Router();
const { userModel } = require(`../models/user.model`);
const { bookmarkModel } = require(`../models/bookmarks.model`);
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
  const { name, email, password, userName, profileImage } = req.body;
  try {
    const encrypted_password = await bcrypt.hash(password, 5);
    const newUser = userModel({
      name,
      email,
      password: encrypted_password,
      userName,
      profileImage,
    });
    const newUserCreated = await newUser.save();
    const newUserBookmarks = await bookmarkModel({
      userId: newUserCreated._id,
    }).save();
    if (newUserCreated) {
      res.status(201).json({
        message: "New User created",
        endpoint: `sign-up post`,
        newUserCreated,
        newUserBookmarks,
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
          {
            userId: userFetchedFromDB._id,
            name: userFetchedFromDB.name,
            userName: userFetchedFromDB.userName,
          },
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
    const data = await userModel
      .find()
      .select("name userName email _id profileImage");
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

// ADD FOLLOWER TO YOUR ACCOUNT AFTER REQUEST IS SENT
router.post(`/addFollower`, auth, async (req, res) => {
  const { userName, profileImage, userId } = req.body;
  const currentUserId = req.headers.userId;
  try {
    const updatedUserData = await userModel.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { followers: { userName, profileImage, userId } } },
      { new: true }
    );
    if (updatedUserData) {
      res.json({
        message: "Successfully following",
        endpoint: "/addFollower",
        updatedUserData,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: ` / addFollower` });
  }
});

// REMOVE FOLLOWER
router.post(`/removeFollower`, auth, async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.headers.userId;
  try {
    const updatedUserData = await userModel.findByIdAndUpdate(
      currentUserId,
      { $pull: { followers: { userId } } },
      { new: true }
    );
    if (updatedUserData) {
      res.json({
        message: "Successfully removed follower",
        endpoint: "/addFollower",
        updatedUserData,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: ` / addFollower` });
  }
});

// to fetch specific user
router.post(`/:userId`, auth, async (req, res) => {});

// delete user account
router.delete(`/:userId`, auth, async (req, res) => {});

// UNFOLLOW SOMEONE
router.delete(`/unfollow`, auth, async (req, res) => {});

// SEND FOLLOW REQUEST
router.delete(`/unfollow`, auth, async (req, res) => {});

// REMOVE UPDATES
router.post(`/filterUpdates`, auth, async (req, res) => {});

// Add updates
router.post(`/addUpdates`, auth, async (req, res) => {});

module.exports = router;
