CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`code` text NOT NULL,
	`output` text NOT NULL,
	`error` text,
	`passed` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_student_created` ON `attempts` (`student_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `progress` (
	`student_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`passed` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`code` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`student_id`, `exercise_id`),
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'student' NOT NULL,
	`joined_at` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`current_topic` text
);
