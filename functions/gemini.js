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
 * @param {Object} params - Parameters.
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
    
    console.log("Gemini Plan Raw Output:", text);

    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON object found in text:", text);
      throw new Error("MODEL_JSON_ERROR: AI returned no JSON.");
    }
    
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON Parse Error. Extracted text was:", jsonMatch[0]);
      throw new Error("MODEL_JSON_ERROR: AI returned invalid JSON format.");
    }

    // Normalize keys
    const normalized = {
      polishPlan: jsonResponse.polishPlan || jsonResponse.PolishPlan || jsonResponse.polish_plan || "",
      englishPrompt: jsonResponse.englishPrompt || jsonResponse.EnglishPrompt || jsonResponse.english_prompt || ""
    };

    if (!normalized.polishPlan && !normalized.englishPrompt) {
       throw new Error("EMPTY_FIELDS: AI returned empty plan.");
    }

    return normalized;
  } catch (error) {
    console.error("Gemini Plan Error:", error);
    return {
      polishPlan: `💡 Błąd planowania: ${error.message}. Spróbuj ponownie lub użyj domyślnego promptu poniżej.`,
      englishPrompt: `Write a high-quality LinkedIn post in POLISH about ${topic}. Tone: ${style}. Platform rules: ${platform}.`
    };
  }
}

/**
 * Transforms a modified Polish strategy into a fresh technical English prompt.
 * @param {Object} params - Parameters.
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
    - Style Guidelines: ${customStyleGuidelines || STYLE_GUIDELINES[style] || STYLE_GUIDELINES['Default']}
    
    User's Polish Strategy (Source):
    "${polishPlan}"
    
    ${workspaceContext ? `WORKSPACE CONTEXT (MANDATORY RULES):
    - Brand Directives: ${workspaceContext.contentDirectives || "Brak szczegółowych wytycznych."}
    - Visual Aesthetic: ${workspaceContext.visualStyle || "Standardowa estetyka social media."}` : ''}
    
    Requirements for the Technical Prompt (Target):
    1. Language: Write the prompt in ENGLISH.
    2. Constraint: The prompt must instruct the AI to write the final post in POLISH.
    3. Detail: Include specific instructions on tone, structure, and formatting based on the Polish input.
    
    Response format: Return ONLY the text of the generated instructions. No markdown blocks.
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
 * Generates social media content based on platform, topic, and style.
 * @param {Object} params - Generation parameters.
 * @param {string} params.platform - Target platform.
 * @param {string} params.topic - The main topic.
 * @param {string} [params.style] - Optional style.
 * @param {string} [params.plannedPrompt] - Optional pre-generated instructions.
 * @returns {Promise<Object>} - The generated content and token count.
 */
async function generatePost({ platform, topic, style = "engaging", plannedPrompt = null, workspaceContext, customStyleGuidelines }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES['Default'];

  let prompt;
  if (plannedPrompt) {
    prompt = `
      Follow these specific instructions to write a social media post:
      ---
      ${plannedPrompt}
      ---
      Original context (if not covered above):
      Topic: ${topic}
      Platform: ${platform}
      Style: ${style}
      
      Output ONLY the post content.
    `;
  } else {
    prompt = `
      You are a world-class social media strategist. 
      Create a highly optimized ${style} post for ${platform} about the following topic:
      
      Topic: ${topic}
      Style: ${style}
      Style Guidelines: ${customStyleGuidelines || STYLE_GUIDELINES[style] || STYLE_GUIDELINES['Default']}
      
      ${workspaceContext ? `WORKSPACE CONTEXT (MANDATORY RULES):
      - Brand Directives: ${workspaceContext.contentDirectives || "Brak szczegółowych wytycznych."}
      - Visual Aesthetic: ${workspaceContext.visualStyle || "Standardowa estetyka social media."}` : ''}
      
      Platform-Specific Strategy: ${rules}
      
      Language: ALWAYS respond in POLISH.
      Content structure: 
      1. Chwytliwy nagłówek (Hook)
      2. Wartościowa treść (Body)
      3. Wezwanie do działania (Call to Action)
      4. Odpowiednie hashtagi
    `;
  }

  try {
    console.log("Generating post for:", platform, "Topic:", topic);
    const response = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return await result.response;
    });
    const content = response.text();
    const tokens = response.usageMetadata?.totalTokenCount || 500;
    console.log("Generation successful, tokens:", tokens);
    return { content, tokens };
  } catch (error) {
    console.error("Gemini Post Error Detail:", error);
    throw new Error(`Failed to generate optimized post: ${error.message}`);
  }
}

