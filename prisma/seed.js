const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
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
    genres: ["math"]
  },
  {
    Qid: 3,
    question: "Who was Finland's president between the years 1956 to 1982? Last Name only.",
    answer: "Kekkonen",
    genres: ["politics", "people"]
  },
  {
    Qid: 4,
    question: "What is the only word with the letter 'Å' within the modern finnish lexicon?",
    answer: "Ångström",
    genres: ["language", "country"]
  }
];

async function main() {
  await prisma.question.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.user.deleteMany();

  // Creating a hashed password
  const hashedPassword = await bcrypt.hash("1234", 10);

  // Create a default user
  const user = await prisma.user.create({
    data: {
      email: "example@example.org",
      password: hashedPassword,
      name: "Example user"
    }
  });

  for (const question of seedQuestions) {
    await prisma.question.create({
      data: {
        question: question.question,
        answer: question.answer,
        userId: user.id,
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