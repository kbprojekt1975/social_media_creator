const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

let genAI;

/**
 * Initializes the Gemini API client.
 */
function initGemini() {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in environment.");
    return null;
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

/**
 * Helper to call Gemini with retry logic for 429 errors.
 */
async function withRetry(fn, maxRetries = 5, delay = 4000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || "";
      const isRateLimit = errorMsg.includes("429") || errorMsg.includes("resource exhausted") || errorMsg.includes("too many requests");
      
      if (isRateLimit && i < maxRetries - 1) {
        console.warn(`[Gemini Retry] Rate limit hit (429). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const PLATFORM_RULES = {
  'LinkedIn': 'Style: Professional, authoritative, industry-expert tone. Structure: Strong hook, bullet points for readability, professional storytelling, 3-5 relevant hashtags. Goal: B2B authority.',
  'Facebook': 'Style: Engaging, community-focused, relatable tone. Structure: Conversational, question at the end to boost comments, emojis throughout, 2-3 hashtags. Goal: High engagement/reach.',
  'Instagram': 'Style: Vibrant, lifestyle-oriented, punchy tone. Structure: Short sentences, many emojis, storytelling focus, up to 15 relevant hashtags. Goal: Visual impact/brand image.',
  'Twitter / X': 'Style: Concise, news-oriented, or thought-provoking. Structure: Very short text, focus on engagement/replies, 1-2 hashtags. Goal: Viral reach.',
  'TikTok': 'Style: High-energy, trend-aware, entertaining, and raw. Structure: Hooks for video script/caption, emphasis on music/trends, use of trending hashtags, maximum relatability. Goal: Viral entertainment.',
  'YouTube': 'Style: Educational, comprehensive, and search-optimized. Structure: Strong title hook, detailed description, chapter suggestions, CTA for subscription, use of tags/hashtags. Goal: Long-form authority.',
  'Pinterest': 'Style: Inspirational, aesthetic, and how-to oriented. Structure: Keyword-rich titles, helpful descriptions with bullet points, focus on utility/beauty, 3-5 specific hashtags. Goal: Clicks/Traffic.',
  'Default': 'Style: Engaging and helpful social media manager tone. Structure: Balanced hook, clear information, and relevant hashtags.'
};

const IMAGE_AESTHETICS = {
  'LinkedIn': 'Professional business photography, clean 3D render, minimalist corporate office, professional studio lighting, neutral or blue-toned color palette. Cinematic and high-end B2B look.',
  'Facebook': 'Relatable lifestyle photography, vibrant outdoor or home settings, friendly and warm lighting, natural colors. Emotional and community-oriented aesthetic.',
  'Instagram': 'High-fashion aesthetic, vibrant and saturated colors, creative and trendy compositions, soft sunset or neon lighting, shallow depth of field. Trendy and visually "pop" aesthetic.',
  'Twitter / X': 'Clean digital illustration, news-style infographic, or punchy minimal photography. Focus on clarity and high contrast.',
  'TikTok': 'Dynamic lifestyle action, bright and saturated colors, vlog-style "raw" feel, high energy, neon or natural daylight. Authentic and high-energy feel.',
  'YouTube': 'High-contrast thumbnail style, bold text placeholders (if applicable), dramatic lighting, clear facial expressions or products, cinematic depth. High-click-through rate aesthetic.',
  'Pinterest': 'Clean, aesthetic layout, high-quality product or DIY photography, warm natural lighting, minimalist backgrounds, soft color palettes. Inspiring and "save-worthy" aesthetic.',
  'Default': 'High-quality professional photography with balanced lighting and clear subjects.'
};

const STYLE_GUIDELINES = {
  'Profesjonalny': 'Tone: Expert, reliable, and authoritative. Use clear, industry-standard language. Focus on facts and insights.',
  'Humorystyczny': 'Tone: Funny, witty, and lighthearted. Use wordplay, clever observations, and appropriate humor. Keep it relatable and entertaining.',
  'Entuzjastyczny': 'Tone: High energy, positive, and motivating. Use exclamations (sparingly but effectively), encouraging words, and a "can-do" attitude.',
  'Nietuzinkowy': 'Tone: Unique, bold, and unconventional. Think outside the box, use surprising metaphors, and challenge the status quo. Be provocative but tasteful.',
  'Default': 'Tone: Engaging, helpful, and balanced.'
};

/**
 * Generates technical instructions (prompt) for a social media post.
 */
async function generatePostPlan({ platform, topic, style = "engaging", workspaceContext, customStyleGuidelines }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES['Default'];

  const prompt = `
    You are a professional Prompt Engineer and Social Media Strategist.
    Goal: Write a detailed instruction (prompt) for an AI model to write a post.
    
    Topic: ${topic}
    Platform: ${platform}
    Style: ${style}
    Style Guidelines: ${customStyleGuidelines || STYLE_GUIDELINES[style] || STYLE_GUIDELINES['Default']}
    
    ${workspaceContext ? `WORKSPACE CONTEXT (MANDATORY RULES):
    - Brand Directives: ${workspaceContext.contentDirectives || "Brak szczegółowych wytycznych."}
    - Visual Aesthetic: ${workspaceContext.visualStyle || "Standardowa estetyka social media."}` : ''}
    
    Requirements for the output JSON:
    1. "polishPlan": A user-friendly summary of the strategy in POLISH (max 3-4 sentences).
    2. "englishPrompt": A technical, highly detailed instruction for another AI model in ENGLISH. 
       This instruction must specifically mention that the final post must be in POLISH.
       Include ${rules} and ${style} guidelines.
    
    JSON Schema:
    {
      "polishPlan": "string",
      "englishPrompt": "string"
    }
  `;

  try {
    const response = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return await result.response;
    });
    let text = response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("MODEL_JSON_ERROR: AI returned no JSON.");
    
    let jsonResponse = JSON.parse(jsonMatch[0]);
    return {
      polishPlan: jsonResponse.polishPlan || jsonResponse.PolishPlan || "",
      englishPrompt: jsonResponse.englishPrompt || jsonResponse.EnglishPrompt || ""
    };
  } catch (error) {
    console.error("Gemini Plan Error:", error);
    return {
      polishPlan: `💡 Błąd planowania: ${error.message}`,
      englishPrompt: `Write a high-quality LinkedIn post in POLISH about ${topic}.`
    };
  }
}

/**
 * Transforms a modified Polish strategy into a fresh technical English prompt.
 */
async function syncEnglishPrompt({ polishPlan, platform, topic, style, workspaceContext, customStyleGuidelines }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  
  const prompt = `
    You are an expert Prompt Engineer. 
    Transform the following Polish strategy into a highly detailed, technical English instruction (prompt) for an AI model that will write the final post.
    
    Context:
    - Topic: ${topic}
    - Platform: ${platform}
    - Style: ${style}
    
    User's Polish Strategy: "${polishPlan}"
    
    ${workspaceContext ? `WORKSPACE CONTEXT: ${workspaceContext.contentDirectives}` : ''}
    
    Return ONLY the text of the generated instructions.
  `;

  try {
    const response = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return await result.response;
    });
    return response.text().trim();
  } catch (error) {
    console.error("Sync Prompt Error:", error);
    throw new Error("Failed to synchronize English instructions.");
  }
}

/**
 * Generates social media content.
 */
async function generatePost({ platform, topic, style = "engaging", plannedPrompt = null, workspaceContext, customStyleGuidelines }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES['Default'];

  let prompt = plannedPrompt ? `
    Follow these specific instructions to write a social media post:
    ---
    ${plannedPrompt}
    ---
    Topic: ${topic}
    Platform: ${platform}
    Output ONLY the post content in POLISH.
  ` : `
    Create a highly optimized ${style} post for ${platform} about: ${topic}.
    Guidelines: ${customStyleGuidelines || STYLE_GUIDELINES[style]}
    ${workspaceContext ? `Brand Rules: ${workspaceContext.contentDirectives}` : ''}
    Always respond in POLISH.
  `;

  try {
    const response = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return await result.response;
    });
    const content = response.text();
    const tokens = response.usageMetadata?.totalTokenCount || 500;
    return { content, tokens };
  } catch (error) {
    console.error("Gemini Post Error:", error);
    throw new Error(`Failed to generate post: ${error.message}`);
  }
}

/**
 * Generates a visual prompt.
 */
async function generateVisualPrompt(postContent, aspectRatio = '1:1', platform = 'Default', type = 'image', workspaceContext = null) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const aesthetic = IMAGE_AESTHETICS[platform] || IMAGE_AESTHETICS['Default'];

  const prompt = `
    Create a visual prompt for ${type} based on this post:
    "${postContent.substring(0, 500)}"
    Platform: ${platform}
    Aesthetic: ${aesthetic}
    Format: ${aspectRatio}
    ${workspaceContext ? `Brand Style: ${workspaceContext.visualStyle}` : ''}
    
    Return JSON:
    {
      "polishDescription": "Opis dla użytkownika",
      "englishPrompt": "Technical prompt for AI"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Visual Prompt Error:", error);
    return { polishDescription: "Scena z posta", englishPrompt: "High quality cinematic " + type };
  }
}

/**
 * Translates visual prompt.
 */
async function translateToTechnicalPrompt(polishPrompt, type = 'image', aspectRatio = '1:1') {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Translate this Polish visual description to technical English prompt for ${type}: "${polishPrompt}". Format: ${aspectRatio}.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    return polishPrompt;
  }
}

/**
 * Refines post.
 */
async function refinePost(originalPost, instructions, workspaceContext = null) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Refine this post: "${originalPost}" based on: "${instructions}". ${workspaceContext ? `Brand rules: ${workspaceContext.contentDirectives}` : ''} Respond ONLY with the refined Polish text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return { content: response.text().trim(), tokens: response.usageMetadata?.totalTokenCount || 250 };
  } catch (error) {
    throw new Error("Błąd ulepszania posta.");
  }
}

