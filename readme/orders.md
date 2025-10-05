# Orders API Documentation

## Overview

The Orders API provides comprehensive endpoints for managing customer orders, including creation, retrieval, modification, and deletion. The API supports complex order structures with multiple items, product options, and automatic tax calculations.

## Base URL

```
http://localhost:8000/api/orders
```

## Authentication

- **All Endpoints**: Require authentication via Sanctum
- **Authentication Method**: Bearer token via Sanctum
- **Token Required**: Include `Authorization: Bearer YOUR_TOKEN` header in all requests

## Endpoints

### 1. Get User's Orders

**Endpoint**: `GET /api/orders`

**Description**: Retrieve all orders for the authenticated user with filtering, sorting, and pagination.

**Authentication**: Required (Bearer token)

**Parameters**:
- `status` (string, optional): Filter by order status (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`)
- `search` (string, optional): Search in order number or phone
- `sort_by` (string, optional): Sort field (`created_at`, `order_number`, `total`, `status`)
- `sort_order` (string, optional): Sort direction (`asc`, `desc`)
- `per_page` (integer, optional): Items per page (1-100, default: 15)

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/orders?status=pending&sort_by=created_at&sort_order=desc&per_page=10" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example Response**:
```json
{
  "data": [
    {
      "id": 215,
      "order_number": "ORD2025090215",
      "user_id": 1,
      "phone": "+1234567890",
      "shipping_address": "123 Main Street, New York, NY 10001",
      "billing_address": "123 Main Street, New York, NY 10001",
      "notes": "Test order from API",
      "status": "pending",
      "subtotal": 444.0,
      "tax": 66.6,
      "total": 510.6,
      "created_at": "2025-09-26T01:06:25.000000Z",
      "updated_at": "2025-09-26T01:06:25.000000Z",
      "items": [
        {
          "id": 1,
          "order_id": 215,
          "product_id": 31,
          "quantity": 2,
          "unit_price": 222.0,
          "total_price": 444.0,
          "options": "[]",
          "notes": "Test item",
          "created_at": "2025-09-26T01:06:25.000000Z",
          "updated_at": "2025-09-26T01:06:25.000000Z",
          "product": {
            "id": 31,
            "name": "fdsf",
            "base_price": "222.00",
            "image": "http://localhost:8000/uploads/products/1758504968_0_design-1757986927412.png"
          }
        }
      ]
    }
  ],
  "links": {
    "first": "http://localhost:8000/api/orders?page=1",
    "last": "http://localhost:8000/api/orders?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "per_page": 15,
    "to": 1,
    "total": 1
  }
}
```

### 2. Get Specific Order Details

**Endpoint**: `GET /api/orders/{order}`

**Description**: Retrieve detailed information about a specific order.

**Authentication**: Required (Bearer token)

**Parameters**:
- `order` (integer, required): Order ID

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/orders/215" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "id": 215,
    "order_number": "ORD2025090215",
    "user_id": 1,
    "phone": "+1234567890",
    "shipping_address": "123 Main Street, New York, NY 10001",
    "billing_address": "123 Main Street, New York, NY 10001",
    "notes": "Test order from API",
    "status": "pending",
    "subtotal": 444.0,
    "tax": 66.6,
    "total": 510.6,
    "created_at": "2025-09-26T01:06:25.000000Z",
    "updated_at": "2025-09-26T01:06:25.000000Z",
    "items": [
      {
        "id": 1,
        "order_id": 215,
        "product_id": 31,
        "quantity": 2,
        "unit_price": 222.0,
        "total_price": 444.0,
        "options": "[]",
        "notes": "Test item",
        "product": {
          "id": 31,
          "name": "fdsf",
          "base_price": "222.00",
          "image": "http://localhost:8000/uploads/products/1758504968_0_design-1757986927412.png"
        }
      }
    ]
  }
}
```

### 3. Create New Order

**Endpoint**: `POST /api/orders`

**Description**: Create a new order with multiple items and product options.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "phone": "string (required)",
  "shipping_address": "string (optional)",
  "billing_address": "string (optional)",
  "notes": "string (optional)",
  "items": [
    {
      "product_id": "integer (required)",
      "quantity": "integer (required, min:1)",
      "options": "array (optional)",
      "notes": "string (optional)"
    }
  ]
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8000/api/orders" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "phone": "+1234567890",
    "shipping_address": "123 Main Street, New York, NY 10001",
    "billing_address": "123 Main Street, New York, NY 10001",
    "notes": "Test order from API",
    "items": [
      {
        "product_id": 31,
        "quantity": 2,
        "notes": "Test item"
      }
    ]
  }'
```

**Example Response**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 215,
    "order_number": "ORD2025090215",
    "user_id": 1,
    "phone": "+1234567890",
    "shipping_address": "123 Main Street, New York, NY 10001",
    "billing_address": "123 Main Street, New York, NY 10001",
    "notes": "Test order from API",
    "status": "pending",
    "subtotal": 444.0,
    "tax": 66.6,
    "total": 510.6,
    "created_at": "2025-09-26T01:06:25.000000Z",
    "updated_at": "2025-09-26T01:06:25.000000Z",
    "items": [
      {
        "id": 1,
        "order_id": 215,
        "product_id": 31,
        "quantity": 2,
        "unit_price": 222.0,
        "total_price": 444.0,
        "options": "[]",
        "notes": "Test item",
        "product": {
          "id": 31,
          "name": "fdsf",
          "base_price": "222.00",
          "image": "http://localhost:8000/uploads/products/1758504968_0_design-1757986927412.png"
        }
      }
    ]
  }
}
```

