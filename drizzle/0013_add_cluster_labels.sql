CREATE TABLE `cluster_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`cluster_hash` text NOT NULL,
	`label` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cluster_labels_cluster_hash_unique` ON `cluster_labels` (`cluster_hash`);