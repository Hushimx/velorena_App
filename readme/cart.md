# Cart Management API Documentation

## Overview

The Cart Management API provides endpoints for managing shopping cart functionality in the QAADS application. This API supports both authenticated users (database cart) and guest users (session cart), with full CRUD operations for cart items and integration with the design system.

## Authentication

All cart API endpoints require authentication using Laravel Sanctum. Include the Bearer token in the Authorization header:

```
Authorization: Bearer {your_token}
```

## Base URL

```
/api/cart
```

---

## API Endpoints

### 1. Get Cart Items

**GET** `/api/cart/items`

Retrieve all items in the user's cart with product details and pricing.

#### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": 5,
        "quantity": 2,
        "unit_price": "25.00",
        "total_price": "50.00",
        "selected_options": {
          "1": "3",
          "2": "7"
        },
        "notes": "Custom notes",
        "created_at": "2024-01-15T10:30:00Z",
        "product": {
          "id": 5,
          "name": "Product Name",
          "name_ar": "اسم المنتج",
          "base_price": "20.00",
          "options": [
            {
              "id": 1,
              "name": "Size",
              "type": "radio",
              "values": [
                {
                  "id": 3,
                  "name": "Large",
                  "price_adjustment": "5.00"
                }
              ]
            }
          ]
        }
      }
    ],
    "summary": {
      "item_count": 2,
      "subtotal": "50.00",
      "tax": "7.50",
      "total": "57.50"
    }
  }
}
```

---

### 2. Add Item to Cart

**POST** `/api/cart/add`

Add a new item to the cart or update quantity if the same product with same options already exists.

#### Request Body

```json
{
  "product_id": 5,
  "quantity": 2,
  "selected_options": {
    "1": "3",
    "2": "7"
  },
  "notes": "Custom notes for this item"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `product_id` | integer | Yes | ID of the product to add |
| `quantity` | integer | Yes | Quantity to add (minimum 1) |
| `selected_options` | object | No | Selected product options (option_id: value_id) |
| `notes` | string | No | Custom notes for the item (max 1000 chars) |

#### Response

```json
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart_item_id": 15,
    "quantity": 2,
    "total_price": "50.00"
  }
}
```

#### Error Responses

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "product_id": ["The product id field is required."],
    "quantity": ["The quantity must be at least 1."]
  }
}
```

---

### 3. Update Cart Item Quantity

**PUT** `/api/cart/items/{cartItemId}`

Update the quantity of a specific cart item.

#### Request Body

```json
{
  "quantity": 3
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `quantity` | integer | Yes | New quantity (minimum 1) |

#### Response

```json
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": {
    "cart_item_id": 15,
    "quantity": 3,
    "total_price": "75.00"
  }
}
```

#### Error Responses

```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "quantity": ["The quantity must be at least 1."]
  }
}
```

---

### 4. Remove Item from Cart

**DELETE** `/api/cart/items/{cartItemId}`

Remove a specific item from the cart.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cartItemId` | integer | Yes | ID of the cart item to remove |

#### Response

```json
{
  "success": true,
  "message": "Item removed from cart successfully"
}
```

#### Error Responses

```json
{
  "success": false,
  "message": "Cart item not found"
}
```

---

### 5. Clear Entire Cart

**DELETE** `/api/cart/clear`

Remove all items from the user's cart.

#### Response

```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

## Design Integration

The cart system integrates with the design system through separate API endpoints:

### Design Selection for Cart Products

**POST** `/api/designs/select-for-product`

Select designs for products in the cart.

**GET** `/api/designs/selected-for-product/{productId}`

Get selected designs for a specific product.

**DELETE** `/api/designs/selected-for-product/{productId}/{designId}`

Remove a design from a product selection.

For detailed documentation on design integration, see [Design API Documentation](DESIGN_API_DOCUMENTATION.md).

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Validation errors |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error |

---

## Cart Features

### Product Options Support

The cart supports various product option types:

- **Radio Options**: Single selection from multiple choices
- **Checkbox Options**: Multiple selections allowed
- **Select Options**: Dropdown-style selection

### Price Calculation

- **Base Price**: Product's base price
- **Option Adjustments**: Additional costs from selected options
- **Unit Price**: Base price + option adjustments
- **Total Price**: Unit price × quantity
- **Tax**: 15% VAT on subtotal
- **Grand Total**: Subtotal + tax

### Cart Persistence

- **Authenticated Users**: Cart stored in database, persists across sessions
- **Guest Users**: Cart stored in session, temporary storage

### Design Integration

- Designs can be attached to cart items
- Designs are transferred to orders when cart is converted
- Support for multiple designs per cart item

---

## Example Usage

### JavaScript/Frontend Integration

```javascript
// Add item to cart
const addToCart = async (productId, quantity, options = {}, notes = '') => {
  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: productId,
      quantity: quantity,
      selected_options: options,
      notes: notes
    })
  });
  
  return await response.json();
};

// Get cart items
const getCartItems = async () => {
  const response = await fetch('/api/cart/items', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Update cart item quantity
const updateCartItem = async (cartItemId, quantity) => {
  const response = await fetch(`/api/cart/items/${cartItemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ quantity })
  });
  
  return await response.json();
};

// Remove item from cart
const removeCartItem = async (cartItemId) => {
  const response = await fetch(`/api/cart/items/${cartItemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Clear entire cart
const clearCart = async () => {
  const response = await fetch('/api/cart/clear', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

```

### cURL Examples

```bash
# Get cart items
curl -X GET "https://your-domain.com/api/cart/items" \
  -H "Authorization: Bearer your_token"

# Add item to cart
curl -X POST "https://your-domain.com/api/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{
    "product_id": 5,
    "quantity": 2,
    "selected_options": {"1": "3", "2": "7"},
    "notes": "Custom notes"
  }'

# Update cart item
curl -X PUT "https://your-domain.com/api/cart/items/15" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_token" \
  -d '{"quantity": 3}'

# Remove cart item
curl -X DELETE "https://your-domain.com/api/cart/items/15" \
  -H "Authorization: Bearer your_token"

# Clear cart
curl -X DELETE "https://your-domain.com/api/cart/clear" \
  -H "Authorization: Bearer your_token"

```

---

## Integration Notes

### With Appointment System

The cart system integrates seamlessly with the appointment booking system:

1. Users can add products to cart
2. Book appointments with cart items
3. Cart items are automatically converted to orders during appointment booking
4. Designs attached to cart items are transferred to the order

### With Payment System

Cart items can be used with the order system for payment processing:

1. Use existing order creation endpoints
2. Initiate payment for the order
3. Process payment completion
4. Update order status

### With Design System

Cart supports design integration:

1. Select designs for cart items
2. Designs are stored separately in cart_designs table
3. Designs can be used with order creation through other endpoints
4. Maintains design metadata and priorities

---

## Best Practices

1. **Always validate input**: Check product existence and option validity
2. **Handle errors gracefully**: Implement proper error handling in frontend
3. **Cache cart data**: Consider caching cart items for better performance
4. **Sync cart state**: Keep frontend cart state synchronized with backend
5. **Optimize requests**: Batch multiple cart operations when possible
6. **Handle guest users**: Implement session-based cart for non-authenticated users

---

## Support

For technical support or questions about the Cart API, please contact the development team or create a support ticket through the application.
