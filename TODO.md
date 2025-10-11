# Listify Transformation TODO

## Phase 1: Update Models and Add New Ones
- [x] Update backend/models/Task.js: Add boardId, column, tags, reminderDate fields; validate reminderDate < dueDate
- [x] Update backend/models/User.js: Add settings and boards fields
- [x] Create backend/models/Board.js: New schema for boards
- [x] Create backend/models/ActivityLog.js: New schema for activity logging
- [x] Create backend/models/Notification.js: New schema for in-app notifications
- [x] Update backend/models/Reminder.js if needed (add boardId)

## Phase 2: Add/Install Dependencies
- [x] Backend: Install socket.io, bullmq, ioredis, helmet, express-rate-limit, joi, date-fns
- [x] Frontend: Install socket.io-client, @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities, date-fns, @tanstack/react-query, lucide-react
- [x] Frontend: Install react-big-calendar for calendar UI (or similar library)

## Phase 3: Implement Realtime with Socket.IO
- [x] Update backend/server.js: Integrate Socket.IO
- [x] Create backend/socketHandler.js: Event handlers for realtime
- [x] Frontend: Add socket context/provider

## Phase 4: Add Board Management (CRUD, Permissions)
- [x] Create backend/controllers/boardController.js
- [x] Create backend/routes/boardRoutes.js
- [x] Update backend/controllers/taskController.js: Add boardId validation and permissions
- [x] Extend backend/middlewares/authMiddleware.js for board permissions

## Phase 5: Update Task Features (New Fields, Kanban Move, Filters/Search)
- [x] Update backend/controllers/taskController.js: Add moveTask endpoint, enhance getTasks with search/filters
- [x] Add MongoDB text index on Task model

## Phase 6: Add Notifications System (In-App, Email, Job Queue)
- [x] Create backend/controllers/notificationController.js
- [x] Create backend/routes/notificationRoutes.js
- [x] Integrate BullMQ in backend/server.js for job queues
- [x] Update taskController: Add notifications/activity logs

## Phase 7: Add Calendar View and API
- [x] Create backend/controllers/calendarController.js: Endpoints for fetching tasks/reminders as calendar events (e.g., GET /events?start&end for date range)
- [x] Create backend/routes/calendarRoutes.js: Mount calendar routes
- [x] Update backend/server.js: Integrate calendar routes
- [x] Update backend/controllers/taskController.js: Enhance getTasks for calendar date ranges if needed
- [x] Frontend: Install react-big-calendar
- [x] Create frontend/task-manager/src/pages/Calendar.jsx: Calendar view using react-big-calendar, fetching events from API
- [x] Update frontend/task-manager/src/App.jsx: Add route for /calendar (protected)
- [x] Update frontend/task-manager/src/utils/apiPaths.js: Add calendar API paths
- [x] Update frontend/task-manager/src/routes/PrivateRoute.jsx: If needed for new route

## Phase 8: Update Frontend for Kanban, Realtime, New Pages
- [x] Update frontend/src/App.jsx: Add new routes
- [x] Create frontend components: KanbanBoard.jsx, BoardList.jsx
- [x] Update existing pages: MyTasks.jsx, Dashboard.jsx
- [x] Create frontend/src/context/socketContext.jsx
- [x] Create frontend/src/hooks/useRealtime.jsx
- [x] Update frontend/src/utils/apiPaths.js

## Phase 9: Add Production Features
- [x] Security: Add helmet/rate-limit to server.js, Joi validation
  - [x] Add helmet and express-rate-limit to server.js
  - [x] Add Joi validation to authController.js
  - [x] Add Joi validation to taskController.js
- [x] Testing: Add Jest, create tests
  - [x] Add Jest to package.json
  - [x] Create auth.test.js
- [x] Deployment: Create Dockerfile, docker-compose.yml
  - [x] Create Dockerfile
  - [x] Create docker-compose.yml

## Phase 10: Seed Data and Documentation
- [x] Create backend/seedBoards.js
- [x] Create docs/API.md
