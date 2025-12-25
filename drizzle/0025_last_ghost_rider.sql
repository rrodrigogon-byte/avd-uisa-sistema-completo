CREATE TABLE `employeeHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`changeType` enum('cargo','departamento','salario','gestor','status','dados_pessoais','contratacao','desligamento','promocao','transferencia','outro') NOT NULL,
	`fieldName` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`reason` text,
	`notes` text,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	CONSTRAINT `employeeHistory_id` PRIMARY KEY(`id`)
);
