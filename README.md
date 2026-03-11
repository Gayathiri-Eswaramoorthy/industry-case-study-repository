# Industry Case Study Portal

A full-stack web application for managing industry case studies across academic institutions. Faculty can create and manage case studies, students can browse and submit solutions, and admins oversee the entire platform.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                         │
│              React + Vite (localhost:5173)              │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │   Student   │  │   Faculty    │  │     Admin     │   │
│  │  Dashboard  │  │  Dashboard   │  │   Dashboard   │   │
│  └─────────────┘  └──────────────┘  └───────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (HTTP/JSON)
                         │ JWT Auth Headers
┌────────────────────────▼────────────────────────────────┐
│                        Backend                          │
│            Spring Boot (localhost:8080)                 │
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │    Auth &    │  │    Case     │  │  Submission   │   │
│  │  Security    │  │  Management │  │  Management   │   │
│  └──────────────┘  └─────────────┘  └───────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ JPA / Hibernate
┌────────────────────────▼────────────────────────────────┐
│                       Database                          │
│                        MySQL                            │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, React Router, Axios |
| Backend    | Spring Boot 3, Spring Security, JWT |
| Database   | MySQL                               |
| Auth       | JWT (Role-based: Admin, Faculty, Student) |
| Build Tool | Maven (backend), npm (frontend)     |

---

## Role-Based Access

| Feature                        | Admin | Faculty | Student |
|-------------------------------|-------|---------|---------|
| View all cases                | ✅    | ❌      | ❌      |
| View published cases          | ✅    | ✅      | ✅      |
| View own draft cases          | ✅    | ✅      | ❌      |
| Create case study             | ✅    | ✅      | ❌      |
| Edit faculty-created cases    | ✅    | ✅      | ❌      |
| Edit admin-created cases      | ✅    | ❌      | ❌      |
| View admin-created cases      | ✅    | ✅ (View only) | ❌ |
| Publish case study            | ✅    | ❌      | ❌      |
| Submit solution               | ❌    | ❌      | ✅      |
| Manage users                  | ✅    | ❌      | ❌      |
| Reset user passwords          | ✅    | ❌      | ❌      |

---

## Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- MySQL 8+
- Maven 3.8+

---

### 1. Clone the Repositories

**Backend:**
```bash
git clone https://github.com/your-username/case-study-backend.git
cd case-study-backend
```

**Frontend:**
```bash
git clone https://github.com/your-username/case-study-frontend.git
cd case-study-frontend
```

---

### 2. Database Setup

```sql
CREATE DATABASE case_study_portal;
```

---

### 3. Backend Setup

Navigate into the cloned backend repo:

```bash
cd case-study-backend
```

Update `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/case_study_portal
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

jwt.secret=your_jwt_secret_key
jwt.expiration=86400000
```

Run the backend:

```bash
mvn spring-boot:run
```

Backend runs at: `http://localhost:8080`

---

### 4. Frontend Setup

Navigate into the cloned frontend repo:

```bash
cd case-study-frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Start the development server:

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Project Structure

### Backend Repo — `backend`
```
backend/
└── src/
    └── main/
        ├── java/
        │   └── com/portal/
        │       ├── controller/      # REST Controllers
        │       ├── service/         # Business Logic
        │       ├── repository/      # JPA Repositories
        │       ├── model/           # Entity Classes
        │       ├── dto/             # Request/Response DTOs
        │       └── security/        # JWT & Spring Security
        └── resources/
            └── application.properties
```

### Frontend Repo — `frontend`
```
frontend/
└── src/
    ├── pages/                       # Page Components
    │   ├── admin/                   # Admin Dashboard & Management
    │   ├── faculty/                 # Faculty Dashboard
    │   └── student/                 # Student Dashboard
    ├── components/                  # Reusable UI Components
    ├── context/                     # Auth Context
    ├── api/                         # Axios API Calls
    └── App.jsx                      # Routes & Role Guards
```

---

## Key Features

### Admin
- Full visibility of all case studies (All / Published / Draft tabs)
- Publish or unpublish case studies
- Create, edit, and delete any case study
- Manage users — add, delete participants
- Reset user passwords
- View activity feed and platform analytics

### Faculty
- Create case studies with rich structure (Problem Statement, Key Questions, Constraints, Rubric, Expected Outcome, Reference Links)
- Edit own or other faculty-created cases
- View (read-only) admin-created cases
- Dashboard with Published and Draft tabs (no All tab)
- Support for Text, PDF, and GitHub Link submission types

### Student
- Browse all published case studies
- Submit solutions based on submission type:
    - **Text** — rich textarea input with additional fields
    - **GitHub Link** — URL input with additional fields
    - **PDF** — file upload only
- Track submission status and completion rate
- View recent activity and submission breakdown on dashboard

---

## Security

- JWT-based stateless authentication
- Role-based route protection on both frontend (React Router guards) and backend (Spring Security)
- Password hashing with BCrypt
- Admin-only endpoints secured at the controller level

---

## Notes

- Only **Admins** can publish case studies
- Faculty can see drafts they created; students only see published cases
- PDF submissions are handled via `multipart/form-data`
- `createdByRole` is exposed on `CaseStudyResponse` DTO to support role-aware UI rendering

---

## Future Improvements

### Core Features
- **Plagiarism Detection** — Auto-check student submissions for similarity across text and PDF responses
- **Case Versioning** — Track full edit history of a case study over time with rollback support
- **Bulk Case Import** — Allow faculty to upload multiple cases at once via Excel/CSV
- **Case Cloning** — Duplicate an existing case as a starting template for new ones

### Analytics & Reporting
- **Submission Analytics** — Visual charts for submission trends, score distributions, and late submissions
- **Student Performance Reports** — Exportable PDF reports per student or per case study
- **Faculty Workload Dashboard** — Track cases created, pending reviews, and average evaluation turnaround time

### Notifications
- **Email Notifications** — Alert students when a case is published or a submission is evaluated
- **In-app Notification Bell** — Real-time alerts for deadlines, new cases, and grading updates

### AI Integration
- **AI-Assisted Evaluation** — Auto-score text submissions against the rubric using an LLM
- **AI Case Generator** — Help faculty draft case studies from a topic prompt
- **Smart Feedback Suggestions** — AI-generated feedback hints for faculty when grading submissions

### Security & Admin
- **Audit Logs** — Track all admin actions with timestamps (who changed what and when)
- **Two-Factor Authentication (2FA)** — Extra login security for Admin and Faculty roles
- **Session Management** — View and remotely revoke active user sessions

### Integrations
- **GitHub API Validation** — Auto-validate submitted GitHub links to confirm the repo exists and is public
- **Cloud Storage for PDFs** — Store submission files on AWS S3 or Google Cloud Storage instead of local disk
- **LMS Integration** — Sync case studies with Moodle or Google Classroom

