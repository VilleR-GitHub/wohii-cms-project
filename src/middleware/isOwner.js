const prisma = require("../lib/prisma");

// Look up question by ID from URL
async function isOwner (req, res, next) {
    const Qid = Number(req.params.Qid);
    const question = await prisma.question.findUnique({
      where: { Qid },
      include: { genres: true },
    });

    // If question does not exist, return a 404
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Compare question.userId & req.user.userId. Return 403 if no match
    if (question.userId !== req.user.userId) {
      return res.status(403).json({ error: "You can only modify your own questions!" });
    }

    // Attach the record to the request so the route handler can reuse it
    req.question = question;
    next();
  
}

module.exports = isOwner;