/**
 * Generates a visual prompt for image or video generation based on a social media post.
 * @param {string} postContent - The content of the post to base the prompt on.
 * @param {string} aspectRatio - The desired format (e.g., '1:1', '9:16', '16:9').
 * @param {string} platform - The target platform for aesthetic optimization.
 * @param {string} type - Visualization type: 'image' (default) or 'video'.
 * @param {Object} workspaceContext - Optional brand workspace context.
 * @returns {Promise<string>} - The generated visual prompt.
 */
async function generateVisualPrompt(postContent, aspectRatio = '1:1', platform = 'Default', type = 'image', workspaceContext = null) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const aesthetic = IMAGE_AESTHETICS[platform] || IMAGE_AESTHETICS['Default'];

  const prompt = `
    Jesteś dyrektorem kreatywnym i ekspertem od Prompt Engineeringu. 
    Twoim zadaniem jest stworzenie opisu wizualnego dla modelu AI (${type === 'video' ? 'wideo' : 'obraz'}), bazując na treści posta.
    
    Platforma: ${platform}
    Estetyka platformy: ${aesthetic}
    Format: ${aspectRatio}
    
    ${workspaceContext ? `WYTYCZNE PRZESTRZENI ROBOCZEJ (MARKI):
    ${workspaceContext.visualStyle}` : ''}

    Treść posta:
    "${postContent.substring(0, 3000)}"
    
    ZWRÓĆ DANE W FORMACIE JSON:
    {
      "polishDescription": "Krótki, sugestywny opis sceny po polsku dla użytkownika (bez technicznego żargonu).",
      "englishPrompt": "Technical English prompt for ${type === 'video' ? 'Veo 3.1' : 'Nano Banana'} (detailed, lighting, composition, camera settings, no text, cinema quality)."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in visual prompt output:", text);
      throw new Error("MODEL_JSON_ERROR: AI returned no JSON for visual prompt.");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Visual Prompt Error:", error);
    return {
      polishDescription: `Wysokiej jakości ${type} przedstawiający: ${postContent.substring(0, 200).trim()}...`,
      englishPrompt: `High quality cinematic ${type} of ${postContent.substring(0, 200).trim()}, professional lighting, 8k, highly detailed.`
    };
  }
}

/**
 * Translates a user-edited Polish prompt into a technical English prompt for the generation models.
 */
async function translateToTechnicalPrompt(polishPrompt, type = 'image', aspectRatio = '1:1') {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Transform the following Polish visual description into a high-end, technical English prompt for ${type === 'video' ? 'Veo 3.1 Video Generator' : 'Nano Banana Image Generator'}.
    
    Polish Description:
    "${polishPrompt}"
    
    Aspect Ratio: ${aspectRatio}
    
    Requirements for the English Prompt:
    - Strictly in ENGLISH.
    - Use technical terms for lighting, camera lens, and composition.
    - No text in the image/video.
    - For video, include specific motion and camera trajectory instructions.
    - Output ONLY the final technical prompt text.
  `;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Translation Error (Retries Failed):", error);
    return polishPrompt; // Fallback to original if translation fails
  }
}

/**
 * Refines an existing post based on user instructions.
 * @param {string} originalPost - The previously generated post.
 * @param {string} instructions - The user's instructions for refinement.
 * @returns {Promise<Object>} - The refined post content and token count.
 */
