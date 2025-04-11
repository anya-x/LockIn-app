# LockIn Task Manager

A science based task management tool that's going to change how you view productivity.

## Tech Stack

- **Backend:** Spring Boot 3.2, PostgreSQL 17, JWT Authentication
- **Frontend:** React 18, TypeScript, Material-UI v7, Vite
- **Architecture:** RESTful API, responsive SPA

## Features

- ✅ User authentication (JWT)
- ✅ Task CRUD operations
- ✅ Eisenhower Matrix categorization (Urgent/Important)
- ✅ Task status tracking (TODO, IN_PROGRESS, COMPLETED)
- ✅ Dashboard with statistics
- ✅ Responsive design for mobile/desktop

## Prerequisites

- Java
- Node.js
- PostgreSQL
- Maven

## API Endpoints

### Authentication

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login as user

### Tasks (Authenticated)

- GET `/api/tasks` - Get all tasks for user
- POST `/api/tasks` - Create new task
- PUT `/api/tasks/{id}` - Update task
- DELETE `/api/tasks/{id}` - Delete task

## Known Issues

- JWT secret is hardcoded (should use environment variable)
- No pagination on task list yet

## Future Improvements

- Add task filtering
- Implement pagination
- Add task search
- Email notifications
- Task attachments
- Pomodoro timer integration
- Dark mode
