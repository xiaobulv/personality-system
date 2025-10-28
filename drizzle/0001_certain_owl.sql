CREATE TABLE `analysisTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenantId` int NOT NULL,
	`candidateId` int NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `analysisTasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `analysisTasks_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`position` varchar(255),
	`sourceText` text NOT NULL,
	`sourceType` enum('text','file','chat') NOT NULL DEFAULT 'text',
	`isHired` boolean NOT NULL DEFAULT false,
	`hiredAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidates_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `quotaLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`operationType` enum('analysis','recharge','refund') NOT NULL,
	`quotaChange` int NOT NULL,
	`balanceBefore` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`relatedId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quotaLogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotaLogs_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`candidateId` int NOT NULL,
	`tenantId` int NOT NULL,
	`personalityType` varchar(50),
	`personalityDimension1` varchar(50),
	`personalityDimension2` varchar(50),
	`maturityScore` int DEFAULT 0,
	`matchScore` int DEFAULT 0,
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`riskFactors` text,
	`reportData` text NOT NULL,
	`analysisStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenantId` int NOT NULL,
	`planType` enum('free','basic','pro','enterprise') NOT NULL DEFAULT 'free',
	`quotaTotal` int NOT NULL DEFAULT 0,
	`quotaUsed` int NOT NULL DEFAULT 0,
	`status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member','readonly') NOT NULL DEFAULT 'member',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`invitedBy` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `teamMembers_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`ownerUserId` int NOT NULL,
	`status` enum('active','suspended','deleted') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;