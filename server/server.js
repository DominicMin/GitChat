const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const { encoding_for_model } = require('tiktoken');
require('dotenv').config();

const app = express();
const port = 8000;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true
}));
app.use(express.json());

// Configure OpenAI API - Support for custom OpenAI-compatible endpoints
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
};

// Override base URL if specified (for OpenAI-compatible APIs)
if (process.env.OPENAI_BASE_URL) {
  openaiConfig.baseURL = process.env.OPENAI_BASE_URL;
}

const openai = new OpenAI(openaiConfig);

// Configure Google Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
let geminiClient = null;

if (GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('✅ Gemini API initialized');
} else {
  console.log('⚠️  Gemini API key not found (set GEMINI_API_KEY to enable)');
}

// Use custom model name from environment variable, default to gpt-4o
const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o';

let systemPrompt;

async function loadSystemPrompt() {
  try {
    systemPrompt = await fs.readFile("llm-branched-conversation-prompt.md", "utf-8");
  } catch (error) {
    console.error("Error loading system prompt:", error);
    process.exit(1);
  }
}

// ===== Utility Functions =====

// Convert GitChat conversation to Gemini history format
function buildGeminiHistory(conversation) {
  return conversation
    .filter(node => node.content && node.content.trim().length > 0)
    .map(node => ({
      role: node.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: node.content }]
    }));
}

