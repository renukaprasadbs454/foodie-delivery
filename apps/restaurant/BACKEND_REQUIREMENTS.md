# Foodie Restaurant Backend Requirements

This document serves as the official, comprehensive backend handoff specification for the **Foodie Restaurant Portal** Spring Boot (3.x) backend application. It defines all REST API endpoints, STOMP WebSocket topics, payload schemas, security policies, error standards, and database models required by the React Native / Expo restaurant frontend application.

---

## 1. Overview

The Foodie Restaurant Portal allows restaurant owners and managers to register stores, manage master profiles, update bank and tax details, geocode store map coordinates, maintain food menu categories and dishes, process customer orders in real-time, view customer reviews, and monitor business analytics.

The frontend application utilizes **Redux Toolkit Query (RTK Query)** for API data fetching and state management. The frontend implements an offline mock fallback layer that automatically switches to live backend APIs as endpoints become available, without requiring UI modifications.

---

## 2. Authentication & Authorization

### Overview
Authentication relies primarily on **Phone Number + 6-digit OTP** verification, with optional username/password login for administrative staff. All protected endpoints require a JWT Bearer token passed in the HTTP Authorization header:

```http
Authorization: Bearer <accessToken>
```

### Authorization Roles
- **`PUBLIC`**: Unauthenticated endpoints (OTP request/verify, login, password reset).
- **`RESTAURANT`**: Authenticated restaurant owner/manager role required for all store management APIs.
- **`ADMIN`**: Platform super-admin role.

### Tenant Isolation Rule
The backend **MUST** enforce strict tenant data isolation. Every database query executed on behalf of a `RESTAURANT` user **MUST** inject `WHERE restaurant_id = :authenticatedRestaurantId` derived directly from the verified JWT claims. A user from Restaurant A must NEVER be able to query, update, or delete data belonging to Restaurant B.

---

## 3. Common API Response Format

All successful API responses MUST follow a standardized JSON envelope structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

---

## 4. Common Error Handling

All error responses MUST follow a standardized error JSON structure:

```json
{
  "success": false,
  "message": "Validation failed for request parameters",
  "errorCode": "VALIDATION_ERROR",
  "errors": {
    "phone": "Phone number must be a valid Indian E.164 number",
    "ifscCode": "Invalid IFSC code format"
  },
  "timestamp": "2026-08-13T10:30:00Z"
}
```

### Standard HTTP Status Codes

| Status Code | Status Name | Usage / Trigger Condition |
|-------------|-------------|---------------------------|
| `200` | OK | Request processed successfully |
| `201` | CREATED | Resource successfully created |
| `204` | NO_CONTENT | Action succeeded with no body returned |
| `400` | BAD_REQUEST | Malformed JSON or input validation failure |
| `401` | UNAUTHORIZED | Missing, invalid, or expired JWT token |
| `403` | FORBIDDEN | User lacks `RESTAURANT` role or unapproved store |
| `404` | NOT_FOUND | Requested resource does not exist |
| `409` | CONFLICT | Business constraint violation (e.g. deleting category with active items) |
| `422` | UNPROCESSABLE_ENTITY | Business rule validation failure |
| `429` | TOO_MANY_REQUESTS | Rate limit exceeded (e.g. OTP request flood) |
| `500` | INTERNAL_SERVER_ERROR | Unexpected backend exception |

---

## 5. Restaurant Profile APIs

