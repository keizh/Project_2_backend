const express = require(`express`);
const router = express.Router();
const { userModel } = require("../models/user.model");
const { postModel } = require("../models/post.model");
const auth = require("../auth");

// FETCH POSTS FOR THE USER , WHO IS SIGNED-IN AT THE MOMENT
router.get(`/posts`, auth, async (req, res) => {
  const currentUserId = req.headers.userId;
  try {
    const usersFollowing = await userModel
      .findById(currentUserId)
      .select("following");
    const usersFollowingIds = usersFollowing.following.map((ele) => ele.userId);
    const posts = await postModel.find({ userId: { $in: usersFollowingIds } });
    if (posts && posts.length > 0) {
      res
        .status(200)
        .json({ message: "posts fetched", endpoint: "/posts", posts });
    } else {
      res.status(400).json({ message: "No Posts", endpoint: "/posts" });
    }
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /posts` });
  }
});

// Like a post
router.post(`/like`, auth, async (req, res) => {
  const currentUserId = req.headers.userId;
  const { postId } = req.body;
  try {
    const postUpdatedAfterLike = await postModel.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: currentUserId } },
      { new: true }
    );
    if (postUpdatedAfterLike) {
      res.status(200).json({
        message: `successfully liked`,
        endpoint: ` /like`,
        postUpdatedAfterLike,
      });
    } else {
      res.status(404).json({ message: `Failed to like`, endpoint: ` /like` });
    }
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /like` });
  }
});

router.post(`/unlike`, auth, async (req, res) => {
  const currentUserId = req.headers.userId;
  const { postId } = req.body;
  try {
    const postUpdatedAfterLike = await postModel.findByIdAndUpdate(
      postId,
      { $pull: { likes: currentUserId } },
      { new: true }
    );
    if (postUpdatedAfterLike) {
      res.status(200).json({
        message: `successfully unliked`,
        endpoint: ` /unlike`,
        postUpdatedAfterLike,
      });
    } else {
      res
        .status(404)
        .json({ message: `Failed to unlike`, endpoint: ` /unlike` });
    }
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /unlike` });
  }
});

module.exports = router;
