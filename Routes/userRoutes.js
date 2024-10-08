const express = require(`express`);
const router = express.Router();
const { userModel } = require(`../models/user.model`);
const { bookmarkModel } = require(`../models/bookmarks.model`);
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const auth = require(`../auth.js`);

// WORKING
router.get(`/sign-in`, (req, res) => {
  res.status(200).json({ message: "user sign-in endpoint was hit" });
});

// WORKING
router.get(`/sign-up`, (req, res) => {
  res.status(200).json({ message: "user sign-up endpoint was hit" });
});

// WORKING
router.post(`/sign-up`, async (req, res) => {
  const { name, email, password, userName } = req.body;
  // , profileImage <-- add later in user req.body
  try {
    // Check for duplicate userName and email
    const duplicateuserName = await userModel.findOne({
      userName: new RegExp(`^${userName}$`, "i"),
    });
    const duplicateemail = await userModel.findOne({ email });

    // Handle duplicates
    if (duplicateuserName && duplicateemail) {
      return res.status(400).json({
        message: "Both username & email already exist",
      });
    } else if (duplicateuserName) {
      return res.status(400).json({
        message: "UserName already exists, choose different UserName",
      });
    } else if (duplicateemail) {
      return res
        .status(400)
        .json({ message: "Email already exists, choose different Email" });
    }
    const encrypted_password = await bcrypt.hash(password, 5);
    const newUser = userModel({
      name,
      email,
      password: encrypted_password,
      userName,
      profileImage: `https://placehold.co/600x400?text=${name
        .split(" ")
        .map((ele) => ele[0])
        .join("")}`,
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

// WORKING
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
      res.status(404).json({
        message: `No Account is registered under ${email}`,
        endpoint: `sign-in post`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `sign-in post` });
  }
});

// WORKING
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

// WORKING
// ADD FOLLOWER TO YOUR ACCOUNT AFTER REQUEST IS SENT
router.post(`/addFollower`, auth, async (req, res) => {
  const { userName, profileImage, userId } = req.body;
  const currentUserId = req.headers.userId;
  const currentUserName = req.headers.userName;
  try {
    if (userId == currentUserId) {
      return res.status(404).json({ message: "No Self following" });
    }
    const updatedUserData = await userModel.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { followers: { userName, profileImage, userId } } },
      { new: true }
    );
    const otherUser = await userModel
      .findById(currentUserId)
      .select("profileImage");
    const DataOfUserToWhomYouAllowedFollowingYou =
      await userModel.findByIdAndUpdate(
        userId,
        {
          $addToSet: {
            following: {
              userName: currentUserName,
              profileImage: otherUser.profileImage,
              userId: currentUserId,
            },
          },
        },
        { new: true }
      );
    if (updatedUserData && DataOfUserToWhomYouAllowedFollowingYou) {
      res.json({
        message: "Successfully following",
        endpoint: "/addFollower",
        updatedUserData,
        DataOfUserToWhomYouAllowedFollowingYou,
        otherUser,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: ` /addFollower` });
  }
});

// find all all users whom we are following yet
router.get(`/YetToFollow`, auth, async (req, res) => {
  const { userId } = req.headers;
  try {
    const followingDocument = await userModel
      .findById(userId)
      .select("following");
    const potentialUsers = await userModel
      .find({ _id: { $nin: [...followingDocument.following, userId] } })
      .select("_id name userName profileImage");
    if (potentialUsers && potentialUsers.length > 0) {
      res.status(200).json({
        message: "list of unFollowed people",
        potentialUsers,
        endpoint: "/YetNoFollowed",
      });
    } else {
      res.status(404).json({
        message: "list of unfollowed people is empty",
        endpoint: "/YetNoFollowed",
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: `${err.message}`, endpoint: "/YetNoFollowed" });
  }
});

router.get(`/home`, auth, async (req, res) => {
  res.status(200).json({ message: "home" });
});

// WORKING
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
    const updatedFollowerUserData = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { following: { currentUserId } } },
      { new: true }
    );
    if (updatedUserData && updatedFollowerUserData) {
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
router.get(`/:userId`, auth, async (req, res) => {
  const { userId } = req.params;
  try {
    const userFetched = await userModel.findById(userId);
    if (userFetched) {
      res.status(200).json({
        message: "user details fetched",
        userFetched,
        endpoint: `/:userId`,
      });
    } else {
      res.status(400).json({
        message: "failed to fetch user details",
        endpoint: `/:userId`,
      });
    }
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: `/:userId` });
  }
});

// delete user account
router.delete(`/:userId`, auth, async (req, res) => {
  try {
    const userDeleted = await userModel.findByIdAndDelete(userId);
    if (userDeleted) {
      res.status(200).json({
        message: "USER SUCCESSFULLY DELETED",
        userDeleted,
        endpoint: `/:userId`,
      });
    } else {
      res
        .status(400)
        .json({ message: "FAILED TO DELETE USER", endpoint: `/:userId` });
    }
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: `/:userId` });
  }
});

// UNFOLLOW SOMEONE
router.post(`/unfollow`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  const { userId: FollowerUserId } = req.body;
  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { following: { userId: FollowerUserId } } },
      { new: true }
    );
    if (updatedUser) {
      res.status(200).json({
        message: "Successfully unfollowed",
        endpoint: "/unfollow",
        updatedUser,
      });
    } else {
      res
        .status(400)
        .json({ message: "Failed to unfollow", endpoint: "/unfollow" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: "/unfollow" });
  }
});

// SEND FOLLOW REQUEST Update
router.post(`/followRequest`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  const { userId: userIdToWhomFollowRequestIsToBeSent } = req.body;
  try {
    const userUpdated = await userModel.findByIdAndUpdate(
      userIdToWhomFollowRequestIsToBeSent,
      {
        $addToSet: {
          requestUpdates: {
            content: `${userName} has sent you a follow request`,
            userIdOfSender: userId,
          },
        },
      },
      { new: true }
    );

    if (userUpdated) {
      res.status(200).json({
        message: "follow request successfully sent",
        endpoint: `/followRequest`,
        userUpdated,
      });
    } else {
      res.status(400).json({
        message: "failed to send follow request",
        endpoint: `/followRequest`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `/followRequest` });
  }
});

// Fetch Update
router.get(`/fetchReqUpdates`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  try {
    const user = await userModel.findById(userId);
    if (user) {
      res.status(200).json({
        message: "request updates fetched successfully",
        endpoint: `/fetchReqUpdates`,
        user,
      });
    } else {
      res.status(400).json({
        message: "failed to fetch request update",
        endpoint: `/fetchReqUpdates`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `/fetchReqUpdates` });
  }
});

// REMOVE UPDATES
router.post(`/filterUpdates`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  const { reqId } = req.body;
  try {
    const userupdated = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { requestUpdates: { reqId } } },
      { new: true }
    );
    if (userupdated) {
      res
        .status(200)
        .json({ message: "successful", endpoint: `/filterUpdates` });
    } else {
      res.status(400).json({ message: "failed", endpoint: `/filterUpdates` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `/filterUpdates` });
  }
});

module.exports = router;