### Requirement 5.1: Fetch Restaurant Profile
- **Module**: Restaurant Profile
- **Purpose**: Retrieves master profile, operational hours, cuisine types, and approval status for the authenticated store.
- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/restaurants/me`
- **Authentication**: Required (`Authorization: Bearer <accessToken>`)
- **Required Role**: `RESTAURANT`
- **Frontend Screen**: `RestaurantSettingsScreen.tsx`, `DashboardScreen.tsx`
- **Success Status**: `200 OK`
- **Success Response JSON**:
  ```json
  {
    "success": true,
    "message": "Restaurant profile retrieved successfully",
    "data": {
      "restaurantId": "res_882910_uuid",
      "name": "Foodie Delights",
      "description": "Authentic North Indian, Tandoor & Biryani Specialties",
      "phone": "+919876543210",
      "email": "contact@foodiedelights.com",
      "logoImageUrl": "https://cdn.foodie.com/logos/res_882910.png",
      "coverImageUrl": "https://cdn.foodie.com/covers/res_882910.png",
      "cuisineTypes": ["North Indian", "Biryani", "Mughlai"],
      "status": "APPROVED",
      "approvalStatus": "APPROVED",
      "openingTime": "11:00",
      "closingTime": "23:00",
      "operatingDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
      "isOnline": true,
      "address": "124 MG Road, Koramangala 5th Block",
      "city": "Bengaluru",
      "state": "Karnataka",
      "country": "India",
      "pincode": "560095",
      "latitude": 12.9352,
      "longitude": 77.6245
    }
  }
  ```

---

### Requirement 5.2: Update Restaurant Profile
- **Module**: Restaurant Profile
- **Purpose**: Updates restaurant name, description, cuisine types, contact info, and operating hours.
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/v1/restaurants/me`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `RestaurantSettingsScreen.tsx`
- **Request Body**:
  ```json
  {
    "name": "Foodie Delights - Koramangala",
    "description": "Authentic Indian, Tandoor & Mughlai",
    "phone": "+919876543210",
    "email": "support@foodiedelights.com",
    "cuisineTypes": ["North Indian", "Biryani", "Kebabs"],
    "openingTime": "10:30",
    "closingTime": "23:30",
    "operatingDays": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
  }
  ```

---

### Requirement 5.3: Register Restaurant Onboarding
- **Module**: Restaurant Onboarding
- **Purpose**: Creates a new restaurant application submission during partner onboarding.
- **HTTP Method**: `POST`
- **Endpoint**: `/api/v1/restaurants`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `RestaurantRegistrationScreen.tsx`
- **Request Body**:
  ```json
  {
    "name": "Foodie Express",
    "description": "Fast casual Indian dining",
    "cuisineTypes": ["North Indian", "Fast Food"],
    "address": {
      "line1": "100 Feet Road, Indiranagar",
      "city": "Bengaluru",
      "pincode": "560038"
    }
  }
  ```
- **Success Status**: `201 CREATED`

---

### Requirement 5.4: Store Online/Offline Availability Toggle
- **Module**: Restaurant Availability Status
- **Purpose**: Allows store owner to toggle online ordering status.
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/v1/restaurants/me/status`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `DashboardOverviewCard.tsx`, `DashboardScreen.tsx`
- **Request Body**:
  ```json
  {
    "isOnline": false
  }
  ```
- **Business Rule**: The backend MUST verify `approvalStatus == 'APPROVED'` before permitting `isOnline = true`.

---

## 6. Business & Tax APIs

### Requirement 6.1: Fetch Business Details
- **Module**: Tax & Business Compliance
- **Purpose**: Retrieves GSTIN, PAN, legal entity name, business contact details, and FSSAI regulatory license information.
- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/restaurants/me/business-details`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `BankAndBusinessDetailsScreen.tsx`
- **Success Status**: `200 OK`
- **Success Response JSON (Masked PAN)**:
  ```json
  {
    "success": true,
    "message": "Business details retrieved",
    "data": {
      "gstin": "29ABCDE1234F1Z5",
      "panNumberMasked": "XXXXXX1234X",
      "legalName": "Foodie Restaurant Pvt Ltd",
      "businessType": "PRIVATE_LIMITED",
      "fssaiLicenseNumber": "12345678901234",
      "fssaiExpiryDate": "2027-12-31",
      "gstinVerificationStatus": "VERIFIED",
      "panVerificationStatus": "VERIFIED",
      "fssaiVerificationStatus": "VERIFIED",
      "businessEmail": "contact@foodiedelights.com",
      "businessPhone": "+919876543210",
      "registeredAddressLine1": "124 MG Road, Koramangala 5th Block",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560095"
    }
  }
  ```

---

