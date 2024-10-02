const { jwtDecode } = require("jwt-decode");

const auth = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    try {
      const decoded = jwtDecode(authorization);
      if (decoded.exp > Date.now() / 1000) {
        req.headers.userId = decoded.userId;
        req.headers.name = decoded.name;
        req.headers.userName = decoded.userName;
        next();
      } else {
        res.status(400).json({ message: "Authorization Token expired" });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid Authorization Token" });
    }
  } else {
    res.status(400).json({ message: "No Authorization Token" });
  }
};

module.exports = auth;