async function refinePost(originalPost, instructions, workspaceContext = null) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Jesteś profesjonalnym Social Media Managerem.
    Masz poniższy wygenerowany post:
    ---
    ${originalPost}
    ---
    
    Klient poprosił o wprowadzenie następujących zmian:
    "${instructions}"
    
    ${workspaceContext ? `MANDATORY BRAND RULES (WORKSPACE):
    - Tone/Style: ${workspaceContext.contentDirectives}` : ''}
    
    Zastosuj te zmiany do posta. 
    Zwróć TYLKO nową, gotową treść posta w docelowym języku (zawsze po polsku, o ile klient nie poprosił inaczej).
  `;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    const content = response.text().trim();
    
    if (!content) {
      throw new Error("Model Gemini zwrócił pustą odpowiedź.");
    }

    const tokens = response.usageMetadata?.totalTokenCount || 250;
    return { content, tokens };
  } catch (error) {
    console.error("Gemini Refine Post Error Details:", error);
    // If it's a safety error or other specific AI error, pass it through
    const errorMessage = error.message?.includes("safety") 
      ? "Treść została zablokowana przez filtry bezpieczeństwa AI." 
      : error.message;
    throw new Error(`Błąd ulepszania posta: ${errorMessage}`);
  }
}

/**
 * Refines a visual prompt using "Deep Scene Reconstruction".
 * Context-aware: takes Version 1 (Anchor) and Last Version to prevent style drift.
 */
async function refineVisualPrompt(v1PromptObject, lastPromptObject, instructions, workspaceContext = null, mediaUrl = null, targetMediaUrl = null, type = 'image', gifSettings = null) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  let promptParts = [];

  // OPTIMIZATION: If we have an image, we send it for multimodal analysis
  if (mediaUrl) {
    try {
      const axios = require('axios');
      const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      
      promptParts.push({
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        }
      });
      console.log("[Multimodal] Added start image context.");
    } catch (e) {
      console.error("Multimodal analysis fetch failed (mediaUrl):", e);
    }
  }

  // TARGET IMAGE: If provided, add it as the second visual context
  if (targetMediaUrl) {
    try {
      const axios = require('axios');
      const response = await axios.get(targetMediaUrl, { responseType: 'arraybuffer' });
      const base64Target = Buffer.from(response.data, 'binary').toString('base64');
      
      promptParts.push({
        inlineData: {
          data: base64Target,
          mimeType: "image/png"
        }
      });
      console.log("[Multimodal] Added target image context.");
    } catch (e) {
      console.error("Multimodal analysis fetch failed (targetMediaUrl):", e);
    }
  }

  const isTransition = !!targetMediaUrl;
  const isGif = type === 'gif';

  const textPrompt = (isTransition || isGif) 
    ? `
    Jesteś reżyserem wizualnym AI. Twoim zadaniem jest stworzenie technicznego promptu dla modelu ${isGif ? 'animacji (GIF)' : 'wideo (Veo 3.1)'}.
    
    KONTEKST:
    - TRYB: ${isGif ? 'Krótki, zapętlony GIF (idealny do social media/naklejek)' : 'Płynne wideo cinematic'}
    ${isTransition ? '- ZADANIE: Przejście (morphing) między Obrazem 1 a Obrazem 2.' : '- ZADANIE: Animacja pojedynczego obrazu.'}
    - WYTYCZNE UŻYTKOWNIKA: "${instructions}"
    
    ${isGif ? `SPECYFIKA GIF:
    - TRYB ANIMACJI: ${gifSettings?.loopType || 'loop'} (jeśli ping-pong, animacja musi wracać do punktu wyjścia).
    - PRĘDKOŚĆ: ${gifSettings?.speed || 0.5}s na cykl zmiany (płynny vs dynamiczny).
    - NAPIS (OVERLAY): "${gifSettings?.text || ''}" (Styl: ${gifSettings?.font || 'modern'}). Umieść napis czytelnie, w dolnej lub środkowej części.
    - EFEKT BEAUTY: ${gifSettings?.beautyEffect || 'none'}.
    - PRZYCISK CTA: ${gifSettings?.cta || 'none'}.
    - PRZEZROCZYSTOŚĆ: ${gifSettings?.isTransparent ? 'TAK (generuj na jednolitym tle ułatwiającym wycięcie/alpha)' : 'NIE'}.
    - Skup się na efektach typu "Sparkle" (błysk), "Before & After" (jeśli są dwa obrazy), lub dynamicznych naklejkach (CTA).
    - Animacja musi być krótka i zaprojektowana tak, aby idealnie się zapętlała (seamless loop).` : ''}
    
    WYMAGANIA TECHNICZNE:
    1. Przeanalizuj załączone obrazy. 
    2. Opisz precyzyjnie ruch kamery i zmiany w kadrze.
    3. ZWRÓĆ DANE TYLKO JAKO JSON:
    {
      "polishDescription": "Krótki, marketingowy opis dla użytkownika.",
      "englishPrompt": "Technical EN prompt for ${isGif ? 'short looping animation' : 'Veo 3.1 video'}.",
      "aiDetectionLog": "PL: [Analiza] | EN: [Strategy]"
    }
    `
    : `
    Jesteś ekspertem od edycji wizualnej AI (Visual Auditor). Twoim celem jest stworzenie technicznego promptu, który zachowa 100% spójności z pierwowzorem, wprowadzając jedynie wskazane poprawki.
