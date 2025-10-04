# Hybrid Notification System Test Guide

## Overview
This guide explains how to test the new hybrid notification system that registers tokens as guests initially and links them to user accounts after login/registration.

## How It Works

### 1. Guest Token Registration
- When the app starts, it automatically requests push notification permissions
- If granted, it gets an Expo push token and registers it as a "guest" token (no user association)
- The token is stored both locally and sent to the backend via `/api/expo-push/register-guest`

### 2. Token Linking
- When a user logs in or registers, the guest token is automatically included in the request
- The backend links the guest token to the user account
- The token is now associated with the authenticated user

### 3. Notification Flow
- **Guest users**: Can receive broadcast notifications sent to all devices
- **Authenticated users**: Can receive both broadcast and targeted notifications

## Testing Steps

### Step 1: Test Guest Token Registration
1. Open the app (without logging in)
2. Navigate to the "Test Notifications" screen
3. Verify that:
   - Status shows "Initialized"
   - Authentication shows "Guest User"
   - Token Type shows "Guest Token"
   - A push token is displayed

### Step 2: Test Guest Notifications
1. While still a guest user, tap "Send Test Notification"
2. You should receive a push notification with title "Test Notification (Guest)"
3. Check the backend logs to confirm the token was registered as guest

### Step 3: Test Token Linking
1. Log in or register a new account
2. Return to the "Test Notifications" screen
3. Verify that:
   - Authentication now shows your email
   - Token Type shows "User Token"
   - The same push token is still displayed

### Step 4: Test User Notifications
1. As an authenticated user, tap "Send Test Notification"
2. You should receive a push notification
3. Check the backend logs to confirm the token was linked to your user account

## Backend API Endpoints

### Guest Token Registration
```
POST /api/expo-push/register-guest
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_id": "ios_1234567890",
  "platform": "ios"
}
```

### User Token Registration/Linking
```
POST /api/expo-push/register
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_id": "ios_1234567890",
  "platform": "ios"
}
```

### Login/Registration with Guest Token
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "guest_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

## Database Schema

The `expo_push_tokens` table stores:
- `token`: The Expo push token
- `tokenable_id`: User ID (null for guest tokens)
- `tokenable_type`: User model class (null for guest tokens)
- `device_id`: Device identifier
- `platform`: Device platform (ios/android/web)
- `is_active`: Whether the token is active
- `last_used_at`: Last time the token was used

## Troubleshooting

### Token Not Registering
- Check device permissions for push notifications
- Verify the Expo project ID is configured correctly
- Check network connectivity to the backend

### Token Not Linking
- Ensure the guest token is being sent with login/registration requests
- Check backend logs for token linking errors
- Verify the user authentication is working correctly

### Notifications Not Received
- Check if the device has push notification permissions
- Verify the Expo push token is valid
- Check backend logs for notification sending errors
- Ensure the Expo push service is configured correctly

## Benefits of This Approach

1. **Seamless Experience**: Users can receive notifications immediately upon app install
2. **No Lost Notifications**: Tokens are preserved when users log in
3. **Flexible Targeting**: Can send to all devices or specific users
4. **Easy Migration**: Existing guest tokens automatically become user tokens
5. **Clean Architecture**: Clear separation between guest and authenticated states
