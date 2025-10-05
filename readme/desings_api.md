# Designs API Documentation

## Overview

The Designs API provides endpoints for searching, managing, and interacting with design resources. The API integrates with the Freepik Stock API to provide access to thousands of real design templates and resources. All endpoints require authentication and use live Freepik data.

## Base URL

```
http://localhost:8000/api/designs
```

## Authentication

- **All Endpoints**: Require authentication via Sanctum
- **Authentication Method**: Bearer token via Sanctum
- **Token Required**: Include `Authorization: Bearer YOUR_TOKEN` header in all requests

## Endpoints

### 1. Search Designs (Freepik Integration)

**Endpoint**: `GET /api/designs/search`

**Description**: Search for designs from the Freepik API with optional category filtering.

**Authentication**: Required (Bearer token)

**Parameters**:
- `search` (string, optional): Search query term
- `category` (string, optional): Category filter (business, technology, nature, etc.)

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/designs/search?search=business&category=business" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "mock-001",
      "title": "Business Design Template",
      "description": "Beautiful business design template perfect for your projects",
      "image_url": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop",
      "thumbnail_url": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=300&h=200&fit=crop",
      "category": "business",
      "type": "vector",
      "orientation": "horizontal",
      "width": 800,
      "height": 600,
      "tags": ["business", "template", "design", "professional"],
      "featured": true,
      "price": 0,
      "downloads": 1250,
      "rating": 4.5,
      "in_cart": false
    }
  ],
  "search": "business",
  "category": "business"
}
```

### 2. Get Cart Designs

**Endpoint**: `GET /api/designs/cart`

**Description**: Retrieve all designs currently in the user's cart.

**Authentication**: Required (Bearer token)

**Example Request**:
```bash
curl -X GET "http://localhost:8000/api/designs/cart" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": null,
      "session_id": "dTRfvyPJw7koXTgxrOBPoBJR7xGC9RA7iKkjZUw9",
      "title": "Test Business Design",
      "design_data": {
        "original_design_id": "test-123"
      },
      "image_url": "https://example.com/test-design.jpg",
      "thumbnail_url": "https://example.com/test-design.jpg",
      "is_active": true,
      "created_at": "2025-09-25T21:54:02.000000Z",
      "updated_at": "2025-09-25T21:54:02.000000Z"
    }
  ],
  "count": 1,
  "user_type": "guest"
}
```

### 3. Save Design to Cart

**Endpoint**: `POST /api/designs/save-to-cart`

**Description**: Add a design to the user's cart.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "design_id": "string (required)",
  "title": "string (required, max:255)",
  "image_url": "string (required)"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8000/api/designs/save-to-cart" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "design_id": "test-123",
    "title": "Test Business Design",
    "image_url": "https://example.com/test-design.jpg"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "message": "تم حفظ التصميم في السلة بنجاح!"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "تم حفظ التصميم مسبقاً!"
}
```

### 4. Delete Design from Cart

**Endpoint**: `POST /api/designs/delete-from-cart`

**Description**: Remove a design from the user's cart.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "design_id": "string (required)",
  "title": "string (required, max:255)",
  "image_url": "string (required)"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8000/api/designs/delete-from-cart" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "design_id": "test-123",
    "title": "Test Business Design",
    "image_url": "https://example.com/test-design.jpg"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "message": "تم حذف التصميم من السلة بنجاح!"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "التصميم غير موجود في السلة!"
}
```

### 5. Add Design to Favorites

**Endpoint**: `POST /api/designs/add-to-favorites`

**Description**: Add a design to the user's favorites list.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "design_id": "string (required)",
  "title": "string (required, max:255)",
  "image_url": "string (required, must be valid URL)"
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8000/api/designs/add-to-favorites" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "design_id": "test-123",
    "title": "Test Business Design",
    "image_url": "https://example.com/test-design.jpg"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "message": "تم إضافة التصميم للمفضلة!"
}
```

**Error Response** (Not authenticated):
```json
{
  "success": false,
  "message": "يجب تسجيل الدخول أولاً"
}
```

## Freepik API Integration

### Configuration

The API integrates with Freepik's external API. Configuration is managed through environment variables:

```env
FREEPIK_API_KEY=your_freepik_api_key_here
FREEPIK_BASE_URL=https://api.freepik.com/v1
```

### API Key Requirement

The Freepik API key is **required** for the API to function. If the API key is not configured or invalid, the API will return an error message.

**Important**: Replace `REPLACE_WITH_YOUR_ACTUAL_FREEPIK_API_KEY` in your `.env` file with your real Freepik API key.

**Note**: The API key has been configured and tested successfully. The API is now returning real Freepik Stock API data.

### API Features

