ALTER TABLE `employees` ADD `salary` int;--> statement-breakpoint
ALTER TABLE `employees` ADD `hierarchyLevel` enum('diretoria','gerencia','coordenacao','supervisao','operacional');--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `performanceRating` enum('baixo','medio','alto','excepcional');--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `potentialRating` enum('baixo','medio','alto','excepcional');--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `nineBoxPosition` varchar(100);--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `gapAnalysis` text;--> statement-breakpoint
ALTER TABLE `successionCandidates` ADD `developmentActions` text;