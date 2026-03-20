# Cleanup Nairobi Backend API

Backend service for the Cleanup Nairobi application built with Node.js, Express, and Supabase.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: User registration, login, profile management
- **Cleanup Events**: Create, manage, and join cleanup events
- **Waste Reporting**: Report waste locations with geolocation
- **Driver Management**: Driver assignments and task tracking
- **Admin Dashboard**: Comprehensive admin controls and statistics
- **Points & Rewards System**: Gamification with points and rewards

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## 🛠️ Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file**
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_secret_key
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

5. **Set up database schema**
   - Go to your Supabase project
   - Run the SQL commands from `DATABASE_SCHEMA.md`
   - Enable Row Level Security (RLS) policies

## 🏃‍♂️ Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0712345678",
  "location": "Westlands"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe Updated",
  "phone": "0712345679",
  "location": "Kilimani"
}
```

### Event Endpoints

#### Get All Events
```http
GET /api/events?status=upcoming&page=1&limit=10
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Create Event (Admin only)
```http
POST /api/events
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Karura Forest Cleanup",
  "description": "Join us for a cleanup event",
  "location": "Karura Forest",
  "latitude": -1.2345,
  "longitude": 36.7890,
  "date": "2024-12-01",
  "startTime": "09:00",
  "endTime": "13:00",
  "maxParticipants": 50
}
```

#### Join Event
```http
POST /api/events/:id/join
Authorization: Bearer <token>
```

#### Leave Event
```http
DELETE /api/events/:id/leave
Authorization: Bearer <token>
```

### Waste Report Endpoints

#### Create Report
```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": "Ngara Road",
  "latitude": -1.2678,
  "longitude": 36.8234,
  "description": "Large pile of plastic waste",
  "wasteType": "plastic",
  "imageUrl": "https://..."
}
```

#### Get All Reports
```http
GET /api/reports?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

#### Get User's Reports
```http
GET /api/reports/my-reports
Authorization: Bearer <token>
```

### Driver Endpoints

#### Get Driver Profile
```http
GET /api/driver/profile
Authorization: Bearer <driver_token>
```

#### Get Assignments
```http
GET /api/driver/assignments?status=pending
Authorization: Bearer <driver_token>
```

#### Accept Assignment
```http
PUT /api/driver/assignments/:id/accept
Authorization: Bearer <driver_token>
```

#### Complete Assignment
```http
PUT /api/driver/assignments/:id/complete
Authorization: Bearer <driver_token>
Content-Type: application/json

{
  "notes": "Waste collected successfully",
  "imageUrl": "https://..."
}
```

### Admin Endpoints

#### Get Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

#### Get All Users
```http
GET /api/admin/users?role=user&page=1&limit=20
Authorization: Bearer <admin_token>
```

#### Create Driver
```http
POST /api/admin/drivers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fullName": "Driver Name",
  "email": "driver@example.com",
  "password": "password123",
  "phone": "0712345678",
  "vehicleNumber": "KAA 123B",
  "vehicleType": "Truck",
  "licenseNumber": "DL123456"
}
```

#### Assign Driver to Report
```http
POST /api/admin/assign-driver
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reportId": "uuid",
  "driverId": "uuid"
}
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 👥 User Roles

- **user**: Regular users who can report waste and join events
- **driver**: Drivers who can accept and complete waste collection assignments
- **admin**: Administrators with full access to manage the system

## 📁 Project Structure

```
backend/
├── config/
│   ├── supabase.js          # Supabase client configuration
│   └── database.js          # Database constants and enums
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── eventController.js   # Event management
│   ├── wasteReportController.js
│   ├── driverController.js
│   └── adminController.js
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation
│   └── errorHandler.js      # Error handling
├── routes/
│   ├── authRoutes.js
│   ├── eventRoutes.js
│   ├── wasteReportRoutes.js
│   ├── driverRoutes.js
│   └── adminRoutes.js
├── utils/
│   └── helpers.js           # Helper functions
├── .env.example
├── .gitignore
├── package.json
├── server.js                # Main server file
├── DATABASE_SCHEMA.md       # Database schema documentation
└── README.md
```

## 🧪 Testing

Test the API using tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)
- cURL

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| SUPABASE_URL | Your Supabase project URL | Yes |
| SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | Yes |
| PORT | Server port (default: 5000) | No |
| NODE_ENV | Environment (development/production) | No |
| JWT_SECRET | Secret key for JWT signing | Yes |
| JWT_EXPIRES_IN | JWT expiration time | No |
| ALLOWED_ORIGINS | CORS allowed origins | No |

## 🚨 Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## 📝 Notes

1. Make sure to set up the database schema in Supabase before running the server
2. Keep your `.env` file secure and never commit it to version control
3. Use strong JWT secrets in production
4. Enable HTTPS in production
5. Set up proper CORS origins for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Support

For support, email support@cleanupnairobi.com or open an issue in the repository.
