const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require('../middleware/auth');
const multer = require("multer");
const path = require("path");

// For image uploading
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

// Non-image uploads are rejected, image max size is 5MB
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Import isOwner, additional middleware for PUT & DELETE to check if user is owner of question they want to update/remove
const isOwner = require("../middleware/isOwner");

// Format the appearance of questions:
// - Questions' genres' IDs are bit visible
// - Extract only the question's owner's name string and remove the full user object from the response
function formatQuestion(question) {
  return {
    ...question,
    genres: question.genres.map((g) => g.category),
    userName: question.user?.name || null,
    attempted: question.attempts ? question.attempts.length > 0 : false,
    attemptCount: question?._count?.attempts || 0,
    user: undefined,
    _count: undefined,
    attempts: undefined

  };
}

// Adding general middleware, all roles here are protected by authentication
router.use(authenticate);


// GET /api/questions/ , /api/questions?genre=country&page=1&limit=5
router.get("/", async (req, res) => {
    const {genre} = req.query;

    const where = genre ?
    { genres: { some: { category: genre } } }: {};

    // safeguard to avoid negative pages, pages that are not a number or very large page number requests (i.e user asks for page 1000)
    const page = Math.max(1, parseInt(req.query.page) || 1);

    // Default page limit
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));

    // How many records to skip (i.e if 10 questions per page and user is on page 3, then skip first 20 questions)
    const skip = (page - 1) * limit;

    const [filteredQuestions, total] = await Promise.all([prisma.question.findMany({
        where,
        include: {
            genres: true,
            user: true,
            attempts: {where: {userId: req.user.userId}, take: 1},      // Has the user attempted the question?
            _count: { select: {attempts: true}}                         // How many users have attempted the question overall? Count with SQL rather than JS
        },
        orderBy: {Qid: "asc" },
        skip,
        take: limit
    }), prisma.question.count({where})]);

    res.json({
        data: filteredQuestions.map(formatQuestion),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),       //Number of total pages that there are, useful for frontend. Math ceiling to round up to next integer
    })
});



// GET /api/questions/:Qid
router.get("/:Qid", async (req, res) => {
    const Qid = Number(req.params.Qid);

    const question = await prisma.question.findUnique({
        where: { Qid: Qid },
        include: {
            genres: true,
            user: true,
        },
    });

    if (!question) {
        return res.status(404).json({msg: "Question not found"});
    }
    res.json(formatQuestion(question));
});



// POST /api/questions
router.post("/", upload.single("image"), async (req, res) => {
    const {question, answer, genres} = req.body;
    if (!question || !answer || !genres) {
        return res.status(400).json({msg: "A question, its answer and the genres are required"})
    }

    const genresArray = (genres ? genres : []).split(",").map((g) => g.trim());
    const imageUrl = req.file ? `/uploads/${req.file.filename}`:null;

    const newQuestion = await prisma.question.create({
        data: {
            question, answer, imageUrl,
            userId: req.user.userId,
            genres: {
                connectOrCreate: genresArray.map((gnr) => ({
                where: { category: gnr }, create: { category: gnr },
            })), },
        },
        include: { genres: true, user: true },
  });


    res.status(201).json(formatQuestion(newQuestion));
});



//PUT /api/questions/:Qid
router.put("/:Qid", isOwner, upload.single("image"), async (req, res) => {
    // Get question ID, check if the question we want to modify exists
    const Qid = Number(req.params.Qid);
    const {question, answer, genres} = req.body;
    const questionGet = await prisma.question.findUnique({ where: { Qid: Qid } } );
    if (!questionGet) {
        return res.status(404).json({msg: "Question not found"});
    }

    if (!question || !answer || !genres) {
        return res.status(400).json({msg: "A question, its answer and the genres are required"})
    }

    // PUT overwrites image if new file uploaded, otherwise keep old one
    const imageUrl = req.file ? `/uploads/${req.file.filename}`:null;

    const genresArray = genres.split(",").map((g) => g.trim()).filter(Boolean);

    // Use update for the question with specific ID, new data is what's given
    const updatedQuestion = await prisma.question.update({
    where: { Qid: Qid },
    data: {
      question, answer, imageUrl,
      genres: {
        set: [],
        connectOrCreate: genresArray.map((gnr) => ({
          where: { category: gnr },
          create: { category: gnr },
        })),
      },
    },
    include: {
        genres: true,
        user: true,
        attempts: { where: { userId: req.user.userId }, take: 1 },
        _count: { select: { attempts: true } },
    },
  });
    res.json(formatQuestion(updatedQuestion));
});



//DELETE /api/questions/:Qid
router.delete("/:Qid", isOwner, async (req, res) => {
    const Qid = Number(req.params.Qid);
    const question = await prisma.question.findUnique({
        where: { Qid: Qid },
        include: { genres: true, user: true },
    });
    if (Qid === -1) {
    return res.status(404).json({msg:"Question not found"});
    }
    await prisma.question.delete({where: { Qid: Qid } });
    
    res.json({
        msg:"Question deleted successfully",
        //question: formatQuestion(question)
        question: question
    });
});

// POST /api/questions/:Qid/play
router.post("/:Qid/play", async (req, res) => {

    // Check if the question exists
    const Qid = Number(req.params.Qid);
    const question = await prisma.question.findUnique({ where: { Qid : Qid } });
    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }


});

// POST /api/questions/:Qid/attempt
router.post("/:Qid/attempt", async (req, res) => {

    // Check if the question exists
    const Qid = Number(req.params.Qid);
    const question = await prisma.question.findUnique({ where: { Qid : Qid } });
    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }

    // Create new entry in the attempts table if it doesn't exist already, a question can be attempted only once
    const attempt = await prisma.attempt.upsert({                               // upsert = Inserted or updated
        where: { userId_Qid: { userId: req.user.userId, Qid } },
        update: {},
        create: { userId: req.user.userId, Qid },
    });

    // Try to get the updated attempt count and return that
    const attemptCount = await prisma.attempt.count({ where: { Qid } });
    res.status(201).json({
        id: attempt.id,
        Qid,
        correct: req.body.answer.trim().toLowerCase() === question.answer.trim().toLowerCase(),
        attempted: true,
        attemptCount,
        attemptedAt: attempt.attemptedAt,
    });
});

// DELETE /api/questions/:Qid/attempt
router.delete("/:Qid/attempt", async (req, res) => {

    // Check if the question exists
    const Qid = Number(req.params.Qid);
    const question = await prisma.question.findUnique({ where: { Qid: Qid } });
    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }

    const attempt = await prisma.attempt.deleteMany({
        where: { userId: req.user.userId, Qid },
    });

    // Try to get the updated attempt count and return that
    const attemptCount = await prisma.attempt.count({ where: { Qid } });
    res.json({
        Qid,
        attempted: false,
        attemptCount
    });
});


module.exports = router;