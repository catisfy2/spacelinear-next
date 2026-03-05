Project Structure Overview
The app is a spaced repetition learning tool (like a personal Anki) called SpaceLinear. It uses React + Vite, Zustand for state, Supabase as the backend, and React Router for navigation.
Pages (src/pages/)
File	Route	Purpose
Today.tsx	/today	Flash-card review session for due topics
Topics.tsx	/topics	List all topics grouped by state
Topic.tsx	/topics/:id	Single topic view with notes + resources
Pulse.tsx	/pulse	Analytics dashboard
Subjects.tsx	/subjects	Subject list
Subject.tsx	/subjects/:id	Single subject view
Settings.tsx	/settings	User settings
Auth.tsx	/auth	Auth page
Components (src/components/)
shell/AppShell.tsx — layout wrapper with sidebar
topics/TopicDetailPanel.tsx — slide-in panel with review history + quick review
topics/TopicNoteEditor.tsx — rich text editor (Yoopta) for topic notes
topics/TopicResources.tsx — resource links/attachments per topic
topics/CreateTopicModal.tsx — new topic form
subjects/CreateSubjectModal.tsx — new subject form
src/lib/types.ts — Full Content
types.ts
Lines 1-60
export type TopicState = 'new' | 'learning' | 'reviewing' | 'relearning';export type Difficulty = 'relearn' | 'hard' | 'medium' | 'easy';export interface Subject { ... }export interface Topic { ... }           // SRS fields: state, easeFactor, streak, nextReviewDate, etc.export interface ReviewHistoryEntry { ... }export interface ReviewResult { ... }export interface Resource { ... }
Key types:
TopicState: 'new' | 'learning' | 'reviewing' | 'relearning'
Difficulty: 'relearn' | 'hard' | 'medium' | 'easy'
Topic has full SRS fields: state, nextReviewDate, currentIntervalDays, easeFactor, totalReviews, correctReviews, streak, currentDifficulty, firstReviewedAt, lastReviewedAt
ReviewHistoryEntry captures each review event with before/after intervals and ease factor
src/store/useStore.ts — Full Content
Zustand store with these state slices and actions:
State:
subjects, topics, reviewHistory, resources
sidebarCollapsed, selectedSidebarTopicId, loading
Key actions:
fetchAll(userId) — loads subjects, topics, review_history from Supabase in parallel
addSubject / addTopic — insert to DB and update local state
submitReview(topicId, difficulty, userId) — calls processReview() from the algorithm, writes updated topic + new history row to Supabase, updates local state
getDueTopics() — filters topics where nextReviewDate < tomorrow, sorted by state priority (relearning first)
getSubjectDueCount(subjectId) — count of due topics per subject
deleteTopic / deleteSubject — cascading deletes
updateTopic / updateSubject — partial patch to DB
fetchResources / addResource / deleteResource
src/App.tsx — Full Content
App.tsx
Lines 1-101
// Routes:// /auth        → AuthPage// /today       → TodayPage       (review session)// /topics      → TopicsPage      (topic list)// /topics/:id  → TopicPage       (single topic)// /pulse       → PulsePage       (analytics)// /subjects    → SubjectsPage// /subjects/:id → SubjectPage// /settings    → SettingsPage
Uses a DataLoader component that calls fetchAll when user logs in and clear on logout. ProtectedRoute redirects unauthenticated users to /auth.
src/pages/Topics.tsx — Full Content
Groups topics by state (relearning → learning → new → reviewing) using StatusGroup component
Tabs: all | active | backlog (active = due within 7 days, backlog = due 30+ days out)
Subject filter chip
Each topic row shows: title, subject icon/name, next review date, streak flame, and a PanelRight button to open TopicDetailPanel
Topic title is a <Link> to /topics/:id
+Subject and +Topic buttons open creation modals
src/pages/Pulse.tsx — Full Content (Analytics Dashboard)
Computed stats from store data:
Metric	Logic
Due Now	topics where nextReviewDate <= now
Total Reviews	reviewHistory.length
30d Retention	% of reviews in last 30 days rated medium or easy
Best Streak	max topic.streak across all topics
Topics by State	stacked bar chart of new/learning/reviewing/relearning counts
Subject Mastery	per-subject: (topics with currentDifficulty === 'easy') / total topics * 100
Topic Review Tracking Logic (src/lib/algorithm.ts)
The SRS algorithm has two phases:
Learning phase (new, learning, relearning):
Steps: [1, 3, 7] days
relearn → reset to 1 day, correct_reviews = 0
hard → repeat last completed step
medium/easy → advance through steps; graduates to reviewing after 3 correct reviews (interval becomes 14 days)
Review phase (reviewing):
relearn → drops back to relearning, 1-day interval
easy → interval = round(current * ease * 1.3)
medium → interval = round(current * ease)
hard → interval = round(current * 1.2)
Ease factor adjustments: relearn -0.2, hard -0.15, medium 0, easy +0.15, clamped to [1.3, 3.0]
processReview(topic, difficulty) — the main entry point called from the store:
Computes calculateLinearIntervals for the UI preview
Uses linear interval scheduling (not the SM-2 result) for actual nextReviewDate
Updates: state, currentDifficulty, nextReviewDate, currentIntervalDays, easeFactor, totalReviews (resets to 0 on relearn), correctReviews, streak (resets on relearn/hard)
Returns { updatedTopic, historyEntry } — both written to Supabase by submitReview