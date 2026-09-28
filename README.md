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
Telemedicine and remote patient monitoring

Mobile application with push notifications

Voice-enabled AI assistant for Ayurveda guidance

Wearable health sensor integration

Advanced predictive analytics for treatment planning

Cloud deployment with multi-clinic support
