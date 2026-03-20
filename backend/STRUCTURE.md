# Backend Project Structure

```
cleanup-nairobi/backend/
│
├── 📁 config/                      # Configuration files
│   ├── supabase.js                 # Supabase client setup
│   └── database.js                 # Database constants & enums
│
├── 📁 controllers/                 # Business logic
│   ├── authController.js           # Authentication (register, login, profile)
│   ├── eventController.js          # Events (CRUD, join, leave)
│   ├── wasteReportController.js    # Waste reports (create, list, update)
│   ├── driverController.js         # Driver operations (assignments, stats)
│   └── adminController.js          # Admin (dashboard, users, drivers)
│
├── 📁 middleware/                  # Express middleware
│   ├── auth.js                     # JWT authentication & authorization
│   ├── validation.js               # Request validation handler
│   └── errorHandler.js             # Global error handling
│
├── 📁 routes/                      # API route definitions
│   ├── authRoutes.js               # /api/auth/* endpoints
│   ├── eventRoutes.js              # /api/events/* endpoints
│   ├── wasteReportRoutes.js        # /api/reports/* endpoints
│   ├── driverRoutes.js             # /api/driver/* endpoints
│   └── adminRoutes.js              # /api/admin/* endpoints
│
├── 📁 utils/                       # Utility functions
│   └── helpers.js                  # Password hashing, JWT, distance calc
│
├── 📄 server.js                    # Main application entry point
├── 📄 package.json                 # Dependencies & scripts
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
│
├── 📚 Documentation/
│   ├── README.md                   # Complete API documentation
│   ├── SETUP_GUIDE.md              # Step-by-step setup
│   ├── DATABASE_SCHEMA.md          # Database structure & SQL
│   ├── API_ENDPOINTS.md            # Quick API reference
│   ├── STRUCTURE.md                # This file
│   └── postman_collection.json     # Postman API collection
│
└── 📄 start.bat                    # Windows startup script
```

## 📊 Request Flow

```
Client Request
    ↓
Express Server (server.js)
    ↓
CORS & Body Parser Middleware
    ↓
Route Handler (routes/*.js)
    ↓
Validation Middleware (if applicable)
    ↓
Authentication Middleware (if protected)
    ↓
Authorization Middleware (if role-specific)
    ↓
Controller (controllers/*.js)
    ↓
Supabase Database (config/supabase.js)
    ↓
Response to Client
```

## 🔐 Authentication Flow

```
1. User Registration
   POST /api/auth/register
   → authController.register()
   → Hash password (bcrypt)
   → Insert into users table
   → Generate JWT token
   → Return user + token

2. User Login
   POST /api/auth/login
   → authController.login()
   → Find user by email
   → Compare password (bcrypt)
   → Generate JWT token
   → Return user + token

3. Protected Route Access
   GET /api/auth/profile
   → auth.authenticate middleware
   → Verify JWT token
   → Attach user to req.user
   → authController.getProfile()
   → Return user data
```

## 🎯 Role-Based Access

```
Public Routes (No Auth)
├── POST /api/auth/register
├── POST /api/auth/login
├── GET  /api/events
└── GET  /api/events/:id

User Routes (Authenticated)
├── GET  /api/auth/profile
├── PUT  /api/auth/profile
├── POST /api/events/:id/join
├── POST /api/reports
└── GET  /api/reports/my-reports

Driver Routes (Driver + Admin)
├── GET  /api/driver/profile
├── GET  /api/driver/assignments
├── PUT  /api/driver/assignments/:id/accept
└── PUT  /api/driver/assignments/:id/complete

Admin Routes (Admin Only)
├── GET  /api/admin/stats
├── POST /api/admin/drivers
├── POST /api/admin/assign-driver
└── DELETE /api/admin/users/:id
```

## 📦 Dependencies Breakdown

### Production Dependencies
```json
{
  "@supabase/supabase-js": "Database client",
  "bcryptjs": "Password hashing",
  "cors": "Cross-origin resource sharing",
  "dotenv": "Environment variables",
  "express": "Web framework",
  "express-validator": "Input validation",
  "jsonwebtoken": "JWT authentication",
  "morgan": "HTTP request logger",
  "multer": "File upload handling",
  "uuid": "UUID generation"
}
```

