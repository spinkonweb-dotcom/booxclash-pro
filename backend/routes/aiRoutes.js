import express from 'express';
import fetch from 'node-fetch'; // Single import for both functions
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

const router = express.Router();

// --- API Key Configuration ---

const GEMINI_API_KEY = process.env.API_KEY; 

if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: API_KEY is not defined in your .env file.");
} else {
    console.log('AI routes have loaded the API Key.');
}

// --- Helper Function for HTML Formatting ---

/**
 * Converts the AI's custom markdown into styled HTML.
 */
function formatRecommendationHTML(text) {
  if (!text) return "";

  return text
    // 1. Convert Markdown bold **text** to <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // 2. Convert [BLUE]Title[/BLUE] to styled HTML
    .replace(/\[BLUE\](.*?)\[\/BLUE\]/g, '<div class="font-bold text-blue-600 mt-3">$1</div>')
    
    // 3. Convert [ORANGE]Title[/ORANGE] to styled HTML
    .replace(/\[ORANGE\](.*?)\[\/ORANGE\]/g, '<div class="font-bold text-orange-600 mt-3">$1</div>')
    
    // 4. Convert [PURPLE]Title[/PURPLE] to styled HTML
    .replace(/\[PURPLE\](.*?)\[\/PURPLE\]/g, '<div class="font-bold text-purple-600 mt-3">$1</div>')
    
    // 5. Convert simple line breaks into <br /> tags
    .replace(/\n/g, '<br />');
}


// --- Controller Function for AI Recommendation ---

const RECOMMENDATION_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

const getAiRecommendation = async (req, res) => {
  const { studentDataPrompt } = req.body;

  if (!studentDataPrompt) {
    return res.status(400).json({ message: 'No student data prompt provided.' });
  }

  // --- *** THIS IS THE UPDATED PROMPT *** ---
  const systemPrompt = `
Act as a specialist educational advisor. Analyze the provided student data.
Your response MUST be a 3-point list.

1.  Analyze the data to determine if the student is (a) excelling, (b) on track, or (c) struggling.
2.  Based on your analysis, provide a 3-point list.
    -   If the student is EXCELLING: Provide "Next Steps" for engagement.
    -   If the student is STRUGGLING: Provide an "Action Plan" for improvement.
3.  Keep the tone encouraging. Start directly with the 3-point list.

***IMPORTANT FORMATTING RULES:***
-   Use markdown for bold: **like this**.
-   For the *main idea* of each numbered point, wrap it in a colored tag.
-   Use [BLUE]...[/BLUE] for the first point's title.
-   Use [ORANGE]...[/ORANGE] for the second point's title.
-   Use [PURPLE]...[/PURPLE] for the third point's title.

Example for a good student:
1. **Analysis:** Talia is **excelling**...
2. [BLUE]Apply Scientific Knowledge[/BLUE]
   Build upon her success by starting a project...
3. [ORANGE]Integrate Math Skills[/ORANGE]
   Ensure Talia is balancing her curriculum...
`;

  const payload = {
    contents: [{ parts: [{ text: studentDataPrompt }] }],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
  };

  try {
    const apiResponse = await fetch(RECOMMENDATION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('Gemini API Error (Recommendation):', errorData);
      return res.status(apiResponse.status).json({ message: 'Failed to get recommendation from AI.' });
    }

    const result = await apiResponse.json();
    const recommendationText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No recommendation generated.";
    
    // --- NEW: Convert AI text to HTML before sending ---
    const formattedHtml = formatRecommendationHTML(recommendationText);
    
    // Send the formatted HTML to the frontend
    res.json({ recommendation: formattedHtml });

  } catch (error) {
    console.error('AI Controller Error (Recommendation):', error);
    res.status(500).json({ message: 'Server error while generating AI recommendation.' });
  }
};


// --- API Routes ---

/**
 * @desc    Generate an AI hint for a game
 * @route   POST /api/ai/get-hint
 * @access  (Public/Private - Add 'protect' middleware if needed)
 */
router.post('/get-hint', async (req, res) => {
    // (This route remains unchanged)
    const { promptText } = req.body;

    if (!promptText) {
        return res.status(400).json({ message: 'Prompt text is required' });
    }

   const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 60000, 
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
    };

    try {
        const apiResponse = await fetch(GOOGLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("Google API Error (Hint):", data);
            return res.status(apiResponse.status).json({ message: "Failed to get response from AI model", details: data });
        }
        
        res.json(data);

    } catch (error) {
        console.error('Error in AI route (Hint):', error);
        res.status(500).json({ message: 'Server error while fetching AI hint.' });
    }
});


/**
 * @desc    Generate an AI recommendation for a parent
 * @route   POST /api/ai/ai-recommendation
 * @access  (Public/Private - Add 'protect' middleware if needed)
 */
router.post('/recommendation', getAiRecommendation);


export default router;