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

// unLike a post
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

router.post(`/addComment`, auth, async (req, res) => {
  const { content, postId } = req.body;
  const { name, userName, userId } = req.headers;
  try {
    const post = await postModel.findByIdAndUpdate(
      postId,
      { $addToSet: { comments: { userId, userName, content } } },
      { new: true }
    );
    if (post) {
      res.status(200).json({
        message: "Comment has been added to the post",
        post,
        endpoint: ` /addComment`,
      });
    } else {
      res.status(400).json({
        message:
          "Failed to added comment , possible reason could not find the post",
        endpoint: ` /addComment`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: ` /addComment` });
  }
});

router.post(`/removeCommentCommentOwner`, auth, async (req, res) => {
  const { postId, commentId } = req.body;
  const { name, userName, userId } = req.headers;
  try {
    // Person responsible for that comment can only delete them
    const post = await postModel.findByIdAndUpdate(
      postId,
      { $pull: { comments: { commentId, userId } } },
      { new: true }
    );
    if (post) {
      res.status(200).json({
        message: "comment successfully deleted",
        endpoint: `/removeCommentCommentOwner`,
      });
    } else {
      res.status(400).json({
        message: "failed to delete comment",
        reason: "Cannot delete other comment",
        endpoint: `/removeCommentCommentOwner`,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `${error.message}`,
      endpoint: `/removeCommentCommentOwner`,
    });
  }
});

// ONLY THE OWNER OF THE POST WILL GET THIS FEATURE
router.post(`/removeCommentPostOwner`, auth, async (req, res) => {
  const { postId, commentId } = req.body;
  const { name, userName, userId } = req.headers;
  try {
    // Post Owner can delete any comment
    const post = await postModel.findByIdAndUpdate(
      postId,
      { $pull: { comments: { commentId } } },
      { new: true }
    );
    if (post) {
      res.status(200).json({
        message: "comment successfully deleted",
        endpoint: `/removeCommentPostOwner`,
      });
    } else {
      res.status(400).json({
        message: "failed to delete comment",
        reason: "Cannot delete other comment",
        endpoint: `/removeCommentPostOwner`,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `${error.message}`,
      endpoint: `/removeCommentPostOwner`,
    });
  }
});

router.post(`/addPost`, auth, async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /unlike` });
  }
});

router.post(`/updatePost`, auth, async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /unlike` });
  }
});

router.post(`/removePost`, auth, async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /unlike` });
  }
});

router.post(`/addBookMart`, auth, async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /unlike` });
  }
});

router.post(`/removeBookMark`, auth, async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /unlike` });
  }
});

router.get(`/bookmarks`, auth, async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /unlike` });
  }
});

module.exports = router;
