<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7550a7ce-fb88-4d89-8651-163f6f0c0848

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


Step-by-Step Implementation1. Build your Vite projectGenerate the static assets (usually output to a dist folder) that will be embedded into the Android app.bashnpm run build
Use code with caution.2. Initialize CapacitorCapacitor bridges your web code to native Android APIs. Add it to your project:bashnpm install @capacitor/core @capacitor/cli
npx cap init
Use code with caution.3. Add the Android platformThis creates a native Android project folder in your root directory.bashnpx cap add android
Use code with caution.4. Sync your web build with CapacitorCopy your compiled dist files into the newly created Android native folder.bashnpx cap copy
Use code with caution.5. Open and Build in Android StudioLaunch your native app inside the Android environment:bashnpx cap open android
Use code with caution.Once Android Studio opens:Wait for the project to finish syncing (Gradle build).Go to the top menu and click Build -> Generate Signed Bundle / APK.Select APK and click Next.Create or select a keystore, input your passwords, and choose release or debug mode.Click Finish. Android Studio will generate your final .apk file.Advanced: Headless/CLI APK Builds (Without Android Studio)If you are running a CI/CD pipeline or prefer compiling completely from the terminal without opening Android Studio, use Gradle directly from your project's android directory:bashcd android
./gradlew assembleDebug
Use code with caution.Your compiled APK will be output in the android/app/build/outputs/apk/debug/ folder
