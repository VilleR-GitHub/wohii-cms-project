const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const seedQuestions = [
  {
    Qid: 1,
    question: "What is the Northernmost village of both Finland and the European Union?",
    answer: "Nuorgam",
    genres: ["country", "geography"]
  },
  {
    Qid: 2,
    question: "What is 3 times 4?",
    answer: "12",
    genres: ["math", "calculation"]
  },
  {
    Qid: 3,
    question: "Who was Finland's president between the years 1956 to 1982? Last Name only.",
    answer: "Kekkonen",
    genres: ["politics", "people"]
  },
  {
    Qid: 4,
    question: "What is the only word with the letter 'Å' modern finnish lexicon?",
    answer: "Ångström",
    genres: ["language", "country"]
  }
];

async function main() {
  await prisma.question.deleteMany();
  await prisma.genre.deleteMany();

  for (const question of seedQuestions) {
    await prisma.question.create({
      data: {
        question: question.question,
        answer: question.answer,
        genres: {
          connectOrCreate: question.genres.map((gnr) => ({
            where: { category: gnr },
            create: { category: gnr },
          })),
        },
      },
    });
  }

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());