### Requirement 6.2: Update Business Details
- **Module**: Tax & Business Compliance
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/v1/restaurants/me/business-details`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `BankAndBusinessDetailsScreen.tsx`
- **Request Body**:
  ```json
  {
    "gstin": "29ABCDE1234F1Z5",
    "panNumber": "ABCDE1234X",
    "legalName": "Foodie Restaurant Pvt Ltd",
    "businessType": "PRIVATE_LIMITED",
    "fssaiLicenseNumber": "12345678901234",
    "fssaiExpiryDate": "2027-12-31",
    "businessEmail": "contact@foodiedelights.com",
    "businessPhone": "+919876543210",
    "registeredAddressLine1": "124 MG Road, Koramangala 5th Block",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560095"
  }
  ```

---

## 7. Bank & UPI APIs

### Requirement 7.1: Fetch Bank Details
- **Module**: Bank Payout Details
- **Purpose**: Retrieves store owner bank account info and UPI IDs for payout disbursement.
- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/restaurants/me/bank-details`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `BankAndBusinessDetailsScreen.tsx`
- **Success Status**: `200 OK`
- **Success Response JSON (Masked Account Number)**:
  ```json
  {
    "success": true,
    "message": "Bank details retrieved",
    "data": {
      "accountHolderName": "Foodie Restaurant Pvt Ltd",
      "bankName": "HDFC Bank",
      "accountNumberMasked": "XXXX XXXX 4521",
      "ifscCode": "HDFC0001234",
      "accountType": "CURRENT",
      "branchName": "Koramangala 5th Block",
      "verificationStatus": "VERIFIED",
      "upiId": "foodierestaurant@upi",
      "upiVerificationStatus": "VERIFIED"
    }
  }
  ```

---

### Requirement 7.2: Update Bank Details
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/v1/restaurants/me/bank-details`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `BankAndBusinessDetailsScreen.tsx`
- **Request Body**:
  ```json
  {
    "accountHolderName": "Foodie Restaurant Pvt Ltd",
    "bankName": "HDFC Bank",
    "accountNumber": "98765432104521",
    "ifscCode": "HDFC0001234",
    "accountType": "CURRENT",
    "branchName": "Koramangala 5th Block",
    "upiId": "foodierestaurant@upi"
  }
  ```

---

### Requirement 7.3: Verify Bank Account & UPI ID
- **Endpoints**:
  - `POST /api/v1/restaurants/me/bank-details/verify`
  - `POST /api/v1/restaurants/me/upi/verify`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `BankAndBusinessDetailsScreen.tsx`

---

## 8. Restaurant Location APIs

### Requirement 8.1: Fetch Store Location & Map Coordinates
- **Module**: Restaurant Location
- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/restaurants/me/location`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `RestaurantLocationScreen.tsx`

---

