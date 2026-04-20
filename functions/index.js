const { onRequest } = require("firebase-functions/v2/https");
const { GoogleAuth } = require('google-auth-library');
const axios = require("axios");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const stripe = require("stripe");
const { generatePost, generatePostPlan, syncEnglishPrompt, generateVisualPrompt, translateToTechnicalPrompt, generateNanoBananaImage, generateVeoVideo, refinePost, refineVisualPrompt, generateCampaignPlan, refineCampaignGoal, refineProductDescription, refineUSP } = require("./gemini");


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
const TOKENS_PER_PLN = 1000000; // 1 PLN = 1,000,000 tokens (adjust margin here)
const CREDIT_RATIO = 0.20; // 20% of payment goes to user token balance
const MIN_TOKENS_FOR_GEN = 1000; // Minimal buffer to allow generation
const POST_COST = 5000; // 5,000 tokens for one post (fixed cost)
const IMAGE_COST = 105000; // 105,000 tokens for one image (approx 0.10 PLN)
const VIDEO_COST = 1100000; // 1,100,000 tokens for one video (approx 1.10 PLN)
const CAMPAIGN_COST = 25000; // 25,000 tokens for a full campaign strategy

// Helper to get Stripe instance (using secret from environment)
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not set in environment.");
  }
  return stripe(secretKey);
};

// --- ROUTES --- (Stripe extension handles checkout and webhooks)


