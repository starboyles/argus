import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      videoId,
      videoData,
      currentTime,
      includeVisuals = true,
    } = await request.json();

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

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more accurate responses
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096, // Increased for more detailed responses
      },
    });

    // Safely extract video data with defaults
    const title = videoData.title || "Unknown Video";
    const description = videoData.description || "No description available";
    const duration = videoData.duration || 0;
    const sections = videoData.sections || [];
    const transcript = videoData.transcript || "No transcript available";
    const safeCurrentTime = currentTime || 0;

    let visualFrames = [];
    if (includeVisuals) {
      try {
        console.log("Fetching visual frames for multimodal analysis...");
        const framesResponse = await fetch(
          `${request.nextUrl.origin}/api/extract-frames`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId,
              query: message,
              contextTime: currentTime,
              maxFrames: 8,
            }),
          }
        );

        if (framesResponse.ok) {
          const framesData = await framesResponse.json();
          visualFrames = framesData.frames || [];
          console.log(`Retrieved ${visualFrames.length} frames for analysis`);
        }
      } catch (frameError) {
        console.warn(
          "Could not fetch frames, continuing with text-only analysis:",
          frameError
        );
      }
    }

    // Build more detailed sections context
    const sectionsText =
      sections.length > 0
        ? sections
            .map((section: any, index: number) => {
              const sectionTitle = section?.title || `Section ${index + 1}`;
              const startTime = section?.startTime || 0;
              const endTime = section?.endTime || 0;
              const sectionDescription =
                section?.description || "No description";
              const sectionTranscript = section?.transcript || "";

              return `${index + 1}. ${sectionTitle} (${Math.floor(
                startTime / 60
              )}:${(startTime % 60).toString().padStart(2, "0")} - ${Math.floor(
                endTime / 60
              )}:${(endTime % 60).toString().padStart(2, "0")})
   Description: ${sectionDescription}
   ${
     sectionTranscript
       ? `Content: ${sectionTranscript.substring(0, 500)}${
           sectionTranscript.length > 500 ? "..." : ""
         }`
       : ""
   }`;
            })
            .join("\n\n")
        : "No sections available";

    // Create multimodal prompt
    const multimodalContent = []
    
    // Add main text prompt
    multimodalContent.push({
      text: `You are an expert AI assistant with advanced multimodal video analysis capabilities. Analyze this video using BOTH textual content AND visual frames to provide comprehensive answers.

VIDEO ANALYSIS CONTEXT:
Title: "${title}"
Total Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}
Current Position: ${Math.floor(safeCurrentTime / 60)}:${(safeCurrentTime % 60).toString().padStart(2, "0")}
Description: ${description}

STRUCTURED CONTENT:
${sectionsText}

COMPLETE TRANSCRIPT:
${transcript}

${visualFrames.length > 0 ? `
VISUAL FRAMES ANALYSIS:
I'm providing you with ${visualFrames.length} key frames from this video. Please analyze these images along with the transcript to understand:
- Code shown on screen (syntax, concepts, IDE interfaces)
- UI elements, diagrams, charts, presentations  
- Visual demonstrations and examples
- Tools and applications being used
- Presenter gestures and body language
- Slide content and visual aids
- Any text or graphics displayed

MULTIMODAL ANALYSIS INSTRUCTIONS:
1. Combine visual evidence from frames with transcript context
2. When you find relevant content, provide EXACT timestamps in MM:SS format
3. Describe what's visually happening at each timestamp
4. Explain how visual content relates to spoken content
5. Identify visual elements that support or contradict transcript
6. Note any code, diagrams, or technical content shown visually
7. Analyze presenter's visual demonstrations and gestures

` : `
TEXT-ONLY ANALYSIS (no visual frames available):
1. Search through the ENTIRE transcript systematically for the requested topic
2. When you find relevant content, provide EXACT timestamps in MM:SS format
3. Include brief context about what's being discussed at each timestamp
4. For programming concepts, explain the specific aspect being covered

`}

SEARCH QUERY: ${message}

Provide a comprehensive ${visualFrames.length > 0 ? 'multimodal' : 'textual'} analysis with specific timestamps and detailed explanations.`
    })

    // Add visual frames to the prompt
    if (visualFrames.length > 0) {
      visualFrames.forEach((frame: any) => {
        multimodalContent.push({
          inlineData: {
            data: frame.base64Data,
            mimeType: "image/jpeg"
          }
        })
      })
    }

    try {
      console.log(`Sending ${visualFrames.length > 0 ? 'multimodal' : 'text-only'} request to Gemini API...`)
      
      // Generate response using Gemini
      const result = await model.generateContent(multimodalContent)
      
      if (!result.response) {
        throw new Error("No response from Gemini API")
      }

      const response = result.response
      let assistantResponse = ""
      
      try {
        assistantResponse = response.text()
      } catch (textError) {
        console.error("Error extracting text from response:", textError)
        if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
          assistantResponse = response.candidates[0].content.parts[0].text
        } else {
          throw new Error("Could not extract text from multimodal response")
        }
      }

      if (!assistantResponse) {
        assistantResponse = "I received your question but couldn't generate a response. Please try rephrasing your question."
      }

      console.log("Gemini multimodal response received successfully")

      // Enhanced timestamp extraction
      const timestampRegex = /(\d{1,3}):(\d{2})/g
      const citations: { text: string; startTime: number; endTime: number }[] = []
      let match

      while ((match = timestampRegex.exec(assistantResponse)) !== null) {
        const minutes = Number.parseInt(match[1], 10)
        const seconds = Number.parseInt(match[2], 10)
        const timestamp = minutes * 60 + seconds

        if (timestamp <= duration && !citations.some(c => c.startTime === timestamp)) {
          citations.push({
            text: `${match[1]}:${match[2]}`,
            startTime: timestamp,
            endTime: Math.min(timestamp + 60, duration),
          })
        }
      }

      return NextResponse.json({
        content: assistantResponse,
        citations: citations.slice(0, 8),
        model: "gemini-2.0-flash-exp",
        analysisType: visualFrames.length > 0 ? "multimodal" : "text-only",
        framesAnalyzed: visualFrames.length
      })

    } catch (geminiError: any) {
      console.error("Gemini API error details:", {
        message: geminiError.message,
        status: geminiError.status,
        statusText: geminiError.statusText,
        response: geminiError.response
      })

      // Handle specific errors
      if (geminiError.message?.includes("API_KEY_INVALID")) {
        return NextResponse.json({
          error: "Invalid API key",
          content: "The Gemini API key is invalid. Please check your configuration."
        }, { status: 500 })
      }

      if (geminiError.message?.includes("Too Many Requests") || geminiError.status === 429) {
        return NextResponse.json({
          error: "Rate limit exceeded", 
          content: "The Gemini API quota has been exceeded. Please try again later."
        }, { status: 429 })
      }

      if (geminiError.message?.includes("SAFETY")) {
        return NextResponse.json({
          content: "I cannot provide a response to this query due to safety guidelines. Please try rephrasing your question."
        })
      }

      return NextResponse.json({
        error: "Gemini API error",
        content: "I'm having trouble connecting to the AI service. Please try again in a moment."
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("General error in chat route:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    return NextResponse.json({
      error: "Failed to process chat message",
      content: "I'm sorry, I encountered an error while processing your message. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
