# Support Tickets API Documentation

## Overview
The Support Tickets API allows users to create, manage, and track support tickets. Users can create tickets, add replies, and view their ticket history.

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints require authentication using Bearer token:
```
Authorization: Bearer {your_token}
```

## Endpoints

### 1. Get User's Support Tickets
**GET** `/support-tickets`

Get all support tickets for the authenticated user with optional filtering.

#### Query Parameters
- `status` (optional) - Filter by status: `open`, `in_progress`, `pending`, `resolved`, `closed`
- `priority` (optional) - Filter by priority: `low`, `medium`, `high`, `urgent`
- `category` (optional) - Filter by category: `technical`, `billing`, `general`, `feature_request`, `bug_report`
- `page` (optional) - Page number for pagination (default: 1)

#### Example Request
```bash
GET /api/support-tickets?status=open&priority=high
```

#### Response
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": 1,
        "ticket_number": "TKT-2025-ABC123",
        "subject": "Login Issue",
        "description": "Cannot login to my account",
        "priority": "high",
        "status": "open",
        "category": "technical",
        "attachments": [],
        "created_at": "2025-01-13T02:15:32.000000Z",
        "updated_at": "2025-01-13T02:15:32.000000Z",
        "user": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "assigned_admin": null
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 1,
      "per_page": 15,
      "total": 1,
      "has_more_pages": false
    }
  }
}
```

---

### 2. Create Support Ticket
**POST** `/support-tickets`

Create a new support ticket.

#### Request Body
```json
{
  "subject": "Login Issue",
  "description": "I cannot login to my account. I keep getting an error message.",
  "priority": "high",
  "category": "technical",
  "attachments": []
}
```

#### Field Validation
- `subject` - Required, string, max 255 characters
- `description` - Required, string, max 5000 characters
- `priority` - Required, must be: `low`, `medium`, `high`, `urgent`
- `category` - Required, must be: `technical`, `billing`, `general`, `feature_request`, `bug_report`
- `attachments` - Optional, array of file paths

#### Response
```json
{
  "success": true,
  "message": "Support ticket created successfully",
  "data": {
    "id": 1,
    "ticket_number": "TKT-2025-ABC123",
    "subject": "Login Issue",
    "description": "I cannot login to my account...",
    "priority": "high",
    "status": "open",
    "category": "technical",
    "attachments": [],
    "created_at": "2025-01-13T02:15:32.000000Z",
    "updated_at": "2025-01-13T02:15:32.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### 3. Get Specific Support Ticket
**GET** `/support-tickets/{id}`

Get details of a specific support ticket including all replies.

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticket_number": "TKT-2025-ABC123",
    "subject": "Login Issue",
    "description": "I cannot login to my account...",
    "priority": "high",
    "status": "in_progress",
    "category": "technical",
    "attachments": [],
    "created_at": "2025-01-13T02:15:32.000000Z",
    "updated_at": "2025-01-13T02:20:15.000000Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "assigned_admin": {
      "id": 1,
      "name": "Admin User"
    },
    "replies": [
      {
        "id": 1,
        "message": "Thank you for reporting this issue. We are looking into it.",
        "attachments": [],
        "author_type": "admin",
        "author_name": "Admin User (Admin)",
        "created_at": "2025-01-13T02:20:15.000000Z"
      }
    ]
  }
}
```

---

### 4. Add Reply to Support Ticket
**POST** `/support-tickets/{id}/replies`

Add a reply to an existing support ticket.

#### Request Body
```json
{
  "message": "Thank you for the update. I have tried the suggested solution but it didn't work.",
  "attachments": []
}
```

#### Field Validation
- `message` - Required, string, max 5000 characters
- `attachments` - Optional, array of file paths

#### Response
```json
{
  "success": true,
  "message": "Reply added successfully",
  "data": {
    "id": 2,
    "message": "Thank you for the update...",
    "attachments": [],
    "author_type": "user",
    "author_name": "John Doe",
    "created_at": "2025-01-13T02:25:30.000000Z"
  }
}
```

---

### 5. Get Support Ticket Replies
**GET** `/support-tickets/{id}/replies`

Get all replies for a specific support ticket.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "message": "Thank you for reporting this issue. We are looking into it.",
      "attachments": [],
      "author_type": "admin",
      "author_name": "Admin User (Admin)",
      "created_at": "2025-01-13T02:20:15.000000Z"
    },
    {
      "id": 2,
      "message": "Thank you for the update...",
      "attachments": [],
      "author_type": "user",
      "author_name": "John Doe",
      "created_at": "2025-01-13T02:25:30.000000Z"
    }
  ]
}
```

