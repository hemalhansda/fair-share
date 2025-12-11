# 📱 Mobile Build Guide - fyrShare

This guide will help you build and deploy fyrShare as native iOS and Android apps.

## ✅ What's Already Done

- ✓ Capacitor installed and configured
- ✓ iOS platform added (`ios/` folder)
- ✓ Android platform added (`android/` folder)
- ✓ Web build created in `dist/`
- ✓ App ID: `com.hemaalhansda.fyrshare`
- ✓ App Name: `fyrShare`

## 📋 Prerequisites

### For iOS Build (macOS only):
- macOS computer
- Xcode 14+ installed from Mac App Store
- Apple Developer Account ($99/year for App Store)
- CocoaPods installed: `sudo gem install cocoapods`

### For Android Build (any OS):
- Android Studio installed
- Java JDK 11+ installed
- Android SDK installed (comes with Android Studio)

## 🔨 Building the Apps

### 1️⃣ Update Web Code & Rebuild

Whenever you make changes to your React code:

```bash
# Build the web app
npm run build

# Copy changes to native projects
npx cap sync
```

### 2️⃣ Build for iOS

```bash
# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your development team (Hemaal Hansda)
2. Connect your iPhone or select a simulator
3. Click the Play ▶️ button to build and run
4. For App Store release:
   - Product → Archive
   - Follow the upload process to App Store Connect

**Important iOS Setup:**
- Configure app icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Update `Info.plist` for permissions (camera, location, etc.)
- Set up signing certificates in Xcode

### 3️⃣ Build for Android

```bash
# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Connect an Android device or use emulator
3. Click Run ▶️ to build and test
4. For Play Store release:
   - Build → Generate Signed Bundle / APK
   - Create a keystore (first time only)
   - Build release APK or AAB

**Important Android Setup:**
- Configure app icons in `android/app/src/main/res/mipmap-*/`
- Update `AndroidManifest.xml` for permissions
- Create a keystore for signing:
```bash
keytool -genkey -v -keystore fyrshare.keystore -alias fyrshare -keyalg RSA -keysize 2048 -validity 10000
```

## 🎨 App Icons & Splash Screens

Create icons for both platforms:

**Required Sizes:**
- iOS: 1024x1024 (App Store), plus various smaller sizes
- Android: 512x512 (Play Store), plus various densities

**Quick Tool:** Use [https://icon.kitchen](https://icon.kitchen) to generate all required sizes.

Place icons in:
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: `android/app/src/main/res/mipmap-*/`

## 🔧 Configuration Files

### capacitor.config.json
```json
{
  "appId": "com.hemaalhansda.fyrshare",
  "appName": "fyrShare",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#10b981",
      "showSpinner": true,
      "androidSpinnerStyle": "large",
      "spinnerColor": "#ffffff"
    }
  }
}
```

## 📦 Building Release Versions

### iOS Release:

1. Archive the app in Xcode (Product → Archive)
2. Upload to App Store Connect
3. Fill out app information, screenshots, descriptions
4. Submit for review
5. Wait for Apple approval (1-2 days typically)

### Android Release:

1. Build signed AAB:
```bash
cd android
./gradlew bundleRelease
```

2. Upload AAB to Google Play Console
3. Fill out store listing, screenshots, descriptions
4. Submit for review
5. Wait for Google approval (a few hours typically)

## 🚀 Publishing Checklist

- [ ] App icons created (iOS & Android)
- [ ] Splash screen configured
- [ ] App name and bundle ID verified
- [ ] Privacy policy created (required by both stores)
- [ ] App description written
- [ ] Screenshots taken (multiple device sizes)
- [ ] Promo graphics created
- [ ] Pricing & availability set
- [ ] Categories selected
- [ ] Content rating completed
- [ ] Testing on real devices
- [ ] All links working (deep linking if applicable)
- [ ] Google OAuth configured for mobile
- [ ] Supabase configured for mobile access

## 🔐 Important: OAuth & Backend Setup

Your app uses Google OAuth and Supabase. Make sure:

1. **Google OAuth:**
   - Add iOS URL scheme in Xcode
   - Add Android package name in Google Console
   - Update OAuth redirect URIs

2. **Supabase:**
   - Add your app's domains to allowed URLs
   - Configure proper CORS settings
   - Test authentication flow on mobile

## 🐛 Common Issues & Solutions

**iOS Build Fails:**
- Run `cd ios && pod install` 
- Clean build folder: Product → Clean Build Folder
- Update CocoaPods: `pod repo update`

**Android Build Fails:**
- Invalidate caches: File → Invalidate Caches / Restart
- Clean: `./gradlew clean`
- Check Android SDK versions match

**OAuth Not Working:**
- Configure custom URL schemes for mobile
- Update redirect URIs in Google Console
- Check Info.plist / AndroidManifest.xml

## 📱 Testing on Devices

**iOS:**
```bash
# Run on connected iPhone
npx cap run ios --target="Your iPhone Name"
```

**Android:**
```bash
# Run on connected Android device
npx cap run android --target="device-id"
```

## 🔄 Update Workflow

When you update your app:

1. Update version in `package.json`
2. Run `npm run build`
3. Run `npx cap sync`
4. Update version in Xcode (iOS)
5. Update version in `android/app/build.gradle`
6. Build and submit to stores

## 📞 Support & Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **iOS Developer:** https://developer.apple.com
- **Android Developer:** https://developer.android.com
- **Ionic Forum:** https://forum.ionicframework.com

## 🎉 Next Steps

1. ✅ Install Xcode (for iOS) or Android Studio (for Android)
2. ✅ Run `npx cap open ios` or `npx cap open android`
3. ✅ Test the app on a simulator/emulator
4. ✅ Create app icons and splash screens
5. ✅ Configure OAuth for mobile
6. ✅ Test on real devices
7. ✅ Prepare store listings
8. ✅ Submit to App Store and Google Play

---

**Made with ❤️ by Hemaal Hansda**

*Good luck with your app launch! 🚀*
