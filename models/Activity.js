const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "test_submitted",
        "user_updated",
        "program_created",
        "program_updated",
        "program_toggled",
        "program_deleted",
        "news_created",
        "news_updated",
        "news_deleted",
      ],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entity: {
      kind: { type: String, required: true }, // 'test' | 'user' | 'program' | 'news'
      id: { type: String, required: true },
    },
    meta: { type: Object, default: {} },
    actor: {
      id: { type: String },
      username: { type: String },
    },
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Activity", ActivitySchema);
