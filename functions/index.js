const { onRequest } = require("firebase-functions/v2/https");
const { GoogleAuth } = require('google-auth-library');
const axios = require("axios");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const stripe = require("stripe");
const { generatePost, generatePostPlan, syncEnglishPrompt, generateVisualPrompt, syncVisualPrompt, translateToTechnicalPrompt, generateNanoBananaImage, generateVeoVideo, refinePost, refineVisualPrompt, generateCampaignPlan, refineCampaignGoal, refineProductDescription, refineUSP } = require("./gemini");


// Initialize Firebase Admin
// In Cloud Functions, this works automatically with default credentials
admin.initializeApp();
const db = admin.firestore();

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Endpoint: Diagnoza modeli (Tymczasowy)
app.get("/list-models", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Brak GEMINI_API_KEY" });

    console.log("Fetching available models from Google...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await axios.get(url);
    const veoModels = response.data.models.filter(m => m.name.toLowerCase().includes('veo'));
    
    res.json({
      all_veo_models: veoModels.map(m => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        supportedMethods: m.supportedGenerationMethods
      }))
    });
  } catch (error) {
    console.error("List Models Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.message, details: error.response?.data });
  }
});

// --- CONFIGURATION ---
// --- DYNAMIC CONFIGURATION (Now in Firestore) ---
let pricingConfig = {
  TOKENS_PER_PLN: 1000000,
  CREDIT_RATIO: 0.20,
  MIN_TOKENS_FOR_GEN: 1000,
  POST_COST: 5000,
  IMAGE_COST: 105000,
  VIDEO_COST: 1100000,
  CAMPAIGN_COST: 25000,
  GIF_COST: 350000,
  REFINE_COST: 5000,
  WELCOME_TOKENS: 50000, // Tokens for registration
  SUBSCRIPTION_TOKENS: 10000000 // Tokens for active subscription
};

// Helper to get latest pricing from Firestore
async function getPricingConfig() {
  try {
    const configDoc = await db.collection("config").doc("pricing").get();
    if (configDoc.exists) {
      pricingConfig = { ...pricingConfig, ...configDoc.data() };
    } else {
      // Create initial config if it doesn't exist
      await db.collection("config").doc("pricing").set(pricingConfig);
      console.log("Created default pricing config in Firestore.");
    }
  } catch (e) {
    console.error("Error fetching pricing config, using defaults:", e);
  }
  return pricingConfig;
}

// Helper to get Stripe instance (using secret from environment)
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not set in environment.");
  }
  return stripe(secretKey);
};

// --- ROUTES --- (Stripe extension handles checkout and webhooks)


