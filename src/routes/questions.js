const express = require('express');
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require('../middleware/auth');

// Import isOwner, additional middleware for PUT & DELETE to check if user is owner of question they want to update/remove
const isOwner = require("../middleware/isOwner");

// Format the appearance of questions' list of genres so that their own ID is not visible on the page. Looks nicer
function formatQuestion(question) {
  return {
    ...question,
    genres: question.genres.map((g) => g.category),
  };
}

// Adding general middleware, all roles here are protected by authentication
router.use(authenticate);


// GET /api/questions/ , /api/questions?genre=country
router.get("/", async (req, res) => {
    const {genre} = req.query;

    const where = genre ?
    { genres: { some: { category: genre } } }: {};

    const filteredQuestions = await prisma.question.findMany({
        where,
        include: {genres: true},
        orderBy: {Qid: "asc" }
});

    res.json(filteredQuestions.map(formatQuestion));
});

// GET /api/questions/:Qid
router.get("/:Qid", async (req, res) => {
    const Qid = Number(req.params.Qid);

    const question = await prisma.question.findUnique({
        where: { Qid: Qid },
        include: { genres: true },
    });

    if (!question) {
        return res.status(404).json({msg: "Question not found"});
    }
    res.json(formatQuestion(question));
});

// POST /api/questions
router.post("/", async (req, res) => {
    const {question, answer, genres} = req.body;
    if (!question || !answer || !genres) {
        return res.status(400).json({msg: "A question, its answer and the genres are required"})
    }

    const genresArray = Array.isArray(genres) ? genres : [];

    const newQuestion = await prisma.question.create({
        data: {
            question, answer,
            userId: req.user.userId,
            genres: {
                connectOrCreate: genresArray.map((gnr) => ({
                where: { category: gnr }, create: { category: gnr },
            })), },
        },
        include: { genres: true },
  });


    res.status(201).json(formatQuestion(newQuestion));
});

//PUT /api/questions/:QID
router.put("/:Qid", isOwner, async (req, res) => {
    // Get question ID, check if the question we want to modify exists
    const Qid = Number(req.params.Qid);
    const questionGet = await prisma.question.findUnique({ where: { Qid: Qid } } );
    if (!questionGet) {
        return res.status(404).json({msg: "Question not found"});
    }

    const {question, answer, genres} = req.body;

    if (!question || !answer || !genres) {
        return res.status(400).json({msg: "A question, its answer and the genres are required"})
    }


    const genresArray = Array.isArray(genres) ? genres : [];

    // Use update for the question with specific ID, new data is what's given
    const updatedQuestion = await prisma.question.update({
    where: { Qid: Qid },
    data: {
      question, answer,
      genres: {
        set: [],
        connectOrCreate: genresArray.map((gnr) => ({
          where: { category: gnr },
          create: { category: gnr },
        })),
      },
    },
    include: { genres: true },
  });

    res.json(formatQuestion(questionGet));
});

//DELETE /api/questions/:Qid
router.delete("/:Qid", isOwner, async (req, res) => {
    const Qid = Number(req.params.Qid);
    const question = await prisma.question.findUnique({
        where: { id: Qid },
        include: { genres: true },
    });
    if (Qid === -1) {
    return res.status(404).json({msg:"Question not found"});
    }
    await prisma.question.delete({where: { Qid: Qid } });
    
    res.json({
        msg:"Question deleted successfully",
        question: formatQuestion(question),
    });
});

module.exports = router;