### Requirement 8.2: Update Store Location & Coordinates
- **Module**: Restaurant Location
- **Purpose**: Persists final selected map coordinates, drag-and-drop marker pin, and address details.
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/v1/restaurants/me/location`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `RestaurantLocationScreen.tsx`, `RestaurantLocationMap.tsx`, `AddressSearch.tsx`
- **Request Body**:
  ```json
  {
    "latitude": 12.9352,
    "longitude": 77.6245,
    "addressLine1": "124 MG Road",
    "addressLine2": "Koramangala 5th Block",
    "landmark": "Opposite Metro Station",
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India",
    "pincode": "560095",
    "formattedAddress": "124 MG Road, Koramangala 5th Block, Bengaluru, Karnataka - 560095, India"
  }
  ```

---

## 9. Category APIs

### Endpoints
- `GET /api/v1/menu/categories` - List categories
- `POST /api/v1/menu/categories` - Create new category
- `PUT /api/v1/menu/categories/{categoryId}` - Update category
- `DELETE /api/v1/menu/categories/{categoryId}` - Delete category
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `CategoriesScreen.tsx`, `MenuItemsScreen.tsx`
- **Category Model**: `categoryId`, `restaurantId`, `name`, `displayOrder`, `itemCount`, `isActive`, `createdAt`, `updatedAt`.
- **Supported Categories**: `All Items`, `Biryani`, `Starters`, `Main Course`, `Beverages`, `Desserts`.

---

## 10. Menu Management APIs

### Endpoints
- `GET /api/v1/restaurants/me/menu` - Fetch complete menu
- `POST /api/v1/restaurants/me/menu/items` - Create menu item
- `GET /api/v1/restaurants/me/menu/items/{itemId}` - Fetch item details
- `PUT /api/v1/restaurants/me/menu/items/{itemId}` - Edit menu item
- `DELETE /api/v1/restaurants/me/menu/items/{itemId}` - Delete menu item
- `PATCH /api/v1/restaurants/me/menu/items/{itemId}/availability` - Toggle availability
- `POST /api/v1/restaurants/me/menu/items/{itemId}/variants` - Add variant
- `PUT /api/v1/restaurants/me/menu/items/{itemId}/variants/{variantId}` - Edit variant
- `DELETE /api/v1/restaurants/me/menu/items/{itemId}/variants/{variantId}` - Delete variant

> **CRITICAL FOOD TYPE RULE**:
> `foodType` MUST be strictly **`VEG`** or **`NON_VEG`**. Values like `EGG` are strictly prohibited across types, validation, and database storage.

#### Menu Item Payload Example:
```json
{
  "itemId": "item_501_uuid",
  "restaurantId": "res_882910_uuid",
  "categoryId": "cat_101_uuid",
  "categoryName": "Biryani",
  "name": "Hyderabadi Chicken Dum Biryani",
  "description": "Richly spiced chicken layered with saffron basmati rice",
  "basePrice": 280.00,
  "foodType": "NON_VEG",
  "isAvailable": true,
  "imageUrl": "https://cdn.foodie.com/items/item_501.jpg",
  "rating": 4.8,
  "preparationTime": "25 mins",
  "variants": [
    { "variantId": "v_1", "name": "Half (1 Person)", "price": 280.00, "isAvailable": true },
    { "variantId": "v_2", "name": "Full (2 Persons)", "price": 480.00, "isAvailable": true }
  ],
  "createdAt": "2026-02-01T10:00:00Z",
  "updatedAt": "2026-08-10T12:00:00Z"
}
```

---

## 11. Order APIs

### Endpoints
- `GET /api/v1/restaurants/me/orders` - List orders (supports `?status=`, `?search=`, `?fromDate=`, `?toDate=`, `?page=`, `?size=`)
- `GET /api/v1/restaurants/me/orders/{orderId}` - Fetch single order detail
- `PATCH /api/v1/restaurants/me/orders/{orderId}/status` - Update order status
- `POST /api/v1/restaurants/me/orders/{orderId}/reject` - Reject order (requires mandatory `reason` string)

### Allowed Status Transitions
- `CONFIRMED` ──► `ACCEPTED`
- `ACCEPTED` ──► `PREPARING`
- `PREPARING` ──► `READY_FOR_PICKUP`
- `READY_FOR_PICKUP` ──► `DELIVERED`
- `CONFIRMED` / `ACCEPTED` ──► `REJECTED` (with reason)
- `CONFIRMED` ──► `CANCELLED` (by customer/system)

---

## 12. Dashboard APIs

### Requirement 12.1: Dashboard Summary Metrics
- **Module**: Restaurant Analytics
- **HTTP Method**: `GET`
- **Endpoint**: `/api/v1/restaurants/me/dashboard`
- **Authentication**: Required (`RESTAURANT` JWT)
- **Frontend Screen**: `DashboardScreen.tsx`, `DashboardOverviewCard.tsx`
- **Success Response JSON**:
  ```json
  {
    "success": true,
    "message": "Dashboard analytics calculated",
    "data": {
      "todayOrders": 25,
      "pendingOrders": 6,
      "completedOrders": 18,
      "grossRevenue": 15450.00,
      "onlineStatus": "ONLINE",
      "restaurantName": "Foodie Delights",
      "logoImageUrl": "https://cdn.foodie.com/logos/res_123.jpg",
      "coverImageUrl": "https://cdn.foodie.com/covers/res_123.jpg",
      "recentOrders": []
    }
  }
  ```

---

## 13. Review APIs

- `GET /api/v1/restaurants/me/reviews` - Fetch customer review list
- `GET /api/v1/restaurants/me/reviews/summary` - Fetch ratings breakdown:
  ```json
  {
    "success": true,
    "message": "Review summary retrieved",
    "data": {
      "averageRating": 4.5,
      "totalReviews": 126,
      "fiveStar": 80,
      "fourStar": 30,
      "threeStar": 10,
      "twoStar": 4,
      "oneStar": 2
    }
  }
  ```

---

## 14. Image/File Upload APIs

| Asset Type | Method | Endpoint | Formats | Max Size | Frontend Component |
|------------|--------|----------|---------|----------|--------------------|
| Logo | `POST` | `/api/v1/restaurants/me/logo` | JPEG, PNG, WebP | 5 MB | `RestaurantSettingsScreen.tsx` |
| Cover Photo | `POST` | `/api/v1/restaurants/me/cover-image` | JPEG, PNG, WebP | 5 MB | `RestaurantSettingsScreen.tsx` |
| Menu Image | `POST` | `/api/v1/restaurants/me/menu/items/{itemId}/image` | JPEG, PNG, WebP | 5 MB | `AddEditItemModal.tsx` |

---

## 15. WebSocket APIs

- **STOMP Over WebSocket URL**: `wss://api.foodie.com/ws/restaurants/orders`
- **Topic Subscription**: `/topic/restaurants/{restaurantId}/orders`
- **Order Event Types**:
  - `ORDER_CREATED`: New order placed by customer.
  - `ORDER_STATUS_UPDATED`: Status transitioned.
  - `ORDER_CANCELLED`: Order cancelled.
