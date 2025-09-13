# Designs API Documentation

## Overview
The Designs API provides functionality for searching, managing, and organizing design assets. It integrates with external design APIs (like Freepik) and allows users to save, organize, and manage their favorite designs.

## Base URL
```
/api/designs
```

## Authentication
Most endpoints require authentication using Bearer token:
```
Authorization: Bearer {token}
```

## Public Endpoints (No Authentication Required)



---

## Authenticated Endpoints

### 2. Search External Designs
Search for designs using external API (Freepik) with advanced filtering options.

**Endpoint:** `GET /api/designs/search`

**Query Parameters:**
- `q` (required): Search query string (min: 2 characters)
- `limit` (optional): Number of results per page (1-100, default: 50)
- `page` (optional): Page number (min: 1, default: 1)
- `category` (optional): Filter by category
- `type` (optional): Design type - `photo`, `vector`, `psd`, `ai`
- `orientation` (optional): Image orientation - `horizontal`, `vertical`, `square`
- `color` (optional): Hex color code (e.g., `#FF0000`)
- `min_width` (optional): Minimum width in pixels
- `min_height` (optional): Minimum height in pixels

**Example Request:**
```
GET /api/designs/search?q=business+logo&type=vector&orientation=horizontal&limit=20
```

**Response:**
```json
{
  "success": true,
  "query": "business logo",
  "data": [
    {
      "id": "ext_12345",
      "title": "Modern Business Logo",
      "description": "Clean and professional business logo design",
      "image_url": "https://example.com/logo.jpg",
      "thumbnail_url": "https://example.com/logo_thumb.jpg",
      "category": "business",
      "tags": "logo,business,corporate,modern",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "format": "vector",
        "premium": true,
        "download_url": "https://example.com/download/12345"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_results": 250,
    "per_page": 50
  },
  "filters_applied": {
    "type": "vector",
    "orientation": "horizontal"
  }
}
```

### 3. Get User's Saved Designs
Get all designs saved to user's favorites.

**Endpoint:** `GET /api/designs/saved`

