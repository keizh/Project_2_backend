const express = require(`express`);
const mongoose = require(`mongoose`);
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
  // userName,profileImage,userId of the user who wishes to follow
  const { userName, profileImage, userId } = req.body;
  const currentUserId = req.headers.userId;
  const currentUserName = req.headers.userName;
  try {
    if (userId == currentUserId) {
      return res.status(404).json({ message: "No Self following" });
    }
    // adding follower is working
    const updatedUserData = await userModel.findByIdAndUpdate(
      currentUserId,
      {
        $addToSet: {
          followers: {
            userName,
            profileImage,
            userId: userId,
          },
        },
      },
      { new: true }
    );

    const otherUser = await userModel
      .findById(currentUserId)
      .select("profileImage");
    console.log(`profile image`, otherUser);
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
    console.log(`sss`, DataOfUserToWhomYouAllowedFollowingYou);
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
      .select("following requestUpdates")
      .lean();
    const userIdsToExclude = followingDocument.following.map((ele) =>
      String(ele.userId)
    );
    var potentialUsers = await userModel
      .find({
        _id: {
          $nin: [...userIdsToExclude, userId],
        },
      })
      .select("_id name userName profileImage requestUpdates")
      .lean();

    const requestSent = followingDocument.requestUpdates
      .filter((ele) => (ele.type = "sent"))
      .map((ele) => ele.userIdtoWhomIsWasSent);

    potentialUsers = potentialUsers.map((ele) => {
      const findIndex = requestSent.findIndex(
        (element) => String(element) == String(ele._id)
      );
      if (findIndex >= 0) {
        ele.isUSERfollowingStatus = "REQ_SENT";
      } else {
        ele.isUSERfollowingStatus = "NOT_FOLLOWING";
      }
      return ele;
    });

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

router.get(`/YetToFollow/:search`, auth, async (req, res) => {
  const { search } = req.params;
  const { userId } = req.headers;
  try {
    const followingDocument = await userModel
      .findById(userId)
      .select("following");
    const userIdsToExclude = followingDocument.following.map((ele) =>
      String(ele.userId)
    );
    const potentialUsers = await userModel
      .find({
        $and: [
          { _id: { $nin: [...userIdsToExclude, userId] } },
          { name: new RegExp(search, "i") },
          { userName: new RegExp(search, "i") },
        ],
      })
      .select("_id name userName profileImage requestUpdates");

    if (potentialUsers && potentialUsers.length > 0) {
      res.status(200).json({
        message: "search array is non-empty",
        potentialUsers,
        endpoint: "/YetNoFollowed/:search",
      });
    } else {
      res.status(404).json({
        message: "search is empty",
        endpoint: "/YetNoFollowed/:search",
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: `${err.message}`, endpoint: "/YetNoFollowed/:search" });
  }
});

router.post(`/update`, auth, async (req, res) => {
  const { name, userName, profileImage, bio } = req.body;
  try {
    const data = await userModel.findByIdAndUpdate(
      req.headers.userId,
      {
        name,
        userName,
        profileImage,
        bio,
      },
      { new: true }
    );
    if (data) {
      res
        .status(200)
        .json({ message: `user Data Updated`, endpoint: "/update", data });
    } else {
      res
        .status(400)
        .json({ message: `user Update failed`, endpoint: "/update" });
    }
  } catch (err) {
    res.status(500).json({ message: `${err.message}`, endpoint: "/update" });
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
  console.log(`current:`, currentUserId);
  console.log(`whom to unfollow:`, userId);
  try {
    const updatedUserData = await userModel.findByIdAndUpdate(
      currentUserId,
      { $pull: { followers: { userId } } },
      { new: true }
    );
    const updatedFollowerUserData = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { following: { userId: currentUserId } } },
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
  const { userId: selfUserId } = req.headers;
  try {
    // userFetdched may or maynot be same
    let userFetched = null;
    // user who has login at the moment
    let selfUserFetched = null;
    // followers of userFetched w.r.t self : following , follow , request_sent
    let followers = null;
    // following of userFetched w.r.t self : following , follow , request_sent
    let following = null;
    userFetched = await userModel.findById(userId).lean();
    if (userId != selfUserId) {
      selfUserFetched = await userModel.findById(selfUserId).lean();

      // followers of TANAY
      followers = userFetched.followers.map((person) => {
        person = person.toObject ? person.toObject() : person;

        // CHECKING IF TANAY FOLLOWER is part of my follow list , if yes findIndex >= 0
        // if yes => i can remove him
        // if No  => i can follow him
        const findIndex = selfUserFetched.followers.findIndex(
          (userIMightBeFollowing) =>
            String(userIMightBeFollowing.userId) === String(person.userId)
        );
        // person.userIsFollowing = findIndex >= 0;

        const reqArrayToCheckIfUserHasSentFollowRequest =
          selfUserFetched.requestUpdates
            .filter((req) => (req.type = "sent"))
            .map((ele) => ele.userIdtoWhomIsWasSent);
        console.log(
          `List of user to whom req was sent by User`,
          reqArrayToCheckIfUserHasSentFollowRequest
        );
        person.userIsFollowing =
          reqArrayToCheckIfUserHasSentFollowRequest.findIndex(
            (userIdToWhomReqWasSent) => {
              console.log(
                `User Id to whom request was sent`,
                userIdToWhomReqWasSent
              );
              console.log(`Person User Id`, person.userId);
              return String(userIdToWhomReqWasSent) == String(person.userId);
            }
          ) >= 0
            ? "REQ_SENT"
            : findIndex >= 0
            ? "FOLLOWING"
            : "NOT_FOLLOWING";
        console.log(`person.userIsFollowing`, person.userIsFollowing);
        return person;
      });

      // Users Tanay is following through his account
      following = userFetched.following.map((person, index) => {
        // USER DETAILs of user whom TANAY is following
        person = person.toObject ? person.toObject() : person;

        // checking if am i following these user's
        // if yes , findIndex >=0 or else findIndex < 0
        const findIndex = selfUserFetched.following.findIndex(
          (userIMightBeFollowing) =>
            String(userIMightBeFollowing.userId) === String(person.userId)
        );

        console.log(
          `${index + 1} ==> IMP : IS KRISHNA FOLLOWING ${person.userName}:`,
          findIndex >= 0
        );

        // person.userIsFollowing = findIndex >= 0; <-- i changed this code becoz it not either
        //  Following or not following , there is a third option i might have sent them a request and the request is yet to be ansered

        // A List of userId of all those users whom i have sent Follow_req but they yet to be answered or dismissed
        const reqArrayToCheckIfUserHasSentFollowRequest =
          selfUserFetched.requestUpdates
            .filter((req) => (req.type = "sent"))
            .map((ele) => ele.userIdtoWhomIsWasSent);

        console.log(
          `${
            index + 1
          } ==> IMP: List of People Whom Request was sent by Krishna to follow`,
          reqArrayToCheckIfUserHasSentFollowRequest
        );

        person.userIsFollowing =
          reqArrayToCheckIfUserHasSentFollowRequest.findIndex(
            (userIdToWhomReqWasSent) =>
              String(userIdToWhomReqWasSent) == String(person.userId)
          ) >= 0
            ? "REQ_SENT"
            : findIndex >= 0
            ? "FOLLOWING"
            : "NOT_FOLLOWING";

        console.log(
          `${
            index + 1
          } ==> IMP: IS Krishna following/follow option/req_sent to ${
            person.userName
          }:`,
          person.userIsFollowing
        );

        return person;
      });

      userFetched.followers = followers;
      userFetched.following = following;
    }

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
    // removing following
    const updatedUser1 = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { following: { userId: FollowerUserId } } },
      { new: true }
    );
    // removing follower
    const updatedUser2 = await userModel.findByIdAndUpdate(
      FollowerUserId,
      { $pull: { followers: { userId } } },
      { new: true }
    );
    if (updatedUser1 && updatedUser2) {
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
  const {
    userId: userIdToWhomFollowRequestIsToBeSent,
    profileImageOfSender,
    profileImageOfReciever,
  } = req.body;
  try {
    const userUpdated = await userModel.findByIdAndUpdate(
      userIdToWhomFollowRequestIsToBeSent,
      {
        $addToSet: {
          requestUpdates: {
            type: "recieved",
            content: `Follow Request from  ${userName}`,
            userIdOfSender: userId,
            userIdtoWhomIsWasSent: userIdToWhomFollowRequestIsToBeSent,
            profileImage: profileImageOfSender,
            userName,
            name,
          },
        },
      },
      { new: true }
    );

    const selfuserUpdated = await userModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          requestUpdates: {
            type: "sent",
            content: `${userName} has sent you a follow request`,
            userIdOfSender: userId,
            userIdtoWhomIsWasSent: userIdToWhomFollowRequestIsToBeSent,
            profileImage: profileImageOfReciever,
          },
        },
      },
      { new: true }
    );

    if (userUpdated && selfuserUpdated) {
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

router.post(`/removefollowRequest`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  const { userId1: senderUserId, userId2: reciverUserId } = req.body;
  try {
    const userUpdated1 = await userModel.findByIdAndUpdate(
      reciverUserId,
      {
        $pull: {
          requestUpdates: {
            userIdOfSender: senderUserId,
          },
        },
      },
      { new: true }
    );

    const userUpdated2 = await userModel.findByIdAndUpdate(
      senderUserId,
      {
        $pull: {
          requestUpdates: {
            userIdtoWhomIsWasSent: reciverUserId,
          },
        },
      },
      { new: true }
    );

    if (userUpdated1 && userUpdated2) {
      res.status(200).json({
        message: "follow request successfully removed",
        endpoint: `/removefollowRequest`,
        userUpdated1,
        userUpdated2,
      });
    } else {
      res.status(400).json({
        message: "failed to remove follow request",
        endpoint: `/removefollowRequest`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `/removefollowRequest` });
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
      res.status(200).json({
        message: "successful",
        endpoint: `/filterUpdates`,
        userupdated,
      });
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
