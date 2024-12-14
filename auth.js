const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization) {
    try {
      const decoded = jwt.verify(authorization, process.env.JWT_Password);
      req.headers.userId = decoded.userId;
      req.headers.name = decoded.name;
      req.headers.userName = decoded.userName;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token has expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(400).json({ message: "Invalid token" });
      } else {
        return res.status(500).json({ message: err.message });
      }
    }
  } else {
    return res.status(400).json({ message: "No Authorization Token" });
  }
};

module.exports = auth;
