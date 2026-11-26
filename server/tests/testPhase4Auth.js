/**
 * STAYEASE - PHASE 4 COMPREHENSIVE AUTOMATED TEST SUITE
 * Tests all 17 authentication and role-based authorization requirements
 * against live MongoDB Atlas cluster using isolated test data.
 */

import http from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config/config.js";
import { connectDB, disconnectDB } from "../config/database.js";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import { hashToken } from "../utils/generateToken.js";

// Import the Express app setup
import express from "express";
import cors from "cors";
import authRoutes from "../routes/authRoutes.js";
import ownerRoutes from "../routes/ownerRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import userRoutes from "../routes/userRoutes.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

let server;
let baseUrl;

// Test identifiers to ensure isolation
const runId = Date.now();
const testCustomerEmail = `test_customer_${runId}@example.com`;
const testOwner1Email = `test_owner1_${runId}@example.com`;
const testOwner2Email = `test_owner2_${runId}@example.com`;
const testAdminEmail = `test_admin_${runId}@example.com`;
const testPassword = "Password123#Secure";

let customerTokens = {};
let owner1Tokens = {};
let owner2Tokens = {};
let adminTokens = {};

let hotel1Id = null;
let hotel2Id = null;

// Track test results
const results = [];

function record(testNum, title, passed, details = "") {
  results.push({ testNum, title, passed, details });
  const statusIcon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${statusIcon} [Test ${testNum.toString().padStart(2, "0")}] ${title}`);
  if (details) console.log(`   └─ ${details}`);
}

function extractRefreshCookie(headers) {
  const setCookie = headers?.["set-cookie"];
  if (!setCookie) return { raw: null, value: null, isHttpOnly: false };
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const match = cookies.find((c) => c.startsWith("refreshToken="));
  if (!match) return { raw: null, value: null, isHttpOnly: false };
  const valuePart = match.split(";")[0];
  const value = valuePart.slice("refreshToken=".length);
  const isHttpOnly = /;\s*HttpOnly/i.test(match);
  return { raw: valuePart, value, isHttpOnly };
}

async function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("\n============================================================");
  console.log("🧪 STAYEASE PHASE 4 AUTH & RBAC COMPREHENSIVE TEST SUITE");
  console.log("   Connecting to MongoDB Atlas...");
  console.log("============================================================\n");

  await connectDB();

  // Start test server on ephemeral port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`📡 In-process test server active on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Successful Signup
    // -------------------------------------------------------------
    const res1 = await request("POST", "/api/auth/register", {
      name: "Test Customer",
      email: testCustomerEmail,
      username: `cust_${runId}`,
      password: testPassword,
      confirmPassword: testPassword,
      role: "admin", // Malicious attempt to self-elevate to admin
    });

    const cookie1 = extractRefreshCookie(res1.headers);
    const pass1 =
      res1.status === 201 &&
      res1.data.success === true &&
      !!res1.data.token &&
      res1.data.refreshToken === undefined && // Refresh token must NOT be exposed in JSON
      !!cookie1.value &&
      cookie1.isHttpOnly &&
      res1.data.user.role === "user" && // Role elevation strictly blocked
      !res1.data.user.password; // No password leak

    customerTokens = {
      token: res1.data.token,
      refreshCookie: cookie1.raw,
      refreshValue: cookie1.value,
      user: res1.data.user,
    };

    record(1, "Successful signup & role-elevation prevention", pass1,
      `Status: ${res1.status}, role: ${res1.data?.user?.role || "n/a"}, refreshToken in JSON: ${res1.data.refreshToken !== undefined}, HttpOnly cookie set: ${cookie1.isHttpOnly}`);

    // -------------------------------------------------------------
    // Test 2: Duplicate Email Signup
    // -------------------------------------------------------------
    const res2 = await request("POST", "/api/auth/register", {
      name: "Duplicate User",
      email: testCustomerEmail,
      password: testPassword,
    });

    const pass2 = res2.status === 409 && res2.data.success === false;
    record(2, "Duplicate email signup prevention", pass2,
      `Status: ${res2.status}, message: "${res2.data.message}"`);

    // -------------------------------------------------------------
    // Test 3: Successful Login
    // -------------------------------------------------------------
    const res3 = await request("POST", "/api/auth/login", {
      email: testCustomerEmail,
      password: testPassword,
    });

    const cookie3 = extractRefreshCookie(res3.headers);
    const pass3 =
      res3.status === 200 &&
      res3.data.success === true &&
      !!res3.data.token &&
      res3.data.refreshToken === undefined && // Refresh token must NOT be in JSON
      !!cookie3.value &&
      cookie3.isHttpOnly;

    // Update tokens with newly logged in session
    customerTokens.token = res3.data.token;
    customerTokens.refreshCookie = cookie3.raw;
    customerTokens.refreshValue = cookie3.value;

    record(3, "Successful login with email & password (HttpOnly cookie, no refreshToken in JSON)", pass3,
      `Status: ${res3.status}, access token received, refreshToken in JSON: ${res3.data.refreshToken !== undefined}, HttpOnly cookie: ${cookie3.isHttpOnly}`);

    // -------------------------------------------------------------
    // Test 4: Invalid Password
    // -------------------------------------------------------------
    const res4 = await request("POST", "/api/auth/login", {
      email: testCustomerEmail,
      password: "WrongPassword!99",
    });

    const pass4 = res4.status === 401 && res4.data.success === false;
    record(4, "Invalid password rejection", pass4,
      `Status: ${res4.status}, message: "${res4.data.message}"`);

    // -------------------------------------------------------------
    // Test 5: Missing Credentials
    // -------------------------------------------------------------
    const res5 = await request("POST", "/api/auth/login", {
      email: "",
      password: "",
    });

    const pass5 = res5.status === 400 && res5.data.success === false;
    record(5, "Missing credentials rejection", pass5,
      `Status: ${res5.status}, message: "${res5.data.message}"`);

    // -------------------------------------------------------------
    // Test 6: Access Token Validation
    // -------------------------------------------------------------
    const res6 = await request("GET", "/api/users/profile", null, {
      Authorization: `Bearer ${customerTokens.token}`,
    });

    const pass6 =
      res6.status === 200 &&
      res6.data.success === true &&
      res6.data.user.email === testCustomerEmail;

    record(6, "Access token validation on protected route", pass6,
      `Status: ${res6.status}, user verified: ${res6.data?.user?.email}`);

    // -------------------------------------------------------------
    // Test 7: Expired Access Token
    // -------------------------------------------------------------
    // Create an expired access token with 0s expiry
    const expiredToken = jwt.sign(
      { id: customerTokens.user.id, email: testCustomerEmail },
      config.JWT_SECRET,
      { expiresIn: "0s" }
    );

    // Sleep 50ms to ensure expiration
    await new Promise((r) => setTimeout(r, 50));

    const res7 = await request("GET", "/api/users/profile", null, {
      Authorization: `Bearer ${expiredToken}`,
    });

    const pass7 = res7.status === 401 && res7.data.success === false;
    record(7, "Expired access token rejection", pass7,
      `Status: ${res7.status}, message: "${res7.data.message}"`);

    // -------------------------------------------------------------
    // Test 8: Refresh Token Rotation & Reuse Detection (via HttpOnly Cookie)
    // -------------------------------------------------------------
    const initialRefreshCookie = customerTokens.refreshCookie;
    const initialRefreshValue = customerTokens.refreshValue;

    const res8 = await request("POST", "/api/auth/refresh", null, {
      Cookie: initialRefreshCookie,
    });

    const cookie8 = extractRefreshCookie(res8.headers);
    const pass8Rotation =
      res8.status === 200 &&
      res8.data.success === true &&
      !!res8.data.token &&
      res8.data.refreshToken === undefined && // Never return refresh token in JSON
      !!cookie8.value &&
      cookie8.isHttpOnly &&
      cookie8.value !== initialRefreshValue;

    customerTokens.token = res8.data.token;
    customerTokens.refreshCookie = cookie8.raw;
    customerTokens.refreshValue = cookie8.value;

    // Test reuse detection: attempting to reuse old initialRefreshCookie
    const res8Reuse = await request("POST", "/api/auth/refresh", null, {
      Cookie: initialRefreshCookie,
    });

    const pass8Reuse = res8Reuse.status === 403 && res8Reuse.data.success === false;
    const pass8 = pass8Rotation && pass8Reuse;

    record(8, "Refresh token rotation and reuse protection (HttpOnly cookie)", pass8,
      `Rotation status: ${res8.status}, rotated cookie: ${cookie8.value !== initialRefreshValue}, reuse blocked: ${res8Reuse.status}`);

    // Log back in to have fresh valid tokens for subsequent tests
    const relogin = await request("POST", "/api/auth/login", {
      email: testCustomerEmail,
      password: testPassword,
    });
    const reloginCookie = extractRefreshCookie(relogin.headers);
    customerTokens.token = relogin.data.token;
    customerTokens.refreshCookie = reloginCookie.raw;
    customerTokens.refreshValue = reloginCookie.value;

    // -------------------------------------------------------------
    // Test 9: Logout and Refresh Token Invalidation
    // -------------------------------------------------------------
    // We create a temporary user specifically to test complete logout
    const tempEmail = `temp_logout_${runId}@example.com`;
    const tempSignup = await request("POST", "/api/auth/register", {
      name: "Temp Logout User",
      email: tempEmail,
      username: `temp_${runId}`,
      password: testPassword,
    });
    const tempCookie = extractRefreshCookie(tempSignup.headers);

    const res9Logout = await request("POST", "/api/auth/logout", null, {
      Authorization: `Bearer ${tempSignup.data.token}`,
      Cookie: tempCookie.raw,
    });

    // Try to refresh with the logged-out refresh token cookie
    const res9TryRefresh = await request("POST", "/api/auth/refresh", null, {
      Cookie: tempCookie.raw,
    });

    const pass9 =
      res9Logout.status === 200 &&
      (res9TryRefresh.status === 401 || res9TryRefresh.status === 403);

    record(9, "Logout and refresh token invalidation", pass9,
      `Logout status: ${res9Logout.status}, refreshed token blocked with status: ${res9TryRefresh.status}`);

    // Cleanup temp user
    await User.deleteOne({ email: tempEmail });

    // -------------------------------------------------------------
    // Test 10: Forgot Password (Hashed token generation & expiry)
    // -------------------------------------------------------------
    const res10 = await request("POST", "/api/auth/forgot-password", {
      email: testCustomerEmail,
    });

    // Fetch user directly from DB to verify hash is stored, NOT plaintext
    const dbUserAfterForgot = await User.findOne({ email: testCustomerEmail }).select("+resetPasswordToken +resetPasswordExpires");

    const pass10 =
      res10.status === 200 &&
      res10.data.success === true &&
      !!dbUserAfterForgot.resetPasswordToken &&
      dbUserAfterForgot.resetPasswordExpires > new Date() &&
      dbUserAfterForgot.resetPasswordToken.length === 64; // SHA-256 hex string

    const validResetToken = res10.data.devToken;
    const expectedBaseUrl = (config.FRONTEND_URL || config.CLIENT_URL).replace(/\/+$/, "");
    const expectedResetUrl = `${expectedBaseUrl}/reset-password/${validResetToken}`;
    const resetUrlValid =
      res10.data.devResetUrl === expectedResetUrl &&
      !String(res10.data.devResetUrl).includes("llocalhost");

    record(10, "Forgot password token generation & reset URL verification", pass10 && resetUrlValid,
      `Status: ${res10.status}, hash length: ${dbUserAfterForgot?.resetPasswordToken?.length}, resetUrl: ${res10.data.devResetUrl}`);

    // -------------------------------------------------------------
    // Test 11: Expired Reset Token
    // -------------------------------------------------------------
    // Manually expire the token in database
    await User.updateOne(
      { email: testCustomerEmail },
      { resetPasswordExpires: new Date(Date.now() - 10000) }
    );

    const res11 = await request("POST", `/api/auth/reset-password/${validResetToken}`, {
      password: "NewPassword123#!",
      confirmPassword: "NewPassword123#!",
    });

    const pass11 = res11.status === 400 && res11.data.success === false;
    record(11, "Expired reset token rejection", pass11,
      `Status: ${res11.status}, message: "${res11.data.message}"`);

    // -------------------------------------------------------------
    // Test 12: Successful Password Reset
    // -------------------------------------------------------------
    // Request a new fresh reset token
    const res12Forgot = await request("POST", "/api/auth/forgot-password", {
      email: testCustomerEmail,
    });
    const freshResetToken = res12Forgot.data.devToken;
    const newResetPassword = "BrandNewPassword123#";

    const res12Reset = await request("POST", `/api/auth/reset-password/${freshResetToken}`, {
      password: newResetPassword,
      confirmPassword: newResetPassword,
    });

    // Verify login with old password fails
    const res12OldLogin = await request("POST", "/api/auth/login", {
      email: testCustomerEmail,
      password: testPassword,
    });

    // Verify login with new password succeeds
    const res12NewLogin = await request("POST", "/api/auth/login", {
      email: testCustomerEmail,
      password: newResetPassword,
    });

    // Verify single-use: token cannot be reused
    const res12ReuseToken = await request("POST", `/api/auth/reset-password/${freshResetToken}`, {
      password: "YetAnotherPassword123#",
    });

    const pass12 =
      res12Reset.status === 200 &&
      res12OldLogin.status === 401 &&
      res12NewLogin.status === 200 &&
      res12ReuseToken.status === 400;

    record(12, "Successful password reset (single-use token & session invalidation)", pass12,
      `Reset: ${res12Reset.status}, old login: ${res12OldLogin.status}, new login: ${res12NewLogin.status}, reuse token: ${res12ReuseToken.status}`);

    customerTokens.token = res12NewLogin.data.token;

    // -------------------------------------------------------------
    // Prepare Owners and Admin for RBAC testing
    // -------------------------------------------------------------
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(testPassword, salt);

    // Create Owner 1
    const owner1Doc = await User.create({
      name: "Owner One",
      username: `owner1_${runId}`,
      email: testOwner1Email,
      password: hashedPass,
      role: "owner",
      isActive: true,
    });

    // Create Owner 2
    const owner2Doc = await User.create({
      name: "Owner Two",
      username: `owner2_${runId}`,
      email: testOwner2Email,
      password: hashedPass,
      role: "owner",
      isActive: true,
    });

    // Create Admin
    const adminDoc = await User.create({
      name: "System Admin",
      username: `admin_${runId}`,
      email: testAdminEmail,
      password: hashedPass,
      role: "admin",
      isActive: true,
    });

    // Create Hotel 1 (owned by Owner 1)
    const hotel1Doc = await Hotel.create({
      name: `Test Hotel 1 (${runId})`,
      description: "Test Hotel owned by Owner 1",
      category: "hotel",
      ownerId: owner1Doc._id,
      city: "Goa",
      location: { city: "Goa", country: "India" },
      isActive: true,
    });
    hotel1Id = hotel1Doc._id.toString();

    // Create Hotel 2 (owned by Owner 2)
    const hotel2Doc = await Hotel.create({
      name: `Test Hotel 2 (${runId})`,
      description: "Test Hotel owned by Owner 2",
      category: "hotel",
      ownerId: owner2Doc._id,
      city: "Mumbai",
      location: { city: "Mumbai", country: "India" },
      isActive: true,
    });
    hotel2Id = hotel2Doc._id.toString();

    // Log in Owner 1
    const loginOwner1 = await request("POST", "/api/auth/login", {
      email: testOwner1Email,
      password: testPassword,
    });
    owner1Tokens = { token: loginOwner1.data.token };

    // Log in Owner 2
    const loginOwner2 = await request("POST", "/api/auth/login", {
      email: testOwner2Email,
      password: testPassword,
    });
    owner2Tokens = { token: loginOwner2.data.token };

    // Log in Admin
    const loginAdmin = await request("POST", "/api/auth/login", {
      email: testAdminEmail,
      password: testPassword,
    });
    adminTokens = { token: loginAdmin.data.token };

    // -------------------------------------------------------------
    // Test 13: Customer Accessing Owner Route
    // -------------------------------------------------------------
    const res13 = await request("GET", "/api/owner/dashboard", null, {
      Authorization: `Bearer ${customerTokens.token}`,
    });

    const pass13 = res13.status === 403;
    record(13, "Customer blocked from owner portal API", pass13,
      `Status: ${res13.status}, message: "${res13.data.message}"`);

    // -------------------------------------------------------------
    // Test 14: Owner Accessing Admin Route
    // -------------------------------------------------------------
    const res14 = await request("GET", "/api/admin/dashboard", null, {
      Authorization: `Bearer ${owner1Tokens.token}`,
    });

    const pass14 = res14.status === 403;
    record(14, "Owner blocked from admin portal API", pass14,
      `Status: ${res14.status}, message: "${res14.data.message}"`);

    // -------------------------------------------------------------
    // Test 15: Owner Attempting to Access Another Owner's Property
    // -------------------------------------------------------------
    // Owner 1 attempts to access Hotel 2 (which is owned by Owner 2)
    const res15Unauthorized = await request("GET", `/api/owner/properties/${hotel2Id}`, null, {
      Authorization: `Bearer ${owner1Tokens.token}`,
    });

    // Owner 2 accesses their own Hotel 2
    const res15Authorized = await request("GET", `/api/owner/properties/${hotel2Id}`, null, {
      Authorization: `Bearer ${owner2Tokens.token}`,
    });

    const pass15 = res15Unauthorized.status === 403 && res15Authorized.status === 200;
    record(15, "Resource ownership validation (Cross-owner property access blocked)", pass15,
      `Unauthorized owner status: ${res15Unauthorized.status}, legitimate owner status: ${res15Authorized.status}`);

    // -------------------------------------------------------------
    // Test 16: Admin Accessing Authorized Admin Routes & Properties
    // -------------------------------------------------------------
    const res16Dashboard = await request("GET", "/api/admin/dashboard", null, {
      Authorization: `Bearer ${adminTokens.token}`,
    });

    const res16Users = await request("GET", "/api/admin/users", null, {
      Authorization: `Bearer ${adminTokens.token}`,
    });

    // Admin can also manage any property
    const res16Property = await request("GET", `/api/owner/properties/${hotel2Id}`, null, {
      Authorization: `Bearer ${adminTokens.token}`,
    });

    const pass16 =
      res16Dashboard.status === 200 &&
      res16Users.status === 200 &&
      res16Property.status === 200;

    record(16, "Admin accessing administrative routes and override permissions", pass16,
      `Dashboard: ${res16Dashboard.status}, users list: ${res16Users.status}, property access: ${res16Property.status}`);

    // -------------------------------------------------------------
    // Test 17: Frontend Session Restoration
    // -------------------------------------------------------------
    // Simulates frontend initializing with stored token and calling GET /api/auth/me
    const res17Me = await request("GET", "/api/auth/me", null, {
      Authorization: `Bearer ${customerTokens.token}`,
    });

    const pass17 =
      res17Me.status === 200 &&
      res17Me.data.success === true &&
      res17Me.data.user.email === testCustomerEmail &&
      res17Me.data.user.role === "user";

    record(17, "Frontend session restoration (GET /api/auth/me)", pass17,
      `Status: ${res17Me.status}, email: ${res17Me.data?.user?.email}, tier: ${res17Me.data?.user?.tier}`);

  } finally {
    // -------------------------------------------------------------
    // Clean up test data from MongoDB Atlas
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up isolated test documents from MongoDB Atlas...");
    await User.deleteMany({
      email: {
        $in: [testCustomerEmail, testOwner1Email, testOwner2Email, testAdminEmail],
      },
    });
    if (hotel1Id) await Hotel.deleteOne({ _id: hotel1Id });
    if (hotel2Id) await Hotel.deleteOne({ _id: hotel2Id });
    console.log("   ✓ Isolated test records removed cleanly.\n");

    if (server) {
      server.close();
    }
    await disconnectDB();
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("============================================================");
  console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED out of ${results.length}`);
  console.log("============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("❌ Fatal error during test execution:", err);
  process.exit(1);
});
