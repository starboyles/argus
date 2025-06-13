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
            "Sorry, I'm having trouble connecting right now. Please try again!",
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.3, // Balanced for natural conversation
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1000, // Concise but complete responses
      },
    });

    // Smart conversational pattern detection
    const conversationalPatterns = {
      greetings: /^(hello|hi|hey|yo|what's up|wassup)\.?$/i,
      gratitude: /^(thank you|thanks|thx|ty)\.?$/i,
      farewell: /^(goodbye|bye|see you|later|gtg)\.?$/i,
      agreement: /^(ok|okay|alright|got it|understood|makes sense|i see)\.?$/i,
      appreciation: /^(cool|nice|great|awesome|amazing|perfect|sweet)\.?$/i,
      confusion: /^(huh|what|confused|don't understand|unclear)\.?$/i,
      gibberish: /^[a-z]{1,15}$/i,
    };

    // Detect conversational intent
    const trimmedMessage = message.trim();
    let conversationalType: keyof typeof conversationalPatterns | null = null;

    for (const [type, pattern] of Object.entries(conversationalPatterns)) {
      if (pattern.test(trimmedMessage)) {
        conversationalType = type as keyof typeof conversationalPatterns;
        break;
      }
    }

    // Handle conversational responses with personality
    if (conversationalType) {
      const responses = {
        greetings: [
          "Hey there! 👋 Ready to dive into this video together?",
          "Hi! I'm here to help you explore this video content. What interests you?",
          "Hello! Let's discover what this video has to offer. What's on your mind?",
        ],
        gratitude: [
          "You're welcome! 😊 Happy to help you learn more.",
          "Glad I could help! What else would you like to explore?",
          "No problem! Keep the questions coming 🚀",
        ],
        farewell: [
          "See you later! Happy learning! 📚",
          "Bye! Come back if you have more questions about the video.",
          "Take care! Hope you found the video helpful! 👋",
        ],
        agreement: [
          "Perfect! Anything else you'd like to know about this video?",
          "Great! What other parts of the video interest you?",
          "Awesome! Feel free to ask about any other topics covered.",
        ],
        appreciation: [
          "Right? This video has some really good content! 🎯",
          "I'm glad you found it useful! Want to explore more?",
          "Yeah! There's a lot of valuable stuff in here. What's next?",
        ],
        confusion: [
          "No worries! Let me try explaining it differently. What part confused you?",
          "I can help clarify! What specifically didn't make sense?",
          "Let's break it down together. Which part should I explain better?",
        ],
        gibberish: [
          "Hmm, that looks like a bit of gibberish! 😄 What did you actually want to ask about this video?",
          "I think your keyboard might have had a moment there! What can I help you find in this video?",
          "Not sure what that means, but I'm here to help with the video content! What interests you?",
        ],
      };

      const responseOptions = conversationalType
        ? responses[conversationalType]
        : [];
      const response =
        responseOptions[Math.floor(Math.random() * responseOptions.length)];

      return NextResponse.json({
        content: response,
        citations: [],
        model: "gemini-2.0-flash-exp",
        analysisType: "conversational",
        searchQuery: message,
      });
    }

    // Extract video data
    const title = videoData.title || "this video";
    const description = videoData.description || "";
    const duration = videoData.duration || 0;
    const sections = videoData.sections || [];
    const transcript = videoData.transcript || "";
    const currentPos = currentTime || 0;

    // Build conversation context from chat history
    const conversationContext = chatHistory
      .slice(-6) // Last 6 messages for context
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Get relevant sections around current time
    const currentSection = findCurrentSection(sections, currentPos);
    const nearbyContent = getNearbyContent(transcript, currentPos, 120); // 2-minute window

    // Create smart, conversational system prompt
    const smartPrompt = `You're a helpful video analysis assistant with expertise in programming and technical content. You're having a natural conversation with someone watching "${title}".

CURRENT SITUATION:
- Video duration: ${formatTime(duration)}
- They're at: ${formatTime(currentPos)}
- Current section: ${currentSection ? currentSection.title : "Not in a specific section"
      }
- Their question: "${message}"

${conversationContext ? `RECENT CONVERSATION:\n${conversationContext}\n` : ""}

CONTENT AROUND CURRENT TIME:
${nearbyContent}

${transcript
        ? `FULL TRANSCRIPT:\n${transcript.substring(0, 4000)}${transcript.length > 4000 ? "..." : ""
        }`
        : ""
      }

HOW TO RESPOND:
✅ Be conversational and helpful like you're watching together
✅ Give direct answers without unnecessary structure  
✅ Include specific timestamps when relevant (format MM:SS)
✅ If you can't find something, suggest what IS available nearby
✅ Keep responses focused and not overwhelming
✅ Show personality - be encouraging and use emojis occasionally
✅ Build on the conversation naturally
✅ Reference their current position when helpful

❌ Don't use academic headers or bullet points
❌ Don't be overly verbose 
❌ Don't list search methodology
❌ Don't overwhelm with too much information

SPECIAL HANDLING:
- If asking about something not covered: "I don't see that in this video, but there's [related topic] at [time] that might help!"
- If asking for summary: Focus on key points with timestamps
- If asking about current time: Use context around where they are
- If vague question: Ask a clarifying question to be more helpful

Remember: You're a smart friend helping them learn, not writing a technical report.`;

    try {
      console.log("Generating conversational response...");

      const result = await model.generateContent(smartPrompt);
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
          "I got your question but I'm having trouble responding right now. Could you try asking again? 🤔";
      }

      // Smart timestamp extraction with context
      const citations = extractSmartCitations(assistantResponse, duration);

      return NextResponse.json({
        content: assistantResponse,
        citations: citations.slice(0, 5), // Keep it manageable
        model: "gemini-2.0-flash-exp",
        analysisType: "smart-conversation",
        searchQuery: message,
        videoContext: {
          title,
          currentTime: formatTime(currentPos),
          currentSection: currentSection?.title || null,
        },
      });
    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError);

      // Friendly error handling
      if (geminiError.message?.includes("API_KEY_INVALID")) {
        return NextResponse.json(
          {
            error: "Invalid API key",
            content:
              "I'm having trouble with my connection. Please check back soon! 🔧",
          },
          { status: 500 }
        );
      }

      if (geminiError.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            content:
              "I'm getting too many requests right now. Give me a moment and try again! ⏳",
          },
          { status: 429 }
        );
      }

      if (geminiError.message?.includes("SAFETY")) {
        return NextResponse.json({
          content:
            "I can't respond to that question, but I'm happy to help with other aspects of this video! 😊",
        });
      }

      return NextResponse.json(
        {
          error: "Service error",
          content:
            "Something went wrong on my end. Please try your question again! 🔄",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("General error:", error);

    return NextResponse.json(
      {
        error: "Processing error",
        content:
          "Oops! I encountered an error. Please try again in a moment! 🤖",
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

function findCurrentSection(sections: any[], currentTime: number) {
  return sections.find(
    (section) =>
      currentTime >= (section.startTime || 0) &&
      currentTime <= (section.endTime || Infinity)
  );
}

function getNearbyContent(
  transcript: string,
  currentTime: number,
  windowSeconds: number
): string {
  if (!transcript) return "No transcript available";

  const lines = transcript.split("\n");
  const relevantLines = lines.filter((line) => {
    const timestampMatch = line.match(/\[(\d+):(\d+)\]/);
    if (timestampMatch) {
      const lineTime =
        parseInt(timestampMatch[1]) * 60 + parseInt(timestampMatch[2]);
      return Math.abs(lineTime - currentTime) <= windowSeconds;
    }
    return false;
  });

  return relevantLines.length > 0
    ? relevantLines.slice(0, 8).join("\n")
    : "No content available around current time";
}

function extractSmartCitations(response: string, maxDuration: number) {
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
        endTime: Math.min(timestamp + 30, maxDuration), // 30-second segments
      });
    }
  }

  return citations;
}
