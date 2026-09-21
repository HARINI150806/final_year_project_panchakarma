# Panchakarma Management System

Full-stack starter project for an Ayurvedic hospital and Panchakarma treatment center management system.

## Structure

- `frontend/` - React + Vite + Tailwind CSS UI
- `backend/` - Spring Boot + Spring Security + JWT + PostgreSQL API

## Included now

- Role-based authentication for `ADMIN`, `DOCTOR`, `THERAPIST`, and `PATIENT`
- Login, registration, and forgot-password starter flow
- Protected dashboard route with healthcare-themed responsive UI
- Sample dashboard cards, activity feed, and recovery charts
- JWT-secured backend endpoints
- Seeded demo users for all four roles

## Demo accounts
 abd
- `admin@panchakarma.com`
- `doctor@panchakarma.com`
- `therapist@panchakarma.com`
- `patient@panchakarma.com`

Password for all demo users: `Password@123`

## Backend setup

1. Create PostgreSQL database: `panchakarma_management`
2. Update environment variables if needed:
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `CORS_ALLOWED_ORIGINS`
   - `MAIL_HOST`
   - `MAIL_PORT`
   - `MAIL_USERNAME`
   - `MAIL_PASSWORD` (a Gmail App Password, without spaces)

   For local development, copy `backend/.env.example` to `backend/.env`.
   Spring Boot loads that file automatically. For Render, add the same variables
   in the backend service's Environment settings; do not commit the `.env` file.
   The frontend must use `VITE_API_URL` pointing to the backend URL, ending in
   `/api`, in both local and production environments.

   On Render, configure `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in the
   **backend Web Service** (not only in the frontend service). For Supabase,
   `DB_URL` should be the pooler JDBC URL, for example:

   ```text
   jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require
   ```

   Do not surround Render variable values with quotes. If the backend logs
   `Unable to determine Dialect without JDBC metadata`, check the preceding
   `HikariPool`/`JDBC connection` error: it means the database URL, credentials,
   network access, or SSL configuration is invalid or unavailable.
3. Run:

```bash
cd backend
mvn spring-boot:run
```

## Frontend setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Optional frontend environment:

```bash
VITE_API_URL=http://localhost:8080/api
```

## Suggested next modules

- Appointment booking with automatic therapist and room scheduling
- Dosha assessment questionnaire and score engine
- Recovery records and charts backed by database data
- AI recovery prediction API integration with Python Flask or FastAPI
- Reports, notifications, and feedback management
