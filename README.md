# 🏨 StayEase — Full Stack Hotel Ticket Booking System

A modern, production-grade Full-Stack Hotel Reservation Web Application built with **React (Frontend)** and **Node.js + Express.js (Backend REST API)**, styled with **Tailwind CSS & Vanilla CSS**, and powered by persistent data storage.

---

## 📌 Syllabus & Evaluation Requirements Checklist

This codebase demonstrates all the concepts requested:

### 1. ⚡ JavaScript
- [x] **Basic JS Concepts**: ES Modules (`import`/`export`), Array methods (`map`, `filter`, `reduce`), destructuring, spread/rest operators.
- [x] **Promises**: Asynchronous file I/O and HTTP request resolution.
- [x] **async / await**: Clean asynchronous execution for all database operations and REST API calls.
- [x] **NPM**: Dependency management (`package.json`), scripts, package isolation.

### 2. 🎨 CSS & Styling
- [x] **Important CSS Properties**: Flexbox, CSS Grid, custom CSS variables (`--se-primary`, `--se-gold`), transitions, animations, backdrop-filter blur.
- [x] **Tailwind CSS & Vanilla CSS**: Seamless blend of Tailwind utility classes and scoped modular CSS for rich aesthetic components.
- [x] **Dark Mode & Light Mode**: Theme toggle persisting in `localStorage` with system-wide CSS classes.

### 3. ⚛️ React.js
- [x] **All Key React Hooks**:
  - `useState`: Form state, active tabs, modal visibility, filter options.
  - `useEffect`: Asynchronous API fetching on mount, token synchronisation, document theme updates.
  - `useContext`: Global auth state (`useAuth`) avoiding prop drilling.
  - `useMemo`: Computed metrics (total bookings, points, price calculations, filtered hotel lists).
  - `useCallback`: Memoized API calls preventing unnecessary re-renders.
  - `useRef`: Auto-focusing editable inputs upon toggling edit mode.
- [x] **Props & Prop Drilling**: Clean component hierarchy with Props (`HotelCard`, `Navbar`) and `AuthContext` to eliminate prop drilling.
- [x] **API Fetching**: Modular service client in `src/services/api.js` handling loading states, try/catch error handling, and structured JSON parsing.

### 4. 🚀 Node.js & Express.js
- [x] **Complete CRUD Operations**:
  - **Create**: Register user (`POST /api/auth/register`), Create hotel (`POST /api/hotels`), Reserve booking (`POST /api/bookings`).
  - **Read**: List hotels (`GET /api/hotels`), Get hotel (`GET /api/hotels/:id`), User profile (`GET /api/users/profile`), User bookings (`GET /api/bookings/my`).
  - **Update**: Update profile details (`PUT /api/users/profile`), Update hotel (`PUT /api/hotels/:id`), Change password (`PUT /api/users/change-password`).
  - **Delete**: Cancel/Delete reservation (`DELETE /api/bookings/:id`), Remove hotel (`DELETE /api/hotels/:id`).
- [x] **CORS**: Configured with `cors()` middleware supporting cross-origin resource sharing between React (`http://localhost:5173`) and Express (`http://localhost:5000`).
- [x] **Middleware Architecture**:
  - Custom request logger (`loggerMiddleware.js`) tracking method, URL, status code, and response time.
  - Authentication middleware (`authMiddleware.js`) verifying JWT tokens.
  - Input validation middleware (`validationMiddleware.js`) checking emails, passwords, and booking dates.
  - Global error handling & 404 middleware (`errorMiddleware.js`).
- [x] **Validation**: Request body validation rejecting malformed data before reaching controllers.
- [x] **Routing & Folder Structure**: Clean industry-standard modular architecture separating routes, controllers, middleware, and database utilities.

---

## 📁 Project Architecture & Folder Structure

