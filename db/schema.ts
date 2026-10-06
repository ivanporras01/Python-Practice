import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const students = sqliteTable('students', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull(),
  role: text('role').notNull().default('student'), joinedAt: integer('joined_at').notNull(),
  lastSeen: integer('last_seen').notNull(), currentTopic: text('current_topic'),
});
export const attempts = sqliteTable('attempts', {
  id: text('id').primaryKey(), studentId: text('student_id').notNull().references(()=>students.id),
  exerciseId: text('exercise_id').notNull(), topicId: text('topic_id').notNull(),
  code: text('code').notNull(), output: text('output').notNull(), error: text('error'),
  passed: integer('passed').notNull(), createdAt: integer('created_at').notNull(),
}, t => [index('idx_attempts_student_created').on(t.studentId,t.createdAt)]);
export const progress = sqliteTable('progress', {
  studentId: text('student_id').notNull().references(()=>students.id), exerciseId: text('exercise_id').notNull(),
  topicId: text('topic_id').notNull(), passed: integer('passed').notNull().default(0),
  attempts: integer('attempts').notNull().default(0), code: text('code').notNull(),
  updatedAt: integer('updated_at').notNull(),
},t=>[primaryKey({columns:[t.studentId,t.exerciseId]})]);
