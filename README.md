# LockIn Task Manager

A science based task management tool that's going to change how you view productivity.

## Tech Stack

- **Backend:** Spring Boot 3.2, PostgreSQL 17, JWT Authentication
- **Frontend:** React 18, TypeScript, Material-UI v7, Vite
- **Architecture:** RESTful API, responsive SPA

## Prerequisites

- Java
- Node.js
- PostgreSQL
- Maven

## API Endpoints

### Authentication

- POST `/api/auth/register` - register a new user
- POST `/api/auth/login` - login as user

### Tasks (Authenticated)

- GET `/api/tasks` - get all user tasks
- GET `/api/tasks/{id}` -get a single task
- POST `/api/tasks` - create a new task
- PUT `/api/tasks/{id}` - update a task
- DELETE `/api/tasks/{id}` - delete a task

### Category Endpoints

- GET `/api/categories` - get all categories
- GET `/api/categories/{id}` - get a single category
- POST `/api/categories `- create a category
- PUT `/api/categories/{id}` - update a category
- DELETE `/api/categories/{id}` - delete a category

### Eisenhower Matrix Endpoints

- GET `/api/tasks/quadrant` - get tasks by quadrant
- GET `/api/tasks/matrix `- get a vcomplete matrix
- PATCH `/api/tasks/{id}/quadrant` - move a task between quadrants

### Search & Filter Endpoints (2)

- GET `/api/tasks/search?query={term}` - search tasks
- GET `/api/tasks/filter?status=...&category=...` - multi criteria filtering

## Features & Roadmap

## Epic 1: Authentication & Foundation

### User Stories Completed:

#### [x] US-1.1: User Registration

**As a** new user  
**I want to** create an account with email and password  
**So that** I can securely access the task manager

**ACs**

- Email validation
- Password strength requirements
- First name and last name captured
- Auto-login after successful registration

---

#### [x] US-1.2: User Login

**As a** registered user  
**I want to** login with my credentials  
**So that** I can access my tasks

**ACs**

- Email and password authentication
- JWT token generation
- Token stored
- Generic error messages (prevents user enumeration)
- Session persistence across browser refreshes

**Known Issues**

- JWT secret hardcoded (TODO: Move to environment variables i prod)
- Token stored in localStorage
- No refresh token mechanism
- No rate limiting on login endpoint

#### [x] US-1.3: Basic Task CRUD

**As a** user  
**I want to** create, read, update, and delete tasks  
**So that** I can manage my to-do list

**AC**

- Create tasks with title and description
- View all my tasks
- Edit task details
- Confirmation dialog when deletng tasks
- Tasks unique to authenticated user

**Known Issues**

- n+1 query problem

## Epic 2: Productivity Framework

#### [x] US-2.1: Task Categories

**As a** user  
**I want to** organise tasks into categories  
**So that** I can group related work

**AC**

- Create custom categories with name, color, and icon
- Assign tasks to categories
- Edit and delete categories
- Category uniqueness per user
- Tasks retain when category deleted (no cascade)

**Known Issues**

- when creating a new category along with task, category filter doesn't refresh with new category
- tasks don't have a category badge

#### [x] US-2.2: Eisenhower Matrix

**As a** user  
**I want to** visualise tasks in an Eisenhower Matrix  
**So that** I can prioritise by urgency and importance

**ACs**

- 2x2 grid showing four quadrants
- Urgent + Important: Do First 🔥
- Not Urgent + Important: Schedule 📅
- Urgent + Not Important: Delegate 👥
- Not Urgent + Not Important: Eliminate 🗑️
- Drag-and-drop tasks between quadrants
- Color-coded by priority (red, blue, orange, purple)

**Known Issues**

- drag and drop on mobile not working properly=

#### [x] US-2.3: Task Search

**As a** user  
**I want to** search tasks by title or description  
**So that** I can quickly find specific tasks

**ACs**

- Real-time search
- Case insensitive matching
- Searches title and description fields
- Loading indicator during search

