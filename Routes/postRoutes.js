const express = require(`express`);
const router = express.Router();
const { userModel } = require("../models/user.model");
const { postModel } = require("../models/post.model");
const { bookmarkModel } = require(`../models/bookmarks.model`);

const auth = require("../auth");
const { getConstantValue } = require("typescript");

// FETCH POSTS FOR THE USER , WHO IS SIGNED-IN AT THE MOMENT
// checking if the the user added a like & bookmark or not
router.get(`/posts`, auth, async (req, res) => {
  const currentUserId = req.headers.userId;
  try {
    const usersFollowing = await userModel
      .findById(currentUserId)
      .select("following")
      .lean();
    const usersFollowingIds = usersFollowing.following.map((ele) => ele.userId);
    const posts = await postModel
      .find({ userId: { $in: usersFollowingIds } })
      .lean();

    const bookmarks = await bookmarkModel
      .findOne({ userId: currentUserId })
      .lean();
    console.log(bookmarks);

    // this updated posts array contains userLiked/userBookmark
    const updatedPostsArray = posts.map((post) => {
      post.userLiked = post.likes.find(
        (userId) => String(userId) == String(currentUserId)
      )
        ? true
        : false;

      post.userBookmark = bookmarks.bookmarks.find(
        (userId) => String(userId) == String(post._id)
      )
        ? true
        : false;

      return post;
    });

    console.log(updatedPostsArray);
    console.log(`------------------------------------->`);

    if (posts && posts.length > 0) {
      res.status(200).json({
        message: "posts fetched",
        endpoint: "/posts",
        updatedPostsArray,
      });
    } else {
      res
        .status(400)
        .json({ usersFollowingIds, message: "No Posts", endpoint: "/posts" });
    }
  } catch (error) {
    res.status(500).json({ message: `${error.message}`, endpoint: ` /posts` });
  }
});

// Fetch Posts OF the USER

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

router.post(`/isLikedOrNot`, auth, async (req, res) => {
  const { postId } = req.body;
  const { userId } = req.headers;
  try {
    const likedOrNot = await postModel.findOne({
      _id: postId,
      likes: userId,
    });
    if (likedOrNot) {
      return res.status(200).json({ message: true, endpoint: `/isLikedOrNot` });
    } else {
      return res
        .status(200)
        .json({ message: false, endpoint: `/isLikedOrNot` });
    }
  } catch (error) {
    res.status(500).json({
      message: `${error.message}`,
      endpoint: `/isLikedOrNot`,
    });
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
  const { userId, name, userName } = req.headers;
  const { content, images } = req.body;
  try {
    const newPost = new postModel({ userId, userName, content, images });
    const newPostCreated = await newPost.save();
    if (newPostCreated) {
      res.status(201).json({
        message: "New Post is Created",
        newPostCreated,
        endpoint: ` /addPost`,
      });
    } else {
      res.status(400).json({
        message: "New Post creation Failed",
        endpoint: ` /addPost`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: ` /addPost` });
  }
});

router.post(`/updatePost`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  const { content, images, postId } = req.body;
  try {
    const updatedPost = await postModel.findByIdAndUpdate(
      postId,
      { $set: { content, images } },
      { new: true }
    );
    if (updatedPost) {
      res.status(200).json({
        message: "Post Updated Successfully",
        updatedPost,
        endpoint: ` /updatePost`,
      });
    } else {
      res.status(400).json({
        message: "Post Update Failed",
        updatedPost,
        endpoint: ` /updatePost`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: ` /updatePost` });
  }
});

router.delete(`/removePost/:id`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  const postId = req.params.id;
  try {
    const deletedPost = await postModel.findByIdAndDelete(postId);
    if (deletedPost) {
      res.status(200).json({
        message: "successfully deleted",
        deletedPost,
        endpoint: `/removePost/:id`,
      });
    } else {
      res
        .status(400)
        .json({ message: "failed to delete", endpoint: `/removePost/:id` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `/removePost/:id` });
  }
});

router.get(`/fetchPosts/:id`, auth, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.headers.userId;
  const bookmarks = await bookmarkModel.findOne({ userId: id });
  try {
    var posts = await postModel.find({ userId: id }).lean();
    if (posts && posts.length > 0) {
      posts = posts.map((post) => {
        post.userBookmark = bookmarks?.bookmarks.find(
          (IdOfPost) => String(IdOfPost) == String(post._id)
        )
          ? true
          : false;

        post.userLiked = post.likes.find(
          (userIdOfLiker) => userIdOfLiker == currentUserId
        )
          ? true
          : false;

        return post;
      });
      res.status(200).json({
        message: "Posts fetches",
        userId: id,
        endpoint: "/fetchPost/:id",
        posts,
      });
    } else {
      res.status(400).json({
        message: "Posts fetches",
        userId: id,
        endpoint: "/fetchPost/:id",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: "/fetchPost/:id" });
  }
});

module.exports = router;
