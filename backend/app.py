from flask import Flask, jsonify, request
from youtube_transcript_api import YouTubeTranscriptApi
from flask_cors import CORS
import re
import os
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
            'transcript_by_id': '/transcript/<video_id> (GET)'
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
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Combine all transcript snippets into complete text
        complete_transcript = " ".join([item['text'] for item in transcript_list])
        
        # Get additional metadata
        transcript_data = {
            'video_id': video_id,
            'transcript': complete_transcript,
            'length': len(complete_transcript),
            'snippet_count': len(transcript_list),
            'language': 'en',  # You can also try to detect this from available transcripts
            'is_generated': None  # This info isn't directly available
        }
        
        return jsonify({
            'success': True,
            'data': transcript_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': f'Failed to fetch transcript: {str(e)}'
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)