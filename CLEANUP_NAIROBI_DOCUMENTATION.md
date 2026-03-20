# Cleanup Nairobi - Project Documentation

## 1. Project Overview
Cleanup Nairobi is a smart waste management platform designed to improve environmental cleanliness and collection efficiency in Nairobi. The system connects residents, drivers, and administrators through a single digital workflow:

1. Citizens report waste locations.
2. Administrators review and assign collection tasks.
3. Drivers execute and complete assignments.
4. The platform tracks status, notifications, and analytics.

The project is implemented as a full-stack web application with a React frontend, Express backend, and Supabase (PostgreSQL) data layer.

## 2. Problem Statement
Urban waste management often faces:

- informal dumping and delayed reporting,
- inefficient manual dispatch,
- limited visibility into field operations,
- weak citizen-government feedback loops.

Cleanup Nairobi addresses this by digitizing reporting, assignment, tracking, and accountability.

## 3. Main Objectives

- Provide residents with simple geotagged waste reporting.
- Improve response time through structured assignment workflows.
- Enable role-based operations for users, drivers, and admins.
- Deliver visibility through dashboards, notifications, and analytics.
- Build a scalable, secure, testable platform for city-level operations.

## 4. User Roles and Capabilities

### Resident/User
- Register and log in.
- Submit waste reports with location and type.
- Track their report progress.
- Join cleanup events.

### Driver
- Access a driver dashboard.
- View assigned tasks.
- Accept, start, and complete assignments.
- View assigned vehicle details.

### Admin
- View dashboard statistics and activities.
- Manage users and drivers.
- Manage waste reports and assignments.
- Manage vehicles.
- Manage notifications and analytics views.

## 5. Core Functional Modules

### A. Authentication and Access Control
- JWT-based authentication.
- Role-based authorization middleware (`user`, `driver`, `admin`).
- Protected routes on both frontend and backend.

### B. Waste Reporting
- Report creation with validation.
- Status progression (`pending`, `assigned`, `in_progress`, `completed`, `rejected`).
- Filtering and retrieval for user and admin workflows.

### C. Assignment Workflow
- Admin assignment of reports to drivers.
- Driver action flow: accept -> start -> complete.
- State-based task lifecycle tracking.

### D. Events Management
- Event creation and lifecycle management.
- User join/leave participation flow.
- Event listing and detail retrieval.

### E. Vehicle Management
- Admin-only vehicle CRUD.
- Available vehicle listing.
- Driver vehicle lookup support.

### F. Notifications
- Notification listing and counts.
- Mark-as-read flows (single and bulk).
- Deletion support.

### G. Analytics and Dashboarding
- Admin dashboard statistics and recent activities.
- UI analytics components for report and operational trends.

## 6. System Architecture

### Frontend
- React + Vite application in `cleanup-nairobi/`.
- Routing with `react-router-dom`.
- Context-based auth state management (`AuthContext`).
- Service layer API abstraction in `src/services/api.js`.

### Backend
- Node.js + Express API in `backend/`.
- Layered structure: routes -> middleware -> controllers -> Supabase.
- Validation with `express-validator`.
- Centralized error handling middleware.

### Database
- Supabase PostgreSQL.
- Core tables include:
  - `users`
  - `cleanup_events`
  - `event_participants`
  - `waste_reports`
  - `drivers`
  - `driver_assignments`
  - `notifications`
  - `vehicles` (via migrations)

## 7. Technology Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router, Recharts, Leaflet.
- Backend: Node.js, Express, JWT, Bcrypt, Express Validator, Morgan.
- Database/Platform: Supabase (PostgreSQL + Auth-ready ecosystem).
- Testing: Jest + Supertest (backend), Vitest + Testing Library (frontend).

## 8. API Surface (Implemented Route Groups)
Base URL: `http://localhost:5000/api`

- `/auth` - registration, login, profile, password change.
- `/events` - event CRUD, join/leave, user event list.
- `/reports` - create/read/update status/assign/delete/report filters.
- `/assignments` - driver assignment actions.
- `/drivers` - driver profile, assignments, stats, availability.
- `/admin` - stats, users, drivers, assignment, activities.
- `/notifications` - list, counts, read/unread actions, delete.
- `/vehicles` - admin vehicle CRUD and availability.

