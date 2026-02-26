
# WarmPath

**WarmPath** is a trust-first social networking application designed to eliminate the awkwardness of the "Cold Start" problem in socializing. Unlike traditional platforms that rely on algorithmic matching or transaction-based networking, this app digitizes the "Plus-One" protocol - ensuring every new connection is vetted and facilitated by a mutual friend.

## The Problem & Solution
People value introductions from mutual friends significantly more than algorithmically generated matches, but the friction of asking for (and facilitating) these introductions often prevents them from happening.


We solve this by introducing a *Triangular Introduction Logic**.
A "Requester" cannot directly message a "Contact". Instead, they ping the "Connector" (the mutual friend), who reviews the context and approves the introduction. Once approved, a real-time chat room opens with a context-aware icebreaker already generated.

## Core Features
* **Path Discover:** Visualizes the social graph to show users exactly how they are connected to 2nd and 3rd-degree network targets.

* **Connector Actions Inbox.** A dedicated UI for mutual friends to review, accept, or decline introduction requests with "Context Pre-Reads."

* **Real-Time Handoff.** Instant messaging powered by Firebase that only unlocks after an introduction is explicitly approved.

* **Proactive Connector Prompts.** When someone in your network posts an intent, you may be prompted "Someone is looking for help with X. Do you know someone who could help?" Connectors can volunteer to facilitate introductions.

* **Smart Prompt Logic.** Automatically generates custom icebreakers based on the shared interests of the newly connected users.

* **Context Pre-reads.** When an introduction is approved, both parties receive a brief summary of the other person (year, major, relevant experience, interests, etc) to prepare for the conversation


## Additional Features to be implemented
* **Coffee Chats.** In platform chat window that includes User, Connector, and Contact upon accepting the introduction prompt. The Connector, and Contact upon accepting the introduction prompt. The Connector will make a brief "warm introduction/ice breaker" comment and can either stay to facilitate the conversation or leave after the introduction. Alternative: instead of a chat window this can be done through email (suggested by professor). Chat window to prompt immediate response to conversation and prevent ghosting.

* **Shadow Profile.** Users don't write their own bios; their profiles are populated by the tags and endorsements of their friends.


## Technical Architecture

This application is built using a modern, type-safe stack:

* **Frontend.** React.js, HTML5, CSS3
* **Backend.** Node.js
* **Database & ORM.** PostgreSQL + Prisma ORM
* **Real-Time & Auth.** Firebase

## Custom Data Schema
Our Prisma database schema moves beyond traditional binary friendships (User A<-> User B)
to support a custom 'Introduction' model. This creates a transaction record linking the **Request**, the **Target**, and the **Connector**, allowing us to track the independent state ('PENDING', 'APPROVED', 'REJECTED') of every intro request.