### 4. Delete Order

**Endpoint**: `DELETE /api/orders/{order}`

**Description**: Delete a specific order (only if status is pending).

**Authentication**: Required (Bearer token)

**Parameters**:
- `order` (integer, required): Order ID

**Example Request**:
```bash
curl -X DELETE "http://localhost:8000/api/orders/215" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example Response**:
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

## Order Management Features

### Automatic Calculations

The Orders API automatically calculates:
- **Subtotal**: Sum of all item prices (base price + options)
- **Tax**: 15% of subtotal
- **Total**: Subtotal + tax

### Product Options Support

Orders support complex product configurations:
- **Base Price**: Product's base price
- **Options**: Additional features with price adjustments
- **Total Price**: Base price + option adjustments × quantity

### Order Status Management

Orders progress through these statuses:
- `pending`: Initial status, can be modified/deleted
- `confirmed`: Order confirmed, cannot be modified
- `processing`: Order being processed
- `shipped`: Order shipped to customer
- `delivered`: Order delivered successfully
- `cancelled`: Order cancelled

### User Access Control

- Users can only access their own orders
- Order modification/deletion restricted to pending orders
- Admin users have full access to all orders

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "phone": ["The phone field is required."],
    "items.0.product_id": ["The items.0.product_id field is required."]
  }
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthenticated"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "message": "Unauthorized access to order"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "message": "Order not found"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Failed to create order",
  "error": "Database connection failed"
}
```

## Data Models

### Order Object

```json
{
  "id": "integer",
  "order_number": "string",
  "user_id": "integer",
  "phone": "string",
  "shipping_address": "string|null",
  "billing_address": "string|null",
  "notes": "string|null",
  "status": "string (pending|confirmed|processing|shipped|delivered|cancelled)",
  "subtotal": "number",
  "tax": "number",
  "total": "number",
  "created_at": "datetime",
  "updated_at": "datetime",
  "items": "array of OrderItem objects"
}
```

### OrderItem Object

```json
{
  "id": "integer",
  "order_id": "integer",
  "product_id": "integer",
  "quantity": "integer",
  "unit_price": "number",
  "total_price": "number",
  "options": "string (JSON array)",
  "notes": "string|null",
  "created_at": "datetime",
  "updated_at": "datetime",
  "product": "Product object"
}
```

## Working Example

Here's a complete working example of how to use the Orders API:

```bash
# 1. Login to get authentication token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@user.com","password":"password123"}'

# Response: {"success":true,"data":{"token":"7|mzVN3jNVfRD5p9AwQ1..."}}

# 2. Get user's orders
curl -X GET "http://localhost:8000/api/orders" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 7|mzVN3jNVfRD5p9AwQ1..."

# 3. Create a new order
curl -X POST "http://localhost:8000/api/orders" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 7|mzVN3jNVfRD5p9AwQ1..." \
  -d '{
    "phone": "+1234567890",
    "shipping_address": "123 Main Street, New York, NY 10001",
    "items": [
      {
        "product_id": 31,
        "quantity": 2,
        "notes": "Test item"
      }
    ]
  }'

# 4. Get specific order details
curl -X GET "http://localhost:8000/api/orders/215" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 7|mzVN3jNVfRD5p9AwQ1..."

# 5. Delete order (if status is pending)
curl -X DELETE "http://localhost:8000/api/orders/215" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 7|mzVN3jNVfRD5p9AwQ1..."
```

## Test Results

All endpoints are verified to work correctly:
- ✅ Authentication with user@user.com working
- ✅ Orders API endpoints working
- ✅ Order creation working (with automatic tax calculation)
- ✅ Order retrieval working (with filtering and pagination)
- ✅ Order filtering working (by status, search, sorting)
- ✅ Order deletion working (pending orders only)

## Implementation Notes

### Database Transactions

All order operations use database transactions to ensure data consistency:
- Order creation with multiple items
- Order modification with recalculations
- Order deletion with cascading item removal

### Tax Calculation

- **Tax Rate**: 15% of subtotal
- **Automatic**: Calculated on order creation/update
- **Consistent**: Applied to all orders

### Order Number Generation

- **Format**: `ORD{YYYYMMDD}{ID}`
- **Unique**: Auto-generated sequential numbers
- **Example**: `ORD2025090215`

### Product Options Integration

- **JSON Storage**: Options stored as JSON array
- **Price Adjustments**: Automatically calculated
- **Validation**: Options validated against product specifications

## Security Considerations

1. **Authentication**: All endpoints require valid Bearer tokens
2. **Authorization**: Users can only access their own orders
3. **Input Validation**: All inputs validated according to Laravel rules
4. **SQL Injection**: Protected by Laravel's Eloquent ORM
5. **XSS Protection**: Output properly escaped
6. **Order Modification**: Restricted to pending orders only

## Future Enhancements

1. **Order Status Updates**: Real-time status notifications
2. **Payment Integration**: Automatic payment processing
3. **Inventory Management**: Stock level checking
4. **Order Tracking**: Shipping and delivery tracking
5. **Bulk Operations**: Multiple order management
6. **Order Templates**: Save and reuse order configurations
7. **Advanced Filtering**: Date ranges, amount ranges, etc.

## Support

For technical support or questions about the Orders API, please refer to the main application documentation or contact the development team.