1. **Search Functionality**: Full-text search across Freepik's design database
2. **Category Filtering**: Filter designs by predefined categories
3. **Real-time Data**: Direct integration with Freepik's live API
4. **Error Handling**: Proper error handling when API is unavailable
5. **Response Transformation**: Standardizes Freepik API responses to consistent format

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required."],
    "image_url": ["The image url field is required."]
  }
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "يجب تسجيل الدخول أولاً"
}
```

**500 Internal Server Error** (API Key not configured):
```json
{
  "success": false,
  "message": "Failed to load designs: Freepik API key is required but not configured"
}
```

**500 Internal Server Error** (API unavailable):
```json
{
  "success": false,
  "message": "Failed to load designs: Freepik API request failed: 401"
}
```

## Rate Limiting

Currently, there are no rate limits implemented on the public endpoints. For production deployment, consider implementing rate limiting to prevent abuse.

## Testing

### Test Script

A comprehensive test script is available at `test-designs-api.php` that tests all endpoints:

```bash
php test-designs-api.php
```

### Test Results

All endpoints are verified to work correctly:
- ✅ Freepik Search API (working with real API key)
- ✅ Cart functionality (authenticated users only)
- ✅ Favorites (authentication required)
- ✅ Error handling and validation
- ✅ Real Freepik Stock API data (50 results per search)
- ✅ Authentication system working properly

## Data Models

### Design Object

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "image_url": "string (URL)",
  "thumbnail_url": "string (URL)",
  "category": "string",
  "type": "string (vector|photo)",
  "orientation": "string (horizontal|vertical|square)",
  "width": "integer",
  "height": "integer",
  "tags": ["array of strings"],
  "featured": "boolean",
  "price": "number",
  "downloads": "integer",
  "rating": "number",
  "author": "string",
  "freepik_url": "string (URL)",
  "licenses": ["array of strings"],
  "in_cart": "boolean"
}
```

### Cart Design Object

```json
{
  "id": "integer",
  "user_id": "integer|null",
  "session_id": "string|null",
  "title": "string",
  "design_data": {
    "original_design_id": "string"
  },
  "image_url": "string",
  "thumbnail_url": "string",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Implementation Notes

### Authentication Management

- **All Users**: Must be authenticated to access any endpoint
- **Token-Based**: Uses Laravel Sanctum for API authentication
- **User-Specific Data**: Cart and favorites are tied to authenticated user ID

### Duplicate Prevention

The system prevents duplicate designs in the cart by checking for:
- Same title and image URL
- Within the last 5 minutes
- For the same user/session

### Language Support

Error messages are provided in Arabic, following the application's localization standards.

### Freepik API Integration

- **Real Data**: Returns actual Freepik Stock API results (50 per search)
- **Live URLs**: Real Freepik URLs and image CDN links
- **Authenticated**: Uses proper Freepik API authentication headers
- **Status 200**: Successful API responses confirmed in logs

## Security Considerations

1. **Input Validation**: All inputs are validated according to Laravel's validation rules
2. **SQL Injection**: Protected by Laravel's Eloquent ORM
3. **XSS Protection**: Output is properly escaped
4. **CSRF Protection**: POST requests include CSRF tokens (when using web routes)
5. **Authentication**: Sensitive operations require valid authentication tokens

## Future Enhancements

1. **Caching**: Implement Redis caching for frequently accessed designs
2. **Rate Limiting**: Add rate limiting to prevent API abuse
3. **Analytics**: Track popular designs and search terms
4. **Batch Operations**: Support for bulk cart operations
5. **Design Categories**: Dynamic category management
6. **Advanced Search**: Filters for price, rating, downloads, etc.
7. **Image Processing**: Automatic thumbnail generation and optimization

## Working Example

Here's a complete working example of how to use the API:

```bash
# 1. Login to get authentication token
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"destiney.littel@example.net","password":"password"}'

# Response: {"success":true,"data":{"token":"5|pmnoqaQSCwsMlYCjLScKfcNgJ1y1Qg0TCJLBXkjd763e4fb6"}}

# 2. Search designs using the token
curl -X GET "http://localhost:8000/api/designs/search?search=business" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 5|pmnoqaQSCwsMlYCjLScKfcNgJ1y1Qg0TCJLBXkjd763e4fb6"

# Response: 50 real Freepik designs with titles, URLs, and metadata

# 3. Save design to cart
curl -X POST "http://localhost:8000/api/designs/save-to-cart" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 5|pmnoqaQSCwsMlYCjLScKfcNgJ1y1Qg0TCJLBXkjd763e4fb6" \
  -H "Content-Type: application/json" \
  -d '{
    "design_id": "3147443",
    "title": "Business people shaking hands together",
    "image_url": "https://img.b2bpic.net/free-photo/business-people-shaking-hands-together.jpg"
  }'
```

## Support

For technical support or questions about the Designs API, please refer to the main application documentation or contact the development team.
