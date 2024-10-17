const router = require(`express`).Router();
const auth = require("../auth");
const { bookmarkModel } = require(`../models/bookmarks.model`);
const { postModel } = require(`../models/post.model`);
router.post(`/addBookmark`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  const { postId } = req.body;
  try {
    // Find the user and add the postId to their bookmarks array
    const bookMarkAdded = await bookmarkModel.findOneAndUpdate(
      { userId },
      { $addToSet: { bookmarks: postId } },
      { new: true }
    );

    // If a bookmark is successfully added
    if (bookMarkAdded) {
      res.status(200).json({
        message: "Post has been added to bookmarks",
        bookMarkAdded,
        endpoint: `/addBookmark`,
      });
    } else {
      res.status(400).json({
        message: "Failed to add post to bookmarks. User or post may not exist.",
        endpoint: `/addBookmark`,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `${error.message}`,
      endpoint: `/addBookmark`,
    });
  }
});

// the below route is for checking if
router.post(`/checking`, auth, async (req, res) => {
  const { userId } = req.headers;
  const { postId } = req.body;
  try {
    const checked = await bookmarkModel.findOne({ userId, bookmarks: postId });
    if (checked) {
      return res
        .status(200)
        .json({ message: true, checked, endpoint: `/checking` });
    } else {
      return res
        .status(200)
        .json({ message: false, checked, endpoint: `/checking` });
    }
  } catch (error) {
    res.status(500).json({
      message: `${error.message}`,
      endpoint: `/checking`,
    });
  }
});

router.delete(`/removeBookMark/:id`, auth, async (req, res) => {
  const { userId, name, userName } = req.headers;
  const postId = req.params.id;
  try {
    const deletedPost = await bookmarkModel.findOneAndUpdate(
      { userId },
      { $pull: { bookmarks: postId } },
      { new: true }
    );
    if (deletedPost) {
      res.status(200).json({
        message: "Successfully removed",
        deletedPost,
        endpoint: `/removeBookMark/:id`,
      });
    } else {
      res.status(400).json({
        message: "Failed to removed",
        endpoint: `/removeBookMark/:id`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `${error.message}`, endpoint: `/removeBookMark/:id` });
  }
});

// FETCHING BOOKMARKS USING userId
router.get(`/BookMarks/:id`, auth, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.headers.userId;
  try {
    const bookmark = await bookmarkModel.findOne({ userId: id }).lean();

    if (bookmark?.bookmarks.length == 0) {
      res.status(200).json({
        message: "No Bookmarks",
        arrayEmpty: true,
        apiEndPoint: "/BookMarks/:id",
        userId: id,
      });
    } else {
      var posts = await postModel
        .find({
          _id: { $in: [...bookmark?.bookmarks] },
        })
        .lean();
      posts = posts.map((post) => {
        post.userBookmark = true;

        post.userLiked = post.likes.find(
          (userIdOfLiker) => userIdOfLiker == currentUserId
        )
          ? true
          : false;

        return post;
      });

      console.log(posts);
      res.status(200).json({
        message: "Bookmarks Fetched",
        arrayEmpty: false,
        apiEndPoint: "/BookMarks/:id",
        posts,
        userId: id,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `${error.message}`,
      endpoint: "/BookMarks/:id",
    });
  }
});
module.exports = router;
