# Backend Requirements for POSBilling Integration

## Overview
This document outlines all backend requirements and changes needed to properly integrate with the POSBilling frontend component. The frontend expects specific API endpoints and data structures.

---

## Database Schema Requirements

### Orders Table
```prisma
model Order {
  id            String      @id @default(cuid())
  restaurantId  String
  totalAmount   Float
  status        String      // 'pending', 'completed', 'cancelled'
  items         OrderItem[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  itemId    String
  quantity  Int
  price     Float
  createdAt DateTime @default(now())
}
```

### Tables Management
```prisma
model Table {
  id            String    @id @default(cuid())
  restaurantId  String
  tableNumber   Int
  capacity      Int
  status        String    // 'available', 'occupied'
  currentOrder  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Customers
```prisma
model Customer {
  id            String      @id @default(cuid())
  restaurantId  String
  name          String
  email         String?
  phone         String?
  loyaltyPoints Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

---

## Required API Endpoints

### Orders API

#### 1. Create Order
- **Endpoint:** `POST /api/orders`
- **Request Body:**
```json
{
  "restaurantId": "string",
  "tableId": "string",
  "items": [
    {
      "itemId": "string",
      "quantity": number,
      "price": number
    }
  ],
  "totalAmount": number
}
```
- **Response:** Created order object with id
- **Error Handling:** 
  - 400: Invalid data
  - 500: Database error

#### 2. Get All Orders
- **Endpoint:** `GET /api/orders`
- **Query Parameters:** 
  - `restaurantId` (required)
  - `status` (optional): filter by status
  - `limit` (optional): default 50
  - `offset` (optional): default 0
- **Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "restaurantId": "string",
      "totalAmount": number,
      "status": "string",
      "items": [ ... ],
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "total": number
}
```

#### 3. Get Order by ID
- **Endpoint:** `GET /api/orders/:id`
- **Response:** Single order object
- **Error Handling:**
  - 404: Order not found

#### 4. Update Order
- **Endpoint:** `PUT /api/orders/:id`
- **Request Body:**
```json
{
  "status": "string",
  "totalAmount": number
}
```
- **Response:** Updated order object

#### 5. Update Table Status
- **Endpoint:** `PUT /api/tables/:id`
- **Request Body:**
```json
{
  "status": "available" | "occupied",
  "currentOrder": "string (orderId) or null"
}
```
- **Response:** Updated table object

### Tables API

#### 1. Get All Tables
- **Endpoint:** `GET /api/tables`
- **Query Parameters:**
  - `restaurantId` (required)
- **Response:**
```json
{
  "tables": [
    {
      "id": "string",
      "restaurantId": "string",
      "tableNumber": number,
      "capacity": number,
      "status": "string",
      "currentOrder": "string or null",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

#### 2. Create Table
- **Endpoint:** `POST /api/tables`
- **Request Body:**
```json
{
  "restaurantId": "string",
  "tableNumber": number,
  "capacity": number
}
```
- **Response:** Created table object

### Customers API

#### 1. Add Customer
- **Endpoint:** `POST /api/customers`
- **Request Body:**
```json
{
  "restaurantId": "string",
  "name": "string",
  "email": "string (optional)",
  "phone": "string (optional)"
}
```
- **Response:** Created customer object

#### 2. Award Loyalty Points
- **Endpoint:** `POST /api/customers/:id/award-points`
- **Request Body:**
```json
{
  "points": number
}
```
- **Response:** Updated customer object with new points

---

## Frontend Integration Points

These are the frontend functions that call the backend:

1. `createOrder()` → **POST** /api/orders
2. `getAllOrders()` → **GET** /api/orders
3. `updateOrderStatus()` → **PUT** /api/orders/:id
4. `updateTableStatus()` → **PUT** /api/tables/:id
5. `addCustomer()` → **POST** /api/customers
6. `awardLoyaltyPoints()` → **POST** /api/customers/:id/award-points
7. `subscribeToOrderUpdates()` → **GET** /api/orders/stream (SSE)

---

## Data Flow

### Order Creation Flow
1. User submits order on frontend
2. Frontend calls `createOrder()` with order details
3. Backend validates input
4. Backend creates Order + OrderItems in database
5. Backend updates Table status to "occupied"
6. Backend returns created order with ID
7. Frontend displays order confirmation

### Real-time Updates
1. Frontend calls `subscribeToOrderUpdates()` on mount
2. Backend maintains Server-Sent Events (SSE) stream
3. When order status changes, backend broadcasts update
4. Frontend receives update and refreshes display

---

## Multi-Tenant Requirements

All API endpoints MUST:
- Include `restaurantId` validation
- Filter queries by `restaurantId`
- Return 403 Forbidden if accessing another restaurant's data
- Never leak data across restaurants

---

## Validation Requirements

### Order Validation
- `totalAmount` must be > 0
- `items` array must not be empty
- Each item must have valid `itemId`, `quantity` > 0, `price` > 0
- `status` must be one of: 'pending', 'completed', 'cancelled'

### Table Validation
- `tableNumber` must be unique per restaurant
- `capacity` must be > 0
- `status` must be one of: 'available', 'occupied'

### Customer Validation
- `name` is required and max 255 characters
- `email` must be valid format if provided
- `phone` must be valid format if provided

---

## Error Handling

All endpoints should return standard error format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": number
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

---

## Testing Checklist

- [ ] Create order with valid data → 201 response
- [ ] Create order with invalid data → 400 response
- [ ] Get order that doesn't exist → 404 response
- [ ] Update order status → order updated correctly
- [ ] Get tables for restaurant → returns all tables
- [ ] Update table status → reflects immediately
- [ ] Add customer → creates customer correctly
- [ ] Award loyalty points → points updated
- [ ] SSE stream → receives updates in real-time
- [ ] Multi-tenant isolation → cannot access other restaurant data

---

## Integration Checklist

- [ ] Prisma schema updated with Order, Table, Customer models
- [ ] Database migrations run successfully
- [ ] API routes created in src/routes/
- [ ] Request validation middleware applied
- [ ] Error handling implemented for all endpoints
- [ ] Multi-tenant checks added to all queries
- [ ] SSE stream endpoint implemented
- [ ] Tests written for all endpoints
- [ ] Frontend tested against backend
- [ ] Staging deployment successful