**Query Parameters:**
- `per_page` (optional): Number of results per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "design_id": 123,
      "notes": "Great for my business card",
      "created_at": "2024-01-15T10:30:00Z",
      "design": {
        "id": 123,
        "title": "Business Card Design",
        "description": "Professional business card template",
        "image_url": "https://example.com/business-card.jpg",
        "thumbnail_url": "https://example.com/business-card_thumb.jpg",
        "category": "business",
        "tags": "business,card,professional",
        "metadata": {
          "width": 1050,
          "height": 600,
          "format": "psd"
        }
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 20,
    "total": 45
  }
}
```

### 4. Save Design to Favorites
Add a design to user's favorites with optional custom image upload.

**Endpoint:** `POST /api/designs/save`

**Request Body (JSON):**
```json
{
  "design_id": 123,
  "notes": "Perfect for my new project"
}
```

**Request Body (Multipart Form Data - for image upload):**
- `design_id` (required): Design ID to save
- `notes` (optional): User notes about the design
- `custom_image` (optional): Custom edited image file (JPG, PNG, PDF, PSD, AI)
- `image_type` (optional): Type of custom image - `edited`, `custom`, `modified`

**Response:**
```json
{
  "success": true,
  "message": "Design added to favorites",
  "data": {
    "id": 1,
    "user_id": 1,
    "design_id": 123,
    "notes": "Perfect for my new project",
    "custom_image_url": "https://example.com/storage/designs/custom_123_456.jpg",
    "image_type": "edited",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 5. Update Favorite Design
Replace a favorite design with a new one and update notes. Can also upload custom edited images.

**Endpoint:** `PUT /api/designs/favorite/{design}`

**Path Parameters:**
- `design`: Design ID to update

**Request Body (JSON):**
```json
{
  "new_design_id": 456,
  "notes": "Updated choice for the project"
}
```

**Request Body (Multipart Form Data - for image upload):**
- `new_design_id` (required): New design ID to replace with
- `notes` (optional): Updated notes
- `custom_image` (optional): Custom edited image file (JPG, PNG, PDF, PSD, AI)
- `image_type` (optional): Type of custom image - `edited`, `custom`, `modified`

**Response:**
```json
{
  "success": true,
  "message": "Favorite design updated successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "design_id": 456,
    "notes": "Updated choice for the project",
    "custom_image_url": "https://example.com/storage/designs/custom/updated_123_456.jpg",
    "image_type": "edited",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z",
    "design": {
      "id": 456,
      "title": "Updated Business Design",
      "description": "New and improved design",
      "image_url": "https://example.com/new-design.jpg",
      "thumbnail_url": "https://example.com/new-design_thumb.jpg",
      "category": "business",
      "tags": "business,updated,modern"
    }
  }
}
```

### 6. Remove Design from Favorites
Remove a design from user's favorites.

**Endpoint:** `DELETE /api/designs/favorite/{design}`

**Path Parameters:**
- `design`: Design ID to remove

**Response:**
```json
{
  "success": true,
  "message": "Design removed from favorites"
}
```

### 7. Get Specific Design Details
Get detailed information about a specific design.

**Endpoint:** `GET /api/designs/{design}`

**Path Parameters:**
- `design`: Design ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "external_id": "ext_12345",
    "title": "Modern Business Logo",
    "description": "Clean and professional business logo design perfect for corporate use",
    "image_url": "https://example.com/logo.jpg",
    "thumbnail_url": "https://example.com/logo_thumb.jpg",
    "category": "business",
    "tags": "logo,business,corporate,modern,professional",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "vector",
      "premium": true,
      "download_url": "https://example.com/download/12345",
      "author": "Design Studio",
      "license": "Premium"
    },
    "is_active": true,
    "created_at": "2024-01-10T08:00:00Z",
    "updated_at": "2024-01-10T08:00:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "design_id": ["The design id field is required."],
    "q": ["The q field must be at least 2 characters."]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Design not found"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "design_id": ["The design id field is required."],
    "notes": ["The notes field must not be greater than 1000 characters."]
  }
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Failed to fetch designs from external API"
}
```

---

## Data Models

### Design Object
```json
{
  "id": 123,
  "external_id": "ext_12345",
  "title": "Design Title",
  "description": "Design description",
  "image_url": "https://example.com/image.jpg",
  "thumbnail_url": "https://example.com/thumb.jpg",
  "category": "business",
  "tags": "tag1,tag2,tag3",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "vector",
    "premium": true,
    "download_url": "https://example.com/download/12345"
  },
  "is_active": true,
  "created_at": "2024-01-10T08:00:00Z",
  "updated_at": "2024-01-10T08:00:00Z"
}
```

### Design Favorite Object
```json
{
  "id": 1,
  "user_id": 1,
  "design_id": 123,
  "notes": "User notes about this design",
  "custom_image_url": "https://example.com/storage/designs/custom_123_456.jpg",
  "image_type": "edited",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## Usage Examples

### Frontend Integration Examples

#### 1. Search for Designs
```javascript
// Search for business logos
const searchDesigns = async (query, filters = {}) => {
  const params = new URLSearchParams({
    q: query,
    ...filters
  });
  
  const response = await fetch(`/api/designs/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};

// Usage
const results = await searchDesigns('business logo', {
  type: 'vector',
  orientation: 'horizontal',
  limit: 20
});
```

#### 2. Save Design to Favorites
```javascript
// Save design without custom image
const saveDesign = async (designId, notes = '') => {
  const response = await fetch('/api/designs/save', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      design_id: designId,
      notes: notes
    })
  });
  
  return await response.json();
};

