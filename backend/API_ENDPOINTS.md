# API Endpoints Quick Reference

Base URL: `http://localhost:5000/api`

## 🔐 Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login user |
| GET | `/auth/profile` | Yes | Get current user profile |
| PUT | `/auth/profile` | Yes | Update user profile |
| PUT | `/auth/change-password` | Yes | Change password |

## 🎯 Event Endpoints

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/events` | No | All | Get all events (with filters) |
| GET | `/events/:id` | No | All | Get event by ID |
| POST | `/events` | Yes | Admin | Create new event |
| PUT | `/events/:id` | Yes | Admin | Update event |
| DELETE | `/events/:id` | Yes | Admin | Delete event |
| POST | `/events/:id/join` | Yes | User | Join event |
| DELETE | `/events/:id/leave` | Yes | User | Leave event |
| GET | `/events/my-events` | Yes | User | Get user's joined events |

## 📍 Waste Report Endpoints

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| POST | `/reports` | Yes | User | Create waste report |
| GET | `/reports` | Yes | All | Get all reports (with filters) |
| GET | `/reports/:id` | Yes | All | Get report by ID |
| GET | `/reports/my-reports` | Yes | User | Get user's reports |
| GET | `/reports/nearby` | Yes | Driver | Get nearby reports |
| PUT | `/reports/:id/status` | Yes | Driver/Admin | Update report status |
| DELETE | `/reports/:id` | Yes | Admin | Delete report |

## 🚛 Driver Endpoints

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/driver/profile` | Yes | Driver | Get driver profile |
| PUT | `/driver/profile` | Yes | Driver | Update driver profile |
| GET | `/driver/assignments` | Yes | Driver | Get driver assignments |
| GET | `/driver/stats` | Yes | Driver | Get driver statistics |
| PUT | `/driver/assignments/:id/accept` | Yes | Driver | Accept assignment |
| PUT | `/driver/assignments/:id/start` | Yes | Driver | Start assignment |
| PUT | `/driver/assignments/:id/complete` | Yes | Driver | Complete assignment |
| PUT | `/driver/assignments/:id/cancel` | Yes | Driver | Cancel assignment |

## 👨‍💼 Admin Endpoints

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/admin/stats` | Yes | Admin | Get dashboard statistics |
| GET | `/admin/users` | Yes | Admin | Get all users |
| GET | `/admin/users/:id` | Yes | Admin | Get user by ID |
| POST | `/admin/drivers` | Yes | Admin | Create driver account |
| GET | `/admin/drivers` | Yes | Admin | Get all drivers |
| POST | `/admin/assign-driver` | Yes | Admin | Assign driver to report |
| PUT | `/admin/users/:id/role` | Yes | Admin | Update user role |
| DELETE | `/admin/users/:id` | Yes | Admin | Delete user |
| GET | `/admin/activities` | Yes | Admin | Get recent activities |

## 📊 Query Parameters

### Events
- `status`: Filter by status (upcoming, ongoing, completed, cancelled)
- `location`: Filter by location (partial match)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Reports
- `status`: Filter by status (pending, assigned, in_progress, completed, rejected)
- `wasteType`: Filter by waste type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Nearby Reports
- `latitude`: Current latitude (required)
- `longitude`: Current longitude (required)
- `radius`: Search radius in km (default: 5)

### Users/Drivers
- `role`: Filter by role (user, driver, admin)
- `isAvailable`: Filter drivers by availability (true/false)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Driver Assignments
- `status`: Filter by status (pending, accepted, in_progress, completed, cancelled)

## 📝 Request Body Examples

### Register User
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "0712345678",
  "location": "Westlands"
}
```

### Login
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Create Event
```json
{
  "title": "Karura Forest Cleanup",
  "description": "Join us for a community cleanup event at Karura Forest",
  "location": "Karura Forest",
  "latitude": -1.2345,
  "longitude": 36.7890,
  "date": "2024-12-15",
  "startTime": "09:00",
  "endTime": "13:00",
  "maxParticipants": 50
}
```

### Create Waste Report
```json
{
  "location": "Ngara Road, near Shell Station",
  "latitude": -1.2678,
  "longitude": 36.8234,
  "description": "Large pile of plastic bottles and bags",
  "wasteType": "plastic",
  "imageUrl": "https://example.com/image.jpg"
}
```

### Create Driver
```json
{
  "fullName": "Driver Name",
  "email": "driver@example.com",
  "password": "DriverPass123!",
  "phone": "0723456789",
  "vehicleNumber": "KAA 123B",
  "vehicleType": "Truck",
  "licenseNumber": "DL123456"
}
```

### Assign Driver
```json
{
  "reportId": "uuid-of-report",
  "driverId": "uuid-of-driver"
}
```

### Complete Assignment
```json
{
  "notes": "Waste collected successfully. 50kg of plastic waste removed.",
  "imageUrl": "https://example.com/completion-photo.jpg"
}
```

### Update Report Status
```json
{
  "status": "completed",
  "notes": "Area cleaned and waste disposed properly"
}
```

## 🔑 Authentication Header

All protected endpoints require a JWT token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ✅ Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

## ❌ Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## 📌 HTTP Status Codes

- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `409` - Conflict (Resource already exists)
- `500` - Internal Server Error

## 🎯 User Roles

- **user**: Regular users (report waste, join events)
- **driver**: Waste collection drivers (accept assignments)
- **admin**: System administrators (full access)

## 💡 Tips

1. Always include `Content-Type: application/json` header for POST/PUT requests
2. Store the JWT token securely (localStorage/sessionStorage)
3. Refresh token before expiration (default: 7 days)
4. Use pagination for large datasets
5. Handle errors gracefully in your frontend

## 🔄 Typical User Flows

### User Registration & Event Participation
1. POST `/auth/register` - Register account
2. POST `/auth/login` - Login
3. GET `/events` - Browse events
4. POST `/events/:id/join` - Join event
5. GET `/events/my-events` - View joined events

### Waste Reporting Flow
1. POST `/auth/login` - Login
2. POST `/reports` - Create waste report
3. GET `/reports/my-reports` - Track report status

### Driver Assignment Flow
1. POST `/auth/login` - Driver login
2. GET `/driver/assignments` - View assignments
3. PUT `/driver/assignments/:id/accept` - Accept assignment
4. PUT `/driver/assignments/:id/start` - Start work
5. PUT `/driver/assignments/:id/complete` - Complete with photo

### Admin Management Flow
1. POST `/auth/login` - Admin login
2. GET `/admin/stats` - View dashboard
3. GET `/admin/users` - Manage users
4. POST `/admin/drivers` - Create driver accounts
5. POST `/admin/assign-driver` - Assign tasks
