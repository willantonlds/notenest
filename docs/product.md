# Product

## What NoteNest is
A notetaking web app for university students. A member signs up, logs in, and creates, edits, deletes, tags, searches, and groups notes by course, and shares selected notes to a public study feed. A moderator hides or restores public notes to keep the feed safe.

## User types
- Visitor: not logged in; can register and log in only.
- Member: a registered student; owns private notes; publishes to and browses the public feed.
- Moderator: a Member with the extra right to hide and restore public notes. A member cannot self-promote.

## Requirements met
- Two distinct user types (Member, Moderator).
- A dynamic database of users and notes.
- Frontend to backend to database operations on every action.
- Runs on many machines against one central database (see [architecture](architecture.md)).

## Milestones (value versions)
- v0.1 Core: sign up, log in, and note create, view, edit, delete.
- v0.2 Sharing: publish to and browse a public feed, with moderation.
- v0.3 Organization: profile, tags, search, filter, and course grouping.

## Non-functional requirements
- Security: private notes are never visible to others; passwords are never readable; every protected route checks the role.
- Responsive at 360 px and 1280 px.
- A page or a list of 100 notes loads within 2 seconds.
- Every rejected action shows a reason.
- Data persists across machines through the central database.