- **REST Polling Fallback**: `GET /api/v1/restaurants/me/orders?updatedSince={timestamp}`

---

## 16. Pagination / Filtering / Sorting

All paginated list APIs MUST use Spring Data `PageImpl` JSON structure:
```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5,
  "hasNext": true
}
```

---

## 17. Validation Rules

- **Phone**: `^\+91[6-9]\d{9}$`
- **OTP**: Exactly 6 numeric digits
- **Latitude / Longitude**: -90 to 90 / -180 to 180
- **Pincode**: `^\d{6}$`
- **GSTIN**: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
- **PAN**: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- **FSSAI**: Exactly 14 numeric digits
- **Food Type**: `VEG` | `NON_VEG` only.

---

## 18. Database/Entity Relationships Required

```
User (1:1) ──► Restaurant
                │
                ├──► RestaurantLocation (1:1)
                ├──► RestaurantBusinessDetails (1:1)
                ├──► RestaurantBankDetails (1:1)
                ├──► MenuCategory (1:N) ──► MenuItem (1:N) ──► MenuItemVariant
                ├──► RestaurantOrder (1:N) ──► OrderItem (1:N) ──► OrderStatusHistory
                ├──► Wallet (1:1) ──► WalletTransaction (1:N) ──► Payout
                ├──► RestaurantReview (1:N)
                └──► Notification (1:N)
```

---

## 19. Frontend-to-Backend API Mapping

