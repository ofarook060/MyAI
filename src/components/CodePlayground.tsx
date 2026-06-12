import React, { useState } from "react";
import { 
  Code, Play, RefreshCw, FileText, CheckCircle, 
  AlertTriangle, Copy, Cpu, Layout, Sliders, Save, Terminal
} from "lucide-react";

interface CodePlaygroundProps {
  onSuggestFix: (code: string) => void;
  activeModel: string;
}

interface CodeFile {
  name: string;
  language: string;
  path: string;
  content: string;
}

export default function CodePlayground({ onSuggestFix, activeModel }: CodePlaygroundProps) {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [files, setFiles] = useState<CodeFile[]>([
    {
      name: "MainActivity.kt",
      language: "kotlin",
      path: "app/src/main/java/com/droid/coder/MainActivity.kt",
      content: `package com.droid.coder

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import com.droid.coder.ai.GemmaLocalEngine

/**
 * Android AI Coding Studio: MainActivity
 * Integrates local Gemma NPU runtime with cloud fallback channels.
 */
class MainActivity : ComponentActivity() {
    private lateinit var localEngine: GemmaLocalEngine

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize NPU edge loading engine
        localEngine = GemmaLocalEngine(this)
        
        setContent {
            MaterialTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    CodingAssistantScreen(
                        engine = localEngine,
                        defaultModel = "Gemma-2B-Local"
                    )
                }
            }
        }
    }
}
`
    },
    {
      name: "GemmaLocalEngine.kt",
      language: "kotlin",
      path: "app/src/main/java/com/droid/coder/ai/GemmaLocalEngine.kt",
      content: `package com.droid.coder.ai

import android.content.Context
import android.util.Log
import java.io.File

/**
 * Manages GGUF local compilation weights running fully offline
 * using Android neural network acceleration (NNAPI).
 */
class GemmaLocalEngine(private val context: Context) {
    private var isModelLoaded = false
    private var nativeContextPointer: Long = 0

    init {
        // Load custom lightweight native llama runtime
        System.loadLibrary("gemma_android_jni")
    }

    fun loadSelectedModel(modelFile: File): Boolean {
        if (!modelFile.exists()) {
            Log.e("GemmaLocal", "Weights file not found: \${modelFile.absolutePath}")
            return false
        }
        
        try {
            nativeContextPointer = initNativeGemma(
                weightsPath = modelFile.absolutePath,
                threads = 4,
                useGpuNNAPI = true
            )
            isModelLoaded = nativeContextPointer != 0L
            return isModelLoaded
        } catch (e: Exception) {
            Log.e("GemmaLocal", "NATIVE INIT ERROR: \${e.message}")
            return false
        }
    }

    private external fun initNativeGemma(
        weightsPath: String, 
        threads: Int, 
        useGpuNNAPI: Boolean
    ): Long
}
`
    },
    {
      name: "local_gemma_server.cpp",
      language: "cpp",
      path: "app/src/main/cpp/local_gemma_server.cpp",
      content: `#include <jni.h>
#include <string>
#include <android/log.h>
#include <cmath>

#define LOG_TAG "GemmaNativeNDK"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

/**
 * Native llama.cpp android hardware driver link
 */
extern "C"
JNIEXPORT jlong JNICALL
Java_com_droid_coder_ai_GemmaLocalEngine_initNativeGemma(
    JNIEnv* env,
    jobject clazz,
    jstring weights_path,
    jint threads,
    jboolean use_gpu_nnapi
) {
    const char* path = env->GetStringUTFChars(weights_path, nullptr);
    LOGI("Bootstrapping Gemma Edge instance with file: %s", path);
    LOGI("Resource parameters: Threads=%d, NNAPI_Accelerate=%s", threads, use_gpu_nnapi ? "TRUE" : "FALSE");
    
    // Simulate raw memory pointer mapping
    uintptr_t context_ptr = 0xCAFEEBAC;
    
    env->ReleaseStringUTFChars(weights_path, path);
    return static_cast<jlong>(context_ptr);
}
`
    }
  ]);

  const [editorText, setEditorText] = useState(files[0].content);
  const [compileLogs, setCompileLogs] = useState<string[]>([
    "Gradle Sync finished: 3 dependencies mapped successfully.",
    "Ready to build project binary."
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [buildStatus, setBuildStatus] = useState<"idle" | "success" | "warning">("idle");

  const handleFileChange = (index: number) => {
    // Save current file text changed first
    const updatedFiles = [...files];
    updatedFiles[selectedFileIndex].content = editorText;
    setFiles(updatedFiles);

    setSelectedFileIndex(index);
    setEditorText(updatedFiles[index].content);
  };

  const runBuildSimulation = () => {
    setIsCompiling(true);
    setCompileLogs(prev => [...prev, `[Build] Starting compile session for module :app...`]);
    
    setTimeout(() => {
      setIsCompiling(false);
      const isCpp = files[selectedFileIndex].language === "cpp";
      if (isCpp) {
        setCompileLogs(prev => [
          ...prev,
          "[Compiler] g++ -O3 -shared -fPIC local_gemma_server.cpp -o libgemma_android_jni.so",
          "[inspect] Dynamic symbols verified.",
          "[Build SUCCESS] Module NDK lib compiles perfectly with clang-17.",
        ]);
        setBuildStatus("success");
      } else {
        setCompileLogs(prev => [
          ...prev,
          "[Gradle] :app:assembleDebug",
          "[Compiler] kotlinc - JVM Target 17 compiled.",
          "[Verifier] Memory alloc optimization analysis checked: OK.",
          "[Build SUCCESS] Application APK assembled. Output path: app/build/outputs/apk/debug/app-debug.apk (Size 12.8MB)",
        ]);
        setBuildStatus("success");
      }
    }, 1500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editorText);
    alert("Source code copied to clipboard!");
  };

  const triggerAIAssignment = () => {
    const contentToSend = `Here is my current code file: ${files[selectedFileIndex].name}\n\n\`\`\`${files[selectedFileIndex].language}\n${editorText}\n\`\`\`\n\nCan you inspect this file for optimization improvements, explaining details?`;
    onSuggestFix(contentToSend);
  };

  return (
    <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden h-[780px]" id="code-playground-pane">
      
      {/* IDE Top Tool Bar */}
      <div className="bg-neutral-950 p-3 border-b border-neutral-800/80 flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-wide text-neutral-200 uppercase font-mono">Droid IDE Playground</span>
        </div>
        
        {/* Connection status tag */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-orange-400" />
            Active Driver: <span className="text-orange-300 font-bold font-mono">{activeModel.split("/").pop()}</span>
          </span>
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Code Editor Files Tabbing */}
      <div className="bg-neutral-900/40 p-1 flex border-b border-neutral-800 gap-1 overflow-x-auto">
        {files.map((file, i) => (
          <button
            key={i}
            id={`file-tab-${i}`}
            onClick={() => handleFileChange(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedFileIndex === i 
                ? "bg-neutral-800 text-cyan-400 border border-neutral-700/60" 
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850"
            }`}
          >
            <FileText className="w-3 h-3 text-neutral-500" />
            {file.name}
          </button>
        ))}
      </div>

      {/* Editor Content Box */}
      <div className="flex-1 relative bg-neutral-950 flex flex-col overflow-hidden">
        
        {/* Editor path heading */}
        <div className="bg-neutral-950 px-4 py-1.5 border-b border-neutral-900 text-[10px] font-mono text-neutral-500 flex justify-between">
          <span>PATH: {files[selectedFileIndex].path}</span>
          <span className="text-cyan-600 font-bold">{files[selectedFileIndex].language.toUpperCase()}</span>
        </div>

        {/* Real-time editable textbox */}
        <textarea
          id="editor-source-textarea"
          value={editorText}
          onChange={(e) => setEditorText(e.target.value)}
          className="flex-1 bg-neutral-950 p-4 text-neutral-300 font-mono text-xs focus:outline-none resize-none overflow-y-auto selection:bg-cyan-900 leading-relaxed font-normal"
          spellCheck="false"
        />

        {/* Small floating actions on the editor */}
        <div className="absolute right-4 bottom-4 flex gap-2">
          <button
            id="copy-editor-code-btn"
            onClick={handleCopyCode}
            aria-label="Copy editor code"
            title="Copy editor code to clipboard"
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-cyan-400 transition shadow cursor-pointer"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            id="prompt-companion-btn"
            onClick={triggerAIAssignment}
            className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/10 cursor-pointer transition-all active:scale-95"
          >
            <Cpu className="w-3.5 h-3.5" />
            Ask AI Companion to Inspect Code
          </button>
        </div>
      </div>

      {/* Console and Compilation Logs Section */}
      <div className="bg-neutral-950 border-t border-neutral-800/80 p-3 h-[200px] flex flex-col">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-mono font-bold text-neutral-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-neutral-500" />
            SIMULATED COMPILE CONSOLE
          </span>
          
          <div className="flex items-center gap-2">
            {buildStatus === "success" && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded">
                <CheckCircle className="w-3 h-3" />
                BUILD OK
              </span>
            )}
            
            <button
              id="compiler-run-build-btn"
              onClick={runBuildSimulation}
              disabled={isCompiling}
              className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-[10px] py-1 border border-neutral-800 hover:border-neutral-700 px-3 rounded-lg flex items-center gap-1 transition cursor-pointer"
            >
              {isCompiling ? (
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-500" />
              ) : (
                <Play className="w-3 h-3 text-emerald-400" />
              )}
              {isCompiling ? "Compiling..." : "Compile Build"}
            </button>
          </div>
        </div>

        {/* Logs viewport */}
        <div className="flex-1 bg-neutral-950/70 border border-neutral-900 rounded-lg p-2.5 overflow-y-auto text-[10px] font-mono text-neutral-400 space-y-1">
          {compileLogs.map((log, i) => (
            <div key={i} className={`p-0.2 ${log.startsWith("[Build SUCCESS]") ? "text-emerald-400 font-semibold" : log.startsWith("[Compiler]") ? "text-cyan-400" : "text-neutral-400"}`}>
              {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
