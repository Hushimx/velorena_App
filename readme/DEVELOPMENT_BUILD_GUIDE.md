# Development Build Guide for Push Notifications

Since Expo Go no longer supports push notifications in SDK 53+, you need to create a **development build** to test push notifications.

## What is a Development Build?

A development build is a **custom version** of your app that includes native code (like push notifications) but still allows you to develop with Expo's tools.

## Quick Setup

### 1. Install EAS CLI

```bash
npm install -g @expo/eas-cli
```

### 2. Login to Expo

```bash
eas login
```

### 3. Configure Your Project

```bash
eas build:configure
```

This creates an `eas.json` file in your project.

### 4. Create Development Build

#### For Android:
```bash
eas build --platform android --profile development
```

#### For iOS:
```bash
eas build --platform ios --profile development
```

### 5. Install on Your Device

- **Android**: Download the APK from the EAS build page and install it
- **iOS**: Install via TestFlight or direct installation

## Alternative: Local Development Build

If you want to build locally instead of using EAS:

### 1. Install Expo CLI

```bash
npm install -g @expo/cli
```

### 2. Create Development Build Locally

#### For Android:
```bash
npx expo run:android
```

#### For iOS:
```bash
npx expo run:ios
```

## Testing Push Notifications

Once you have a development build installed:

1. **Open your development build** (not Expo Go)
2. **Navigate to the test notifications screen**
3. **Grant notification permissions**
4. **Test push notifications normally**

## Development vs Production

### Development Build
- ✅ Supports push notifications
- ✅ Hot reloading works
- ✅ Expo dev tools work
- ❌ Takes time to build and install

### Expo Go
- ❌ No push notifications (SDK 53+)
- ✅ Instant testing
- ✅ No build required
- ✅ Easy sharing

## EAS Configuration Example

Your `eas.json` should look like this:

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

## Troubleshooting

### Build Fails
- Check your `app.json` configuration
- Ensure all dependencies are properly installed
- Check EAS build logs for specific errors

### Notifications Still Don't Work
- Make sure you're using the development build, not Expo Go
- Check notification permissions in device settings
- Verify your push token is being generated

### Slow Builds
- Use EAS Build Cache: `eas build --clear-cache`
- Consider using local builds for faster iteration

## Cost Considerations

- **EAS Build**: Free tier includes 30 builds per month
- **Local Builds**: Free but require Android Studio/Xcode setup
- **Development Builds**: Same as regular builds in terms of limits

## Best Practices

1. **Use development builds** for testing push notifications
2. **Use Expo Go** for UI development and non-notification features
3. **Test on physical devices** (push notifications don't work in simulators)
4. **Keep development builds updated** with your latest code changes

## Next Steps

1. Set up your development build
2. Test push notifications in the development build
3. Continue development using the build for notification testing
4. Use Expo Go for other development tasks

For more information, visit: https://docs.expo.dev/develop/development-builds/introduction/
