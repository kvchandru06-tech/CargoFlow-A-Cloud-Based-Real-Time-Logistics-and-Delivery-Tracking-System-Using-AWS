# CargoFlow — Cloud-Based Real-Time Logistics & Delivery Tracking

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB)
![Flask](https://img.shields.io/badge/Backend-Flask%20Python-000000)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57)
![AWS](https://img.shields.io/badge/Cloud-AWS-FF9900)
![TailwindCSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38BDF8)

A full-stack logistics and delivery tracking platform built with React.js, Flask, SQLite, and AWS services.

---

## Features

- **JWT Authentication** — Login/register with Admin, Customer, and Delivery Agent roles
- **Shipment Management** — Create, track, and manage shipments end-to-end
- **Real-Time Tracking** — Live status updates with a visual delivery timeline
- **Admin Dashboard** — Analytics charts, revenue reports, agent management, user control
- **Customer Dashboard** — Track shipments, download PDF invoices, notification center
- **Agent Dashboard** — Assigned deliveries, status updates, proof-of-delivery upload
- **PDF Invoice Generation** — Auto-generated invoices via ReportLab
- **File Uploads** — AWS S3 for delivery proofs and avatars (local fallback included)
- **Email/SMS Alerts** — AWS SNS notifications on status changes (graceful fallback)
- **Dark/Light Mode** — Full theme toggle with system preference detection
- **Responsive Design** — Mobile-friendly UI with Tailwind CSS

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React 18, Tailwind CSS, Chart.js        |
| Backend     | Flask 2.3 (Python 3.11+)               |
| Database    | SQLite + SQLAlchemy ORM + Flask-Migrate |
| Auth        | JWT (Flask-JWT-Extended)                |
| Cloud       | AWS S3, SNS (optional)                  |
| PDF         | ReportLab                               |
| Container   | Docker + Docker Compose                 |

---

## Project Structure

```
CargoFlow/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory, extensions, blueprints
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── routes/              # auth, shipments, tracking, admin, notifications, uploads
│   │   ├── services/            # aws_s3, aws_sns, pdf_generator
│   │   └── utils/               # helpers, decorators
│   ├── config.py
│   ├── run.py
│   ├── seed_data.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.js
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   ├── TrackPage.js
│       │   ├── admin/           # Dashboard, Shipments, Agents, Users, Reports
│       │   ├── customer/        # Dashboard, Shipments, CreateShipment, Detail, Notifications
│       │   └── agent/           # Dashboard, Deliveries, DeliveryDetail
│       ├── components/          # layout, ui, shipments
│       ├── context/             # AuthContext, ThemeContext
│       └── services/            # api.js (axios + JWT interceptors)
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── README.md
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed_data.py      # seeds DB with demo data
python run.py            # starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start                # starts on http://localhost:3000
```

The frontend proxies `/api` requests to `http://localhost:5000` automatically.

### Docker (full stack)

```bash
docker-compose up --build
# Frontend: http://localhost
# Backend:  http://localhost:5000
```

---

## Default Login Credentials

| Role           | Email                       | Password      |
|----------------|-----------------------------|---------------|
| Admin          | admin@cargoflow.com         | admin123      |
| Customer       | customer@cargoflow.com      | customer123   |
| Delivery Agent | agent@cargoflow.com         | agent123      |

---

## API Endpoints

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/health                       | Health check                   |
| POST   | /api/auth/register                | Register new user              |
| POST   | /api/auth/login                   | Login                          |
| GET    | /api/auth/me                      | Get current user               |
| GET    | /api/shipments                    | List shipments (paginated)     |
| POST   | /api/shipments                    | Create shipment                |
| GET    | /api/shipments/:id                | Get shipment detail            |
| PUT    | /api/shipments/:id/status         | Update shipment status         |
| PUT    | /api/shipments/:id/assign         | Assign agent (admin)           |
| GET    | /api/shipments/:id/invoice        | Download PDF invoice           |
| GET    | /api/tracking/:tracking_number    | Public tracking (no auth)      |
| GET    | /api/admin/dashboard              | Admin stats & charts           |
| GET    | /api/admin/reports                | Revenue & delivery reports     |
| GET    | /api/notifications                | User notifications             |
| POST   | /api/uploads/proof/:shipment_id   | Upload proof of delivery       |

---

## AWS Configuration (Optional)

Set these in `backend/.env` to enable cloud features:

```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=cargoflow-uploads
AWS_SNS_TOPIC_ARN=arn:aws:sns:...
```

Without AWS credentials, the app falls back to local file storage and skips SNS notifications gracefully.

---

## License

MIT