// Generate request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Count tokens in text
function countTokens(text, model = 'gpt-4o') {
  try {
    let encoding;
    try {
      encoding = encoding_for_model(model);
    } catch {
      // Fallback to cl100k_base (GPT-4 default) if model not supported
      encoding = encoding_for_model('gpt-4');
    }
    
    const tokens = encoding.encode(text);
    encoding.free();
    return tokens.length;
  } catch (error) {
    // Simple estimation: ~1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

// Analyze conversation statistics
function analyzeConversation(conversation) {
  let userNodes = 0;
  let llmNodes = 0;
  let totalContentLength = 0;
  
  // Use Set to track unique node IDs (avoid double counting in merge scenarios)
  const seenNodeIds = new Set();
  
  conversation.forEach(node => {
    // Skip if already counted (in case of merge scenarios)
    if (seenNodeIds.has(node.id)) {
      return;
    }
    
    // Only count nodes with non-empty content
    if (node.content && node.content.trim().length > 0) {
      seenNodeIds.add(node.id);
      
      if (node.role === 'user') {
        userNodes++;
      } else if (node.role === 'assistant') {
        llmNodes++;
      }
    }
    totalContentLength += (node.content || '').length;
  });
  
  return {
    userNodes,
    llmNodes,
    totalNodes: userNodes + llmNodes,
    totalContentLength
  };
}

// Format duration (milliseconds → seconds)
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Print request statistics
function printRequestStats(stats) {
  console.log('\n' + '='.repeat(60));
  console.log(`📨 REQUEST: ${stats.requestId}`);
  console.log('='.repeat(60));
  console.log(`🎯 Model: ${stats.model}`);
  console.log(`📊 Nodes: ${stats.userNodes} user + ${stats.llmNodes} LLM = ${stats.totalNodes} total`);
  console.log(`📝 Input Tokens: ~${stats.inputTokens}`);
  console.log(`⏱️  Time: ${stats.duration}`);
  if (stats.outputTokens) {
    console.log(`📤 Output Tokens: ~${stats.outputTokens}`);
    console.log(`⚡ Speed: ${stats.speed} tokens/s`);
  }
  if (stats.error) {
    console.log(`❌ Error: ${stats.error}`);
  } else {
    console.log(`✅ Status: Success`);
  }
  console.log('='.repeat(60) + '\n');
}

app.post("/generate", async (req, res) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  let streamStarted = false;
  let outputText = '';
  
  try {
    const data = req.body;
    const conversation = data.conversation || [];
    
    // Analyze conversation
    const analysis = analyzeConversation(conversation);
    
    // Calculate input tokens
    const conversationText = JSON.stringify(data);
    const systemPromptTokens = countTokens(systemPrompt, MODEL_NAME);
    const conversationTokens = countTokens(conversationText, MODEL_NAME);
    const totalInputTokens = systemPromptTokens + conversationTokens;
    
    // Print request info (before sending)
    console.log('\n' + '='.repeat(60));
    console.log(`📨 SENDING REQUEST: ${requestId}`);
    console.log('='.repeat(60));
    console.log(`🎯 Model: ${MODEL_NAME}`);
    console.log(`📊 Nodes: ${analysis.userNodes} user + ${analysis.llmNodes} LLM = ${analysis.totalNodes} total`);
    console.log(`📝 Input Tokens: ~${totalInputTokens} (system: ${systemPromptTokens}, conversation: ${conversationTokens})`);
    console.log(`⏳ Waiting for response...`);
    console.log('='.repeat(60));

    const stream = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(data) }
      ],
      stream: true,
    });

    // Only set headers after successful stream creation
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    streamStarted = true;

    // Stream processing and accumulate output
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        outputText += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ content: "[DONE]" })}\n\n`);
    res.end();
    
    // Calculate response time and output tokens
    const endTime = Date.now();
    const duration = endTime - startTime;
    const outputTokens = countTokens(outputText, MODEL_NAME);
    const speed = duration > 0 ? (outputTokens / (duration / 1000)).toFixed(2) : 0;
    
    // Print completion statistics
    printRequestStats({
      requestId,
      model: MODEL_NAME,
      userNodes: analysis.userNodes,
      llmNodes: analysis.llmNodes,
      totalNodes: analysis.totalNodes,
      inputTokens: totalInputTokens,
      outputTokens: outputTokens,
      duration: formatDuration(duration),
      speed: speed,
      error: null
    });
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error("Error in generate endpoint:", error);
    
    // Print error statistics
    printRequestStats({
      requestId,
      model: MODEL_NAME,
      userNodes: 0,
      llmNodes: 0,
      totalNodes: 0,
      inputTokens: 0,
      duration: formatDuration(duration),
      error: error.message
    });
    
    // Only send JSON error if stream hasn't started
    if (!streamStarted) {
      res.status(500).json({ error: error.message });
    } else {
      // If stream already started, send error through SSE
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// ===== Gemini Endpoint =====
app.post("/generate/gemini", async (req, res) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  let streamStarted = false;
  let outputText = '';
  
  try {
    // Check if Gemini is enabled
    if (!geminiClient) {
      throw new Error('Gemini API not configured. Please set GEMINI_API_KEY in .env');
    }
    
    const data = req.body;
    const conversation = data.conversation || [];
    
    // Analyze conversation
    const analysis = analyzeConversation(conversation);
    
    // Print request info
    console.log('\n' + '='.repeat(60));
    console.log(`📨 SENDING GEMINI REQUEST: ${requestId}`);
    console.log('='.repeat(60));
    console.log(`🎯 Model: ${GEMINI_MODEL}`);
    console.log(`📊 Nodes: ${analysis.userNodes} user + ${analysis.llmNodes} LLM = ${analysis.totalNodes} total`);
    console.log(`⏳ Waiting for response...`);
    console.log('='.repeat(60));

    // Build Gemini history from conversation
    const history = buildGeminiHistory(conversation);
    
    // Get model and create chat with history
    const model = geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
    const chat = model.startChat({ history: history });
    
    // Get the last user message (the new message to send)
    const lastUserMessage = data.newMessage || 'Continue the conversation.';
    
    // Send message and get streaming response
    const result = await chat.sendMessageStream(lastUserMessage);
    
    // Set up streaming response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    streamStarted = true;

    // Stream the response
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        outputText += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ content: "[DONE]" })}\n\n`);
    res.end();
    
    // Calculate response time
    const endTime = Date.now();
    const duration = endTime - startTime;
    const outputTokens = countTokens(outputText, 'gpt-4'); // Approximate
    const speed = duration > 0 ? (outputTokens / (duration / 1000)).toFixed(2) : 0;
    
    // Print completion statistics
    printRequestStats({
      requestId,
      model: GEMINI_MODEL,
      userNodes: analysis.userNodes,
      llmNodes: analysis.llmNodes,
      totalNodes: analysis.totalNodes,
      inputTokens: countTokens(JSON.stringify(conversation), 'gpt-4'),
      outputTokens: outputTokens,
      duration: formatDuration(duration),
      speed: speed,
      error: null
    });
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error("Error in Gemini generate endpoint:", error);
    
    // Print error statistics
    printRequestStats({
      requestId,
      model: GEMINI_MODEL,
      userNodes: 0,
      llmNodes: 0,
      totalNodes: 0,
      inputTokens: 0,
      duration: formatDuration(duration),
      error: error.message
    });
    
    // Only send JSON error if stream hasn't started
    if (!streamStarted) {
      res.status(500).json({ error: error.message });
    } else {
      // If stream already started, send error through SSE
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

async function startServer() {
  await loadSystemPrompt();
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Using model: ${MODEL_NAME}`);
    console.log(`API endpoint: ${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1 (default)'}`);
  });
}

startServer();