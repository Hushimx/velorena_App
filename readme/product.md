# Products API Documentation

## Overview

The Products API provides comprehensive product management functionality for the e-commerce system. All endpoints are **public** (no authentication required) and support multi-image functionality with bilingual support (English/Arabic).

## Base URL
```
/api/products
```

## Image URL Behavior

- **`/{product}` endpoint**: Returns **images array** with full URLs for all product images
- **All other endpoints** (`/`, `/latest`, `/best-selling`, `/search`): Return **single image URL** in `image` field
- All image URLs are **full URLs** (not relative paths) for direct use in frontend applications
- Single product endpoint shows complete image metadata, list endpoints show only primary image

## Endpoints

### 1. Get All Products
**GET** `/api/products`

Retrieve a paginated list of active products with filtering and search capabilities.

#### Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|-----------|-------------|---------|
| `category_id` | integer | No | Filter by specific category ID | `1` |
| `search` | string | No | Search by product name (English/Arabic) | `"business card"` |
| `limit` | integer | No | Items per page (1-100, default: 15) | `20` |
| `page` | integer | No | Page number for pagination | `2` |

#### Example Request
```bash
GET /api/products?category_id=1&search=business&limit=10&page=1
```

#### Response
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "category_id": 1,
        "name": "Standard Business Cards",
        "name_ar": "بطاقات عمل قياسية",
        "description": "Professional business cards with various customization options",
        "description_ar": "بطاقات عمل احترافية مع خيارات تخصيص متنوعة",
        "base_price": "50.00",
        "is_active": true,
        "sort_order": 1,
        "specifications": null,
        "created_at": "2024-01-15T10:30:00.000000Z",
        "updated_at": "2024-01-15T10:30:00.000000Z",
        "image": "https://example.com/uploads/products/product1-primary.jpg",
        "category": {
          "id": 1,
          "name": "Business Cards",
          "name_ar": "بطاقات عمل"
        },
        "options": [
          {
            "id": 1,
            "name": "Paper Size",
            "name_ar": "حجم الورق",
            "type": "select",
            "is_required": true,
            "sort_order": 1,
            "values": [
              {
                "id": 1,
                "value": "Standard (85x55mm)",
                "value_ar": "قياسي (85x55مم)",
                "price_adjustment": "0.00"
              }
            ]
          }
        ]
      }
    ],
    "per_page": 15,
    "total": 25,
    "last_page": 2
  }
}
```

---

### 2. Search Products
**GET** `/api/products/search`

Search products by name or description with advanced filtering.

#### Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|-----------|-------------|---------|
| `q` | string | Yes | Search query (minimum 2 characters) | `"business card"` |
| `category_id` | integer | No | Filter by category | `1` |
| `min_price` | number | No | Minimum price filter | `10.00` |
| `max_price` | number | No | Maximum price filter | `100.00` |
| `sort_by` | string | No | Sort field (name, price, created_at, sort_order) | `"price"` |
| `sort_order` | string | No | Sort direction (asc, desc) | `"asc"` |
| `page` | integer | No | Page number | `1` |
| `limit` | integer | No | Items per page (1-100) | `15` |

#### Example Request
```bash
GET /api/products/search?q=business&category_id=1&min_price=10&max_price=100&sort_by=price&sort_order=asc
```

#### Response
```json
{
  "success": true,
  "query": "business",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "name": "Standard Business Cards",
        "name_ar": "بطاقات عمل قياسية",
        "description": "Professional business cards",
        "base_price": "50.00",
        "image": "https://example.com/uploads/products/product1-primary.jpg",
        "category": {
          "id": 1,
          "name": "Business Cards",
          "name_ar": "بطاقات عمل"
        }
      }
    ],
    "per_page": 15,
    "total": 5,
    "last_page": 1
  }
}
```

---

### 3. Get Latest Products
**GET** `/api/products/latest`

Retrieve the most recently added products.

#### Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|-----------|-------------|---------|
| `limit` | integer | No | Number of products (1-20, default: 5) | `10` |

#### Example Request
```bash
GET /api/products/latest?limit=10
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Standard Business Cards",
      "name_ar": "بطاقات عمل قياسية",
      "base_price": "50.00",
      "img": "https://example.com/uploads/products/product1-primary.jpg",
      "url": "/products/1",
      "category": {
        "id": 1,
        "name": "Business Cards",
        "name_ar": "بطاقات عمل"
      }
    }
  ]
}
```

---

### 4. Get Best Selling Products
**GET** `/api/products/best-selling`

Retrieve products ordered by sales count.

#### Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|-----------|-------------|---------|
| `limit` | integer | No | Number of products (1-20, default: 5) | `10` |

#### Example Request
```bash
GET /api/products/best-selling?limit=10
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Standard Business Cards",
      "name_ar": "بطاقات عمل قياسية",
      "base_price": "50.00",
      "img": "https://example.com/uploads/products/product1-primary.jpg",
      "url": "/products/1",
      "order_count": 25,
      "category": {
        "id": 1,
        "name": "Business Cards",
        "name_ar": "بطاقات عمل"
      }
    }
  ]
}
```

---

### 5. Get Single Product
**GET** `/api/products/{id}`

Retrieve detailed information about a specific product.

#### Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|-----------|-------------|---------|
| `id` | integer | Yes | Product ID | `1` |

#### Example Request
```bash
GET /api/products/1
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "category_id": 1,
    "name": "Standard Business Cards",
    "name_ar": "بطاقات عمل قياسية",
    "description": "Professional business cards with various customization options",
    "description_ar": "بطاقات عمل احترافية مع خيارات تخصيص متنوعة",
    "base_price": "50.00",
    "images": [
      {
        "id": 1,
        "image_path": "/uploads/products/product1-primary.jpg",
        "image_url": "https://example.com/uploads/products/product1-primary.jpg",
        "alt_text": "Standard Business Cards - Front View",
        "is_primary": true,
        "sort_order": 1
      },
      {
        "id": 2,
        "image_path": "/uploads/products/product1-back.jpg",
        "image_url": "https://example.com/uploads/products/product1-back.jpg",
        "alt_text": "Standard Business Cards - Back View",
        "is_primary": false,
        "sort_order": 2
      }
    ],
    "category": {
      "id": 1,
      "name": "Business Cards",
      "name_ar": "بطاقات عمل"
    },
    "options": [
      {
        "id": 1,
        "name": "Paper Size",
        "name_ar": "حجم الورق",
        "type": "select",
        "is_required": true,
        "sort_order": 1,
        "values": [
          {
            "id": 1,
            "value": "Standard (85x55mm)",
            "value_ar": "قياسي (85x55مم)",
            "price_adjustment": "0.00"
          },
          {
            "id": 2,
            "value": "Large (90x50mm)",
            "value_ar": "كبير (90x50مم)",
            "price_adjustment": "5.00"
          }
        ]
      }
    ],
    "highlights": [
      {
        "id": 1,
        "name": "Fast Delivery",
        "name_ar": "توصيل سريع"
      }
    ],
    "is_active": true,
    "sort_order": 1,
    "specifications": {
      "dimensions": "85x55mm",
      "finish": "Matte"
    },
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T10:30:00.000000Z"
  }
}
```

---

## Data Models

### Product Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique product ID |
| `category_id` | integer | Category ID |
| `name` | string | Product name (English) |
| `name_ar` | string | Product name (Arabic) |
| `description` | string | Product description (English) |
| `description_ar` | string | Product description (Arabic) |
| `base_price` | string | Base price (formatted to 2 decimal places) |
| `is_active` | boolean | Whether product is active |
| `sort_order` | integer | Display order |
| `specifications` | object | Product specifications (JSON) |
| `created_at` | string | Creation timestamp (ISO 8601) |
| `updated_at` | string | Last update timestamp (ISO 8601) |

### Image Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique image ID |
| `image_path` | string | Relative path to image file |
| `image_url` | string | Full URL to image |
| `alt_text` | string | Alt text for accessibility |
| `is_primary` | boolean | Whether this is the primary image |
| `sort_order` | integer | Display order |

### Category Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique category ID |
| `name` | string | Category name (English) |
| `name_ar` | string | Category name (Arabic) |

### Option Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique option ID |
| `name` | string | Option name (English) |
| `name_ar` | string | Option name (Arabic) |
| `type` | string | Option type (select, checkbox, radio, text) |
| `is_required` | boolean | Whether option is required |
| `sort_order` | integer | Display order |
| `values` | array | Array of option values |

### Option Value Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique value ID |
| `value` | string | Value text (English) |
| `value_ar` | string | Value text (Arabic) |
| `price_adjustment` | string | Price adjustment (can be negative) |

---

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "q": ["The q field is required."],
    "limit": ["The limit must be between 1 and 100."]
  }
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Usage Examples

### Frontend Integration

#### JavaScript/Fetch
```javascript
// Get all products
const products = await fetch('/api/products')
  .then(response => response.json())
  .then(data => data.data.data);

// Get single product
const product = await fetch('/api/products/1')
  .then(response => response.json())
  .then(data => data.data);

// Search products
const searchResults = await fetch('/api/products/search?q=business')
  .then(response => response.json())
  .then(data => data.data.data);
```

#### React Example
```jsx
const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <img 
        src={product.image} 
        alt={product.name}
      />
      <h3>{product.name}</h3>
      <p>{product.base_price}</p>
    </div>
  );
};
```

---

## Notes

- All endpoints return **full image URLs** ready for direct use in frontend applications
- **List endpoints** (`/`, `/latest`, `/best-selling`, `/search`): Return single `image` field with primary image URL
- **Single product endpoint** (`/{id}`): Returns complete `images` array with all image metadata
- All endpoints support both English and Arabic content
- Pagination is available for list endpoints
- Search functionality supports both English and Arabic text
- All timestamps are in ISO 8601 format
- Price values are returned as strings formatted to 2 decimal places