...

    KONTEKST (KOTWICA):
    - ORYGINALNY POMYSŁ (V1): "${v1PromptObject?.englishPrompt || v1PromptObject?.polishDescription}"
    - OSTATNI STAN: "${lastPromptObject?.englishPrompt || lastPromptObject?.polishDescription}"
    - ZMIANA UŻYTKOWNIKA: "${instructions}"

    ZADANIA AUDYTU:
    1. Zidentyfikuj relacje przestrzenne (Spatial Relationships) między obiektami na obrazie (np. odległości, pozycje).
    2. Zmapuj oświetlenie (kierunek, temperatura) oraz charakterystykę obiektywu (depth of field).
    3. Zachowaj rysy twarzy i pozę postaci zgodnie z V1 (Seed Persistence).

    HIERARCHIA PROMPTU (BARDZO WAŻNE):
    1. [START]: Kompozycja i relacje przestrzenne (np. "Fixed composition, [A] positioned [X] relative to [B]").
    2. [ŚRODEK]: Mapowanie oświetlenia i technika (np. "Identical lighting mapping, 35mm lens").
    3. [KONIEC]: Szczegóły obiektu i wprowadzona modyfikacja.

    WYMAGANIA:
    - Syntetyzuj opis: Maksymalnie 200 słów. Tylko twarde dane techniczne.
    - Używaj fraz: "Maintaining exact composition", "Photogrammetric consistency".
    - Umieść najważniejsze parametry techniczne na samym początku promptu.

    ZWRÓĆ DANE TYLKO JAKO JSON:
    {
      "polishDescription": "Zwięzły opis zmian po polsku.",
      "englishPrompt": "Hierarchical technical EN prompt (max 200 words).",
      "aiDetectionLog": "Raport dwujęzyczny w formacie: 'PL: [Krótki opis po polsku] | EN: [Technical summary in English]'"
    }
  `;

  promptParts.push(textPrompt);

  try {
    const result = await withRetry(() => model.generateContent(promptParts));
    const response = await result.response;
    const text = response.text().trim();
    
    // Robust JSON extraction for production reliability
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in visual refinement output:", text);
      throw new Error("AI nie zwróciło poprawnego formatu JSON.");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      polishDescription: parsed.polishDescription || "Poprawiony projekt",
      englishPrompt: parsed.englishPrompt || "",
      aiDetectionLog: parsed.aiDetectionLog || "Analiza zakończona pomyślnie"
    };
  } catch (error) {
    console.error("Refine Visual Error (Visual Auditor):", error);
    throw new Error(`Błąd audytu wizualnego: ${error.message}`);
  }
}

/**
 * Synchronizes the English technical prompt based on manual edits to the Polish description.
 */
async function syncVisualPrompt({ polishDescription, aspectRatio = '1:1', type = 'image', workspaceContext = null, isAnimation = false, sourceImageUrl = null }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  // Use multimodal model for animation analysis if image is provided
  const modelId = (isAnimation && sourceImageUrl) ? "gemini-2.5-flash-lite" : "gemini-2.5-flash-lite";
  const model = ai.getGenerativeModel({ model: modelId });

  let promptParts = [];

  if (isAnimation && sourceImageUrl) {
    try {
      const response = await axios.get(sourceImageUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      promptParts.push({
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        }
      });
    } catch (e) {
      console.error("Failed to fetch source image for animation sync:", e);
    }
  }

  const textPrompt = isAnimation 
    ? `
    Jesteś reżyserem animacji AI. Masz przed sobą zdjęcie oraz instrukcję ruchu od użytkownika: "${polishDescription}".
    Twoim zadaniem jest stworzenie bardzo szczegółowego, technicznego promptu w języku ANGIELSKIM dla modelu wideo (Veo 3.1).
    
    WYMAGANIA:
    - Zachowaj 100% zgodności wizualnej z załączonym zdjęciem.
    - Opisz dynamikę: co się porusza, w jaki sposób, jaka jest trajektoria kamery (np. "Slow zoom in", "Handheld shake", "Fluid motion").
    - Skup się na fizyce: jak światło reaguje na ruch, jak poruszają się materiały.
    - Format: ${aspectRatio}.
    - Zwróć TYLKO techniczny prompt po angielsku.
    `
    : `
    Transform the following Polish visual description into a high-end, technical English prompt for ${type === 'video' ? 'Veo 3.1 Video Generator' : 'Nano Banana Image Generator'}.
    
    Polish Description:
    "${polishDescription}"
    
    Aspect Ratio: ${aspectRatio}
    
    ${workspaceContext ? `MANDATORY BRAND STYLE: ${workspaceContext.visualStyle}` : ''}
    
    Requirements:
    - Strictly in ENGLISH.
    - Technical terminology (lens, lighting, textures).
    - No text in image.
    
    Return ONLY the English prompt text.
  `;

  promptParts.push(textPrompt);

  try {
    const result = await model.generateContent(promptParts);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Sync Visual Prompt Error:", error);
    return isAnimation ? `Cinematic animation of this image with motion: ${polishDescription}` : `Cinematic ${type} based on: ${polishDescription}`;
  }
}


/**
 * Generates a video using the Veo 3.1 model via Google AI Studio (Gemini API) REST.
 * We use predictLongRunning as it's the only supported method for this model.
 */
async function generateVeoVideo(visualPrompt, aspectRatio = '1:1', imageBase64 = null, isGif = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not found.");

  const modelId = "models/veo-3.1-lite-generate-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/${modelId}:predictLongRunning?key=${apiKey}`;

  const instance = { prompt: visualPrompt };
  if (imageBase64) {
    instance.image = {
      bytesBase64Encoded: imageBase64,
      mimeType: "image/png"
    };
  }

  const payload = {
    instances: [instance],
    parameters: {
      sampleCount: 1,
      aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      durationSeconds: isGif ? 4 : 6
    }
  };

  console.log("Initiating Veo 3.1 via AI Studio REST (predictLongRunning)...");

  try {
    const response = await axios.post(url, payload);
    const data = response.data;

    if (data.name) {
      console.log("Video generation started as LRO in AI Studio:", data.name);
      return { status: "processing", operationName: data.name };
    } else {
      console.log("Unexpected AI Studio REST Response:", JSON.stringify(data, null, 2));
      throw new Error("Nie otrzymano nazwy operacji z AI Studio.");
    }
  } catch (error) {
    console.error("AI Studio REST Video Error:", error.response?.data || error.message);
    throw new Error(`Błąd AI Studio (REST): ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Generates an image using the Nano Banana (Gemini 3.1 Flash Image) model via REST API.
 * Supports Image-to-Image by providing originalImageBase64 as context.
 */
async function generateNanoBananaImage(visualPrompt, aspectRatio = '1:1', originalImageBase64 = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not found.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ 
      parts: [
        // If we have an original image, provide it as context for Image-to-Image refinement
        ...(originalImageBase64 ? [{ inlineData: { data: originalImageBase64, mimeType: "image/png" } }] : []),
        { text: visualPrompt }
      ] 
    }],
    generationConfig: {
      responseModalities: ["IMAGE"]
    }
  };

  try {
    const response = await axios.post(url, payload);
    const data = response.data;
    
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.find(p => p.inlineData);
    
    if (part && part.inlineData) {
      return Buffer.from(part.inlineData.data, 'base64');
    } else {
      console.error("Nano Banana REST Response Error:", JSON.stringify(data, null, 2));
      throw new Error("Nie otrzymano danych obrazu z modelu Nano Banana.");
    }
  } catch (error) {
    console.error("Nano Banana REST Error:", error.response?.data || error.message);
    throw new Error(`Błąd techniczny generowania obrazu: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Generates a full campaign plan based on multiple parameters.
 */
async function generateCampaignPlan(data) {
  const { 
    name, 
    goal, 
    productDescription, 
    usp, 
    duration, 
    platforms,
    intensity,
    toneOfVoice,
    mainCTA,
    targetAudience,
    problemSolved,
    workspaceContext
  } = data;

  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const platformRules = platforms.map(p => `[${p}]: ${PLATFORM_RULES[p] || PLATFORM_RULES['Default']}`).join('\n');

  const prompt = `
    Jesteś dyrektorem marketingu i ekspertem od strategii social media. Twoim zadaniem jest stworzenie kompletnej strategii kampanii.

    DANE KAMPANII:
    - Nazwa: ${name}
    - Cele: ${goal}
    - Produkt/Usługa: ${productDescription}
    - USP (Unikalna wartość): ${usp}
    - Rozwiązywany problem: ${problemSolved || 'Nie określono'}
    - Grupa docelowa (Persona): ${targetAudience}
    - Czas trwania: ${duration} dni
    - Platformy: ${platforms.join(', ')}
    - Intensywność/Faza: ${intensity} (Steady = stały szum, Teaser-Launch = budowanie napięcia, Sprint = agresywna sprzedaż)
    - Ton komunikacji: ${toneOfVoice}
    - Główne CTA: ${mainCTA || 'Nie określono'}

    ${workspaceContext ? `WYTYCZNE MARKI (MANDATORY):
    - Strategia treści: ${workspaceContext.contentDirectives}
    - Estetyka wizualna: ${workspaceContext.visualStyle}` : ''}

    ZASADY DLA KANAŁÓW:
    ${platformRules}

    WYMAGANIA DOTYCZĄCE WYJŚCIA (JSON):
    Stwórz listę postów (harmonogram), rozłożoną w czasie. 
    Dla każdego elementu podaj:
    1. "day": numer dnia lub etap (np. "Dzień 1", "Dzień 3").
    2. "platform": na którą platformę jest ten post.
    3. "topic": konkretny temat posta (krótki, gotowy do wrzucenia do generatora).
    4. "visualIdea": sugestia co powinno być na obrazku/wideo.
    5. "rationale": dlaczego ten post realizuje cel: ${goal}.

    ZWRÓĆ DANE TYLKO W FORMACIE JSON (tablica obiektów):
    [
      {
        "day": "string",
        "platform": "string",
        "topic": "string",
        "visualIdea": "string",
        "rationale": "string"
      }
    ]

    Pamiętaj o specyfice platform: 
    - LinkedIn: merytoryka, autorytet, B2B.
    - TikTok/IG: energia, trendy, wizualny "wow".
    - FB: społeczność, relacje.

    Odpowiadaj w języku POLSKIM.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Robust JSON extraction
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("MODEL_JSON_ERROR: AI nie zwróciło poprawnego formatu JSON.");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Campaign Plan Error:", error);
    throw new Error(`Błąd generowania kampanii: ${error.message}`);
  }
}

/**
 * Refines a custom campaign goal using AI.
 */
async function refineCampaignGoal(rawGoal) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Jesteś ekspertem od strategii marketingowej. Użytkownik podał własny cel kampanii, który może być niejasny lub mało profesjonalny.
    Twoim zadaniem jest zredagowanie go tak, aby brzmiał jak profesjonalny cel biznesowy (SMART), zachowując jednak intencję użytkownika.

    SUROWY CEL UŻYTKOWNIKA:
    "${rawGoal}"

    ZWRÓĆ DANE W FORMACIE JSON:
    {
      "refinedGoal": "Krótka, profesjonalna nazwa celu (np. 'Zwiększenie retencji klientów o 20%')",
      "description": "Rozwinięcie celu i uzasadnienie strategiczne (max 2 zdania)."
    }

    Odpowiadaj w języku POLSKIM.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI nie zwróciło poprawnego formatu JSON.");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Refine Goal Error:", error);
    throw new Error("Nie udało się zredagować celu.");
  }
}

/**
 * Refines a product description using AI.
 */
async function refineProductDescription(rawDescription) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Jesteś copywriterem sprzedażowym. Użytkownik podał opis swojego produktu lub usługi.
    Twoim zadaniem jest zredagowanie go tak, aby brzmiał profesjonalnie, zachęcająco i podkreślał korzyści, zachowując jednak wszystkie fakty podane przez użytkownika.

    SUROWY OPIS:
    "${rawDescription}"

    ZWRÓĆ TYLKO ZREDAGOWANY TEKST (max 3-4 zdania).
    Odpowiadaj w języku POLSKIM.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Refine Product Error:", error);
    throw new Error("Nie udało się zredagować opisu produktu.");
  }
}

/**
 * Refines a USP (Unique Selling Proposition) using AI.
 */
async function refineUSP(rawUSP) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Jesteś ekspertem od brandingu. Użytkownik podał swoje USP (Unique Selling Proposition).
    Twoim zadaniem jest zredagowanie go tak, aby było krótkie, uderzające (punchy) i zapadało w pamięć.

    SUROWY USP:
    "${rawUSP}"

    ZWRÓĆ TYLKO ZREDAGOWANE USP (max 1 zdanie).
    Odpowiadaj w języku POLSKIM.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Refine USP Error:", error);
    throw new Error("Nie udało się zredagować USP.");
  }
}

/**
 * Chat with the SMC Assistant.
 */
async function chatWithAssistant(history, message) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");

  const model = ai.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    systemInstruction: `Jesteś pomocnym asystentem aplikacji "Social Media Creator" (SMC). Twoim celem jest prowadzenie użytkownika przez proces tworzenia treści. 

**Ważne:** Ty sam nie generujesz obrazów ani wideo, ale instruujesz użytkownika, jak to zrobić w aplikacji.

Kluczowe ścieżki pomocy:
1. **Tworzenie Wideo/GIF/Obrazów (2 drogi):**
   - **Podczas tworzenia posta:** Po wygenerowaniu treści posta, zjedź niżej do sekcji "Wizualizacje". Tam możesz wybrać format i kliknąć przycisk "Generuj Obraz", "Wideo" lub "GIF".
   - **Z własnym zdjęciem:** Przejdź do zakładki "Edytor Wizualny" w górnym menu. Tam możesz wgrać własne zdjęcie i zamienić je w animację lub edytować opisem.
2. **Kampanie:** Zakładka "Kampanie" pozwala stworzyć wielodniową strategię. Każdy pomysł z harmonogramu można wysłać do generatora jednym kliknięciem.
3. **Workspace:** W zakładce "Workspace" (Przestrzenie Robocze) definiuje się styl marki, aby AI zawsze pisało i generowało grafiki w tym samym tonie.

Jeśli użytkownik zapyta "czy zrobisz mi wideo?", odpowiedz: "Ja służę pomocą i radą, ale wideo wygenerujesz sam w kilka sekund! Możesz to zrobić pod aktualnym postem w sekcji Wizualizacje lub w zakładce Edytor Wizualny, jeśli chcesz ożywić własne zdjęcie."

Bądź profesjonalny, konkretny i podawaj dokładne nazwy sekcji/zakładek. Odpowiadaj w języku polskim.`
  });

  const chat = model.startChat({
    history: history || [],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  try {
    const result = await withRetry(() => chat.sendMessage(message));
    return result.response.text();
  } catch (error) {
    console.error("Chat Assistant Error:", error);
    throw new Error("Błąd asystenta czatu.");
  }
}

/**
 * Generates professional brand directives (content and visual) based on brand name/description and current input.
 */
async function generateBrandDirectives({ brandName, type, currentDirectives }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = type === 'content' 
    ? `
    Jesteś ekspertem od strategii komunikacji marki i copywritingu. 
    Twoim zadaniem jest stworzenie lub ulepszenie profesjonalnych wytycznych tekstowych dla marki.
    
    NAZWA MARKI: "${brandName}"
    ISTNIEJĄCE NOTATKI/WYTYCZNE UŻYTKOWNIKA: "${currentDirectives || 'Brak'}"
    
    Wytyczne powinny zawierać:
    1. Ton komunikacji (Tone of Voice).
    2. Słowa kluczowe i frazy, których należy używać.
    3. Czego unikać w tekstach.
    4. Sposób zwracania się do odbiorcy.
    
    INSTRUKCJA: Rozwiń i profesjonalizuj notatki użytkownika, zachowując ich sens, ale nadając im formę konkretnej instrukcji dla AI.
    WAŻNE FORMATOWANIE: Zostaw zawsze PUSTĄ LINIĘ (podwójny enter) między każdym nowym punktem na liście dla lepszej czytelności.
    WAŻNE: Zwróć TYLKO same wytyczne. Nie dodawaj wstępów typu "Oto wytyczne...", "Doskonale!", ani żadnych komentarzy.
    Odpowiadaj po POLSKU. Max 4-5 zdań.
    `
    : `
    Jesteś dyrektorem artystycznym i ekspertem od brandingu wizualnego. 
    Twoim zadaniem jest stworzenie lub ulepszenie profesjonalnych wytycznych wizualnych dla marki.
    
    NAZWA MARKI: "${brandName}"
    ISTNIEJĄCE NOTATKI/WYTYCZNE UŻYTKOWNIKA: "${currentDirectives || 'Brak'}"
    
    Wytyczne powinny zawierać:
    1. Preferowaną kolorystykę i oświetlenie.
    2. Styl kompozycji i kadrowania.
    3. Nastrój i emocje, jakie mają budzić grafiki.
    4. Elementy charakterystyczne dla tej marki.
    
    INSTRUKCJA: Rozwiń i profesjonalizuj notatki użytkownika, zachowując ich sens, ale nadając im formę konkretnej instrukcji dla modeli generatywnych (np. Midjourney/Stable Diffusion).
    WAŻNE: Zwróć TYLKO same wytyczne. Nie dodawaj wstępów typu "Oto wytyczne...", "Doskonale!", ani żadnych komentarzy.
    Odpowiadaj po POLSKU. Max 4-5 zdań.
    `;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Generate Brand Directives Error:", error);
    throw new Error(`Nie udało się wygenerować wytycznych: ${error.message}`);
  }
}

/**
 * Generates market trends based on brand name and its directives.
 */
async function generateMarketTrends({ brandName, contentDirectives, visualStyle }) {
  const ai = initGemini();
  if (!ai) throw new Error("Gemini API not initialized.");
  
  // Use Gemini 2.5 Pro if available or Flash for broad knowledge
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
    Jesteś analitykiem trendów i głównym strategiem social media.
    Twoim zadaniem jest zidentyfikowanie 3-5 najważniejszych, aktualnych trendów rynkowych dla poniższej marki.
    
    NAZWA MARKI: "${brandName || 'Nie podano'}"
    STYL KOMUNIKACJI: "${contentDirectives || 'Brak danych'}"
    STYL WIZUALNY: "${visualStyle || 'Brak danych'}"
    
    Zidentyfikuj trendy, które pozwolą tej marce pisać lepsze posty i tworzyć lepsze grafiki (np. popularne formaty, estetyka, zagadnienia, które teraz angażują).
    
    INSTRUKCJA: Zwróć wynik jako zwięzłą listę.
    WAŻNE FORMATOWANIE: Zostaw zawsze PUSTĄ LINIĘ (podwójny enter) między każdym nowym punktem na liście dla lepszej czytelności.
    WAŻNE: Nie używaj wstępów typu "Oto trendy". Zwróć tylko konkrety gotowe do użycia przez AI jako kontekst.
    Odpowiadaj po POLSKU.
  `;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Generate Market Trends Error:", error);
    throw new Error(`Nie udało się wyszukać trendów: ${error.message}`);
  }
}

module.exports = { 
  generatePost, generatePostPlan, syncEnglishPrompt, generateVisualPrompt, 
  syncVisualPrompt, translateToTechnicalPrompt, generateNanoBananaImage, 
  generateVeoVideo, refinePost, refineVisualPrompt, generateCampaignPlan, 
  refineCampaignGoal, refineProductDescription, refineUSP, chatWithAssistant,
  generateBrandDirectives, generateMarketTrends
};