Detailed endpoint mappings are available in `backend/API_ENDPOINTS.md`.

## 9. Data and Workflow Lifecycle

### Report-to-Collection Lifecycle
1. User submits a waste report.
2. Admin reviews and assigns a driver.
3. Driver accepts assignment.
4. Driver starts and completes collection.
5. System updates report and assignment statuses.
6. Notifications and dashboards reflect progress.

This lifecycle forms the operational backbone of the platform.

## 10. Project Structure

### Backend
- `backend/server.js` - server bootstrapping and route mounting.
- `backend/routes/` - endpoint definitions.
- `backend/controllers/` - business logic.
- `backend/middleware/` - auth, validation, error handling.
- `backend/config/` - Supabase client and constants.
- `backend/db/migrations/` - database evolution scripts.

### Frontend
- `cleanup-nairobi/src/App.jsx` - route orchestration and role-based navigation.
- `cleanup-nairobi/src/context/` - auth and modal providers.
- `cleanup-nairobi/src/services/api.js` - centralized API client wrappers.
- `cleanup-nairobi/src/pages/` and `src/admin/pages/` - role-specific screens.
- `cleanup-nairobi/src/components/driver/` - driver workflows.

## 11. Setup and Run Instructions

### Prerequisites
- Node.js 16+
- npm
- Supabase project and credentials

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example` and configure:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
4. Apply SQL schema from `backend/DATABASE_SCHEMA.md`.
5. Run server: `npm run dev`

### Frontend Setup
1. `cd cleanup-nairobi`
2. `npm install`
3. (Optional) set `VITE_API_URL` (defaults to `http://localhost:5000`).
4. Run client: `npm run dev`

## 12. Testing Strategy

### Backend
- Unit and integration tests in `backend/__tests__/`.
- Controller and utility test coverage.
- Run with:
  - `npm test`
  - `npm run test:coverage`

### Frontend
- Component and behavior tests in `cleanup-nairobi/src/**/__tests__/`.
- Run with:
  - `npm run test`
  - `npm run test:run`

## 13. Security and Reliability Considerations

- JWT authentication with protected routes.
- Password hashing with `bcryptjs`.
- Role-based authorization middleware.
- Input validation and structured error responses.
- CORS restrictions via `ALLOWED_ORIGINS`.
- Centralized API error handling and offline indicators in frontend.

## 14. Current Strengths

- Full role-based operational flow is implemented.
- Clear modular backend structure suitable for scaling.
- Good test foundation across major modules.
- Strong presentation-ready UI for landing, dashboards, and analytics.

## 15. Known Gaps / Improvement Opportunities

- Add real-time push notifications (WebSocket/Supabase Realtime) end-to-end.
- Expand audit logging and observability (metrics/tracing).
- Improve deployment automation (CI/CD, environment promotion).
- Harden production security (rate limiting, token refresh strategy, secret rotation).
- Expand geospatial optimization for dispatch and route planning.

## 16. Deployment Notes

For production readiness:

- deploy frontend and backend as separate services,
- configure secure environment variables and HTTPS,
- enforce strict CORS origin lists,
- provision production Supabase with RLS and backup policy,
- monitor API logs and failed authentication events.

## 17. Suggested Presentation Flow (Demo Script)

1. Introduce the waste-management problem in Nairobi.
2. Show the landing page and platform value proposition.
3. Demo user report creation flow.
4. Switch to admin dashboard and assign a report.
5. Switch to driver dashboard and complete task lifecycle.
6. Return to admin analytics and notification views.
7. Close with measurable impact (faster response, cleaner neighborhoods, traceable operations).

## 18. Conclusion
Cleanup Nairobi demonstrates a practical, scalable civic-tech solution for urban waste management. It combines citizen participation, structured operational execution, and administrative intelligence in one platform, making it suitable for both academic presentation and real-world pilot deployment.