// Gemini Content Generation
app.post("/generate", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { platform, topic, style, plannedPrompt, workspaceContext } = req.body;

    if (!platform || !topic) {
      return res.status(400).json({ error: "Platform and topic are required." });
    }

    const { content, tokens } = await generatePost({ platform, topic, style, plannedPrompt, workspaceContext });
    
    // Check balance and deduct cost
    const userRef = db.collection("users").doc(decodedToken.uid);
    
    let historyId = null;
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const userData = userDoc.data() || {};
      const currentBalance = userData.balance || 0;

      if (currentBalance < tokens && currentBalance < MIN_TOKENS_FOR_GEN) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct balance (using fixed cost)
      t.update(userRef, { 
        balance: admin.firestore.FieldValue.increment(-POST_COST) 
      });

      // Save to history
      const historyRef = userRef.collection("history").doc();
      historyId = historyRef.id;
      t.set(historyRef, {
        platform,
        topic,
        style,
        content,
        tokensUsed: POST_COST,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    res.json({ content, tokensUsed: POST_COST, historyId });

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
    const { polishDescription, aspectRatio, type, workspaceContext } = req.body;
    if (!polishDescription) return res.status(400).send("Polish description is required.");

    const englishPrompt = await syncVisualPrompt({ polishDescription, aspectRatio, type, workspaceContext });
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
    const { platform, topic, style, workspaceContext } = req.body;
    if (!platform || !topic) {
      return res.status(400).json({ error: "Platform and topic are required." });
    }

    const plan = await generatePostPlan({ platform, topic, style, workspaceContext });
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
    const { polishPlan, platform, topic, style, workspaceContext } = req.body;
    if (!polishPlan) return res.status(400).send("Polish plan is required.");

    const englishPrompt = await syncEnglishPrompt({ polishPlan, platform, topic, style, workspaceContext });
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

// Endpoint: Refine Visual Prompt
app.post("/refine-image-prompt", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) return res.status(401).send("Unauthorized");

  try {
    const { originalPromptObject, instructions, workspaceContext } = req.body;
    if (!originalPromptObject || !instructions) {
      return res.status(400).json({ error: "originalPromptObject and instructions are required." });
    }

    const visualPlannedPrompt = await refineVisualPrompt(originalPromptObject, instructions, workspaceContext);
    res.json({ visualPlannedPrompt });

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

      if (currentBalance < CAMPAIGN_COST) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct balance
      t.update(userRef, { 
        balance: admin.firestore.FieldValue.increment(-CAMPAIGN_COST) 
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

    res.json({ strategy, cost: CAMPAIGN_COST });

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
    const { prompt, aspectRatio } = req.body;
    if (!prompt) return res.status(400).send("Prompt is required.");

    const userRef = db.collection("users").doc(decodedToken.uid);
    const userDoc = await userRef.get();
    const balance = userDoc.data()?.balance || 0;

    // Pre-process prompt (Translate Polish description to technical English)
    const technicalPrompt = await translateToTechnicalPrompt(prompt, 'image', aspectRatio || '1:1');
    console.log("Technical Image Prompt:", technicalPrompt);

    // Call Nano Banana (AI Studio) with technical aspectRatio
    const buffer = await generateNanoBananaImage(technicalPrompt, aspectRatio || '1:1');


    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `generated/${decodedToken.uid}/${Date.now()}.png`;
    const file = bucket.file(fileName);

    await file.save(buffer, { contentType: 'image/png' });
    await file.makePublic();
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Deduct tokens
    await userRef.update({ 
      balance: admin.firestore.FieldValue.increment(-IMAGE_COST) 
    });

    res.json({ imageUrl: downloadUrl, cost: IMAGE_COST });
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
    const { prompt, aspectRatio } = req.body;
    if (!prompt) return res.status(400).send("Prompt is required.");

    // Translate Polish description to technical English
    const technicalPrompt = await translateToTechnicalPrompt(prompt, 'video', aspectRatio || '1:1');
    console.log("Starting Video LRO for:", technicalPrompt);

    // This now returns { status, operationName, videoBase64 }
    const result = await generateVeoVideo(technicalPrompt, aspectRatio || '1:1');
    
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
      const userRef = db.collection("users").doc(decodedToken.uid);
      await userRef.update({ 
        balance: admin.firestore.FieldValue.increment(-VIDEO_COST) 
      });

      return res.json({ 
        status: "done", 
        videoUrl: downloadUrl,
        videoBase64: result.videoBase64,
        cost: VIDEO_COST
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
    const { operationName } = req.query;
    if (!operationName) return res.status(400).send("operationName is required.");

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 1. Check status using Gemini API (AI Studio)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not found.");

    console.log("Checking AI Studio LRO Status for:", operationName);

    // AI Studio operations endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    console.log("AI Studio Status Response:", data.done ? "DONE" : "IN_PROGRESS");

    // 2. Handle Completion
    if (data.done) {
      if (data.error) {
        console.error("AI Studio LRO reported an error:", data.error);
        return res.status(500).json({ status: "failed", error: data.error.message });
      }

      // 1. Extract the URI from the new AI Studio response structure
      const videoUri = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

      if (!videoUri) {
        console.error("AI Studio finished but no video URI found. Data:", JSON.stringify(data, null, 2));
        throw new Error("Nie znaleziono linku do filmu w odpowiedzi AI Studio.");
      }

      console.log("Downloading video bytes from Google File API:", videoUri);

      // 2. Download the actual video bytes using the API Key
      const videoResponse = await axios.get(`${videoUri}&key=${apiKey}`, { 
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
      const userRef = db.collection("users").doc(decodedToken.uid);
      await userRef.update({ 
        balance: admin.firestore.FieldValue.increment(-VIDEO_COST) 
      });

      return res.json({ 
        status: "done", 
        videoUrl: downloadUrl,
        cost: VIDEO_COST
      });
    } else {
      // 6. Still in progress
      console.log("Video still processing for:", operationName);
      res.json({ status: "processing" });
    }
  } catch (error) {
    console.error("Hardened Status Check Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to check video status detail: " + (error.response?.data?.error?.message || error.message) });
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
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    if (!userData.lastSubscriptionId || userData.lastSubscriptionId !== event.params.subscriptionId) {
      console.log(`🎁 Przyznawanie 10M tokenów dla ${userId} (Sub: ${event.params.subscriptionId})`);
      await userRef.set({
        balance: admin.firestore.FieldValue.increment(10000000),
        lastSubscriptionId: event.params.subscriptionId,
        subscriptionStatus: subscription.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
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




// Export the app as a Cloud Function
exports.api = onRequest({
  secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "GEMINI_API_KEY"],
  cors: true,
  memory: "2GiB",
  timeoutSeconds: 300
}, app);
