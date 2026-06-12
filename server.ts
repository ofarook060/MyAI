import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Server-side endpoint to fetch environment details
app.get("/api/env", (req, res) => {
  res.json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    appUrl: process.env.APP_URL || "http://localhost:3000",
  });
});

// Unified API Chat Complete Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { provider, model, messages, customApiKey, systemPrompt, settings } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const systemInstruction = systemPrompt || "You are a helpful AI Coding Assistant inside an Android developer studio setup.";

    // 1. GEMINI PROVIDER
    if (provider === "gemini") {
      const activeKey = customApiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({ error: "Gemini API Key is not configured on the server or client." });
      }

      // Initialize dynamic client if customized, otherwise use default
      const activeAi = customApiKey 
        ? new GoogleGenAI({ apiKey: activeKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })
        : ai;

      const modelToUse = model || "gemini-3.5-flash";

      // Call generateContent
      // Create user messages string or convert messages array
      // Gemini chats helper can also be used, but generateContent with complete history is highly stable.
      const response = await activeAi.models.generateContent({
        model: modelToUse,
        contents: messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction,
          temperature: settings?.temperature ?? 0.7,
        }
      });

      return res.json({
        content: response.text || "No response text received.",
        model: modelToUse,
        provider: "gemini",
      });
    }

    // 2. OPENROUTER PROVIDER
    if (provider === "openrouter") {
      const activeKey = customApiKey || "";
      if (!activeKey) {
        return res.status(400).json({ error: "OpenRouter API Token is required." });
      }

      const modelToUse = model || "google/gemini-2.5-flash";
      
      const payload = {
        model: modelToUse,
        messages: [
          { role: "system", content: systemInstruction },
          ...messages
        ],
        temperature: settings?.temperature ?? 0.7,
      };

      const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
      const response = await fetch(openRouterUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeKey}`,
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "Droid AI Coding Assistant",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errDetail = await response.text();
        return res.status(response.status).json({ error: `OpenRouter Error: ${errDetail}` });
      }

      const data = await response.json();
      const choice = data?.choices?.[0];
      return res.json({
        content: choice?.message?.content || "No response received.",
        model: modelToUse,
        provider: "openrouter",
        usage: data?.usage
      });
    }

    // 3. HUGGING FACE INFERENCE API
    if (provider === "huggingface") {
      const activeKey = customApiKey || "";
      if (!activeKey) {
        return res.status(400).json({ error: "Hugging Face API Token is required to call Hugging Face Cloud models." });
      }

      // Model formats, e.g. "meta-llama/Llama-3-8b-instruct" or "google/gemma-2-9b-it"
      const modelToUse = model || "meta-llama/Meta-Llama-3-8B-Instruct";
      
      // Merge system instruction with prompt or pass formatted messaging if supported
      const hfUrl = `https://api-inference.huggingface.co/models/${modelToUse}`;
      
      // Hugging Face standard chat template compatibility is handled via key-value or inputs
      // E.g. prompting text with instruction and conversation back-and-forth
      let promptBuilder = `${systemInstruction}\n\n`;
      messages.forEach(msg => {
        const sender = msg.role === "user" ? "User" : "Assistant";
        promptBuilder += `${sender}: ${msg.content}\n`;
      });
      promptBuilder += `Assistant:`;

      const payload = {
        inputs: promptBuilder,
        parameters: {
          max_new_tokens: 512,
          temperature: settings?.temperature ?? 0.7,
        }
      };

      const response = await fetch(hfUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errDetail = await response.text();
        return res.status(response.status).json({ error: `Hugging Face Error: ${errDetail}` });
      }

      const data = await response.json();
      // HF Inference API usually returns [{"generated_text": "..."}]
      let outputText = "";
      if (Array.isArray(data) && data[0]?.generated_text) {
        let text = data[0].generated_text;
        // Strip out previous builders to only show assistant response
        if (text.startsWith(promptBuilder)) {
          outputText = text.replace(promptBuilder, "").trim();
        } else {
          outputText = text.trim();
        }
      } else {
        outputText = JSON.stringify(data);
      }

      return res.json({
        content: outputText || "Hugging Face returned an empty response.",
        model: modelToUse,
        provider: "huggingface",
      });
    }

    // 4. OLLAMA LOCAL SERVER PROXIER
    if (provider === "ollama") {
      // Typically runs at http://localhost:11434 on developer environment
      const ollamaEndpoint = settings?.ollamaUrl || "http://localhost:11434";
      const modelToUse = model || "gemma2:2b";

      const payload = {
        model: modelToUse,
        messages: [
          { role: "system", content: systemInstruction },
          ...messages
        ],
        stream: false,
        options: {
          temperature: settings?.temperature ?? 0.7,
        }
      };

      try {
        const response = await fetch(`${ollamaEndpoint}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errDetail = await response.text();
          return res.status(response.status).json({ error: `Ollama Connection Error: ${errDetail}` });
        }

        const data = await response.json();
        return res.json({
          content: data?.message?.content || "Empty Ollama response.",
          model: modelToUse,
          provider: "ollama",
        });
      } catch (ollamaErr: any) {
        return res.status(503).json({
          error: `Ollama is unreachable at ${ollamaEndpoint}. Please verify that Ollama is running (` + "`ollama serve`" + `) and CORS is enabled via ` + "`OLLAMA_ORIGINS=*`" + `.`,
          code: "OLLAMA_UNREACHABLE"
        });
      }
    }

    // 5. LOCAL GEMMA SIMULATOR (Roleplayed Server-side using Gemini to give an perfectly realistic fast offline experience)
    if (provider === "local-gemma") {
      // Simulate fully local compilation or inference processing latency
      // Let's use Gemini server key to translate user request mimicking a small 2B Gemma model!
      const modelToUse = model || "gemma-2b-local";
      
      const customLocalInstruction = `
        ${systemInstruction}
        IMPORTANT ROLEPLAY GUIDELINE:
        You are simulating a local "Gemma 2B IT" model running natively on an Android device (via llama.cpp / Ollama local bridge).
        Provide extremely concise, developer-centric, high-quality, smart, but directly to-the-point code responses. No verbose word fluffs.
        Make comments inside the code indicating it is processed by "[Android Local Gemma-2B-IT]".
      `;

      if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          })),
          config: {
            systemInstruction: customLocalInstruction,
            temperature: 0.4,
          }
        });

        return res.json({
          content: response.text || "No response.",
          model: modelToUse,
          provider: "local-gemma",
          isOfflineSimulated: true,
          stats: {
            tokensPerSecond: 28.4,
            timeToFirstTokenMs: 95,
            engine: "llama.cpp android-arm64 (optimized)",
            ramUsageGb: "1.82 GB / 6.00 GB Allocated",
          }
        });
      } else {
        // Mock fallback if user doesn't even have Gemini key
        const userPrompt = messages[messages.length - 1]?.content || "";
        return res.json({
          content: `// [Simulated Local Gemma 2B IT Assistant]\n// Running fully offline on Android container\n\nfunction processCode() {\n  console.log("Locally processed prompt: '${userPrompt.replace(/"/g, '\\"')}'");\n  // To obtain live smart responses, please add your Gemini API key in Secrets panel!\n  return true;\n}`,
          model: modelToUse,
          provider: "local-gemma",
          isOfflineSimulated: true,
          stats: {
            tokensPerSecond: 31.0,
            timeToFirstTokenMs: 80,
            engine: "wasm-xgemma native (offline mock)",
            ramUsageGb: "1.12 GB Allocation",
          }
        });
      }
    }

    return res.status(400).json({ error: `Unknown provider specified: ${provider}` });
  } catch (error: any) {
    console.error("Chat Server Error:", error);
    res.status(500).json({ error: error.message || "Unknown Server Error" });
  }
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Coding Assistant Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
