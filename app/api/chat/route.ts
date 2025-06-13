import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { message, videoId, videoData, currentTime } = await request.json();

    // Validate input data
    if (!message || !videoId || !videoData) {
      return NextResponse.json(
        {
          error: "Missing required data",
          content:
            "I'm sorry, I need more information to help you with this video.",
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
          content: "I'm sorry, the AI service is not properly configured.",
        },
        { status: 500 }
      );
    }

    // Initialize Gemini with optimal settings for text analysis
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1, // Very low for maximum accuracy and consistency
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192, // Maximum for detailed responses
      },
    });

    // Check for conversational/social messages first
    const conversationalPatterns = [
      /^(thank you|thanks|thx)\.?$/i,
      /^(hello|hi|hey|yo|what's up|wassup|)\.?$/i,
      /^(goodbye|bye|see you)\.?$/i,
      /^(you're welcome|welcome)\.?$/i,
      /^(ok|okay|alright)\.?$/i,
      /^(got it|understood|makes sense)\.?$/i,
      /^(cool|nice|great|awesome)\.?$/i,
    ];

    const isConversational = conversationalPatterns.some((pattern) =>
      pattern.test(message.trim())
    );

    if (isConversational) {
      // Handle conversational responses with proper typing
      const conversationalResponses: Record<string, string> = {
        "thank you":
          "You're welcome! Feel free to ask me anything else about this video.",
        thanks:
          "You're welcome! I'm here if you need any more help with the video content.",
        thx: "No problem! Let me know if you have other questions about the video.",
        hello:
          "Hello! I'm ready to help you analyze this video. What would you like to know?",
        hi: "Hi there! Ask me anything about this video content.",
        hey: "Hey! What can I help you discover in this video?",
        goodbye:
          "Goodbye! Feel free to come back if you have more questions about the video.",
        bye: "See you later! Happy learning with your video content.",
        ok: "Great! Is there anything specific you'd like to know about this video?",
        okay: "Perfect! What else can I help you understand about this video?",
        cool: "Glad you found it helpful! Any other questions about the video?",
        nice: "Thanks! Let me know if you want to explore more of this video content.",
        great:
          "Wonderful! Feel free to ask about any other parts of the video.",
        awesome:
          "I'm glad I could help! What else would you like to know about this video?",
      };

      const normalizedMessage = message.toLowerCase().replace(/[.!?]/g, "");
      const response =
        conversationalResponses[normalizedMessage] ||
        "Thanks! Is there anything specific you'd like to know about this video?";

      return NextResponse.json({
        content: response,
        citations: [],
        model: "gemini-2.0-flash-exp",
        analysisType: "conversational-response",
        searchQuery: message,
      });
    }
    const title = videoData.title || "Unknown Video";
    const description = videoData.description || "No description available";
    const duration = videoData.duration || 0;
    const sections = videoData.sections || [];
    const transcript = videoData.transcript || "No transcript available";
    const safeCurrentTime = currentTime || 0;

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
        startFormatted: `${Math.floor(startTime / 60)}:${(startTime % 60)
          .toString()
          .padStart(2, "0")}`,
        endFormatted: `${Math.floor(endTime / 60)}:${(endTime % 60)
          .toString()
          .padStart(2, "0")}`,
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
                duration: number;
                description: any;
                transcript: string;
              }) =>
                `Section ${section.index}: "${section.title}"
Time Range: ${section.startFormatted} - ${section.endFormatted} (${Math.floor(
                  section.duration / 60
                )}m ${section.duration % 60}s)
Description: ${section.description}
${
  section.transcript
    ? `Transcript Excerpt: ${section.transcript.substring(0, 300)}${
        section.transcript.length > 300 ? "..." : ""
      }`
    : ""
}
---`
            )
            .join("\n\n")
        : "No structured sections available";

    // Analyze transcript for programming concepts and patterns
    const transcriptAnalysis = analyzeTranscriptPatterns(transcript);

    // Create context-aware timestamps around current time
    const contextWindow = getContextualTimestamps(
      transcript,
      safeCurrentTime,
      180
    ); // 3-minute window

    // Build the ultimate analysis prompt
    const expertPrompt = `You are an expert AI video analyst with deep knowledge of programming, software development, and technical education. You excel at finding precise information in video content and providing detailed, accurate responses with exact timestamps.

COMPREHENSIVE VIDEO CONTEXT:
═══════════════════════════════════════════════════════════════

📹 TITLE: "${title}"
⏱️ TOTAL DURATION: ${Math.floor(duration / 60)}:${(duration % 60)
      .toString()
      .padStart(2, "0")}
📍 CURRENT POSITION: ${Math.floor(safeCurrentTime / 60)}:${(
      safeCurrentTime % 60
    )
      .toString()
      .padStart(2, "0")}
📝 DESCRIPTION: ${description}

STRUCTURAL ANALYSIS:
${sectionsAnalysis}

CONTENT PATTERN ANALYSIS:
${transcriptAnalysis}

CONTEXTUAL WINDOW (±3 minutes from current position):
${contextWindow}

COMPLETE TRANSCRIPT WITH TIMESTAMPS:
${transcript}

EXPERT ANALYSIS INSTRUCTIONS:
═══════════════════════════════════════════════════════════════

🔍 SEARCH METHODOLOGY:
1. Perform a comprehensive scan of the ENTIRE transcript
2. Use advanced pattern matching for technical terminology and concepts
3. Consider variations, synonyms, and related terms
4. Analyze context around matches for relevance
5. Cross-reference with section titles and descriptions

📍 TIMESTAMP PRECISION:
1. Provide EXACT timestamps in MM:SS format for every relevant mention
2. Include brief context for what's happening at each timestamp
3. If a topic spans multiple timeframes, list ALL occurrences
4. Distinguish between brief mentions vs. detailed explanations

🧠 TECHNICAL UNDERSTANDING:
1. Demonstrate deep understanding of programming concepts
2. Explain the specific aspect being discussed at each timestamp
3. Identify relationships between different parts of the content
4. Note progressive complexity or skill building

💡 COMPREHENSIVE RESPONSE FORMAT:
1. Start with a summary of findings
2. List each relevant timestamp with detailed context
3. Explain the progression or flow of the topic
4. Note any visual cues mentioned in the transcript (code examples, diagrams, etc.)
5. If the topic isn't found, explain what WAS searched and suggest related topics that ARE present

SEARCH QUERY: "${message}"

Provide an exhaustive analysis that demonstrates mastery of both the video content and the requested topic. Be thorough, precise, and educational in your response.`;

    try {
      console.log("Sending optimized text-based request to Gemini API...");

      // Generate response using enhanced prompt
      const result = await model.generateContent(expertPrompt);

      if (!result.response) {
        throw new Error("No response from Gemini API");
      }

      const response = result.response;
      let assistantResponse = "";

      try {
        assistantResponse = response.text();
      } catch (textError) {
        console.error("Error extracting text from response:", textError);
        if (
          response.candidates &&
          response.candidates[0]?.content?.parts?.[0]?.text
        ) {
          assistantResponse = response.candidates[0].content.parts[0].text;
        } else {
          throw new Error("Could not extract text from response");
        }
      }

      if (!assistantResponse) {
        assistantResponse =
          "I received your question but couldn't generate a response. Please try rephrasing your question.";
      }

      console.log("Expert-level text analysis completed successfully");

      // Advanced timestamp extraction with context validation
      const timestampRegex = /(\d{1,3}):(\d{2})/g;
      const citations: {
        text: string;
        startTime: number;
        endTime: number;
        context?: string;
      }[] = [];
      let match;

      while ((match = timestampRegex.exec(assistantResponse)) !== null) {
        const minutes = Number.parseInt(match[1], 10);
        const seconds = Number.parseInt(match[2], 10);
        const timestamp = minutes * 60 + seconds;

        if (
          timestamp <= duration &&
          !citations.some((c) => c.startTime === timestamp)
        ) {
          // Extract context around the timestamp mention
          const beforeText = assistantResponse.substring(
            Math.max(0, match.index - 100),
            match.index
          );
          const afterText = assistantResponse.substring(
            match.index + match[0].length,
            Math.min(
              assistantResponse.length,
              match.index + match[0].length + 100
            )
          );

          citations.push({
            text: `${match[1]}:${match[2]}`,
            startTime: timestamp,
            endTime: Math.min(timestamp + 90, duration), // Longer segments for better context
            context: (beforeText + match[0] + afterText).trim(),
          });
        }
      }

      return NextResponse.json({
        content: assistantResponse,
        citations: citations.slice(0, 10), // Allow more citations for comprehensive analysis
        model: "gemini-2.0-flash-exp",
        analysisType: "expert-text-analysis",
        searchQuery: message,
        videoAnalyzed: {
          title,
          duration: `${Math.floor(duration / 60)}:${(duration % 60)
            .toString()
            .padStart(2, "0")}`,
          sectionsCount: sections.length,
          transcriptLength: transcript.length,
        },
      });
    } catch (geminiError: any) {
      console.error("Gemini API error details:", {
        message: geminiError.message,
        status: geminiError.status,
        statusText: geminiError.statusText,
        response: geminiError.response,
      });

      // Handle specific errors with helpful messages
      if (geminiError.message?.includes("API_KEY_INVALID")) {
        return NextResponse.json(
          {
            error: "Invalid API key",
            content:
              "The Gemini API key is invalid. Please check your configuration.",
          },
          { status: 500 }
        );
      }

      if (
        geminiError.message?.includes("Too Many Requests") ||
        geminiError.status === 429
      ) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            content:
              "The Gemini API quota has been exceeded. Please try again later.",
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
          error: "Gemini API error",
          content:
            "I'm having trouble connecting to the AI service. Please try again in a moment.",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("General error in chat route:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: "Failed to process chat message",
        content:
          "I'm sorry, I encountered an error while processing your message. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to analyze transcript patterns
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
    ? `Programming Terms Detected: ${analysis.join(" | ")}`
    : "General content without specific programming terminology detected";
}

// Helper function to get contextual timestamps
function getContextualTimestamps(
  transcript: string,
  currentTime: number,
  windowSeconds: number
): string {
  const lines = transcript.split("\n");
  const relevantLines = lines.filter((line) => {
    const timestampMatch = line.match(/\[(\d+):(\d+)\]/);
    if (timestampMatch) {
      const lineTime =
        Number.parseInt(timestampMatch[1]) * 60 +
        Number.parseInt(timestampMatch[2]);
      return Math.abs(lineTime - currentTime) <= windowSeconds;
    }
    return false;
  });

  return relevantLines.length > 0
    ? `Context around current time:\n${relevantLines.slice(0, 10).join("\n")}`
    : "No timestamped content available around current position";
}
