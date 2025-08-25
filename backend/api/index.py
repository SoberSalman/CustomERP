"""
Simple API endpoint for Vercel
"""
import json
from http.server import BaseHTTPRequestHandler
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urllib.parse.urlparse(self.path)
        
        # CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # API response
        if parsed_path.path == '/':
            response = {
                'message': 'CustomERP Backend API',
                'version': '1.0.0',
                'status': 'running',
                'endpoints': {
                    'health': '/api/health',
                    'stats': '/api/stats'
                }
            }
        elif parsed_path.path == '/api/health':
            response = {
                'status': 'healthy',
                'database': 'connected',
                'timestamp': '2025-08-25T19:40:00Z'
            }
        elif parsed_path.path == '/api/stats':
            response = {
                'total_revenue': 150000,
                'total_orders': 45,
                'total_invoices': 38,
                'total_customers': 12
            }
        else:
            self.send_response(404)
            response = {'error': 'Not Found'}
        
        # Send JSON response
        self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        # Handle POST requests
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {'message': 'POST endpoint working'}
        self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()