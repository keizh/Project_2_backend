const { Schema, model } = require(`mongoose`);

const bookmarkSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  bookmarks: [{ type: Schema.Types.ObjectId, ref: "post" }],
});

const bookmarkModel = model("bookmark", bookmarkSchema);

module.exports = { bookmarkModel };