| Frontend Feature | Frontend File | Required API | HTTP Method | Authentication | Status |
|------------------|---------------|--------------|-------------|----------------|--------|
| Phone OTP Request | `PhoneAuthScreen.tsx` | `/api/v1/auth/otp/request` | `POST` | Public | `REQUIRED` |
| Phone OTP Verify | `OtpVerificationScreen.tsx` | `/api/v1/auth/otp/verify` | `POST` | Public | `REQUIRED` |
| Password Login | `PhoneAuthScreen.tsx` | `/api/v1/auth/login` | `POST` | Public | `EXISTS` |
| Token Refresh | `authSlice.ts` | `/api/v1/auth/refresh` | `POST` | Public | `REQUIRED` |
| Session Logout | `RestaurantSettingsScreen.tsx` | `/api/v1/auth/logout` | `POST` | `RESTAURANT` | `REQUIRED` |
| Current User Context | `authSlice.ts` | `/api/v1/auth/me` | `GET` | `RESTAURANT` | `REQUIRED` |
| Fetch Store Profile | `RestaurantSettingsScreen.tsx` | `/api/v1/restaurants/me` | `GET` | `RESTAURANT` | `EXISTS` |
| Update Profile | `RestaurantSettingsScreen.tsx` | `/api/v1/restaurants/me` | `PUT` | `RESTAURANT` | `EXISTS` |
| Store Registration | `RestaurantRegistrationScreen.tsx` | `/api/v1/restaurants` | `POST` | `RESTAURANT` | `EXISTS` |
| Logo Upload | `RestaurantSettingsScreen.tsx` | `/api/v1/restaurants/me/logo` | `POST` | `RESTAURANT` | `EXISTS` |
| Cover Image Upload | `RestaurantSettingsScreen.tsx` | `/api/v1/restaurants/me/cover-image` | `POST` | `RESTAURANT` | `EXISTS` |
| Store Status Toggle | `DashboardOverviewCard.tsx` | `/api/v1/restaurants/me/status` | `PUT` | `RESTAURANT` | `REQUIRED` |
| Business Details | `BankAndBusinessDetailsScreen.tsx` | `/api/v1/restaurants/me/business-details` | `GET`/`PUT` | `RESTAURANT` | `EXISTS` |
| Bank Details | `BankAndBusinessDetailsScreen.tsx` | `/api/v1/restaurants/me/bank-details` | `GET`/`PUT` | `RESTAURANT` | `EXISTS` |
| Bank Verify | `BankAndBusinessDetailsScreen.tsx` | `/api/v1/restaurants/me/bank-details/verify` | `POST` | `RESTAURANT` | `EXISTS` |
| UPI Verify | `BankAndBusinessDetailsScreen.tsx` | `/api/v1/restaurants/me/upi/verify` | `POST` | `RESTAURANT` | `EXISTS` |
| Store Location | `RestaurantLocationScreen.tsx` | `/api/v1/restaurants/me/location` | `GET`/`PUT` | `RESTAURANT` | `EXISTS` |
| Menu Categories | `CategoriesScreen.tsx` | `/api/v1/menu/categories` | `GET`/`POST`/`PUT`/`DELETE` | `RESTAURANT` | `EXISTS` |
| Menu Items List | `MenuItemsScreen.tsx` | `/api/v1/restaurants/me/menu` | `GET` | `RESTAURANT` | `REQUIRED` |
| Menu Item Create | `AddEditItemModal.tsx` | `/api/v1/restaurants/me/menu/items` | `POST` | `RESTAURANT` | `REQUIRED` |
| Menu Item Update | `AddEditItemModal.tsx` | `/api/v1/restaurants/me/menu/items/{id}` | `PUT` | `RESTAURANT` | `REQUIRED` |
| Menu Item Delete | `MenuItemsScreen.tsx` | `/api/v1/restaurants/me/menu/items/{id}` | `DELETE` | `RESTAURANT` | `REQUIRED` |
| Item Availability | `MenuItemsScreen.tsx` | `/api/v1/restaurants/me/menu/items/{id}/availability` | `PATCH` | `RESTAURANT` | `REQUIRED` |
| Item Image Upload | `AddEditItemModal.tsx` | `/api/v1/restaurants/me/menu/items/{id}/image` | `POST` | `RESTAURANT` | `REQUIRED` |
| Item Variants | `AddEditItemModal.tsx` | `/api/v1/restaurants/me/menu/items/{id}/variants` | `POST`/`PUT`/`DELETE` | `RESTAURANT` | `REQUIRED` |
| Orders List | `IncomingOrdersScreen.tsx` | `/api/v1/restaurants/me/orders` | `GET` | `RESTAURANT` | `REQUIRED` |
| Order Status Update | `OrderCard.tsx` | `/api/v1/restaurants/me/orders/{id}/status` | `PATCH` | `RESTAURANT` | `REQUIRED` |
| Reject Order | `OrderCard.tsx` | `/api/v1/restaurants/me/orders/{id}/reject` | `POST` | `RESTAURANT` | `REQUIRED` |
| Dashboard Metrics | `DashboardScreen.tsx` | `/api/v1/restaurants/me/dashboard` | `GET` | `RESTAURANT` | `REQUIRED` |
| Reviews List | `ReviewsScreen.tsx` | `/api/v1/restaurants/me/reviews` | `GET` | `RESTAURANT` | `EXISTS` |
| Reviews Summary | `ReviewSummaryCard.tsx` | `/api/v1/restaurants/me/reviews/summary` | `GET` | `RESTAURANT` | `EXISTS` |
| Notifications List | `NotificationsScreen.tsx` | `/api/v1/restaurants/me/notifications` | `GET` | `RESTAURANT` | `REQUIRED` |

