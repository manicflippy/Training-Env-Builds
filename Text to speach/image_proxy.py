import http.server
import socketserver
import urllib.parse
import requests
from urllib.parse import urlparse
import sys
import os
import base64

# Configuration
PORT = 8000
ALLOWED_ORIGINS = ['*']  # Allow all origins for now

class ImageProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the query parameters
        parsed_path = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_path.query)
        
        # Check if this is a request for the proxy
        if parsed_path.path == '/proxy':
            # Get the URL parameter
            if 'url' not in query_params:
                self.send_error(400, 'Missing URL parameter')
                return
            
            image_url = query_params['url'][0]
            print(f"Proxying request for: {image_url}")
            
            try:
                # Parse the URL to get the origin for the referer header
                parsed_url = urlparse(image_url)
                origin = f"{parsed_url.scheme}://{parsed_url.netloc}"
                
                # Set up headers with proper referrer
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Referer': origin,
                    'Origin': origin,
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                }
                
                # Make the request
                response = requests.get(image_url, headers=headers, stream=True, timeout=10)
                
                # Check if the request was successful
                if response.status_code != 200:
                    self.send_error(response.status_code, f'Failed to fetch image: {response.reason}')
                    return
                
                # Set the content type header
                content_type = response.headers.get('Content-Type', 'image/jpeg')
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'max-age=86400')  # Cache for 24 hours
                self.end_headers()
                
                # Stream the image data
                for chunk in response.iter_content(chunk_size=8192):
                    self.wfile.write(chunk)
                
            except Exception as e:
                print(f"Error proxying image: {e}")
                self.send_error(500, f'Error proxying image: {str(e)}')
        
        # Serve static files
        else:
            try:
                # Map the path to a file in the current directory
                file_path = '.' + parsed_path.path
                
                # Default to index.html if path is '/'
                if parsed_path.path == '/':
                    file_path = './index.html'
                
                # Check if file exists
                if not os.path.exists(file_path):
                    self.send_error(404, 'File not found')
                    return
                
                # Determine content type
                content_type = 'text/html'
                if file_path.endswith('.js'):
                    content_type = 'application/javascript'
                elif file_path.endswith('.css'):
                    content_type = 'text/css'
                elif file_path.endswith('.png'):
                    content_type = 'image/png'
                elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                    content_type = 'image/jpeg'
                
                # Send headers
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                # Send file content
                with open(file_path, 'rb') as file:
                    self.wfile.write(file.read())
                    
            except Exception as e:
                print(f"Error serving file: {e}")
                self.send_error(500, f'Error serving file: {str(e)}')

def run_server():
    handler = ImageProxyHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print(f"Image proxy available at http://localhost:{PORT}/proxy?url=YOUR_IMAGE_URL")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