// Save design with custom edited image
const saveDesignWithImage = async (designId, imageFile, notes = '', imageType = 'edited') => {
  const formData = new FormData();
  formData.append('design_id', designId);
  formData.append('notes', notes);
  formData.append('custom_image', imageFile);
  formData.append('image_type', imageType);
  
  const response = await fetch('/api/designs/save', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
};
```

#### 3. Get User's Saved Designs
```javascript
const getSavedDesigns = async (page = 1) => {
  const response = await fetch(`/api/designs/saved?page=${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

#### 4. Remove from Favorites
```javascript
const removeFromFavorites = async (designId) => {
  const response = await fetch(`/api/designs/favorite/${designId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

#### 5. React Component Example
```jsx
import React, { useState } from 'react';

const DesignSaveComponent = ({ designId, onSave }) => {
  const [notes, setNotes] = useState('');
  const [customImage, setCustomImage] = useState(null);
  const [imageType, setImageType] = useState('edited');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    
    try {
      let response;
      
      if (customImage) {
        // Save with custom image
        const formData = new FormData();
        formData.append('design_id', designId);
        formData.append('notes', notes);
        formData.append('custom_image', customImage);
        formData.append('image_type', imageType);
        
        response = await fetch('/api/designs/save', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        // Save without custom image
        response = await fetch('/api/designs/save', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            design_id: designId,
            notes: notes
          })
        });
      }
      
      const result = await response.json();
      
      if (result.success) {
        onSave(result.data);
        setNotes('');
        setCustomImage(null);
      } else {
        console.error('Error saving design:', result.message);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="design-save-form">
      <h3>Save Design to Favorites</h3>
      
      <div className="form-group">
        <label>Notes:</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this design..."
          maxLength={1000}
        />
      </div>
      
      <div className="form-group">
        <label>Upload Custom Edited Image (Optional):</label>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.psd,.ai"
          onChange={(e) => setCustomImage(e.target.files[0])}
        />
        <small>Supported formats: JPG, PNG, PDF, PSD, AI (Max: 10MB)</small>
      </div>
      
      {customImage && (
        <div className="form-group">
          <label>Image Type:</label>
          <select
            value={imageType}
            onChange={(e) => setImageType(e.target.value)}
          >
            <option value="edited">Edited</option>
            <option value="custom">Custom</option>
            <option value="modified">Modified</option>
          </select>
        </div>
      )}
      
      <button
        onClick={handleSave}
        disabled={loading}
        className="save-button"
      >
        {loading ? 'Saving...' : 'Save to Favorites'}
      </button>
    </div>
  );
};

export default DesignSaveComponent;
```

---

## Notes for Frontend Developers

1. **Authentication**: All endpoints except `/categories` require authentication. Include the Bearer token in the Authorization header.

2. **Pagination**: Most list endpoints support pagination. Use the `page` and `per_page` parameters to control results.

3. **Error Handling**: Always check the `success` field in responses. Handle different HTTP status codes appropriately.

4. **Image URLs**: The API returns both `image_url` (full size) and `thumbnail_url` (smaller version) for each design. Use thumbnails for lists and full images for detail views.

5. **External API Integration**: The search endpoint integrates with external design APIs. Results may vary based on API availability and rate limits.

6. **Design Metadata**: The `metadata` field contains additional information about designs like dimensions, format, and download URLs.

7. **Categories**: Use the public `/categories` endpoint to populate category filters in your UI.

8. **Rate Limiting**: Be mindful of API rate limits, especially for search requests that hit external APIs.

9. **Caching**: Consider implementing client-side caching for frequently accessed data like user favorites.

10. **Responsive Design**: Design images come in various sizes. Implement responsive image loading for optimal performance.

11. **Custom Image Upload**: Users can upload their own edited versions of designs. Supported formats: JPG, PNG, PDF, PSD, AI. Maximum file size: 10MB.

12. **Image Storage**: Custom images are stored in `storage/app/public/designs/custom/` and are automatically cleaned up when favorites are removed.
