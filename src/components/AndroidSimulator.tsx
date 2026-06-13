import React, { useState, useEffect, useRef } from "react";
import { 
  Smartphone, Cpu, Key, Download, Server, Wifi, WifiOff, 
  Send, Sparkles, CheckCircle2, RefreshCw, Layers, ShieldCheck, 
  Terminal, ShieldAlert, BadgeAlert, Database, ChevronRight, HelpCircle, 
  Sliders, ArrowRight, Play, Check, Trash
} from "lucide-react";
import { Provider, AIModel, ChatMessage, ProviderConfig, DownloadState } from "../types";

interface AndroidSimulatorProps {
  activeProvider: Provider;
  setActiveProvider: (p: Provider) => void;
  activeModel: string;
  setActiveModel: (m: string) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  providerConfigs: Record<Provider, ProviderConfig>;
  updateProviderConfig: (p: Provider, config: Partial<ProviderConfig>) => void;
  gemmaDownload: DownloadState;
  startSimulatedDownload: (modelId: string) => void;
  gemmaServed: boolean;
  setGemmaServed: (s: boolean) => void;
  onCodeInject: (code: string) => void;
  models: AIModel[];
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
}

export default function AndroidSimulator({
  activeProvider,
  setActiveProvider,
  activeModel,
  setActiveModel,
  messages,
  onSendMessage,
  isLoading,
  providerConfigs,
  updateProviderConfig,
  gemmaDownload,
  startSimulatedDownload,
  gemmaServed,
  setGemmaServed,
  onCodeInject,
  models,
  isOfflineMode,
  setIsOfflineMode,
}: AndroidSimulatorProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "models" | "keys" | "terminal">("chat");
  const [chatInput, setChatInput] = useState("");
  const [localLogs, setLocalLogs] = useState<string[]>([
    "[System] DroidCoder daemon starting...",
    "[System] Local memory: 6.2GB free.",
    "[Local SDK] Ready for model compilation. Connect standard tools."
  ]);
  const [batteryLevel] = useState(87);
  const [currentTime, setCurrentTime] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update simple clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll chat to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!chatInput.trim() || isLoading) return;
    onSendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleModelSelect = (mId: string, provider: Provider) => {
    // Prevent selecting un-downloaded local models
    if (provider === "local-gemma" && !gemmaServed) {
      alert("Please go to the 'Models' tab, download the Gemma weights, and serve the model first!");
      return;
    }
    setActiveProvider(provider);
    setActiveModel(mId);
  };

  // Pre-seed some sample prompts for convenience
  const quickPrompts = [
    { label: "Implement QuickSort", text: "Write an optimized QuickSort in Kotlin for Android using generic arrays." },
    { label: "Fix Memory Leak", text: "How do I avoid memory leaks when using dynamic BroadcastReceivers or Handlers inside an Android Activity?" },
    { label: "Material Buttons", text: "Give me modern material card styles in Jetpack Compose layout." }
  ];

  const filteredModels = models.filter(m => {
    if (m.provider === "local-gemma") return true; // always show local Gemma
    return m.provider === activeProvider;
  });

  // Calculate downloaded models number
  const localGemmaModels = models.filter(m => m.provider === "local-gemma");

  return (
    <div className="w-full max-w-[420px] mx-auto bg-neutral-900 border-4 border-neutral-700 rounded-[48px] p-3 shadow-2xl relative overflow-hidden ring-1 ring-neutral-800/50 flex flex-col h-[780px]" id="android-device-frame">
      
      {/* Speaker and Camera notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-xl z-50 flex items-center justify-center gap-2">
        <div className="w-12 h-1 bg-neutral-800 rounded-full"></div>
        <div className="w-3 h-3 bg-neutral-800 rounded-full border border-neutral-700"></div>
      </div>

      {/* Screen Container */}
      <div className="w-full h-full bg-neutral-950 rounded-[38px] overflow-hidden flex flex-col relative border border-neutral-800">
        
        {/* Status Bar */}
        <div className="h-9 px-6 pt-1 bg-neutral-950 text-neutral-400 text-xs flex justify-between items-center z-40 select-none">
          <span className="font-semibold text-[11px] text-neutral-300 font-mono tracking-wider">{currentTime}</span>
          <div className="flex items-center gap-2">
            {isOfflineMode ? (
              <div className="flex items-center gap-0.5 text-rose-500 font-mono text-[9px] font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                <WifiOff className="w-3 h-3 mr-0.5" />
                OFFLINE MODE
              </div>
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="text-[10px] font-mono text-neutral-300 bg-neutral-800/80 px-1 py-0.5 rounded flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5 text-orange-400" />
              {activeProvider === "local-gemma" ? "EDGE" : "CLOUD"}
            </span>
            <span className="font-mono text-neutral-300 text-[10px]">{batteryLevel}%</span>
            <div className="w-5.5 h-3 border border-neutral-500 rounded-sm p-0.5 flex items-center">
              <div className="h-full bg-emerald-400 rounded-2xs" style={{ width: `${batteryLevel}%` }}></div>
            </div>
          </div>
        </div>

        {/* Dynamic App Header */}
        <header className="px-4 py-3 bg-gradient-to-r from-cyan-950 to-neutral-950 border-b border-neutral-800/80 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/15">
              <Smartphone className="w-4 h-4 text-neutral-950 font-bold" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-neutral-100 tracking-tight flex items-center gap-1.5">
                DroidCoder AI
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              </h1>
              <p className="text-[10px] text-neutral-400 max-w-[170px] truncate">
                Active: {activeProvider.toUpperCase()} / {activeModel.split("/").pop() || "None"}
              </p>
            </div>
          </div>

          {/* Quick Offline Switcher */}
          <button 
            id="offline-toggle-btn"
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`p-1.5 rounded-lg border transition-all text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
              isOfflineMode 
                ? "bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/40" 
                : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800"
            }`}
            title="Toggle simulated Edge / Offline mode"
          >
            {isOfflineMode ? <WifiOff className="w-3 h-3 text-rose-400" /> : <Wifi className="w-3 h-3" />}
            {isOfflineMode ? "Offline" : "Online"}
          </button>
        </header>

        {/* Main Content Area per Tab */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 font-sans text-sm pb-14">
          
          {/* TAB 1: Chat Dashboard */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full space-y-3">
              {/* Welcome card if no messages */}
              {messages.length === 0 ? (
                <div className="my-1 text-center bg-cyan-950/20 border border-cyan-900/40 rounded-2xl p-4 text-xs text-neutral-300 space-y-3" id="welcome-chat-box">
                  <div className="bg-cyan-500/10 p-2 rounded-full w-fit mx-auto">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-cyan-100">Android AI Companion</h3>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    Configure your API tokens, compile/serve Gemma locally or select cloud LLMs to trigger instant coding generation!
                  </p>

                  <div className="pt-2 text-left space-y-1.5">
                    <p className="text-[10px] text-neutral-500 font-semibold tracking-wider uppercase pl-1">Ask me about:</p>
                    {quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        id={`quick-prompt-${idx}`}
                        onClick={() => {
                          setChatInput(p.text);
                        }}
                        className="w-full text-left bg-neutral-900 hover:bg-neutral-800 hover:text-cyan-300 border border-neutral-800/60 rounded-lg p-2 transition text-[11px] truncate flex items-center justify-between cursor-pointer"
                      >
                        <span>{p.label}</span>
                        <ArrowRight className="w-3 h-3 text-cyan-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3" id="chat-scroller">
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      id={`chat-msg-${m.id}`}
                      className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.role === "user" 
                          ? "bg-cyan-600 text-neutral-50 ml-auto rounded-tr-none" 
                          : "bg-neutral-900 text-neutral-200 border border-neutral-800/70 rounded-tl-none font-sans"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1 border-b border-white/5 pb-1">
                        {m.role === "user" ? "You" : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-cyan-400 flex items-center gap-1 font-mono text-[10px]">
                              <Cpu className="w-2.5 h-2.5" />
                              Droid助手
                            </span>
                            {m.stats && (
                              <span className="text-[9px] text-neutral-400 font-mono font-normal">
                                {m.stats.tokensPerSecond} t/s | {m.stats.timeToFirstTokenMs}ms
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="whitespace-pre-wrap selection:bg-cyan-900 break-words text-[11px] leading-relaxed">
                        {m.content}
                      </div>

                      {/* Code Block Context Extractor */}
                      {m.role === "assistant" && m.content.includes("```") && (
                        <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-end">
                          <button
                            id={`inject-btn-${m.id}`}
                            onClick={() => {
                              // Extract first code block found
                              const match = m.content.match(/```(?:kotlin|typescript|javascript|cpp|json|java)?\s*([\s\S]*?)```/);
                              if (match && match[1]) {
                                onCodeInject(match[1]);
                              } else {
                                onCodeInject(m.content);
                              }
                            }}
                            className="bg-cyan-950 hover:bg-cyan-900 text-cyan-300 px-2 py-1 rounded text-[10px] font-mono border border-cyan-800/40 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5" />
                            Send code to IDE
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 bg-neutral-900 text-neutral-300 w-fit rounded-2xl p-2.5 px-3.5 border border-cyan-950/60 rounded-tl-none text-[10px] animate-pulse font-mono">
                      <RefreshCw className="w-3 w-3 text-cyan-400 animate-spin" />
                      DroidCoder is processing query...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Model Download & Serve Center */}
          {activeTab === "models" && (
            <div className="space-y-4" id="models-tab-content">
              <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800">
                <h3 className="font-semibold text-neutral-100 flex items-center gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  Gemma Offline App Engine
                </h3>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Download lightweight Gemma weights onto your simulated storage to boot your own offline LLM server.
                </p>
              </div>

              {/* Mock Storage Allocation */}
              <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                   <span className="text-neutral-400">DEVICE STORAGE (SIMULATED)</span>
                   <span className="text-neutral-200">14.2 GB / 32 GB Free</span>
                </div>
                <div className="w-full bg-neutral-950 h-2 rounded overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-[55%]"></div>
                </div>
              </div>

              {localGemmaModels.map((m) => (
                <div key={m.id} className="p-3.5 bg-neutral-900/60 rounded-2xl border border-neutral-800/80 space-y-3" id={`local-model-card-${m.id}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-900/60 rounded text-[9px] font-mono font-bold">GEMMA ARM</span>
                        <h4 className="font-bold text-neutral-200 text-xs">{m.displayName}</h4>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">{m.description}</p>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-cyan-400 bg-cyan-950 border border-cyan-900/40 px-1.5 py-0.5 rounded shadow">
                      {m.size}
                    </span>
                  </div>

                  {/* Progressive Download UI */}
                  {gemmaDownload.modelId === m.id && gemmaDownload.status !== "idle" && gemmaDownload.status !== "installed" ? (
                    <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 space-y-2" id="download-progress-box">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-cyan-400 uppercase tracking-widest animate-pulse">Status: {gemmaDownload.status}</span>
                        <span className="text-neutral-200">{gemmaDownload.speed} | ETA: {gemmaDownload.eta}</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800/80">
                        <div 
                          className="bg-cyan-500 h-full transition-all duration-300 shadow shadow-cyan-500/30" 
                          style={{ width: `${gemmaDownload.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-neutral-400 leading-none">
                        <span>Chunk validation: ON</span>
                        <span>{gemmaDownload.progress}%</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    {m.isDownloaded ? (
                      <div className="w-full flex gap-2">
                        <div className="flex-1 bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-center flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Weights Cached
                        </div>
                        <button
                          id={`serve-btn-${m.id}`}
                          onClick={() => {
                            setGemmaServed(!gemmaServed);
                            // Log boot status to simulation terminal
                            if (!gemmaServed) {
                              setLocalLogs(prev => [
                                ...prev,
                                `[Ollama/Serve] Loading offline weights ${m.name}...`,
                                "[Ollama] Allocating edge CPU structures. Page limit = 1.6GB",
                                "[Ollama] SIMD dynamic neon optimization starting...",
                                `[Ollama] Edge device server started correctly! Listening on http://0.0.0.0:11434`,
                                `[Ollama] Gemma model successfully served and loaded into edge cache.`
                              ]);
                            } else {
                              setLocalLogs(prev => [
                                ...prev,
                                "[Ollama/Serve] Unloading Gemma weights to free RAM.",
                                "[Ollama] Local server container stopped."
                              ]);
                            }
                          }}
                          className={`flex-1 font-mono text-[10px] font-semibold py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                            gemmaServed 
                              ? "bg-rose-950/40 border-rose-800/50 text-rose-300 hover:bg-rose-900/40" 
                              : "bg-cyan-500 border-cyan-400 text-neutral-950 hover:bg-cyan-400 hover:shadow-cyan-500/20 shadow-md"
                          }`}
                        >
                          {gemmaServed ? "Unload Server" : "Serve Locally"}
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`download-btn-${m.id}`}
                        onClick={() => startSimulatedDownload(m.id)}
                        disabled={gemmaDownload.status !== "idle" && gemmaDownload.status !== "installed"}
                        className="w-full bg-neutral-950 text-neutral-200 border border-neutral-700/80 p-2 rounded-xl hover:bg-neutral-900 transition flex items-center justify-center gap-1.5 text-xs font-semibold hover:border-cyan-500/50 group cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                        Download LLM Bundle
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Other provider lists shortcut info */}
              <div className="bg-neutral-900/30 p-3 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
                <span className="font-semibold text-[10px] text-neutral-300 block mb-1">OTHER CURRENT PROVIDERS:</span>
                <span className="flex justify-between">
                  <span>✨ Gemini (Server managed)</span>
                  <span className="text-emerald-400 font-mono text-[9px]">DIRECT</span>
                </span>
                <span className="flex justify-between">
                  <span>🚀 OpenRouter AI Cloud</span>
                  <span className={providerConfigs.openrouter.apiKey ? "text-emerald-400 font-mono text-[9px]" : "text-amber-500 font-mono text-[9px]"}>
                    {providerConfigs.openrouter.apiKey ? "KEY_SET" : "NO_KEY"}
                  </span>
                </span>
                <span className="flex justify-between">
                  <span>🤗 Hugging Face API</span>
                  <span className={providerConfigs.huggingface.apiKey ? "text-emerald-400 font-mono text-[9px]" : "text-amber-500 font-mono text-[9px]"}>
                    {providerConfigs.huggingface.apiKey ? "TOKEN_SET" : "NO_TOKEN"}
                  </span>
                </span>
                <span className="flex justify-between">
                  <span>🐳 Local Ollama Bridge</span>
                  <span className="text-neutral-500 font-mono text-[9px]">{providerConfigs.ollama.ollamaUrl || "localhost"}</span>
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: Credentials Integration Screen */}
          {activeTab === "keys" && (
            <div className="space-y-4 font-sans" id="keys-tab-content">
              <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800">
                <h3 className="font-semibold text-neutral-100 flex items-center gap-1.5 text-xs">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Provider Integrations
                </h3>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Authenticate securely to query cloud networks directly. Keys are stored locally inside the application runtime.
                </p>
              </div>

              {/* 1. GEMINI */}
              <div className="bg-neutral-900 p-3.5 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Gemini API Configuration
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/50">
                    SERVER SAFE
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  AI Studio initializes Gemini with the server secret key. Optionally input a custom key below to override.
                </p>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-neutral-400 block tracking-wider font-mono">CUSTOM GEMINI KEY (OPTIONAL)</label>
                  <input
                    type="password"
                    id="gemini-custom-key-input"
                    value={providerConfigs.gemini.apiKey}
                    onChange={(e) => updateProviderConfig("gemini", { apiKey: e.target.value })}
                    placeholder="••••••••••••••••••••••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg p-2 text-xs font-mono text-neutral-200"
                  />
                </div>
              </div>

              {/* 2. OPENROUTER */}
              <div className="bg-neutral-900 p-3.5 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-orange-400" />
                    OpenRouter AI Token
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    providerConfigs.openrouter.apiKey ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/50" : "bg-neutral-950 text-neutral-500 border border-neutral-800"
                  }`}>
                    {providerConfigs.openrouter.apiKey ? "CONNECTED" : "DISCONNECTED"}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-neutral-400 block tracking-wider font-mono">OPENROUTER_API_KEY</label>
                  <input
                    type="password"
                    id="openrouter-api-key-input"
                    value={providerConfigs.openrouter.apiKey}
                    onChange={(e) => updateProviderConfig("openrouter", { apiKey: e.target.value })}
                    placeholder="sk-or-v1-••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg p-2 text-xs font-mono text-neutral-200"
                  />
                </div>
              </div>

              {/* 3. HUGGING FACE */}
              <div className="bg-neutral-900 p-3.5 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-500" />
                    Hugging Face HF_TOKEN
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    providerConfigs.huggingface.apiKey ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/50" : "bg-neutral-950 text-neutral-500 border border-neutral-800"
                  }`}>
                    {providerConfigs.huggingface.apiKey ? "ACTIVE" : "MISSING"}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-neutral-400 block tracking-wider font-mono">HUGGING_FACE_TOKEN</label>
                  <input
                    type="password"
                    id="hf-token-input"
                    value={providerConfigs.huggingface.apiKey}
                    onChange={(e) => updateProviderConfig("huggingface", { apiKey: e.target.value })}
                    placeholder="hf_••••••••••••••••••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg p-2 text-xs font-mono text-neutral-200"
                  />
                </div>
              </div>

              {/* 4. OLLAMA CLIENT CONFIG */}
              <div className="bg-neutral-900 p-3.5 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-200 text-xs flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-sky-400" />
                    Ollama Local Daemon Bridge
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Connect to Ollama daemon on your device or network. Ensure CORS rules is toggled correctly with OLLAMA_ORIGINS.
                </p>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-neutral-400 block tracking-wider font-mono">OLLAMA BASE HOST</label>
                  <input
                    type="text"
                    id="ollama-url-input"
                    value={providerConfigs.ollama.ollamaUrl || ""}
                    onChange={(e) => updateProviderConfig("ollama", { ollamaUrl: e.target.value })}
                    placeholder="http://127.0.0.1:11434"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-lg p-2 text-xs font-mono text-neutral-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Terminal Daemon Logs */}
          {activeTab === "terminal" && (
            <div className="space-y-3 font-mono h-full" id="terminal-tab-content">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  Console Logs
                </span>
                <button 
                  id="clear-logs-btn"
                  onClick={() => setLocalLogs([])}
                  className="text-[9px] hover:text-rose-400 text-neutral-500 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-1.5 py-0.5 rounded transition cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 h-[380px] overflow-y-auto text-[9px] text-neutral-300 space-y-1 font-mono hover:border-neutral-700/80 transition-all select-all leading-normal">
                {localLogs.length === 0 ? (
                  <div className="text-neutral-600 italic select-none">No active logs present. Boot or select action to spawn logs.</div>
                ) : (
                  localLogs.map((log, i) => (
                    <div key={i} className={`p-0.5 ${
                      log.includes("[System]") ? "text-cyan-400" :
                      log.includes("[Ollama]") ? "text-yellow-400" :
                      log.includes("[Error]") || log.includes("[Failed]") ? "text-rose-400" : "text-neutral-300"
                    }`}>
                      {log}
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 text-[10px] text-neutral-400 flex items-start gap-2 leading-relaxed font-sans">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-semibold text-neutral-200">System Tip: </span>
                  Ollama runs as a daemon locally. You can compile Gemma to a raw GGUF layer directly, then host the dynamic context with instant socket links.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION TAB BAR */}
        <nav className="absolute bottom-0 left-0 right-0 h-14 bg-neutral-950 border-t border-neutral-800/80 flex justify-around items-center px-2 z-40 select-none">
          <button
            id="tab-btn-chat"
            onClick={() => setActiveTab("chat")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "chat" ? "text-cyan-400 scale-105" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-wide">Assistant</span>
          </button>

          <button
            id="tab-btn-models"
            onClick={() => setActiveTab("models")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "models" ? "text-cyan-400 scale-105" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Download className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-wide">Models</span>
          </button>

          <button
            id="tab-btn-keys"
            onClick={() => setActiveTab("keys")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "keys" ? "text-cyan-400 scale-105" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Key className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-wide">Integrations</span>
          </button>

          <button
            id="tab-btn-terminal"
            onClick={() => setActiveTab("terminal")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeTab === "terminal" ? "text-cyan-400 scale-105" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Terminal className="w-4.5 h-4.5" />
            <span className="text-[9px] font-medium tracking-wide">Terminal</span>
          </button>
        </nav>

        {/* BOTTOM TEXT INPUT SENDER (Only shown on Chat Tab) */}
        {activeTab === "chat" && (
          <div className="absolute bottom-14 left-0 right-0 px-3 py-2 bg-neutral-950 border-t border-neutral-900 flex gap-2 items-center" id="voice-txt-sender">
            <select
              id="model-select-dropdown"
              value={activeModel}
              onChange={(e) => {
                const spec = models.find(m => m.id === e.target.value);
                if (spec) {
                  handleModelSelect(spec.id, spec.provider);
                }
              }}
              className="bg-neutral-900 border border-neutral-850 rounded-lg text-neutral-300 p-1.5 font-mono text-[9px] w-[130px] focus:outline-none focus:border-cyan-500"
            >
              <optgroup label="Select Active Model">
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id === "local-gemma-2b" && !gemmaServed ? "(Offline) " : ""}
                    {m.displayName}
                  </option>
                ))}
              </optgroup>
            </select>

            <input
              type="text"
              id="chat-message-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isOfflineMode && activeProvider !== "local-gemma" ? "Offline. Choose local Gemma!" : "Ask code guidance..."}
              disabled={isOfflineMode && activeProvider !== "local-gemma"}
              className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-[11px] text-neutral-200 placeholder-neutral-500 focus:outline-none"
            />

            <button
              id="send-chat-btn"
              onClick={handleSend}
              disabled={isLoading || (isOfflineMode && activeProvider !== "local-gemma")}
              className={`p-1.5 rounded-lg text-neutral-950 shadow transition cursor-pointer ${
                isLoading || (isOfflineMode && activeProvider !== "local-gemma")
                  ? "bg-neutral-800 text-neutral-600" 
                  : "bg-cyan-400 hover:bg-cyan-300 active:scale-95"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
