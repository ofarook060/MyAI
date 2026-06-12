import React, { useState, useEffect } from "react";
import { 
  Smartphone, Cpu, Key, Download, Server, Wifi, WifiOff, 
  Send, Sparkles, CheckCircle2, RefreshCw, Layers, ShieldCheck, 
  Terminal, ShieldAlert, BadgeAlert, Database, ChevronRight, HelpCircle, 
  Sliders, ArrowRight, Play, Check, Trash, FileCode, PlayCircle, Settings,
  Code, RefreshCcw, Info, CheckCircle, Flame, ExternalLink
} from "lucide-react";
import { Provider, AIModel, ChatMessage, ChatSession, ProviderConfig, DownloadState } from "./types";
import AndroidSimulator from "./components/AndroidSimulator";

// Initial Files for our Virtual Android Project Studio
const INITIAL_PROJECT_FILES = [
  {
    name: "MainActivity.kt",
    path: "app/src/main/java/com/droid/MainActivity.kt",
    language: "kotlin",
    content: `package com.droid

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    CodingAssistantDemo()
                }
            }
        }
    }
}

@Composable
fun CodingAssistantDemo() {
    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(text = "DroidCoder Assistant v1.0", style = MaterialTheme.typography.headlineMedium)
        Text(text = "Offline Edge Gemma compilation active.", style = MaterialTheme.typography.bodyMedium)
        
        Button(onClick = { /* Action */ }) {
            Text("Run Compilation")
        }
    }
}`
  },
  {
    name: "styles.xml",
    path: "app/src/main/res/values/styles.xml",
    language: "xml",
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.DroidCoder" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="colorPrimary">@color/cyan_500</item>
        <item name="colorSecondary">@color/indigo_500</item>
        <item name="android:statusBarColor">?attr/colorSurface</item>
    </style>
</resources>`
  },
  {
    name: "build.gradle.kts",
    path: "app/build.gradle.kts",
    language: "kotlin",
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.droid"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.droid.coder"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
    }
}`
  }
];

