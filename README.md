# 🗺️ Local Guide Platform - Backend API

A comprehensive backend API for connecting travelers with local tour guides. Built with Node.js, Express, TypeScript, and MongoDB.

# Live Url : https://local-guide-server-bd.vercel.app/


## ✨ Features

### Core Functionality
- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control (Tourist, Guide, Admin)
- 👥 **User Management** - Registration, login, profile management
- 🎯 **Tour Management** - Create, update, delete tours with media uploads
- 📅 **Availability System** - Date-based availability with time slots and guest capacity
- 📝 **Booking System** - Complete booking workflow with status tracking
- 💳 **Payment Integration** - SSLCommerz payment gateway integration
- 💰 **Wallet & Earnings** - Guide wallet system with earnings tracking
- 💸 **Payout Management** - Guide payout requests and admin processing
- ⭐ **Review System** - Tourist reviews with ratings and auto-calculated stats
- 🔔 **Notification System** - notifications for bookings, payments, reviews
- ⚙️ **Platform Settings** - Dynamic platform fee, payout settings, contact info
- 📧 **Email System** - Nodemailer integration for transactional emails
- 🔍 **Advanced Search** - Filter tours by category, language

### Admin Features
- User management (block/unblock users)
- Tour management (approve/reject tours)
- Booking management (view all bookings)
- Payment management (view all payments, process refunds)
- Payout management (approve/reject payout requests)
- Review management (moderate reviews)
- Platform settings configuration
- Newsletter subscriber management

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken), Passport.js
- **Payment**: SSLCommerz
- **File Upload**: Cloudinary
- **Email**: Nodemailer
- **Validation**: Zod
- **Security**: bcryptjs for password hashing
- **Session**: express-session

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)

