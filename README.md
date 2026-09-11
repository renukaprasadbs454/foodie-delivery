# Foodie Delivery Application

This is the unified frontend repository for the Foodie Delivery application. Built with **Expo** and **React Native**, it supports Android, iOS, and Web platforms from a single, unified codebase. 

## 📦 Project Structure
- `src/` - The main application code (components, screens, navigation, API layer, etc.).
- `assets/` - Static files like images and fonts.
- `android/` & `ios/` - Auto-generated native directories (do not modify manually, use `app.json` or Expo plugins).

---

## 🚀 1. Setup & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- For native Android builds: Java 21 LTS (Eclipse Temurin) & Android Studio

### Installation
1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
   *(Update `.env` with your local backend URL if you are running the backend locally, otherwise it defaults to the production `api.foodie.kwiko.org`)*

### Running the App Locally

**For Web (Localhost):**
Run the web version directly in your browser with live reloading:
```bash
npm run web
# or
npx expo start --web
```

**For Mobile (Expo Go / Dev Client):**
Start the Expo Metro bundler:
```bash
npx expo start
```
- Press `a` to open the Android emulator.
- Press `i` to open the iOS simulator.
- Scan the QR code with your physical device.

---

## 🏗️ 2. Building the App

### Option A: Local Build via Script (Android APK)
If you are on Windows and want to instantly generate an APK without waiting in Expo's cloud queues, we have provided a PowerShell script that manages the Java 21 environment and builds it using Gradle natively:

```powershell
.\build-local.ps1
```
- This will run `npx expo prebuild`, configure the Gradle wrappers, bypass Hermes issues by enforcing the JSC engine, and compile the final APK.
- Once complete, the APK will be located at: `android\app\build\outputs\apk\release\app-release.apk`

### Option B: Building using Android Studio (Manual)
If you prefer using the Android Studio GUI to manage SDKs, run emulators, or build:

1. Generate the native Android project (if you haven't already):
   ```bash
   npx expo prebuild --platform android --clean
   ```
2. Open **Android Studio**.
3. Select **"Open"** and choose the `android` folder located inside the `foodie-delivery` root directory.
4. Wait for Gradle to finish syncing (this may take a few minutes).
5. From the top menu, select **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate a release APK.
6. Alternatively, select your emulator from the device dropdown and click the green **Run (Play)** button to launch it.

### Option C: Building using Expo Application Services (EAS Cloud)
If you want to build iOS without a Mac, or let Expo's cloud servers handle the Android build:

1. Log in to Expo and configure EAS:
   ```bash
   npx eas login
   npx eas build:configure
   ```
2. Trigger an Android build:
   ```bash
   npx eas build -p android --profile preview
   # or for production app bundles (.aab)
   npx eas build -p android --profile production
   ```
3. Trigger an iOS build (requires Apple Developer account):
   ```bash
   npx eas build -p ios --profile production
   ```

---

## 🌐 3. Web Admin / Production Deployment
To generate the static files for deploying the Web application (e.g., to Vercel, Netlify, or Nginx):

1. Export the static web bundle:
   ```bash
   npx expo export -p web
   ```
2. Test the production build locally:
   ```bash
   npx serve dist
   ```
3. **Deployment**: Upload the contents of the `dist/` folder to your web hosting provider.

---

## 🔧 Architecture Notes
- **Javascript Engine**: This app uses `jsc` (JavaScriptCore) instead of `hermes` to gracefully support `#private` class fields and newer ES6 syntax utilized by React Native 0.81.
- **Routing**: Handled by `@react-navigation/native` with modal stacks.
- **State & Data Fetching**: Managed globally via Redux Toolkit and RTK Query (`src/api`).
