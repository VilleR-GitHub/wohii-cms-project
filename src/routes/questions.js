const express = require('express');
const router = express.Router();

const questions = require("../data/questions");

// GET /api/questions/ , /api/questions?genre=country
router.get("/", (req, res) => {
    const {genre} = req.query;
    if (!genre) {
        return res.json(questions);
    }
    const filteredQuestions = questions.filter(p=>p.genres.includes(genre));
    res.json(filteredQuestions);
})

// GET /api/questions/:Qid
router.get("/:Qid", (req, res) => {
    const Qid = Number(req.params.Qid);
    const question = questions.find(p=>p.Qid === Qid);
    if (!question) {
        return res.status(404).json({msg: "Question not found"});
    }
    res.json(question);
});

// POST /api/questions
router.post("/", (req, res) => {
    const {question, answer, genres} = req.body;
    if (!question || !answer || !genres) {
        return res.status(400).json({msg: "A question, its answer and the genres are required"})
    }

    // Calculate, what is the next assignable ID in the list of questions for a new one
    const existingQids = questions.map(p=> p.Qid) // [1,2,3,4]
    const maxQid = Math.max(...existingQids)

    const newQuestion = {
        Qid: questions.length ? maxQid + 1 : 1,     // Assign next ID to the question, otherwise it's 1 if database empty
        question, answer,
        genres: Array.isArray(genres) ? genres: [] // Check if keywords coming from the user are an array, if they are add them, otherwise empty
    }
    //Push new question
    questions.push(newQuestion);
    res.status(201).json(newQuestion);
});

//PUT /api/posts/:postID
router.put("/:Qid", (req, res) => {
    // Get question ID, check if the question we want to modify exists
    const Qid = Number(req.params.Qid);
    const questionGet = questions.find(p=>p.Qid === Qid);
    if (!questionGet) {
        return res.status(404).json({msg: "Question not found"});
    }

    const {question, answer, genres} = req.body;
    if (!question || !answer || !genres) {
        return res.status(400).json({msg: "A question, its answer and the genres are required"})
    }

    // Modifying field by field
    questionGet.question = question;
    questionGet.answer = answer;
    questionGet.genres = Array.isArray(genres) ? genres : [];

    res.json(questionGet);

});

//DELETE /api/posts/:Qid
router.delete("/:Qid", (req, res) => {
    const Qid = Number(req.params.Qid);
    const questionIndex = questions.findIndex(p => p.Qid === Qid);

    if (Qid === -1) {
        return res.status(404).json({msg:"Question not found"});
    }
    const deletedQuestion = questions.splice(questionIndex, 1); //If deletable question exists, assign it to a const, we use a function from arrays called splice
    res.json({
        msg:"Question deleted successfully",
        question: deletedQuestion
    });
});

module.exports = router;