---

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Configure environment variables** (see [Environment Variables](#environment-variables))

---

## 🔧 Environment Variables

Create a `.env` file in the backend root directory with the following variables:

### Server Configuration
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Database
```env
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/local-guide-db?retryWrites=true&w=majority
```

### JWT Configuration
```env
JWT_ACCESS_SECRET=your_access_secret_key
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES=30d
```

### Password Hashing
```env
BCRYPT_SALT_ROUND=10
```

### Admin Credentials (Auto-created on startup)
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@Password123
ADMIN_NAME=Admin User
```



### SSLCommerz Payment Gateway
```env
SSL_STORE_ID=your_store_id
SSL_STORE_PASS=your_store_password
SSL_PAYMENT_API=https://sandbox.sslcommerz.com/gwprocess/v3/api.php
SSL_VALIDATION_API=https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php

# Frontend URLs (where users are redirected after payment)
SSL_SUCCESS_FRONTEND_URL=http://localhost:3000/payment/success
SSL_FAIL_FRONTEND_URL=http://localhost:3000/payment/failed
SSL_CANCEL_FRONTEND_URL=http://localhost:3000/payment/cancelled

# Backend URLs (SSLCommerz callbacks)
SSL_SUCCESS_BACKEND_URL=http://localhost:5000/api/payments/success
SSL_FAIL_BACKEND_URL=http://localhost:5000/api/payments/fail
SSL_CANCEL_BACKEND_URL=http://localhost:5000/api/payments/cancel
```

### Cloudinary (File Upload)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### Email Configuration (Nodemailer)
```env
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_FROM=your_email@gmail.com
```
---

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Server runs on `http://localhost:5000` with auto-reload on file changes.

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/user/register
Content-Type: application/json

{
  "role": "TOURIST" | "GUIDE",
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```



### Tour Endpoints

#### Get All Tours (Public)
```http
GET /api/tours?city=Dhaka&category=History&minPrice=50&maxPrice=200&page=1&limit=10
```

#### Get Tour Details
```http
GET /api/tours/:slug
```

#### Create Tour (Guide Only)
```http
POST /api/tours
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Historical Dhaka Tour",
  "description": "Explore the rich history of Dhaka",
  "category": "History",
  "city": "Dhaka",
  "pricePerPerson": 150,
  "duration": 4,
  "maxGroupSize": 10,
  "languages": ["en", "bn"],
  "included": ["Guide", "Transport", "Lunch"],
  "notIncluded": ["Personal expenses"]
}
```

### Availability Endpoints

#### Create Availability (Guide Only)
```http
POST /api/availability
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "specificDate": "2025-12-15",
  "startTime": "9:00 AM",
  "endTime": "5:00 PM",
  "pricePerPerson": 150,
  "maxGroupSize": 10
}
```

#### Get Guide Availability
```http
GET /api/availability/guide/:guideId
```

#### Check Availability
```http
GET /api/availability/guide/:guideId/check?date=2025-12-15&time=9:00 AM
```

### Booking Endpoints

#### Create Booking (Tourist Only)
```http
POST /api/bookings
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tourId": "tour_id",
  "availabilityId": "availability_id",
  "numGuests": 2,
  "specialRequests": "Vegetarian meals please"
}
```

#### Get My Bookings
```http
GET /api/bookings/my-bookings
Authorization: Bearer {accessToken}
```

### Payment Endpoints

#### Initiate Payment (Tourist Only)
```http
POST /api/payments/initiate
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "bookingId": "booking_id"
}
```

#### Get Payment History
```http
GET /api/payments/my-history
Authorization: Bearer {accessToken}
```

### Review Endpoints

#### Create Review (Tourist Only)
```http
POST /api/reviews
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "tourId": "tour_id",
  "bookingId": "booking_id",
  "rating": 5,
  "comment": "Amazing experience!"
}
```

#### Get Tour Reviews
```http
GET /api/reviews/tour/:tourId
```

### Wallet & Payout Endpoints

#### Get My Wallet (Guide Only)
```http
GET /api/wallet/my-wallet
Authorization: Bearer {accessToken}
```

#### Request Payout (Guide Only)
```http
POST /api/payouts/request
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "amount": 5000,
  "paymentMethod": "bKash",
  "accountDetails": {
    "accountNumber": "01700000000",
    "accountName": "John Doe"
  }
}
```

### Admin Endpoints

#### Get All Users (Admin Only)
```http
GET /api/user/admin/all-users?page=1&limit=10
Authorization: Bearer {adminAccessToken}
```

#### Block/Unblock User (Admin Only)
```http
PATCH /api/user/admin/:userId/toggle-status
Authorization: Bearer {adminAccessToken}
```

#### Get All Payments (Admin Only)
```http
GET /api/payments/admin/all-payments
Authorization: Bearer {adminAccessToken}
```

#### Process Refund (Admin Only)
```http
POST /api/payments/:paymentId/refund
Authorization: Bearer {adminAccessToken}
Content-Type: application/json

{
  "reason": "Customer request"
}
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app/
│   │   ├── config/
│   │   │   ├── database.ts          # MongoDB connection
│   │   │   ├── env.ts                # Environment variables
│   │   │   ├── passport.ts           # Passport.js config
│   │   │   └── cloudinary.ts         # Cloudinary config
│   │   ├── modules/
│   │   │   ├── user/
│   │   │   │   ├── user.interface.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.route.ts
│   │   │   │   └── user.validation.ts
│   │   │   ├── auth/
│   │   │   ├── tour/
│   │   │   ├── availability/
│   │   │   ├── booking/
│   │   │   ├── payment/
│   │   │   ├── wallet/
│   │   │   ├── payout/
│   │   │   ├── review/
│   │   │   ├── notification/
│   │   │   ├── settings/
│   │   │   └── newsletter/
│   │   ├── middlewares/
│   │   │   ├── checkAuth.ts         # JWT authentication
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── notFound.ts
│   │   │   └── validateRequest.ts
│   │   ├── utils/
│   │   │   ├── QueryBuilder.ts      # Query helper
│   │   │   ├── catchAsync.ts        # Async error handler
│   │   │   ├── sendResponse.ts      # Response formatter
│   │   │   └── sendEmail.ts         # Email utility
│   │   ├── errorHelpers/
│   │   │   └── AppError.ts          # Custom error class
│   │   ├── routes/
│   │   │   └── index.ts             # Route aggregator
│   │   └── constants/
│   │       └── index.ts             # App constants
│   ├── app.ts                        # Express app setup
│   └── server.ts                     # Server entry point
├── .env                              # Environment variables
├── .env.example                      # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Schema