export default function App() {
  const [activeProvider, setActiveProvider] = useState<Provider>("gemini");
  const [activeModel, setActiveModel] = useState<string>("gemini-3.5-flash");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Local project files sandbox state
  const [projectFiles, setProjectFiles] = useState(INITIAL_PROJECT_FILES);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [compileStatus, setCompileStatus] = useState<"idle" | "compiling" | "success" | "error">("idle");
  const [buildLogs, setBuildLogs] = useState<string[]>([
    "Virtual Gradle daemon initialized.",
    "Click 'Compile Gradle Project' to build APK output sandbox."
  ]);

  // Provider Credential Integrations stored locally
  const [providerConfigs, setProviderConfigs] = useState<Record<Provider, ProviderConfig>>({
    gemini: { apiKey: "", isActive: true, customModels: [] },
    openrouter: { apiKey: "", isActive: false, customModels: [] },
    huggingface: { apiKey: "", isActive: false, customModels: [] },
    ollama: { apiKey: "", isActive: false, customModels: [], ollamaUrl: "http://localhost:11434" },
    "local-gemma": { apiKey: "", isActive: false, customModels: [] }
  });

  // Simulated Gemma Downloader State
  const [gemmaDownload, setGemmaDownload] = useState<DownloadState>({
    modelId: "local-gemma-2b",
    progress: 0,
    speed: "0 MB/s",
    eta: "--:--",
    status: "idle",
    log: []
  });
  
  const [gemmaServed, setGemmaServed] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "models" | "keys" | "terminal">("chat");

  // Default master AI model configs
  const [models, setModels] = useState<AIModel[]>([
    {
      id: "gemini-3.5-flash",
      name: "gemini-3.5-flash",
      displayName: "Gemini 3.5 Flash",
      description: "Fast multi-lingual coding engine optimized for high-speed edge reasoning.",
      provider: "gemini",
      type: "cloud"
    },
    {
      id: "gemini-3.5-pro",
      name: "gemini-3.5-pro",
      displayName: "Gemini 3.5 Pro",
      description: "Smartest reasoning model for complex architecture layouts.",
      provider: "gemini",
      type: "cloud"
    },
    {
      id: "google/gemini-2.5-flash",
      name: "google/gemini-2.5-flash",
      displayName: "OpenRouter Gemini 2.5",
      description: "Proxy endpoint via OpenRouter API with high latency optimization.",
      provider: "openrouter",
      type: "cloud"
    },
    {
      id: "meta-llama/llama-3.1-8b-instruct:free",
      name: "meta-llama/llama-3.1-8b-instruct:free",
      displayName: "Llama 3.1 8B (Free)",
      description: "High speed lightweight generic LLM hosted on cloud.",
      provider: "openrouter",
      type: "cloud"
    },
    {
      id: "meta-llama/Meta-Llama-3-8B-Instruct",
      name: "meta-llama/Meta-Llama-3-8B-Instruct",
      displayName: "HuggingFace Llama-3 (8B)",
      description: "Serverless standard instruct weights via HF inference endpoint.",
      provider: "huggingface",
      type: "cloud"
    },
    {
      id: "gemma2:2b",
      name: "gemma2:2b",
      displayName: "Ollama Gemma 2 (2B)",
      description: "Local model daemon hosted instantly on http://localhost:11434.",
      provider: "ollama",
      type: "local"
    },
    {
      id: "local-gemma-2b",
      name: "gemma-2b-it-arm64",
      displayName: "Gemma Edge 2B IT",
      description: "Downloadable GGUF weights compiled directly for ARM structures.",
      provider: "local-gemma",
      size: "1.42 GB",
      type: "local",
      isDownloaded: false
    }
  ]);

  // Read saved API keys on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem("DROIDCODER_KEYS");
      if (stored) {
        const parsed = JSON.parse(stored);
        setProviderConfigs(parsed);
      }
      
      const storedModels = localStorage.getItem("DROIDCODER_MODELS");
      if (storedModels) {
        setModels(JSON.parse(storedModels));
      }
    } catch (e) {
      console.error("Failed loading keys", e);
    }
  }, []);

  const updateProviderConfig = (p: Provider, config: Partial<ProviderConfig>) => {
    const updated = {
      ...providerConfigs,
      [p]: {
        ...providerConfigs[p],
        ...config
      }
    };
    setProviderConfigs(updated);
    localStorage.setItem("DROIDCODER_KEYS", JSON.stringify(updated));
  };

  // Chat request sender
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check if offline mode constraint
    if (isOfflineMode && activeProvider !== "local-gemma") {
      alert("Offline Mode is active. You can only chat using local Gemma edge compilation weights!");
      return;
    }

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedMessages);
    setIsLoading(true);

    try {
      const payload = {
        provider: activeProvider,
        model: activeModel,
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        customApiKey: providerConfigs[activeProvider]?.apiKey || "",
        systemPrompt: "You are an elite Android Coding Assistant. Provide working, complete snippets with clear inline instructions.",
        settings: {
          temperature: 0.6,
          ollamaUrl: providerConfigs.ollama?.ollamaUrl || "http://localhost:11434"
        }
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Network response failed.");
      }

      const data = await res.json();
      
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString(),
        stats: data.stats || {
          tokensPerSecond: Math.floor(20 + Math.random() * 25),
          timeToFirstTokenMs: Math.floor(100 + Math.random() * 200),
          engine: activeProvider === "local-gemma" ? "ARM-Neon Core" : "Cloud Sandbox",
          isOfflineSimulated: activeProvider === "local-gemma"
        }
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to contact DroidCoder server.";
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: "assistant",
        content: `⚠️ [Connection Error]\n\n${errorMsg}\n\n*Please ensure your API Token is config in the "Integrations" screen or utilize the high performance Gemini Free server.*`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Simulated Gradle Compilation
  const compileProject = () => {
    setCompileStatus("compiling");
    setBuildLogs(prev => [
      ...prev,
      `[Compile] Started Gradle assembleDebug task on: ${new Date().toLocaleTimeString()}`,
      `[Compile] Analyzing code graph and importing compose compiler assets...`,
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setBuildLogs(prev => [...prev, "[Compile] Running AAPT2 layout pre-compiling logic...", "[Compile] Processing activity_main.xml configurations..."]);
      } else if (step === 2) {
        setBuildLogs(prev => [...prev, "[Compile] Compiling MainActivity.kt into standard byte layers...", "[Compile] Kotlin compilation dynamic optimizing flags parsed correctly."]);
      } else if (step === 3) {
        // Validate if there's any obvious syntax errors to mock error handling
        const activeCode = projectFiles[0].content;
        const hasMatchingClass = activeCode.includes("class MainActivity");
        
        if (!hasMatchingClass) {
          setBuildLogs(prev => [
            ...prev,
            "[Error] Target activity MainActivity is missing main class signature!",
            "[Compile] Gradle task failed with exit status 1."
          ]);
          setCompileStatus("error");
          clearInterval(interval);
          return;
        }

        setBuildLogs(prev => [
          ...prev,
          "[Compile] Linking libraries and dependencies...",
          "[Compile] Signing APK with local test debug key structures...",
          "[Compile] APK compiled successfully. Installed file size: 4.82 MB."
        ]);
        setCompileStatus("success");
        clearInterval(interval);
      }
    }, 1200);
  };

  // Inject assistant block code code directly into our IDE editor
  const injectCodeIntoEditor = (code: string) => {
    const updatedFiles = [...projectFiles];
    updatedFiles[0].content = code; // always inject to first file (MainActivity.kt)
    setProjectFiles(updatedFiles);
    
    // Switch editor index to MainActivity.kt
    setSelectedFileIndex(0);

    // Dynamic toast alerts inside app logs
    setCompileStatus("idle");
    setBuildLogs(prev => [
      ...prev,
      `[Workspace] Successfully synchronized AI code suggestion with MainActivity.kt!`
    ]);
  };

  // Gemma Weighted Download Simulator
  const startSimulatedDownload = (modelId: string) => {
    setGemmaDownload(prev => ({
      ...prev,
      modelId,
      status: "preparing",
      progress: 0,
      log: ["Inlining client cache connections...", "Retrieving Hugging Face CDN links for Gemma weight assets."]
    }));

    let progressNum = 0;
    const interval = setInterval(() => {
      progressNum += Math.floor(Math.random() * 12) + 5;
      if (progressNum >= 100) {
        progressNum = 100;
        setGemmaDownload(prev => ({
          ...prev,
          progress: 100,
          speed: "0 MB/s",
          eta: "0s",
          status: "installed",
          log: [...prev.log, "Weights fully cached inside cache structures. Initializing ARM compilation checksums."]
        }));
        
        // Mark model as downloaded
        const updatedModels = models.map(m => {
          if (m.id === modelId) {
            return { ...m, isDownloaded: true };
          }
          return m;
        });
        setModels(updatedModels);
        localStorage.setItem("DROIDCODER_MODELS", JSON.stringify(updatedModels));

        clearInterval(interval);
      } else {
        const speedVal = (9 + Math.random() * 5).toFixed(1) + " MB/s";
        const remSecs = Math.ceil(((100 - progressNum) * 1.4) / parseFloat(speedVal));
        setGemmaDownload(prev => ({
          ...prev,
          progress: progressNum,
          speed: speedVal,
          eta: `${remSecs}s`,
          status: "downloading",
          log: progressNum % 20 === 0 ? [...prev.log, `Downloaded ${progressNum}% of weight blocks...`] : prev.log
        }));
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0B0D11] text-gray-200 p-3 sm:p-5 flex flex-col font-sans" id="bento-master-layout">
      
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Smartphone className="w-5.5 h-5.5 text-neutral-950 font-black" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                DroidCoder <span className="text-cyan-400 font-mono text-sm uppercase px-2 py-0.5 bg-cyan-950/80 border border-cyan-800/40 rounded-lg">Studio</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">Interactive Android Studio Companion & Gemma compilations environment</p>
            </div>
          </div>
        </div>

        {/* Quick status controls */}
        <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-[#12161F] px-3.5 py-1.5 rounded-xl border border-neutral-800 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-gray-300 font-mono text-[11px]">Daemon API: Live</span>
          </div>

          <button
            id="global-offline-toggle"
            onClick={() => {
              setIsOfflineMode(!isOfflineMode);
              if (!isOfflineMode) {
                // Instantly swap provider to local gemma for better UX if served
                if (gemmaServed) {
                  setActiveProvider("local-gemma");
                  setActiveModel("local-gemma-2b");
                }
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
              isOfflineMode 
                ? "bg-rose-950/40 border-rose-800/50 text-rose-300"
                : "bg-[#12161F] border-neutral-800 text-gray-400 hover:bg-neutral-800"
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 text-rose-400" /> : <Wifi className="w-3.5 h-3.5 text-cyan-400" />}
            {isOfflineMode ? "Developer Offline" : "Online Mode"}
          </button>
        </div>
      </header>

      {/* COMPACT DASHBOARD BENTO GRID */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-12 gap-5 flex-1">
        
        {/* BENTO BLOCK A: Interactive Android Phone Device Frame (Width: 4/12 or 12/12 on mobile) */}
        <section className="col-span-12 lg:col-span-4 xl:col-span-4 order-2 lg:order-1 flex flex-col justify-center items-center">
          <div className="text-center w-full mb-2 flex justify-between px-2 items-center">
            <span className="text-xs uppercase font-bold tracking-widest text-neutral-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-cyan-400" />
              Android ADB Emulator
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/30">
              Target Pixel 8
            </span>
          </div>
          
          <AndroidSimulator 
            activeProvider={activeProvider}
            setActiveProvider={setActiveProvider}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            providerConfigs={providerConfigs}
            updateProviderConfig={updateProviderConfig}
            gemmaDownload={gemmaDownload}
            startSimulatedDownload={startSimulatedDownload}
            gemmaServed={gemmaServed}
            setGemmaServed={setGemmaServed}
            onCodeInject={injectCodeIntoEditor}
            models={models}
            isOfflineMode={isOfflineMode}
            setIsOfflineMode={setIsOfflineMode}
          />
        </section>

        {/* BENTO BLOCK B: Complete IDE Project Workspace & Interactive Live Editor (Width: 8/12) */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-8 order-1 lg:order-2 flex flex-col h-full space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bento Widget B1: Integrations Quick Diagnostics Checklist */}
            <div className="bg-[#12161F] rounded-2xl border border-neutral-800 p-4.5 flex flex-col justify-between whitespace-normal relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    Secure Integrations Matrix
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400">
                    STATUS_CHECKS
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="font-semibold text-gray-200">Google Gemini Cloud</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-mono border border-emerald-900/40">
                      System Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${providerConfigs.openrouter.apiKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <span className="font-semibold text-gray-200">OpenRouter Cloud Hub</span>
                    </div>
                    {providerConfigs.openrouter.apiKey ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-mono border border-emerald-900/40">
                        KEY_CONNECTED
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Not configured
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${providerConfigs.huggingface.apiKey ? 'bg-emerald-500' : 'bg-neutral-600'}`}></div>
                      <span className="font-semibold text-gray-200">HuggingFace Serverless</span>
                    </div>
                    {providerConfigs.huggingface.apiKey ? (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-mono border border-emerald-900/40">
                        TOKEN_ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        No Token set
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3.5 pt-2 border-t border-neutral-800/60 flex justify-between items-center text-[10px] text-neutral-400">
                <span>Check active ports</span>
                <button 
                  id="goto-integrations"
                  onClick={() => alert("Please use the 'Integrations' tab inside the mobile phone emulator to input or change keys!")}
                  className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                >
                  Configure Tokens <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Bento Widget B2: Local Storage & Weights compilation Monitor */}
            <div className="bg-[#12161F] rounded-2xl border border-neutral-800 p-4.5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    Gemma Device Weights
                  </span>
                  <span className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400">
                    {models.find(m => m.id === "local-gemma-2b")?.isDownloaded ? "CACHED" : "UNINSTALLED"}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between text-[11px] font-mono">
                     <span className="text-neutral-400">STORAGE DEPLOYMENT:</span>
                     <span className="text-neutral-200 font-bold">14.2 GB / 32 GB Standard</span>
                  </div>
                  <div className="w-full bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800 text-[11px] text-neutral-300 leading-normal flex items-start gap-2">
                    <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      {models.find(m => m.id === "local-gemma-2b")?.isDownloaded ? (
                        <div className="space-y-1">
                          <p className="text-emerald-400 font-semibold">Gemma edge weights compiled successfully.</p>
                          <p className="text-[10px] text-neutral-400">Serve the model locally via the assistant's 'Models' tab or choose offline reasoning mode.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-neutral-200">Gemma GGUF ARM compilation package is missing.</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">Go to the phone's "Models" tab, download 1.42 GB weights layer, and enable ultra fast offline edge capabilities.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory status info */}
              <div className="mt-3 text-[10px] font-mono text-neutral-500 flex justify-between">
                <span>Memory usage: 1.82 GB Allocated</span>
                <span>ARM Neon Optimization: ON</span>
              </div>
            </div>

          </div>

          {/* Bento Widget B3: Elite Live Code Sandbox & Editor (Width: Full) */}
          <div className="bg-[#12161F] rounded-2xl border border-neutral-800 p-5 flex flex-col flex-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800/80 pb-3 mb-4 gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  DroidCoder Core Project Workspace
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Edit compiled APK classes and trigger Android compilation tasks</p>
              </div>

              {/* Action operations */}
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  id="compile-project-btn"
                  onClick={compileProject}
                  disabled={compileStatus === "compiling"}
                  className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-500 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  {compileStatus === "compiling" ? "Gradle-ing..." : "Compile Gradle Project"}
                </button>

                <button
                  id="reset-project-btn"
                  onClick={() => {
                    setProjectFiles(INITIAL_PROJECT_FILES);
                    setCompileStatus("idle");
                    setBuildLogs(["Gradle dynamic daemon reset. MainActivity restored!"]);
                  }}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[11px] hover:bg-neutral-800 hover:text-white px-2.5 py-1.5 rounded-xl transition"
                  title="Reset code files to original blueprint"
                >
                  Reset IDE
                </button>
              </div>
            </div>

            {/* Editor Workspace content structure */}
            <div className="grid grid-cols-12 gap-4 flex-1">
              
              {/* Vertical Directory list */}
              <div className="col-span-12 sm:col-span-3 bg-neutral-900/40 p-2.5 rounded-xl border border-neutral-800/70 space-y-2 select-none h-[180px] sm:h-[280px] overflow-y-auto">
                <span className="text-[10px] font-bold text-neutral-500 pl-2 block tracking-wider font-mono">PROJECT EXPLORER</span>
                {projectFiles.map((file, idx) => (
                  <button
                    key={idx}
                    id={`file-tab-${idx}`}
                    onClick={() => {
                      setSelectedFileIndex(idx);
                      setBuildLogs(prev => [...prev, `[Workspace] Navigated to file ${file.name}`]);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      selectedFileIndex === idx 
                        ? "bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-semibold"
                        : "text-neutral-400 hover:text-neutral-200 border border-transparent hover:bg-neutral-900"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5 mb-0.5" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
              </div>

              {/* Textarea Code content box */}
              <div className="col-span-12 sm:col-span-9 flex flex-col h-[220px] sm:h-[280px]">
                <div className="flex justify-between items-center bg-neutral-950 px-3 py-1.5 border border-b-0 border-neutral-800/85 rounded-t-xl text-[10px] text-neutral-400 font-mono font-medium">
                  <span>{projectFiles[selectedFileIndex].path}</span>
                  <span className="uppercase text-cyan-400">{projectFiles[selectedFileIndex].language}</span>
                </div>
                <textarea
                  id="ide-code-textarea"
                  value={projectFiles[selectedFileIndex].content}
                  onChange={(e) => {
                    const cloned = [...projectFiles];
                    cloned[selectedFileIndex].content = e.target.value;
                    setProjectFiles(cloned);
                  }}
                  className="w-full flex-1 bg-neutral-950 text-cyan-100 font-mono text-[11px] leading-relaxed p-4 border border-neutral-800/85 rounded-b-xl focus:outline-none focus:border-cyan-500 select-all whitespace-pre resize-none"
                  placeholder="Insert custom Kotlin / Compose code content..."
                />
              </div>

            </div>

            {/* Sandbox Virtual Gradle Compiler terminal logs */}
            <div className="mt-4 pt-4 border-t border-neutral-800/80 grid grid-cols-12 gap-4">
              
              <div className="col-span-12 sm:col-span-8 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-indigo-400" />
                  Virtual Gradle Daemon Terminal
                </span>
                
                <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800 h-[100px] overflow-y-auto text-[9.5px] font-mono select-text text-neutral-300 space-y-1 leading-normal">
                  {buildLogs.map((log, i) => (
                    <div key={i} className={`p-0.5 ${
                      log.startsWith("[Error]") ? "text-rose-400" :
                      log.startsWith("[Compile]") ? "text-cyan-400" :
                      log.startsWith("[Workspace]") ? "text-yellow-400" : "text-neutral-400"
                    }`}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnostic Visual compiled APK outputs simulated state */}
              <div className="col-span-12 sm:col-span-4 bg-neutral-950/30 rounded-xl border border-neutral-800/80 p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-1">APK PREVIEW</span>
                  <div className="mt-2 text-center" id="apk-preview-box">
                    {compileStatus === "idle" && (
                      <span className="text-neutral-500 italic text-xs block py-3">Compile target first</span>
                    )}
                    {compileStatus === "compiling" && (
                      <div className="py-2 flex flex-col items-center gap-1">
                        <RefreshCcw className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-[10px] text-cyan-400 font-mono">Building assembly...</span>
                      </div>
                    )}
                    {compileStatus === "success" && (
                      <div className="flex flex-col items-center gap-1.5 bg-emerald-950/30 border border-emerald-900/40 p-2 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10.5px] text-emerald-400 font-bold font-mono">BUILD SUCCESSFUL</span>
                      </div>
                    )}
                    {compileStatus === "error" && (
                      <div className="flex flex-col items-center gap-1 bg-rose-950/30 border border-rose-900/40 p-2 rounded-lg">
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        <span className="text-[10.5px] text-rose-400 font-mono font-bold">BUILD FAILING</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-neutral-500 font-semibold leading-normal font-mono uppercase text-right">
                  Target: Droid-ARM64
                </div>
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* DASHBOARD FOOTER */}
      <footer className="max-w-7xl mx-auto w-full mt-6 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-3">
        <div className="flex items-center gap-4">
          <span>Client: static • Edge: local simulator</span>
          <span className="font-mono text-[10px] text-neutral-600">|</span>
          <span>Target Architecture: armeabi-v8a neon</span>
        </div>
        <div className="flex items-center gap-4">
          <span>v2.4.0 (Bento Pro Theme)</span>
          <a 
            href="https://google.github.io/gemma/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
          >
            Gemma Documentation <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>

    </div>
  );
}