/**
 * Refines visual prompt.
 */
async function refineVisualPrompt(v1PromptObject, lastPromptObject, instructions, workspaceContext = null, mediaUrl = null, targetMediaUrl = null, type = 'image', gifSettings = null) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Refine visual prompt. Last version: "${lastPromptObject?.englishPrompt}". Instructions: "${instructions}". Return JSON with polishDescription and englishPrompt.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      polishDescription: parsed.polishDescription || "Poprawiony projekt",
      englishPrompt: parsed.englishPrompt || "",
      aiDetectionLog: "Analiza zakończona pomyślnie"
    };
  } catch (error) {
    throw new Error("Błąd ulepszania wizualizacji.");
  }
}

/**
 * Syncs visual prompt.
 */
async function syncVisualPrompt({ polishDescription, aspectRatio = '1:1', type = 'image', workspaceContext = null }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Translate and professionalize this Polish description to technical English prompt for ${type}: "${polishDescription}". Format: ${aspectRatio}.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    return polishDescription;
  }
}

/**
 * Generates Veo Video.
 */
async function generateVeoVideo(visualPrompt, aspectRatio = '1:1', imageBase64 = null, isGif = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = "models/veo-3.1-lite-generate-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelId}:predictLongRunning?key=${apiKey}`;

  const payload = {
    instances: [{ prompt: visualPrompt, ...(imageBase64 ? { image: { bytesBase64Encoded: imageBase64, mimeType: "image/png" } } : {}) }],
    parameters: { sampleCount: 1, aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9', durationSeconds: isGif ? 4 : 6 }
  };

  try {
    const response = await axios.post(url, payload);
    return { status: "processing", operationName: response.data.name };
  } catch (error) {
    throw new Error("Błąd AI Studio (Video).");
  }
}

/**
 * Generates Nano Banana Image.
 */
async function generateNanoBananaImage(visualPrompt, aspectRatio = '1:1', originalImageBase64 = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [...(originalImageBase64 ? [{ inlineData: { data: originalImageBase64, mimeType: "image/png" } }] : []), { text: visualPrompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] }
  };

  try {
    const response = await axios.post(url, payload);
    const part = response.data.candidates[0].content.parts.find(p => p.inlineData);
    return Buffer.from(part.inlineData.data, 'base64');
  } catch (error) {
    throw new Error("Błąd Nano Banana.");
  }
}

