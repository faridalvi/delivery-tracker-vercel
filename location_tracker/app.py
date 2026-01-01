from flask import Flask, render_template, request, jsonify, redirect, url_for
import uuid
import json
from datetime import datetime
import os

app = Flask(__name__)

# Store locations in a JSON file
LOCATIONS_FILE = "locations.json"

def load_locations():
    if os.path.exists(LOCATIONS_FILE):
        with open(LOCATIONS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_locations(locations):
    with open(LOCATIONS_FILE, 'w') as f:
        json.dump(locations, f, indent=2)

@app.route('/')
def index():
    """Main dashboard to create tracking links and view results"""
    locations = load_locations()
    return render_template('index.html', locations=locations)

@app.route('/create_link', methods=['POST'])
def create_link():
    """Generate a new tracking link"""
    link_id = str(uuid.uuid4())[:8]
    name = request.form.get('name', 'Unknown')

    locations = load_locations()
    locations[link_id] = {
        'name': name,
        'created': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'status': 'pending',
        'location': None
    }
    save_locations(locations)

    return redirect(url_for('index'))

@app.route('/track/<link_id>')
def track(link_id):
    """Page that requests location permission from the user"""
    locations = load_locations()
    if link_id not in locations:
        return "Invalid tracking link", 404
    return render_template('track.html', link_id=link_id)

@app.route('/save_location', methods=['POST'])
def save_location():
    """Save the location received from the user's browser"""
    data = request.json
    link_id = data.get('link_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    accuracy = data.get('accuracy')

    locations = load_locations()
    if link_id in locations:
        locations[link_id]['status'] = 'received'
        locations[link_id]['location'] = {
            'latitude': latitude,
            'longitude': longitude,
            'accuracy': accuracy,
            'received_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'ip': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', 'Unknown')
        }
        save_locations(locations)
        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Invalid link'}), 400

@app.route('/delete/<link_id>')
def delete_link(link_id):
    """Delete a tracking link"""
    locations = load_locations()
    if link_id in locations:
        del locations[link_id]
        save_locations(locations)
    return redirect(url_for('index'))

if __name__ == '__main__':
    print("[+] Location Tracker Server")
    print("[+] Open http://localhost:5000 in your browser")
    print("[+] Create a tracking link and send it to the person")
    print("[+] When they click and approve, you'll see their location")
    app.run(debug=True, host='0.0.0.0', port=5000)
