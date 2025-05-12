// Load environment variables from .env file ONLY LOCALLY
// Render handles env vars differently
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000; // Use Render's port or 3000 locally

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (your frontend) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Get your API key from environment variables (works locally via dotenv, on Render via dashboard)
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable not set. Please set it in Render dashboard.");
    // In a real app, you might want to handle this more gracefully,
    // but for deployment readiness, exiting is clear.
    process.exit(1);
}

// Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(apiKey);
// Choose a model - 'gemini-pro' is generally good, 'gemini-1.5-flash-latest' is newer/faster
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// API endpoint to handle chat requests
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "Message is required." });
    }

    try {
        // Construct the prompt with identity instructions
        const prompt = `
You are StudyxAi, an AI assistant designed to help users study and learn.
You will never reveal your underlying model, creator, or mention names like Gemini, Bard, or state that you are a large language model.
If asked about your identity or who created you, state clearly that you are StudyxAi.
Focus on providing helpful, informative, and relevant responses based on the user's queries related to studying, learning, or general knowledge.

User: ${userMessage}

StudyxAi:`; // Use 'StudyxAi:' to encourage the model to adopt the persona

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Basic filtering (optional, prompt engineering is key)
        // This tries to catch mentions of Gemini, Bard, LLM terms.
        const filteredText = text.replace(/Gemini|Bard|large language model|LLM|I am an AI/gi, (match) => {
            // More sophisticated logic could go here if needed
            return ''; // Simply remove the unwanted terms
        }).trim(); // Trim whitespace after filtering

         // A simple check if the filter removed everything, provide a default
        const finalResponse = filteredText || "...";


        res.json({ message: finalResponse });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`StudyxAi backend listening on port ${port}`);
});