/**
 * Generates Campaign Plan.
 */
async function generateCampaignPlan(data) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const prompt = `Create a campaign plan JSON based on: ${JSON.stringify(data)}. Return array of objects with day, platform, topic, visualIdea, rationale.`;

  try {
    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error("Błąd planowania kampanii.");
  }
}

/**
 * Refines custom campaign goal.
 */
async function refineCampaignGoal(rawGoal) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const prompt = `Refine this goal professionally: "${rawGoal}". Return JSON {refinedGoal, description}.`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);
}

/**
 * Refines product description.
 */
async function refineProductDescription(rawDescription) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent(`Refine professionally in Polish: "${rawDescription}". Max 3 sentences.`);
  return result.response.text().trim();
}

/**
 * Refines USP.
 */
async function refineUSP(rawUSP) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent(`Refine professionally in Polish (1 sentence): "${rawUSP}".`);
  return result.response.text().trim();
}

/**
 * Chat with Assistant.
 */
async function chatWithAssistant(history, message) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite", systemInstruction: "Jesteś pomocnym asystentem SMC..." });
  const chat = model.startChat({ history: history || [] });
  const result = await chat.sendMessage(message);
  return result.response.text();
}

/**
 * Brand Directives.
 */
async function generateBrandDirectives({ brandName, type, currentDirectives }) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent(`Generate brand ${type} directives for ${brandName}. Current: ${currentDirectives}. In Polish.`);
  return result.response.text().trim();
}

/**
 * Market Trends.
 */
async function generateMarketTrends({ brandName, contentDirectives, visualStyle }) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent(`Market trends for ${brandName}. In Polish.`);
  return result.response.text().trim();
}

/**
 * Publishing Schedule.
 */
async function generatePublishingSchedule(campaignData) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-pro", tools: [{ googleSearch: {} }] });
  const result = await model.generateContent(`Publishing schedule for ${JSON.stringify(campaignData)}. In Polish.`);
  return result.response.text().trim();
}

/**
 * Individual Post Schedule.
 */
async function generatePostSchedule({ postContent, productDescription, topic, platform }) {
  const ai = initGemini();
  const model = ai.getGenerativeModel({ model: "gemini-2.5-pro", tools: [{ googleSearch: {} }] });
  const prompt = `When to post this? Post: "${postContent}". Topic: "${topic}". Product: "${productDescription}". Platform: "${platform}". In Polish. Max 4 points.`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { 
  generatePost, generatePostPlan, syncEnglishPrompt, generateVisualPrompt, 
  syncVisualPrompt, translateToTechnicalPrompt, generateNanoBananaImage, 
  generateVeoVideo, refinePost, refineVisualPrompt, generateCampaignPlan, 
  refineCampaignGoal, refineProductDescription, refineUSP, chatWithAssistant,
  generateBrandDirectives, generateMarketTrends, generatePublishingSchedule,
  generatePostSchedule
};
