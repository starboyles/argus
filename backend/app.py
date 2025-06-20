from flask import Flask, jsonify, request
from youtube_transcript_api import YouTubeTranscriptApi
from flask_cors import CORS
import re
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Python backend is running'})

@app.route('/transcript', methods=['POST'])
def get_transcript():
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
        
        # Fetch transcript using the API
        ytt_api = YouTubeTranscriptApi()
        fetched_transcript = ytt_api.fetch(video_id)
        
        # Combine all transcript snippets into complete text
        complete_transcript = " ".join([snippet.text for snippet in fetched_transcript])
        
        # Get additional metadata
        transcript_data = {
            'video_id': video_id,
            'transcript': complete_transcript,
            'length': len(complete_transcript),
            'snippet_count': len(fetched_transcript),
            'language': fetched_transcript.language if hasattr(fetched_transcript, 'language') else 'en',
            'is_generated': fetched_transcript.is_generated if hasattr(fetched_transcript, 'is_generated') else None
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
        ytt_api = YouTubeTranscriptApi()
        fetched_transcript = ytt_api.fetch(video_id)
        complete_transcript = " ".join([snippet.text for snippet in fetched_transcript])
        
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