### Collections

1. **users** - User accounts (Tourist, Guide, Admin)
2. **tours** - Tour listings created by guides
3. **availabilities** - Guide availability slots with date/time
4. **bookings** - Tourist bookings with status tracking
5. **payments** - Payment records with SSLCommerz data
6. **wallets** - Guide wallet balances and earnings
7. **payouts** - Guide payout requests
8. **reviews** - Tourist reviews for tours
9. **notifications** - User notifications
10. **settings** - Platform settings (fees, contact info)
11. **newsletters** - Newsletter subscriptions

### Key Relationships

- User (Guide) → Tours (one-to-many)
- User (Guide) → Availabilities (one-to-many)
- Tour + Availability → Booking (many-to-one)
- Booking → Payment (one-to-one)
- User (Guide) → Wallet (one-to-one)
- Booking → Review (one-to-one)

---

## 🔐 Authentication

### JWT Token Flow

1. User logs in with email/password
2. Server validates credentials
3. Server generates access token (1 day) and refresh token (30 days)
4. Tokens stored in HTTP-only cookies
5. Client includes access token in Authorization header
6. Server validates token on protected routes

### Role-Based Access Control

- **TOURIST**: Can book tours, make payments, write reviews
- **GUIDE**: Can create tours, manage availability, view earnings
- **ADMIN**: Full access to all resources

### Protected Routes

```typescript
// Middleware usage
router.get('/my-bookings', checkAuth(ERole.TOURIST), controller.getMyBookings);
router.post('/tours', checkAuth(ERole.GUIDE), controller.createTour);
router.get('/admin/users', checkAuth(ERole.ADMIN), controller.getAllUsers);
```

---

## 💳 Payment Integration

### SSLCommerz Flow

1. **Initiate Payment**
   - Tourist clicks "Pay Now"
   - Backend creates payment record
   - Backend calls SSLCommerz API
   - User redirected to SSLCommerz payment page

2. **Payment Success**
   - SSLCommerz redirects to success callback
   - Backend validates payment
   - Updates booking status to CONFIRMED
   - Updates availability (decreases slots)
   - Updates guide wallet
   - Sends notifications

3. **Payment Failure/Cancel**
   - SSLCommerz redirects to fail/cancel callback
   - Backend updates payment status
   - Booking remains PENDING

### Timezone Handling

The system handles timezone issues in availability matching:
- Uses date ranges instead of exact date matching
- Converts dates to UTC for storage
- Compares using `$gte` and `$lt` operators

---

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Add all variables from `.env`

4. **Update Callback URLs**
   - Update `SSL_SUCCESS_BACKEND_URL` to production URL
   - Update `GOOGLE_CALLBACK_URL` to production URL
   - Update `FRONTEND_URL` to production frontend URL

### MongoDB Atlas Setup

1. Create cluster on MongoDB Atlas
2. Whitelist Vercel IP addresses (or use 0.0.0.0/0 for all)
3. Create database user
4. Get connection string
5. Update `DB_URL` in environment variables

---

## 📝 Key Features Explained

### Availability System
- Guides create availability slots with date, time, and capacity
- Tourists can only book available slots
- System prevents overbooking
- Auto-cleanup of past dates
- Timezone-aware date matching

### Booking Workflow
```
PENDING → (Payment) → CONFIRMED → (Guide Action) → COMPLETED
                                                  → CANCELLED
```

### Wallet System
- Guide earnings tracked in wallet
- Platform fee deducted on payout request
- Transaction history maintained
- Balance = Total Earned - Total Withdrawn

### Notification System
- Real-time notifications for key events
- Booking created/confirmed/cancelled
- Payment success/failure
- Review received
- Payout approved/rejected


---

**Version**: 1.0.0  
**Last Updated**: December 2025
