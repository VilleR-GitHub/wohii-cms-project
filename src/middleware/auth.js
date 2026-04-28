const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

// Read authorization header from request
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Splitting the token by space. i.e if we have "Bearer asdfg" it will be split to "Bearer" "asdfg" where bearer is 0 and asdfg 1
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

module.exports = authenticate;