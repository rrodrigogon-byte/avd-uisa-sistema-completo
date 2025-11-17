CREATE TABLE `psychometricTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`testType` enum('disc','bigfive') NOT NULL,
	`completedAt` datetime NOT NULL,
	`discDominance` int,
	`discInfluence` int,
	`discSteadiness` int,
	`discCompliance` int,
	`discProfile` varchar(10),
	`bigFiveOpenness` int,
	`bigFiveConscientiousness` int,
	`bigFiveExtraversion` int,
	`bigFiveAgreeableness` int,
	`bigFiveNeuroticism` int,
	`responses` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `psychometricTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testType` enum('disc','bigfive') NOT NULL,
	`questionNumber` int NOT NULL,
	`questionText` text NOT NULL,
	`dimension` varchar(50) NOT NULL,
	`reverse` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testQuestions_id` PRIMARY KEY(`id`)
);
