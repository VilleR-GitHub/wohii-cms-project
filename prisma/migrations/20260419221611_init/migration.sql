-- CreateTable
CREATE TABLE `questions` (
    `Qid` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(255) NOT NULL,
    `answer` TEXT NOT NULL,

    PRIMARY KEY (`Qid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genres` (
    `Qid` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `genres_category_key`(`category`),
    PRIMARY KEY (`Qid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_GenreToQuestion` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_GenreToQuestion_AB_unique`(`A`, `B`),
    INDEX `_GenreToQuestion_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_GenreToQuestion` ADD CONSTRAINT `_GenreToQuestion_A_fkey` FOREIGN KEY (`A`) REFERENCES `genres`(`Qid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_GenreToQuestion` ADD CONSTRAINT `_GenreToQuestion_B_fkey` FOREIGN KEY (`B`) REFERENCES `questions`(`Qid`) ON DELETE CASCADE ON UPDATE CASCADE;
