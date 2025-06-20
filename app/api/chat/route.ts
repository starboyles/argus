import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      videoId,
      videoData,
      currentTime,
      chatHistory = [],
    } = await request.json();

    // Validate input data
    if (!message || !videoId || !videoData) {
      return NextResponse.json(
        {
          error: "Missing required data",
          content: "I need more information to help you with this video! 🤔",
        },
        { status: 400 }
      );
    }

    // Ensure we have the API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY not configured",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again! 🔧",
        },
        { status: 500 }
      );
    }

    // Initialize Gemini with settings optimized for analysis
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1, // Lower for accurate analysis
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2000, // Increased for detailed analysis
      },
    });

    // Handle only simple conversational responses
    const simpleConversational =
      /^(hi|hello|hey|thanks?|thank you|bye|ok|okay)\.?$/i;

    if (simpleConversational.test(message.trim())) {
      const responses = {
        hi: "Hi! What would you like to know about this video? 👋",
        hello: "Hello! Ask me anything about the video content.",
        hey: "Hey! Ready to analyze this video together?",
        thanks: "Happy to help! What else would you like to explore?",
        "thank you": "Happy to help! What else would you like to explore?",
        bye: "See you later! 👋",
        ok: "Great! What would you like to know about this video?",
        okay: "Perfect! How can I help you analyze this content?",
      };

      const normalizedMessage = message
        .toLowerCase()
        .replace(/[.!?]/g, "") as keyof typeof responses;
      const response =
        responses[normalizedMessage] || "How can I help you with this video?";

      return NextResponse.json({
        content: response,
        citations: [],
        model: "gemini-2.0-flash-exp",
        analysisType: "conversational",
      });
    }

    // Extract video data for analysis
    const title = videoData.title || "Unknown Video";
    const description = videoData.description || "No description available";
    const duration = videoData.duration || 0;
    const sections = videoData.sections || [];
    const currentPos = currentTime || 0;

    
    let realTranscript = videoData.transcript || "No transcript available";

    // Check if we have a real transcript or just a placeholder
    if (!realTranscript || 
        realTranscript.includes("Transcript for") || 
        realTranscript.includes("Video transcript and analysis") ||
        realTranscript.length < 1000) {
      
      try {
        console.log("Getting fresh transcript for chat analysis...");
        
        // Try Python backend first
        const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        const transcriptResponse = await fetch(`${PYTHON_BACKEND_URL}/transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: youtubeUrl }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (transcriptResponse.ok) {
          const transcriptResult = await transcriptResponse.json();
          if (transcriptResult.success && transcriptResult.data) {
            realTranscript = transcriptResult.data.transcript;
            console.log(`✅ Fresh transcript for chat: ${realTranscript.length} characters`);
          }
        } else {
          throw new Error("Python backend failed");
        }
        
      } catch (pythonError) {
        console.warn("Python backend failed, trying JavaScript fallback...");
        
        // Fallback to JavaScript library
        try {
          const { YoutubeTranscript } = await import("youtube-transcript");
          const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
          realTranscript = transcriptData.map(item => item.text).join(' ');
          console.log(`✅ Fallback transcript for chat: ${realTranscript.length} characters`);
        } catch (fallbackError) {
          console.error("Both transcript methods failed:", fallbackError);
          realTranscript = "Transcript not available for detailed analysis";
        }
      }
    } else {
      console.log(`✅ Using existing transcript: ${realTranscript.length} characters`);
    }

    // Now use the real transcript for analysis
    const transcript = realTranscript;

    // Build comprehensive sections with timing analysis
    const enrichedSections = sections.map((section: any, index: number) => {
      const sectionTitle = section?.title || `Section ${index + 1}`;
      const startTime = section?.startTime || 0;
      const endTime = section?.endTime || 0;
      const sectionDescription = section?.description || "No description";

      return {
        index: index + 1,
        title: sectionTitle,
        startTime,
        endTime,
        duration: endTime - startTime,
        startFormatted: formatTime(startTime),
        endFormatted: formatTime(endTime),
        description: sectionDescription,
        transcript: section?.transcript || "",
      };
    });

    const sectionsAnalysis =
      enrichedSections.length > 0
        ? enrichedSections
          .map(
            (section: {
              index: any;
              title: any;
              startFormatted: any;
              endFormatted: any;
              description: any;
              transcript: string;
            }) =>
              `Section ${section.index}: "${section.title}"
Time: ${section.startFormatted} - ${section.endFormatted}
Description: ${section.description}
${section.transcript
                ? `Content: ${section.transcript.substring(0, 200)}...`
                : ""
              }`
          )
          .join("\n\n")
        : "No structured sections available";

    // Analyze transcript for programming concepts
    const transcriptAnalysis = analyzeTranscriptPatterns(transcript);

    // Build conversation context if available
    const conversationContext =
      chatHistory.length > 0
        ? `Previous conversation context:\n${chatHistory
          .slice(-4)
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join("\n")}\n`
        : "";

    // Create the analysis-focused prompt
    const analysisPrompt = `You are an intelligent video analysis assistant specializing in programming and technical content. You excel at finding precise information and helping users learn from "${title}".

Current video position: ${formatTime(currentPos)} / ${formatTime(duration)}

**Tone & Communication Style:**
- Be conversational and helpful like you're learning together
- Use natural language: "I found", "let me check", "looks like"
- Show genuine interest in helping users understand the content
- Be encouraging and educational, not robotic or academic
- Maintain technical accuracy while being approachable and friendly

**Core Analysis Behavior:**
- Take initiative to search comprehensively across the entire transcript
- Make intelligent connections between different parts of the video
- Proactively suggest related topics when exact matches aren't found
- Focus on being thorough, accurate, and genuinely helpful

VIDEO INFORMATION:
Title: "${title}"
Duration: ${formatTime(duration)}
Current Position: ${formatTime(currentPos)}
Description: ${description}
Transcript Length: ${transcript.length} characters

STRUCTURED CONTENT:
${sectionsAnalysis}

CONTENT ANALYSIS:
${transcriptAnalysis}

FULL TRANSCRIPT:
${transcript}

${conversationContext}

USER QUESTION: "${message}"

**ANALYSIS INSTRUCTIONS:**
1. **THOROUGHLY search the entire transcript** for the requested information
2. **If keyword not in transcript:** Respond that the transcript doesn't contain the word and end there. No further analysis.
3. **Provide EXACT timestamps (MM:SS format)** for every relevant mention with correct timing
4. **Include detailed context** about what's discussed at each timestamp
5. **List ALL occurrences chronologically** if spanning multiple sections
6. **Distinguish between brief mentions vs detailed explanations**
7. **If not found:** Explain what you searched for and suggest related topics that ARE covered
8. **For gibberish prompts:** State it's gibberish and don't continue analysis

**RESPONSE FORMAT:**
- Start with a brief, friendly summary of findings
- Present results naturally: **[MM:SS]** - Context of what's covered
- Explain the flow/progression of the topic when relevant
- Be thorough but conversational
- Use emojis sparingly for friendliness
- Focus on being comprehensive and accurate while maintaining a helpful tone

**SMART SEARCH STRATEGY:**
When content is found: Present all relevant timestamps with context and explain how the topic develops
When content is not found: Briefly state what was searched, then suggest related available topics
Always prioritize accuracy and completeness while staying conversational and educational.`;

    try {
      console.log("Performing detailed video analysis...");

      const result = await model.generateContent(analysisPrompt);
      let assistantResponse = "";

      try {
        assistantResponse = result.response.text();
      } catch (textError) {
        console.error("Error extracting text:", textError);
        if (result.response.candidates?.[0]?.content?.parts?.[0]?.text) {
          assistantResponse =
            result.response.candidates[0].content.parts[0].text;
        } else {
          throw new Error("Could not extract response text");
        }
      }

      if (!assistantResponse) {
        assistantResponse =
          "I received your question but couldn't analyze the content. Please try rephrasing your question.";
      }

      // Extract timestamps with validation
      const citations = extractTimestamps(assistantResponse, duration);

      return NextResponse.json({
        content: assistantResponse,
        citations: citations.slice(0, 8), // Allow comprehensive citations
        model: "gemini-2.0-flash-exp",
        analysisType: "detailed-analysis",
        searchQuery: message,
        videoAnalyzed: {
          title,
          duration: formatTime(duration),
          sectionsCount: sections.length,
          transcriptLength: transcript.length,
        },
      });
    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError);

      if (geminiError.message?.includes("API_KEY_INVALID")) {
        return NextResponse.json(
          {
            error: "Invalid API key",
            content:
              "The API configuration is invalid. Please check your setup.",
          },
          { status: 500 }
        );
      }

      if (geminiError.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            content: "Too many requests. Please try again in a moment.",
          },
          { status: 429 }
        );
      }

      if (geminiError.message?.includes("SAFETY")) {
        return NextResponse.json({
          content:
            "I cannot provide a response to this query due to safety guidelines. Please try rephrasing your question.",
        });
      }

      return NextResponse.json(
        {
          error: "Analysis error",
          content:
            "I encountered an error while analyzing the video. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("General error:", error);

    return NextResponse.json(
      {
        error: "Processing error",
        content: "Failed to process your request. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper Functions
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function analyzeTranscriptPatterns(transcript: string): string {
  const patterns = {
    codeTerms: [
      "function",
      "variable",
      "class",
      "method",
      "algorithm",
      "loop",
      "condition",
    ],
    concepts: [
      "mutex",
      "thread",
      "async",
      "sync",
      "goroutine",
      "channel",
      "interface",
    ],
    actions: [
      "implement",
      "demonstrate",
      "example",
      "show",
      "explain",
      "discuss",
    ],
    timeMarkers: [
      "first",
      "next",
      "then",
      "finally",
      "later",
      "before",
      "after",
    ],
  };

  const analysis = [];
  const lowerTranscript = transcript.toLowerCase();

  for (const [category, terms] of Object.entries(patterns)) {
    const foundTerms = terms.filter((term) => lowerTranscript.includes(term));
    if (foundTerms.length > 0) {
      analysis.push(`${category}: ${foundTerms.join(", ")}`);
    }
  }

  return analysis.length > 0
    ? `Programming concepts detected: ${analysis.join(" | ")}`
    : "General content without specific programming terminology detected";
}

function extractTimestamps(response: string, maxDuration: number) {
  const timestampRegex = /(\d{1,3}):(\d{2})/g;
  const citations: { text: string; startTime: number; endTime: number }[] = [];
  let match;

  while ((match = timestampRegex.exec(response)) !== null) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const timestamp = minutes * 60 + seconds;

    if (
      timestamp <= maxDuration &&
      !citations.some((c) => c.startTime === timestamp)
    ) {
      citations.push({
        text: `${match[1]}:${match[2]}`,
        startTime: timestamp,
        endTime: Math.min(timestamp + 60, maxDuration),
      });
    }
  }

  return citations;
}