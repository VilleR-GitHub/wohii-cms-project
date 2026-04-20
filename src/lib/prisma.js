// Import Prisma client library
const { PrismaClient } = require("@prisma/client");

//Initialize a new object in Prisma
const prisma = new PrismaClient();

// Export the object so it can be used from any file within app
module.exports = prisma;