// Proxy to bypass CORS and force download
app.get("/download-proxy", async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).send("No URL provided");
  
  try {
    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream'
    });
    
    // Determine extension from content-type or URL
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const extension = contentType.split('/')[1]?.split('+')[0] || 'bin';
    const filename = `sm-creator-${Date.now()}.${extension}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy Download Error:", error.message);
    res.status(500).send("Failed to download file");
  }
});

// Gemini Content Generation
app.post("/generate", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { platform, topic, style, plannedPrompt, workspaceContext, customStyleGuidelines } = req.body;

    if (!platform || !topic) {
      return res.status(400).json({ error: "Platform and topic are required." });
    }

    const pricing = await getPricingConfig();
    const { content, tokens } = await generatePost({ platform, topic, style, plannedPrompt, workspaceContext, customStyleGuidelines });
    
    // Check balance and deduct cost
    const userRef = db.collection("users").doc(decodedToken.uid);
    
    let historyId = null;
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const userData = userDoc.data() || {};
      const currentBalance = userData.balance || 0;

      if (currentBalance < tokens && currentBalance < pricing.MIN_TOKENS_FOR_GEN) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct balance (using fixed cost)
      t.update(userRef, { 
        balance: admin.firestore.FieldValue.increment(-pricing.POST_COST) 
      });

      // Save to history
      const historyRef = userRef.collection("history").doc();
      historyId = historyRef.id;
      t.set(historyRef, {
        platform,
        topic,
        style,
        content,
        tokensUsed: pricing.POST_COST,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ content, tokensUsed: pricing.POST_COST, historyId });

  } catch (error) {
    if (error.message === "INSUFFICIENT_FUNDS") {
      return res.status(402).json({ error: "Brak tokenów na koncie. Doładuj portfel, aby generować dalej." });
    }
    console.error("Generate Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Generate Visual Prompt (Image or Video)
app.post("/generate-image-prompt", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { postContent, aspectRatio, platform, type, workspaceContext } = req.body;
    if (!postContent) return res.status(400).send("Post content is required.");

    const visualPlannedPrompt = await generateVisualPrompt(postContent, aspectRatio || '1:1', platform || 'Default', type || 'image', workspaceContext);
    res.json({ visualPlannedPrompt });

  } catch (error) {
    console.error("Generate Image Prompt Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Sync Visual English Prompt from Polish description
app.post("/sync-visual-prompt", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { polishDescription, aspectRatio, type, workspaceContext, isAnimation, sourceImageUrl } = req.body;
    if (!polishDescription) return res.status(400).send("Polish description is required.");

    const englishPrompt = await syncVisualPrompt({ 
      polishDescription, 
      aspectRatio, 
      type, 
      workspaceContext,
      isAnimation,
      sourceImageUrl
    });
    res.json({ englishPrompt });

  } catch (error) {
    console.error("Generate Error:", error);
    const status = error.message?.includes("429") ? 429 : 500;
    res.status(status).json({ error: error.message });
  }
});

// Endpoint: Generate Post Plan (PEaaS)
app.post("/generate-plan", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { platform, topic, style, workspaceContext, customStyleGuidelines } = req.body;
    if (!platform || !topic) {
      return res.status(400).json({ error: "Platform and topic are required." });
    }

    const plan = await generatePostPlan({ platform, topic, style, workspaceContext, customStyleGuidelines });
    res.json({ plan });

  } catch (error) {
    console.error("Plan Error:", error);
    const status = error.message?.includes("429") ? 429 : 500;
    res.status(status).json({ error: error.message });
  }
});

// Endpoint: Sync English Prompt with modified Polish Strategy
app.post("/sync-prompt", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { polishPlan, platform, topic, style, workspaceContext, customStyleGuidelines } = req.body;
    if (!polishPlan) return res.status(400).send("Polish plan is required.");

    const englishPrompt = await syncEnglishPrompt({ polishPlan, platform, topic, style, workspaceContext, customStyleGuidelines });
    res.json({ englishPrompt });

  } catch (error) {
    console.error("Sync Error:", error);
    const status = error.message?.includes("429") ? 429 : 500;
    res.status(status).json({ error: error.message });
  }
});

// Endpoint: Refine Post
app.post("/refine-post", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { originalPost, instructions, workspaceContext } = req.body;
    if (!originalPost || !instructions) {
      return res.status(400).json({ error: "originalPost and instructions are required." });
    }

    const { content, tokens } = await refinePost(originalPost, instructions, workspaceContext);
    res.json({ content, tokens });

  } catch (error) {
    console.error("Refine Post Error:", error);
    const status = error.message?.includes("429") ? 429 : 500;
    res.status(status).json({ error: error.message });
  }
});

// Endpoint: Refine Visual Prompt (Visual Auditor)
app.post("/refine-image-prompt", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { 
      v1PromptObject, 
      lastPromptObject, 
      originalPromptObject, // for backward compatibility
      instructions, 
      workspaceContext, 
      mediaUrl,
      targetMediaUrl,
      type,
      gifSettings 
    } = req.body;

    // Determine context anchors
    const v1 = v1PromptObject || originalPromptObject;
    const last = lastPromptObject || originalPromptObject;

    if (!v1 || !instructions) {
      return res.status(400).json({ error: "Context (v1/last) and instructions are required." });
    }

    const result = await refineVisualPrompt(v1, last, instructions, workspaceContext, mediaUrl, targetMediaUrl, type, gifSettings);
    res.json({ visualPlannedPrompt: result });

  } catch (error) {
    console.error("Refine Visual Error:", error);
    const status = error.message?.includes("429") ? 429 : 500;
    res.status(status).json({ error: error.message });
  }
});

// Endpoint: Generate Campaign Strategy
app.post("/generate-campaign", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { name, goal, productDescription, usp, duration, platforms, workspaceContext } = req.body;

    if (!name || !goal || !productDescription) {
      return res.status(400).json({ error: "Name, goal, and product description are required." });
    }

    const pricing = await getPricingConfig();
    const strategy = await generateCampaignPlan({ 
      name, 
      goal, 
      productDescription, 
      usp, 
      duration: duration || 7, 
      platforms: platforms || ["LinkedIn"], 
      workspaceContext 
    });

    // Check balance and deduct cost
    const userRef = db.collection("users").doc(decodedToken.uid);
    
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const userData = userDoc.data() || {};
      const currentBalance = userData.balance || 0;

      if (currentBalance < pricing.CAMPAIGN_COST) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct balance
      t.update(userRef, { 
        balance: admin.firestore.FieldValue.increment(-pricing.CAMPAIGN_COST) 
      });

      // Save to campaigns collection
      const campaignRef = userRef.collection("campaigns").doc();
      t.set(campaignRef, {
        name,
        goal,
        productDescription,
        usp,
        duration: duration || 7,
        platforms: platforms || ["LinkedIn"],
        strategy, // The JSON array
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ strategy, cost: pricing.CAMPAIGN_COST });

  } catch (error) {
    if (error.message === "INSUFFICIENT_FUNDS") {
      return res.status(402).json({ error: "Brak tokenów na koncie. Doładuj portfel." });
    }
    console.error("Campaign Generate Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Refine Custom Campaign Goal
app.post("/refine-campaign-goal", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { rawGoal } = req.body;
    if (!rawGoal) return res.status(400).send("rawGoal is required.");

    const result = await refineCampaignGoal(rawGoal);
    res.json(result);
  } catch (error) {
    console.error("Refine Goal Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Refine Product Description
app.post("/refine-product-description", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { rawDescription } = req.body;
    if (!rawDescription) return res.status(400).send("rawDescription is required.");

    const result = await refineProductDescription(rawDescription);
    res.json({ refinedDescription: result });
  } catch (error) {
    console.error("Refine Product Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Refine USP
app.post("/refine-usp", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { rawUSP } = req.body;
    if (!rawUSP) return res.status(400).send("rawUSP is required.");

    const result = await refineUSP(rawUSP);
    res.json({ refinedUSP: result });
  } catch (error) {
    console.error("Refine USP Error:", error);
    res.status(500).json({ error: error.message });
  }
});



// Endpoint: Generate Image (Nano Banana / Gemini 2.5 Flash Image)
app.post("/generate-image", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { prompt, aspectRatio, originalImageUrl, isAlreadyTechnical } = req.body;
    if (!prompt) return res.status(400).send("Prompt is required.");

    const pricing = await getPricingConfig();
    const userRef = db.collection("users").doc(decodedToken.uid);
    const userDoc = await userRef.get();
    const balance = userDoc.data()?.balance || 0;

    if (balance < pricing.IMAGE_COST) {
      return res.status(402).json({ error: "Brak tokenów na koncie. Doładuj portfel." });
    }

    // OPTIMIZATION: Skip Gemini Translator if the prompt is already technical
    let technicalPrompt = prompt;
    if (!isAlreadyTechnical) {
      console.log("[API] Translating to technical English...");
      technicalPrompt = await translateToTechnicalPrompt(prompt, 'image', aspectRatio || '1:1');
    } else {
      console.log("[API] Skipping translation. Using technical prompt directly.");
    }

    let base64Context = null;
    // IMAGE-TO-IMAGE: Use original image as visual context if provided
    if (originalImageUrl) {
      try {
        const imgResponse = await axios.get(originalImageUrl, { responseType: 'arraybuffer' });
        base64Context = Buffer.from(imgResponse.data, 'binary').toString('base64');
        console.log("Image-to-Image context captured.");
      } catch (e) {
        console.error("Failed to fetch image context:", e);
      }
    }

    // Call Nano Banana (AI Studio) with visual context
    const buffer = await generateNanoBananaImage(technicalPrompt, aspectRatio || '1:1', base64Context);


    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `generated/${decodedToken.uid}/${Date.now()}.png`;
    const file = bucket.file(fileName);

    await file.save(buffer, { contentType: 'image/png' });
    await file.makePublic();
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Deduct tokens
    await userRef.update({ 
      balance: admin.firestore.FieldValue.increment(-pricing.IMAGE_COST) 
    });

    res.json({ imageUrl: downloadUrl, cost: pricing.IMAGE_COST });
  } catch (error) {
    console.error("Nano Banana Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Generate Video (Veo 3.1) - Now Asynchronous
app.post("/generate-video", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { prompt, aspectRatio, imageUrl, targetImageUrl, isAlreadyTechnical, type } = req.body;
    if (!prompt) return res.status(400).send("Prompt is required.");

    // OPTIMIZATION: Skip Gemini Translator if the prompt is already technical
    let technicalPrompt = prompt;
    if (!isAlreadyTechnical) {
      console.log("[API] Translating video prompt to technical English...");
      technicalPrompt = await translateToTechnicalPrompt(prompt, 'video', aspectRatio || '1:1');
    } else {
      console.log("[API] Skipping video translation. Using technical prompt directly.");
    }
    console.log("Starting Video LRO for:", technicalPrompt);

    let base64Context = null;
    if (imageUrl) {
      try {
        const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        base64Context = Buffer.from(imgResponse.data, 'binary').toString('base64');
        console.log("Image-to-Video context captured.");
      } catch (e) {
        console.error("Failed to fetch image context for video:", e);
      }
    }

    // This now returns { status, operationName, videoBase64 }
    const result = await generateVeoVideo(technicalPrompt, aspectRatio || '1:1', base64Context, type === 'gif');
    
    if (result.status === "done" && result.videoBase64) {
      // 1. Save to Storage (Direct case)
      const buffer = Buffer.from(result.videoBase64, 'base64');
      const bucket = admin.storage().bucket();
      const fileName = `generated/${decodedToken.uid}/${Date.now()}.mp4`;
      const file = bucket.file(fileName);

      await file.save(buffer, { contentType: 'video/mp4' });
      await file.makePublic();
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // 2. Deduct tokens
      const pricing = await getPricingConfig();
      const cost = type === 'gif' ? (pricing.GIF_COST || 350000) : (pricing.VIDEO_COST || 1100000);
      const userRef = db.collection("users").doc(decodedToken.uid);
      await userRef.update({ 
        balance: admin.firestore.FieldValue.increment(-cost) 
      });

      return res.json({ 
        status: "done", 
        videoUrl: downloadUrl,
        videoBase64: result.videoBase64,
        cost: cost
      });
    }

    res.json({ 
      status: "started", 
      operationName: result.operationName,
      technicalPrompt: technicalPrompt 
    });

  } catch (error) {
    console.error("Veo Start Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Check Video Generation Status (Hardened version)
app.get("/video-status", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { operationName, type } = req.query;
    if (!operationName) return res.status(400).send("operationName is required.");

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 1. Check status using Gemini API (AI Studio)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found.");

    console.log(`Checking status for operation: ${operationName}`);

    // AI Studio operations endpoint - ensure URL is correctly formed
    const cleanOperationName = operationName.startsWith('/') ? operationName.substring(1) : operationName;
    const url = `https://generativelanguage.googleapis.com/v1beta/${cleanOperationName}?key=${apiKey}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    console.log("AI Studio Status Response (Full):", JSON.stringify(data, null, 2));

    // 2. Handle Completion
    if (data.done) {
      if (data.error) {
        console.error("AI Studio LRO reported an error:", data.error);
        return res.status(500).json({ status: "failed", error: data.error.message || "Błąd modelu Veo." });
      }

      // Extract the URI with fallback paths
      const videoUri = 
        data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
        data.response?.generatedSamples?.[0]?.video?.uri ||
        data.response?.video?.uri;

      if (!videoUri) {
        console.error("AI Studio finished but no video URI found. Check the full response above.");
        throw new Error("Wideo zostało wygenerowane, ale nie znaleźliśmy linku do pliku. Sprawdź logi serwera.");
      }

      console.log("Downloading video bytes from Google File API:", videoUri);

      // 2. Download the actual video bytes using the API Key
      const videoResponse = await axios.get(`${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${apiKey}`, { 
        responseType: 'arraybuffer' 
      });
      
      const buffer = Buffer.from(videoResponse.data);

      // 3. Save the buffer to your Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `generated/${decodedToken.uid}/${Date.now()}.mp4`;
      const file = bucket.file(fileName);

      await file.save(buffer, { contentType: 'video/mp4' });
      await file.makePublic();
      const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // 4. Deduct tokens
      const pricing = await getPricingConfig();
      const cost = type === 'gif' ? (pricing.GIF_COST || 350000) : (pricing.VIDEO_COST || 1100000);
      const userRef = db.collection("users").doc(decodedToken.uid);
      await userRef.update({ 
        balance: admin.firestore.FieldValue.increment(-cost) 
      });

      return res.json({ 
        status: "done", 
        videoUrl: downloadUrl,
        cost: cost
      });
    } else {
      // 6. Still in progress
      console.log("Video still processing for:", operationName);
      res.json({ status: "processing" });
    }
  } catch (error) {
    const errorData = error.response?.data;
    console.error("Hardened Status Check Error:", JSON.stringify(errorData || error.message, null, 2));
    res.status(500).json({ 
      error: "Failed to check video status", 
      detail: errorData?.error?.message || error.message,
      code: errorData?.error?.code
    });
  }
});