#### [x] US-2.4: Advanced Filtering

**As a** user  
**I want to** filter tasks by status, category, urgency and importance  
**So that** I can focus on specific task groups

**ACs**

- Filter by status
- Filter by category
- Filter by urgency
- Filter by importance
- Combine multiple filters
- Show active filter count badge
- Button to clear all filters (x)

## Epic 3: Focus Management

#### [x] US-3.1: Pomodoro Timer

**As a** user  
**I want to** use a Pomodoro timer (multiple choices: 25/5, 50/10...)  
**So that** I can deep focus during sessions

**ACs**

- Configurable work/break durations
- Audio/visual notifications
- Browser notifications (with permission)
- Pause/resume functionality
- Session history tracking

#### [ ] US-3.2: Focus Session Tracking

**As a** user  
**I want to** track my focus sessions  
**So that** I can analyse my patterns

**ACs**

- FocusSession entity (start time, duration, task link)
- Session notes and reflection
- Daily/weekly session statistics
- Peak productivity hour detection

## Epic 4: Analytics & Insights

#### [ ] US-4.1: Productivity Dashboard

**As a** user  
**I want to** see my productivity trends  
**So that** I can identify patterns and improve

**ACs**

- Daily analytics calculation
- Productivity score (multi-factor algorithm)
- Completion rate trends
- Focus time tracking
- Break/work ratio analysis

#### [ ] US-4.2: Burnout Detection

**As a** user concerned about well-being  
**I want to** be alerted when showing burnout signs  
**So that** I can adjust my workload

#### [ ] US-4.3: Goal Tracking

**As a** user  
**I want to** set and track productivity goals  
**So that** I can measure progress toward my objectives

#### [ ] US-4.4: Report Generation

**As a** user  
**I want to** export productivity reports  
**So that** I can share with manager or reflect on my own progress

## Epic 5: Intelligent Features

#### US-5.1:

## Epic 6: Production Readiness

#### US-6.1: Comprehensive Testing

**As a** developer  
**I want** atleast 70% test coverage  
**So that** I can deploy with confidence and ease

#### US-6.2: Docker Deployment

**As a** developer  
**I want** containerised deployment  
**So that** the app runs consistently everywhere

#### 🔄 US-6.3: CI/CD Pipeline

**As a** developer  
**I want** automated testing and deployment  
**So that** I can ship new and modify features quickly and safely

#### ☁️ US-6.4: Cloud Deployment

**As a** user  
**I want** the app accessible online  
**So that** I can use it from anywhere

**BUGS TO FIX ASAP**

- sessions marked complete when stopping [x]
- new session started when paused [x]
- filtering by time in stats issue + quality measurement odd behaviour
- filterbycategories in matrix

**To do (low priority)**

- Dark mode
- Mobile app (React Native)
- Team collaboration
- Integration with Slack, Jira, Trello
- Custom themes
- More chart types
- Voice commands
- Multi-language support
- category chips on matrix cards and task list
- edit, add, delete tasks on matrix cards
- potential refactoring: task card in task list and matrix, empty and error state
- loader skeleton
- pomodoro: timer stops when changing tabs
- sorting asc/desc
- session history doesn't automatically refresh after session complete
- possibility to archive tasks
- focus session timer on tab
- ux/ui: redo timer page- too vertical rn

## Research References

All productivity features are backed by research:

1. **Covey, S. R. (1989).** "The 7 Habits of Highly Effective People" - eisenhower Matrix
2. **Cirillo, F. (2006).** "The Pomodoro Technique" - focus sessions
3. **Newport, C. (2016).** "Deep Work" - 4 hour optimal focus time
4. **Sweller, J. (1988).** "Cognitive Load Theory" - task limits
5. **Maslach, C. (1981).** "Burnout Inventory

" - overwork detection 6. **Locke & Latham (1990).** "Goal Setting Theory" - goal tracking

**Last Updated:** 3 June 2025