---

## 20. API Implementation Checklist

- [ ] **Authentication**: OTP request, OTP verify, password login, refresh token, logout, user session context (`/auth/me`)
- [ ] **Restaurant Profile**: Fetch profile, update profile, register store, upload logo, upload cover image
- [ ] **Business Details**: Fetch & update GSTIN, PAN (masked), FSSAI license, business address
- [ ] **Bank Details**: Fetch & update bank account (masked), account verification
- [ ] **UPI**: Fetch & verify UPI ID
- [ ] **GST/PAN/FSSAI**: Verification APIs & expiry date tracking
- [ ] **Location**: Get & update map coordinates, latitude/longitude validation, address persistence
- [ ] **Categories**: List, create, update, delete menu categories
- [ ] **Menu CRUD**: List items, create item, edit item, delete item
- [ ] **Menu Images**: Multipart menu item image upload
- [ ] **Menu Variants**: Add, edit, delete dish size/type variants
- [ ] **Availability**: Toggle dish online availability
- [ ] **Dashboard**: Aggregate today's orders, pending orders, completed orders, gross revenue
- [ ] **Orders**: Incoming orders list, order details, pagination, filtering by status
- [ ] **Order Status Transitions**: State machine enforcement (`CONFIRMED -> ACCEPTED -> PREPARING -> READY_FOR_PICKUP -> DELIVERED`)
- [ ] **Order Rejection**: Reject order with mandatory rejection reason
- [ ] **Reviews**: Customer review listing & ratings breakdown summary
- [ ] **WebSocket**: STOMP live orders connection & topic subscription
- [ ] **Error Handling**: Standardized error envelope & HTTP status mapping
- [ ] **Validation**: Input regexes, coordinate ranges, pincodes, file mime validation
- [ ] **Database Integration**: JPA entities, foreign keys, tenant isolation indexing
- [ ] **API Documentation**: OpenAPI 3.0 / Swagger UI configuration

---

## 21. Summary of Changes & Missing APIs

### Summary of Added Sections & Document Enhancements:
1. Restructured document into the 20 requested top-level sections.
2. Standardized common success `{ "success": true, "message": "...", "data": {} }` and error `{ "success": false, "message": "...", "errorCode": "VALIDATION_ERROR", "errors": {} }` formats.
3. Expanded every backend requirement with HTTP method, endpoint, authentication level, role requirement, parameters, payloads, status codes, and frontend screen basenames.
4. Added live STOMP WebSocket specification and REST polling fallback guidelines.
5. Added database entity relationship diagram across 14 domain entities.
6. Created comprehensive Frontend-to-Backend API Mapping table.
7. Included complete 22-item implementation checklist for backend developers.

### Frontend APIs Missing / Requiring Backend Implementation:
1. `POST /api/v1/auth/otp/request` & `POST /api/v1/auth/otp/verify` (Phone OTP authentication)
2. `POST /api/v1/auth/refresh` & `POST /api/v1/auth/logout` & `GET /api/v1/auth/me` (Session lifecycle)
3. `PUT /api/v1/restaurants/me/status` (Online/offline store toggle)
4. `GET /api/v1/restaurants/me/menu` & CRUD on `/items` (Full menu items management)
5. `PATCH /api/v1/restaurants/me/menu/items/{id}/availability` (Dish availability toggle)
6. `POST /api/v1/restaurants/me/menu/items/{id}/image` (Dish image upload)
7. CRUD on `/api/v1/restaurants/me/menu/items/{id}/variants` (Dish variants)
8. `GET /api/v1/restaurants/me/orders` & status update/reject endpoints (Orders processing)
9. `GET /api/v1/restaurants/me/dashboard` (Dashboard aggregate statistics)
10. `wss://api.foodie.com/ws/restaurants/orders` (Live WebSocket order updates)

### Requirements Inconsistencies Resolved:
- **Food Type**: Enforced strictly `VEG` or `NON_VEG` (removed `EGG`).
- **Data Security**: Masked account numbers and PAN numbers in all GET responses.
- **Tenant Isolation**: Mandated `WHERE restaurant_id = :authenticatedRestaurantId` on all database queries.