```
hotel-ticket-booking/
├── server/                           # Backend (Node.js & Express.js)
│   ├── config/
│   │   └── config.js                 # Environment config & constants (PORT=5000, JWT_SECRET)
│   ├── controllers/
│   │   ├── authController.js         # Register, Login, GetMe controllers
│   │   ├── hotelController.js        # Hotel CRUD operations
│   │   ├── bookingController.js      # Booking CRUD operations (Create, Read, Cancel)
│   │   └── userController.js         # User profile update & password change
│   ├── routes/
│   │   ├── authRoutes.js             # /api/auth endpoints
│   │   ├── hotelRoutes.js            # /api/hotels endpoints
│   │   ├── bookingRoutes.js          # /api/bookings endpoints
│   │   └── userRoutes.js             # /api/users endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT Token verification (protect & optionalAuth)
│   │   ├── validationMiddleware.js   # Request body validation (auth, bookings, profile)
│   │   ├── loggerMiddleware.js       # HTTP request logger
│   │   └── errorMiddleware.js        # Global error & 404 handler
│   ├── data/
│   │   ├── db.json                   # Persistent JSON Database (Users, Hotels, Bookings)
│   │   └── seedHotels.js             # 30 Curated luxury hotels initial seed data
│   ├── utils/
│   │   ├── fileDb.js                 # Async Promise-based CRUD file store
│   │   └── generateToken.js          # JWT signing utility
│   ├── package.json                  # Backend dependencies
│   └── server.js                     # Express App entry point & middleware mounting
│
├── src/                              # Frontend (React 19 + Vite + Tailwind CSS)
│   ├── components/
│   │   ├── Navbar.jsx                # Responsive navbar with auth state & user avatar
│   │   └── HotelCard.jsx             # Hotel display card
│   ├── context/
│   │   └── AuthContext.jsx           # Global Authentication Context & backend sync
│   ├── services/
│   │   └── api.js                    # Modular API client (Promises & async/await)
│   ├── pages/
│   │   ├── Home.jsx                  # Hero, destination cards, search bar
│   │   ├── SearchResults.jsx         # Hotel filtering, sorting, price range
│   │   ├── HotelDetails.jsx          # Room selector, gallery, amenities
│   │   ├── Booking.jsx               # Booking form connected to backend API
│   │   ├── BookingConfirmation.jsx   # Voucher confirmation view
│   │   ├── Auth.jsx                  # Login page
│   │   ├── Signup.jsx                # Registration page
│   │   ├── MyProfile.jsx             # Redesigned user dashboard with tabs & CRUD
│   │   └── MyProfile.css             # Luxury aesthetic styles for Profile
│   ├── App.jsx                       # Routing setup & theme management
│   ├── main.jsx                      # App root
│   └── index.css                     # Global design tokens & styling
│
├── package.json                      # Root scripts & dependencies
└── vite.config.js                    # Vite configuration
```

---

## 🚀 How to Run the Project

### 1. Start the Backend Server (Express.js on port 5000)
Open a terminal in the project root:
```bash
npm run server
```
Or start directly inside the `server/` directory:
```bash
cd server
npm start
```
The server will start at `http://localhost:5000` and automatically initialize the database in `server/data/db.json`.

### 2. Start the Frontend (Vite + React)
Open a second terminal in the project root:
```bash
npm run dev
```
Open your browser at `http://localhost:5173` (or the URL displayed in the terminal).

---

## 🔑 Demo Account Credentials

A pre-seeded demo user account is ready for testing:
- **Email**: `aarav@stayease.com`
- **Password**: `password123`
- **Username**: `demouser`

You can also create a new account anytime using the **Sign Up** page.

---

## 🌟 Key Features in the Redesigned Profile Dashboard (`/profile`)

1. **User Identity & Hero Card**:
   - Displays avatar initials, full name, email, city, and a **✦ Gold Explorer** loyalty badge.
   - Quick Action buttons: "Edit Profile" and "Log out".
2. **Interactive Metric Cards**:
   - Total Reservations count
   - Active Stays count
   - StayEase Loyalty Points (earned on every booking)
   - Completed Stays count
3. **Tab 1: My Bookings & Reservations (CRUD)**:
   - Filter chips: *All, Confirmed, Completed, Cancelled*.
   - Displays hotel image, room details, check-in/out dates, price paid, and reference code (e.g., `ST-8492011`).
   - **View Receipt Modal**: Opens a printable booking voucher with `window.print()`.
   - **Cancel Reservation**: Triggers confirmation modal and updates status via `DELETE /api/bookings/:id`.
4. **Tab 2: Personal Information (CRUD Update)**:
   - Edit full name, email, phone number, date of birth, and city.
   - Saves updates directly to the backend via `PUT /api/users/profile`.
5. **Tab 3: Security & Password**:
   - Update account password with real-time validation and bcrypt hashing (`PUT /api/users/change-password`).
6. **Tab 4: Member Perks & Loyalty Progress**:
   - Visual tier progress bar towards Platinum Elite and benefits breakdown (free breakfast, late check-out, upgrades).
