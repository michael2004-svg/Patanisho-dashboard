from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import json

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Path to local JSON file for data storage
DATA_FILE = "user_data.json"

# Initialize JSON file if it doesn't exist
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w') as f:
        json.dump({}, f)

# Helper function to read JSON data
def read_user_data():
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

# Serve the frontend
@app.route('/')
def index():
    return render_template('index.html')

# API: Fetch dashboard data for a user (by uid)
@app.route('/api/dashboard/<uid>', methods=['GET'])
def get_dashboard(uid):
    try:
        user_data = read_user_data()
        stats = {
            "total_residents": 57,
            "meals_today": 173,
            "alerts": 8,
            "low_stock_items": 12
        }

        meal_prefs = user_data.get(uid, {}).get('meal_preferences', {}).get('weekly', {
            "vegetarian": 60,
            "vegan": 20,
            "gluten_free": 20
        })

        meals = {
            "breakfast": {
                "name": "Breakfast",
                "time": "08:00",
                "items": ["Pancakes", "Fruit Salad", "Coffee"],
                "stats": {"calories": 500, "protein": 20, "residents": 50}
            },
            "lunch": {
                "name": "Lunch",
                "time": "12:30",
                "items": ["Grilled Chicken", "Steamed Broccoli", "Rice"],
                "stats": {"calories": 700, "protein": 35, "residents": 55}
            }
        }

        alerts = user_data.get(uid, {}).get('alerts', [
            {
                "title": "Low Stock",
                "description": "Running low on rice",
                "time": "2025-05-07T10:00:00Z",
                "type": "amber"
            },
            {
                "title": "Dietary Request",
                "description": "Resident requested gluten-free meal",
                "time": "2025-05-07T09:30:00Z",
                "type": "blue"
            }
        ])

        return jsonify({
            "status": "success",
            "data": {
                "stats": stats,
                "meal_preferences": meal_prefs,
                "meals": meals,
                "alerts": alerts
            }
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

# API: Fetch meal preferences by period
@app.route('/api/meal_preferences/<uid>', methods=['GET'])
def get_meal_preferences(uid):
    try:
        period = request.args.get('period', 'weekly').lower()
        if period not in ['weekly', 'monthly', 'yearly']:
            return jsonify({"status": "error", "message": "Invalid period"}), 400

        user_data = read_user_data()
        meal_prefs = user_data.get(uid, {}).get('meal_preferences', {}).get(period, {
            "vegetarian": 60 if period == 'weekly' else 55,
            "vegan": 20 if period == 'weekly' else 25,
            "gluten_free": 20 if period == 'weekly' else 20
        })

        return jsonify({"status": "success", "data": meal_prefs}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)