# Highlights and Product Search System Documentation

## Overview

The Velorena application features a comprehensive highlight and product search system that allows users to discover products through categorized highlights and advanced search functionality. This system enables marketing campaigns, seasonal promotions, and easy product discovery.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Structure](#database-structure)
3. [Models and Relationships](#models-and-relationships)
4. [API Endpoints](#api-endpoints)
5. [Search Functionality](#search-functionality)
6. [Admin Panel Integration](#admin-panel-integration)
7. [Frontend Integration](#frontend-integration)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)

## System Architecture

### Core Components

1. **Highlights System**: Marketing campaigns and product categories
2. **Product-Highlight Association**: Many-to-many relationship
3. **Search Engine**: Multi-field search across products and categories
4. **Admin Management**: Full CRUD operations for highlights and product assignments

### Key Features

- ✅ **Multi-language Support**: English and Arabic
- ✅ **SEO-friendly URLs**: Slug-based routing
- ✅ **Flexible Sorting**: Custom sort order for highlights and products
- ✅ **Advanced Search**: Name, description, and category-based search
- ✅ **Pagination**: Efficient data loading
- ✅ **Admin Panel**: Complete management interface

## Database Structure

### Tables

#### `highlights` Table
```sql
CREATE TABLE highlights (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NULL,
    description_ar TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

#### `product_highlights` Pivot Table
```sql
CREATE TABLE product_highlights (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    highlight_id BIGINT UNSIGNED NOT NULL,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (highlight_id) REFERENCES highlights(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_highlight (product_id, highlight_id)
);
```

#### `products` Table (Relevant Fields)
```sql
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    description TEXT NULL,
    description_ar TEXT NULL,
    image VARCHAR(255) NULL,
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 1,
    specifications JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

## Models and Relationships

### Product Model

```php
class Product extends Model
{
    // Relationship with highlights through product_highlights pivot table
    public function highlights(): BelongsToMany
    {
        return $this->belongsToMany(Highlight::class, 'product_highlights')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }

    /**
     * Scope to get products with highlights
     */
    public function scopeWithHighlights($query)
    {
        return $query->with('highlights');
    }

    /**
     * Scope to filter products by highlight
     */
    public function scopeByHighlight($query, $highlightId)
    {
        return $query->whereHas('highlights', function ($q) use ($highlightId) {
            $q->where('highlights.id', $highlightId);
        });
    }
}
```

### Highlight Model

```php
class Highlight extends Model
{
    /**
     * Get the products that belong to this highlight
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_highlights')
            ->withPivot('sort_order')
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }

    /**
     * Scope to get only active highlights
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort_order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Get the route key for the model (uses slug instead of ID)
     */
    public function getRouteKeyName()
    {
        return 'slug';
    }

    /**
     * Generate unique slug from name
     */
    public static function generateSlug($name)
    {
        $slug = \Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;
        
        while (static::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
}
```

## API Endpoints

### Highlights API

#### 1. Get All Highlights
```http
GET /api/highlights
```

**Parameters:**
- `with_products` (boolean, optional): Include products for each highlight

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Spring Offers",
            "name_ar": "عروض الربيع",
            "slug": "spring-offers",
            "description": "Special spring season offers",
            "description_ar": "عروض خاصة لموسم الربيع",
            "is_active": true,
            "sort_order": 1,
            "products": [
                {
                    "id": 1,
                    "name": "Standard Business Cards",
                    "name_ar": "بطاقات عمل قياسية",
                    "base_price": "50.00",
                    "image": "storage/products/business-cards.jpg"
                }
            ]
        }
    ]
}
```

#### 2. Get Specific Highlight
```http
GET /api/highlights/{highlight}
```

**Parameters:**
- `highlight` (string): Highlight slug (e.g., "spring-offers")

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "Spring Offers",
        "name_ar": "عروض الربيع",
        "slug": "spring-offers",
        "description": "Special spring season offers",
        "description_ar": "عروض خاصة لموسم الربيع",
        "is_active": true,
        "sort_order": 1
    }
}
```

#### 3. Get Products for Highlight
```http
GET /api/highlights/{highlight}/products
```

**Parameters:**
- `highlight` (string): Highlight slug
- `page` (integer, optional): Page number for pagination
- `limit` (integer, optional): Products per page (1-100, default: 15)

**Response:**
```json
{
    "success": true,
    "highlight": {
        "id": 1,
        "name": "Spring Offers",
        "name_ar": "عروض الربيع",
        "slug": "spring-offers"
    },
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "name": "Standard Business Cards",
                "name_ar": "بطاقات عمل قياسية",
                "base_price": "50.00",
                "image": "storage/products/business-cards.jpg",
                "category": {
                    "id": 1,
                    "name": "Business Cards",
                    "name_ar": "بطاقات عمل"
                }
            }
        ],
        "per_page": 15,
        "total": 5
    }
}
```

### Products API

#### 1. Get All Products with Search
```http
GET /api/products
```

**Parameters:**
- `category_id` (integer, optional): Filter by category
- `search` (string, optional): Search in product names
- `page` (integer, optional): Page number
- `limit` (integer, optional): Products per page (1-100, default: 15)

**Response:**
```json
{
    "success": true,
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "name": "Standard Business Cards",
                "name_ar": "بطاقات عمل قياسية",
                "description": "Professional business cards",
                "description_ar": "بطاقات عمل احترافية",
                "base_price": "50.00",
                "image": "storage/products/business-cards.jpg",
                "is_active": true,
                "sort_order": 1,
                "category": {
                    "id": 1,
                    "name": "Business Cards",
                    "name_ar": "بطاقات عمل"
                },
                "highlights": [
                    {
                        "id": 1,
                        "name": "Spring Offers",
                        "name_ar": "عروض الربيع",
                        "slug": "spring-offers"
                    }
                ],
                "options": [
                    {
                        "id": 1,
                        "name": "Paper Type",
                        "name_ar": "نوع الورق",
                        "values": [
                            {
                                "id": 1,
                                "name": "Premium",
                                "name_ar": "مميز",
                                "price_adjustment": "10.00"
                            }
                        ]
                    }
                ]
            }
        ],
        "per_page": 15,
        "total": 25
    }
}
```

## Search Functionality

### Frontend Search (Livewire Component)

The `UserProductsTable` component provides comprehensive search functionality:

```php
class UserProductsTable extends Component
{
    public $search = '';
    public $categoryFilter = '';

    public function render()
    {
        $products = Product::with('category')
            ->where('is_active', true)
            ->when($this->search, function ($query, $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('name_ar', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('description_ar', 'like', "%{$search}%")
                        ->orWhereHas('category', function ($categoryQuery) use ($search) {
                            $categoryQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('name_ar', 'like', "%{$search}%");
                        });
                });
            })
            ->when($this->categoryFilter, function ($query, $categoryFilter) {
                $query->where('category_id', $categoryFilter);
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(12);
    }
}
```

### Search Features

1. **Multi-field Search**: Searches across:
   - Product name (English & Arabic)
   - Product description (English & Arabic)
   - Category name (English & Arabic)

2. **Category Filtering**: Filter products by specific category

3. **Real-time Search**: Livewire provides instant search results

4. **Pagination**: Efficient loading with 12 products per page

## Admin Panel Integration

### Highlight Management

#### 1. Create Highlight
```http
POST /admin/highlights
```

**Form Fields:**
- `name` (required): English name
- `name_ar` (required): Arabic name
- `description` (optional): English description
- `description_ar` (optional): Arabic description
- `is_active` (boolean): Active status
- `sort_order` (integer): Display order

#### 2. Assign Products to Highlight
```http
GET /admin/products/{product}/assign-highlights
POST /admin/products/{product}/assign-highlights
```

**Features:**
- Multi-select interface for product assignment
- Custom sort order for products within highlights
- Bulk assignment capabilities

### Product Management

#### 1. Product Table with Highlights
The admin product table displays:
- Product information
- Associated highlights
- "Assign Highlights" button for each product

#### 2. Highlight Assignment Interface
- Checkbox list of all available highlights
- Sort order input for each highlight
- Bulk assignment options

## Frontend Integration

### Displaying Highlights

#### 1. Highlight List
```blade
@foreach($highlights as $highlight)
    <div class="highlight-card">
        <h3>{{ $highlight->name }}</h3>
        <p>{{ $highlight->description }}</p>
        <a href="{{ route('highlights.products', $highlight->slug) }}">
            View Products
        </a>
    </div>
@endforeach
```

#### 2. Products by Highlight
```blade
@foreach($products as $product)
    <div class="product-card">
        <img src="{{ asset($product->image) }}" alt="{{ $product->name }}">
        <h4>{{ $product->name }}</h4>
        <p class="price">{{ $product->base_price }} SAR</p>
        <div class="highlights">
            @foreach($product->highlights as $highlight)
                <span class="highlight-badge">{{ $highlight->name }}</span>
            @endforeach
        </div>
    </div>
@endforeach
```

### Search Interface

```blade
<div class="search-container">
    <input type="text" 
           wire:model.live="search" 
           placeholder="Search products..."
           class="search-input">
    
    <select wire:model.live="categoryFilter" class="category-filter">
        <option value="">All Categories</option>
        @foreach($categories as $category)
            <option value="{{ $category->id }}">{{ $category->name }}</option>
        @endforeach
    </select>
</div>

<div class="products-grid">
    @foreach($products as $product)
        <!-- Product card -->
    @endforeach
</div>

{{ $products->links() }}
```

## Usage Examples

### 1. Get Spring Offers Products

```javascript
// Fetch products for "Spring Offers" highlight
fetch('/api/highlights/spring-offers/products')
    .then(response => response.json())
    .then(data => {
        console.log('Spring offers products:', data.data.data);
    });
```

### 2. Search Products by Name

```javascript
// Search for business cards
fetch('/api/products?search=business')
    .then(response => response.json())
    .then(data => {
        console.log('Search results:', data.data.data);
    });
```

### 3. Filter by Category

```javascript
// Get all business card products
fetch('/api/products?category_id=1')
    .then(response => response.json())
    .then(data => {
        console.log('Business cards:', data.data.data);
    });
```

### 4. Admin: Assign Highlights to Product

```php
// In admin controller
public function storeProductHighlights(Request $request, Product $product)
{
    $request->validate([
        'highlights' => 'array',
        'highlights.*.highlight_id' => 'required|exists:highlights,id',
        'highlights.*.sort_order' => 'required|integer|min:1'
    ]);

    // Sync highlights with custom sort order
    $syncData = [];
    foreach ($request->highlights as $highlightData) {
        $syncData[$highlightData['highlight_id']] = [
            'sort_order' => $highlightData['sort_order']
        ];
    }

    $product->highlights()->sync($syncData);

    return redirect()->back()
        ->with('success', 'Highlights assigned successfully');
}
```

## Best Practices

### 1. Performance Optimization

- **Eager Loading**: Always use `with()` to load relationships
- **Pagination**: Limit results to prevent memory issues
- **Indexing**: Ensure database indexes on search fields

```php
// Good: Eager load relationships
$products = Product::with(['category', 'highlights', 'options.values'])
    ->where('is_active', true)
    ->paginate(15);

// Good: Use database indexes
// Add indexes on: products.name, products.name_ar, highlights.slug
```

### 2. SEO Optimization

- **Slug-based URLs**: Use highlight slugs instead of IDs
- **Meta Tags**: Include highlight information in page meta
- **Structured Data**: Add JSON-LD for better search engine understanding

### 3. User Experience

- **Real-time Search**: Use Livewire for instant results
- **Loading States**: Show loading indicators during search
- **Error Handling**: Graceful fallbacks for failed requests

### 4. Data Management

- **Validation**: Always validate highlight assignments
- **Soft Deletes**: Consider soft deletes for highlights
- **Audit Trail**: Log highlight assignments for tracking

### 5. Security

- **Input Sanitization**: Sanitize search inputs
- **Rate Limiting**: Implement rate limiting for search endpoints
- **Access Control**: Restrict admin functions to authorized users

## Troubleshooting

### Common Issues

1. **Search Not Working**
   - Check database indexes
   - Verify search field names
   - Test with simple queries first

2. **Highlight Assignment Fails**
   - Verify pivot table structure
   - Check foreign key constraints
   - Validate sort_order values

3. **Performance Issues**
   - Add database indexes
   - Use pagination
   - Optimize eager loading

4. **Slug Conflicts**
   - Use `generateSlug()` method
   - Handle duplicate slugs gracefully
   - Consider unique constraints

### Debug Commands

```bash
# Check highlight assignments
php artisan tinker
>>> Product::with('highlights')->find(1);

# Test search functionality
>>> Product::where('name', 'like', '%business%')->get();

# Verify slug generation
>>> Highlight::generateSlug('Spring Offers');
```

## Conclusion

The highlights and product search system provides a robust foundation for product discovery and marketing campaigns. By following the patterns and best practices outlined in this documentation, you can create an efficient, user-friendly, and scalable product management system.

For additional support or questions, refer to the API documentation or contact the development team.