---

### 6. Get Support Ticket Statistics
**GET** `/support-tickets/statistics`

Get statistics about the user's support tickets.

#### Response
```json
{
  "success": true,
  "data": {
    "total": 10,
    "open": 3,
    "closed": 7,
    "by_priority": {
      "high": 2,
      "medium": 5,
      "low": 3
    },
    "by_category": {
      "technical": 4,
      "billing": 3,
      "general": 2,
      "feature_request": 1
    }
  }
}
```

---

## Data Models

### Support Ticket
```json
{
  "id": 1,
  "ticket_number": "TKT-2025-ABC123",
  "subject": "string",
  "description": "string",
  "priority": "low|medium|high|urgent",
  "status": "open|in_progress|pending|resolved|closed",
  "category": "technical|billing|general|feature_request|bug_report",
  "attachments": ["array of file paths"],
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "user": {
    "id": 1,
    "name": "string",
    "email": "string"
  },
  "assigned_admin": {
    "id": 1,
    "name": "string"
  }
}
```

### Support Ticket Reply
```json
{
  "id": 1,
  "message": "string",
  "attachments": ["array of file paths"],
  "author_type": "user|admin|system",
  "author_name": "string",
  "created_at": "ISO 8601 timestamp"
}
```

---

## Status Values

### Ticket Status
- `open` - New ticket created by user
- `in_progress` - Assigned to admin and being worked on
- `pending` - Waiting for user response or external action
- `resolved` - Issue has been resolved
- `closed` - Ticket is closed (cannot be reopened)

### Priority Levels
- `urgent` - Critical issues requiring immediate attention
- `high` - Important issues that should be resolved quickly
- `medium` - Standard priority issues
- `low` - Minor issues or feature requests

### Categories
- `technical` - Technical issues, bugs, system problems
- `billing` - Payment, subscription, billing questions
- `general` - General inquiries, account questions
- `feature_request` - Requests for new features
- `bug_report` - Bug reports and issues

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "subject": ["The subject field is required."],
    "priority": ["The priority must be one of: low, medium, high, urgent."]
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
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Support ticket not found"
}
```

### 422 Unprocessable Entity
```json
{
  "success": false,
  "message": "This ticket is closed and cannot accept new replies"
}
```

---

## Usage Examples

### JavaScript/Fetch
```javascript
// Get all support tickets
const response = await fetch('/api/support-tickets', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json'
  }
});
const data = await response.json();

// Create a new ticket
const ticketData = {
  subject: 'Login Issue',
  description: 'Cannot login to my account',
  priority: 'high',
  category: 'technical'
};

const response = await fetch('/api/support-tickets', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(ticketData)
});
```

### PHP/cURL
```php
// Create a support ticket
$data = [
    'subject' => 'Login Issue',
    'description' => 'Cannot login to my account',
    'priority' => 'high',
    'category' => 'technical'
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'http://localhost:8000/api/support-tickets',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'Accept: application/json'
    ]
]);

$response = curl_exec($ch);
curl_close($ch);
```

### Python/Requests
```python
import requests

# Get support tickets
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json'
}

response = requests.get('http://localhost:8000/api/support-tickets', headers=headers)
tickets = response.json()

# Create a new ticket
ticket_data = {
    'subject': 'Login Issue',
    'description': 'Cannot login to my account',
    'priority': 'high',
    'category': 'technical'
}

response = requests.post(
    'http://localhost:8000/api/support-tickets',
    json=ticket_data,
    headers=headers
)
```

---

## Notes

- All timestamps are in ISO 8601 format
- File attachments are stored as file paths in the `attachments` array
- Users can only access their own tickets and replies
- Closed tickets cannot accept new replies
- Ticket numbers are auto-generated in format: `TKT-YYYY-XXXXXX`
- All endpoints return JSON responses with `success` boolean field
