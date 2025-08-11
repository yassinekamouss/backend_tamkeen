const asyncHandler = require("../utils/asyncHandler");

exports.getHelloNews = asyncHandler(async (req, res) => {
  res.json({ message: "helloNews" });
});
