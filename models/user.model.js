const mongoose = require(`mongoose`);
const { Schema, model } = mongoose;

const followUserSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

const bookmarkSchema = new Schema(
  {
    postImage: {
      type: String,
      required: true,
    },
    postUserName: {
      type: String,
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    postContent: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      default:
        "New to Hashtag, exploring and connecting with the world! Let's stay connected and discover together.",
    },
    profileImage: {
      type: String,
      default: `https://placehold.co/600x400?text=user`,
    },
    following: [followUserSchema],
    followers: [followUserSchema],
    bookmarks: [bookmarkSchema],
    createdOn: {
      type: String,
      default: `${new Date().getDate()} / ${
        new Date().getMonth() + 1
      } / ${new Date().getFullYear()} `,
    },
    updates: [String],
  },
  { timestamps: true }
);

const userModel = model("user", userSchema);

module.exports = { userModel };
