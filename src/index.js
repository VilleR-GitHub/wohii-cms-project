const express = require('express');

const app = express();
const postsRouter = require("./routes/questions");
const prisma = require("./lib/prisma");
const PORT = process.env.PORT || 3000;

//Middleware to parse JSON bodies
app.use(express.json());
app.use("/api/questions", postsRouter);

// Default response (404) if resource not found
app.use((req,res) => {
    res.status(404).json({msg: "not found"});
})

//Server Start
app.listen(PORT, () => {
    console.log('Server is running on http://localhost:${PORT}'); 
});

// Graceful shutdown
// If server is interrupted, the database connection is prevented from entering a zombie state
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});