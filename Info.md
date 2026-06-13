Path A: Run and Build This Web App (Vite + Express Server)
To run the DroidCoder Web Companion and the LLM API proxy server on your local machine:
Clone the Repository:
   code
   Bash
git clone <your-github-repo-url>
cd <your-repo-folder>

Install Dependencies:
   code
   Bash
npm install

Configure Your Secrets (.env):
Create a .env file in the root directory and add your Google Gemini, OpenRouter, or Hugging Face API keys:
   code
   Env
GEMINI_API_KEY="your-gemini-key"
APP_URL="http://localhost:3000"

Run in Development Mode:
   code
   Bash
npm run dev

This launches the interactive studio on http://localhost:3000 with the live emulator.

Compile the Production Build:
To bundle the server and frontend together for deployment:
   code
   Bash
npm run build

This generates the production bundle ready to run via npm start.

Path B: Deploy Local Gemma weights (Ollama)
To make the Local/Edge Gemma model functional in your real local development 

setup:Install Ollama: Download Ollama for your OS from ollama.com.

Pull Gemma:
Run the following terminal command to download the optimized model weights of Gemma 2 locally:
   code
   Bash
ollama pull gemma2:2b

Configure CORS Permissions:
Since your web application accesses the local Ollama endpoint (http://localhost:11434) from the browser, you must allow cross-origin requests. Launch Ollama as follows:
macOS/Linux:
   code
   Bash
OLLAMA_ORIGINS="*" ollama serve

Windows: Close Ollama via the system tray, then restart it via PowerShell:
   code
   Powershell
$env:OLLAMA_ORIGINS="*"
ollama serve


Path C: Assemble a Real Android APK (Android Studio)
The mock code shown inside the DroidCoder IDE Explorer panel is ready for real Android devices. To compile a real runnable APK:

Open Android Studio: Download and install Android Studio.
Create a New Project: Choose a "Empty Activity" template utilizing Jetpack Compose.

Mirror Project Classes:
Copy the code in MainActivity.kt in DroidCoder into app/src/main/java/com/yourpackage/MainActivity.kt

Add the dependencies mentioned in build.gradle.kts into your local Gradle files.
Compile App: Select Build > Build Bundle(s) / APK(s) > Build APK(s) in the top menu bar to compile a physical output file.

To work around this restriction completely and continue coding uninterrupted:
Toggle Offline Mode to "ON" or select "Gemma Edge 2B IT" inside the Models tab.
In the Models tab, download the simulated Gemma Edge Weights and click Serve Locally.
This initializes a fast local mock inference engine running entirely inside your server memory, completely bypassing connection timeouts to external ports!