// --- STRIPE EXTENSION TOKEN GRANT TRIGGER ---
// Przyznaje tokeny, gdy subskrypcja zostanie utworzona (status active/trialing)
exports.grantTokens = onDocumentCreated({
  document: "customers/{userId}/subscriptions/{subscriptionId}",
  memory: "512MiB"
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const subscription = snapshot.data();
  const userId = event.params.userId;

  // Stripe używa statusów 'active' lub 'trialing'
  if (subscription.status === "active" || subscription.status === "trialing") {
    const userRef = admin.firestore().collection("users").doc(userId);
    try {
      await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data() || {};

        if (userData.lastSubscriptionId === event.params.subscriptionId) {
          console.log(`ℹ️ Tokeny dla subskrypcji ${event.params.subscriptionId} już przyznane.`);
          return;
        }

        const pricing = await getPricingConfig();
        const tokensToGrant = pricing.SUBSCRIPTION_TOKENS || 10000000;

        console.log(`🎁 Przyznawanie tokenów dla ${userId}`);
        transaction.set(userRef, {
          balance: admin.firestore.FieldValue.increment(tokensToGrant),
          lastSubscriptionId: event.params.subscriptionId,
          subscriptionStatus: subscription.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
    } catch (e) {
      console.error("Transaction failed:", e);
    }
  }
});

// Aktualizuje status subskrypcji w dokumencie użytkownika
exports.onSubscriptionUpdate = onDocumentUpdated({
  document: "customers/{userId}/subscriptions/{subscriptionId}",
  memory: "512MiB"
}, async (event) => {
  const after = event.data.after.data();
  const before = event.data.before.data();
  const userId = event.params.userId;

  if ((after.status === "active" || after.status === "trialing") && before.status !== after.status) {
    const userRef = admin.firestore().collection("users").doc(userId);
    await userRef.update({
      subscriptionStatus: after.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
});




// Endpoint: Initialize User (Grant Welcome Tokens)
app.post("/initialize-user", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userRef = db.collection("users").doc(userId);

    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return res.json({ status: "exists", balance: userDoc.data().balance });
    }

    const pricing = await getPricingConfig();
    const welcomeTokens = pricing.WELCOME_TOKENS || 50000;

    console.log(`🎉 Initializing new user: ${userId}. Granting ${welcomeTokens} welcome tokens.`);
    
    const newUser = {
      email: decodedToken.email || "",
      balance: welcomeTokens,
      subscriptionStatus: "none",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(newUser);
    res.json({ status: "initialized", balance: welcomeTokens });

  } catch (error) {
    console.error("Initialize User Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export the app as a Cloud Function
exports.api = onRequest({
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "GEMINI_API_KEY"],
  cors: true,
  memory: "2GiB",
  timeoutSeconds: 300
}, app);
