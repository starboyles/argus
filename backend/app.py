from flask import Flask, jsonify, request
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
from flask_cors import CORS
import re
import os
import time
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["*"])  # Enable CORS for Next.js frontend

def extract_video_id(url):
    """Extract video ID from various YouTube URL formats"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If no pattern matches, assume it's already a video ID
    return url

@app.route('/', methods=['GET'])
def root():
    """Root endpoint to verify the app is running"""
    return jsonify({
        'status': 'running',
        'message': 'Argus Python Backend API',
        'endpoints': {
            'health': '/health',
            'transcript': '/transcript (POST)',
            'transcript_by_id': '/transcript/<video_id> (GET)',
            'test': '/test-transcript (GET)'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Python backend is running'})

@app.route('/transcript', methods=['POST', 'OPTIONS'])
def get_transcript():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({
                'success': False, 
                'error': 'Missing YouTube URL in request body'
            }), 400
            
        youtube_url = data['url']
        video_id = extract_video_id(youtube_url)
        
        if not video_id:
            return jsonify({
                'success': False,
                'error': 'Invalid YouTube URL format'
            }), 400
        
        # Fetch transcript using the CORRECT API method
        print(f"Attempting to fetch transcript for video ID: {video_id}")
        
        try:
            # Try to get available transcripts first
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            print(f"Available transcripts: {[t.language for t in transcript_list]}")
            
            # Get the transcript (preferably manually created English, then auto-generated)
            try:
                transcript = transcript_list.find_manually_created_transcript(['en'])
                print("Using manually created English transcript")
            except:
                try:
                    transcript = transcript_list.find_generated_transcript(['en'])
                    print("Using auto-generated English transcript")
                except:
                    # Get any available transcript
                    transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
                    print(f"Using transcript in language: {transcript.language}")
            
            # Fetch the actual transcript data
            transcript_data = transcript.fetch()
            
            # Combine all transcript snippets into complete text
            complete_transcript = " ".join([item['text'] for item in transcript_data])
            
            # Store language info
            language_info = transcript.language
            is_generated = transcript.is_generated
            
        except Exception as inner_e:
            print(f"Transcript fetch error details: {str(inner_e)}")
            # Try direct method as fallback
            print("Trying direct get_transcript method...")
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id)
            complete_transcript = " ".join([item['text'] for item in transcript_data])
            language_info = 'en'
            is_generated = None
        
        # Get additional metadata
        transcript_data = {
            'video_id': video_id,
            'transcript': complete_transcript,
            'length': len(complete_transcript),
            'snippet_count': len(transcript_data) if 'transcript_data' in locals() else 0,
            'language': language_info if 'language_info' in locals() else 'en',
            'is_generated': is_generated if 'is_generated' in locals() else None
        }
        
        return jsonify({
            'success': True,
            'data': transcript_data
        })
        
    except TranscriptsDisabled:
        return jsonify({
            'success': False,
            'error': 'Transcripts are disabled for this video'
        }), 400
    except NoTranscriptFound:
        return jsonify({
            'success': False,
            'error': 'No transcript found for this video'
        }), 404
    except Exception as e:
        error_msg = str(e)
        print(f"Full error: {error_msg}")
        
        # Check for specific error patterns
        if "no element found" in error_msg.lower():
            return jsonify({
                'success': False,
                'error': 'YouTube API returned empty response. This might be a temporary issue or the video might be restricted.',
                'details': error_msg,
                'suggestion': 'Try again in a few seconds or check if the video is accessible'
            }), 503
        
        return jsonify({
            'success': False, 
            'error': f'Failed to fetch transcript: {error_msg}'
        }), 500

@app.route('/transcript/<video_id>', methods=['GET'])
def get_transcript_by_id(video_id):
    """Alternative endpoint that accepts video ID directly"""
    try:
        # Use the CORRECT static method
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        complete_transcript = " ".join([item['text'] for item in transcript_list])
        
        return jsonify({
            'success': True,
            'data': {
                'video_id': video_id,
                'transcript': complete_transcript,
                'length': len(complete_transcript)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/test-transcript', methods=['GET'])
def test_transcript():
    """Test endpoint to check if transcript fetching works at all"""
    test_videos = [
        'dQw4w9WgXcQ',  # Rick Roll - should always work
        'B_ketdzJtY8',  # The organic chemistry video
    ]
    
    results = {}
    for vid in test_videos:
        try:
            transcript_data = YouTubeTranscriptApi.get_transcript(vid)
            results[vid] = {
                'success': True,
                'length': len(transcript_data),
                'first_text': transcript_data[0]['text'] if transcript_data else 'No data'
            }
        except Exception as e:
            results[vid] = {
                'success': False,
                'error': str(e)
            }
    
    return jsonify({
        'test_results': results,
        'server_info': {
            'platform': os.name,
            'python_version': os.sys.version
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)