### Development Dependencies
```json
{
  "nodemon": "Auto-restart on file changes"
}
```

## 🗄️ Database Tables Overview

```
users (Main user table)
├── id (UUID, PK)
├── full_name
├── email (unique)
├── password (hashed)
├── phone
├── location
├── role (user/driver/admin)
├── avatar_url
├── points
└── timestamps

cleanup_events
├── id (UUID, PK)
├── title
├── description
├── location
├── latitude/longitude
├── date/time
├── max_participants
├── status
└── created_by (FK → users)

waste_reports
├── id (UUID, PK)
├── user_id (FK → users)
├── location
├── latitude/longitude
├── description
├── waste_type
├── image_url
├── status
└── timestamps

drivers
├── id (UUID, PK)
├── user_id (FK → users)
├── vehicle_number
├── vehicle_type
├── license_number
├── is_available
└── timestamps

driver_assignments
├── id (UUID, PK)
├── driver_id (FK → drivers)
├── report_id (FK → waste_reports)
├── status
└── timestamps
```

## 🔄 Data Flow Examples

### Creating a Waste Report
```
User → POST /api/reports
    ↓
authRoutes.js (route definition)
    ↓
authenticate middleware (verify JWT)
    ↓
createReportValidation (validate input)
    ↓
wasteReportController.createReport()
    ↓
Insert into waste_reports table
    ↓
Increment user points (+10)
    ↓
Return created report
```

### Driver Completing Assignment
```
Driver → PUT /api/driver/assignments/:id/complete
    ↓
driverRoutes.js
    ↓
authenticate middleware
    ↓
isDriver middleware (check role)
    ↓
driverController.completeAssignment()
    ↓
Update assignment status
    ↓
Update waste_report status
    ↓
Increment driver points (+50)
    ↓
Return updated assignment
```

## 🎨 Code Organization Principles

1. **Separation of Concerns**
   - Routes: Define endpoints
   - Controllers: Business logic
   - Middleware: Cross-cutting concerns
   - Utils: Reusable functions

2. **Single Responsibility**
   - Each file has one clear purpose
   - Controllers handle one resource type
   - Middleware handles one concern

3. **DRY (Don't Repeat Yourself)**
   - Common functions in utils/helpers.js
   - Shared middleware in middleware/
   - Reusable validation rules

4. **Security First**
   - Authentication on protected routes
   - Authorization for role-specific actions
   - Input validation on all endpoints
   - Password hashing
   - SQL injection prevention

## 📝 File Naming Conventions

- **Controllers**: `resourceController.js` (e.g., authController.js)
- **Routes**: `resourceRoutes.js` (e.g., eventRoutes.js)
- **Middleware**: `purposeMiddleware.js` or `purpose.js`
- **Utils**: Descriptive names (helpers.js)
- **Config**: Service name (supabase.js, database.js)

## 🚀 Startup Sequence

```
1. Load environment variables (.env)
2. Initialize Express app
3. Configure middleware (CORS, JSON parser, Morgan)
4. Register routes
5. Add error handlers
6. Start listening on PORT
7. Log startup message
```

## 💾 Environment Variables

```
Required:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- JWT_SECRET

Optional (with defaults):
- PORT (default: 5000)
- NODE_ENV (default: development)
- JWT_EXPIRES_IN (default: 7d)
- ALLOWED_ORIGINS (default: *)
```

## 🎯 Best Practices Implemented

✅ Async/await for asynchronous operations
✅ Try-catch blocks for error handling
✅ Consistent error response format
✅ Input validation before processing
✅ JWT token expiration
✅ Password hashing (never store plain text)
✅ Environment-based configuration
✅ Modular code structure
✅ RESTful API design
✅ Proper HTTP status codes
✅ CORS configuration
✅ Request logging
✅ Comprehensive documentation

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
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

## 🔧 Maintenance & Updates

To add a new feature:
1. Create controller in `controllers/`
2. Define routes in `routes/`
3. Add validation rules
4. Update documentation
5. Test endpoints
6. Update Postman collection

To modify existing feature:
1. Update controller logic
2. Adjust validation if needed
3. Update documentation
4. Test changes
5. Update API reference
