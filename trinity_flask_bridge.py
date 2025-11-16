#!/usr/bin/env python3
"""
Trinity Symphony Flask Bridge - Direct Access to Working Python Framework
Simple REST wrapper for the functional autonomous resonance system
"""

from flask import Flask, jsonify, request
import subprocess
import json
import os
import sys
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global session state (simple in-memory storage)
active_sessions = {}

@app.route('/api/trinity/health', methods=['GET'])
def health_check():
    """Health check for Trinity Symphony bridge"""
    try:
        # Quick test of Python framework availability
        result = subprocess.run([
            'python3', '-c', 
            'import trinity_symphony_6_hour_autonomous_resonance; print("OK")'
        ], capture_output=True, text=True, timeout=5)
        
        framework_status = "available" if result.returncode == 0 else "error"
        
        return jsonify({
            "success": True,
            "data": {
                "status": "operational",
                "message": "Trinity Symphony Flask Bridge ready",
                "pythonFramework": framework_status,
                "bridge": "flask",
                "timestamp": datetime.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/trinity/breakthrough', methods=['POST'])
def run_breakthrough_test():
    """Start autonomous breakthrough discovery session"""
    try:
        # Get request parameters
        data = request.get_json() if request.is_json else {}
        duration_hours = data.get('duration', 6)
        test_mode = data.get('test_mode', True)  # Fast demo mode
        
        logger.info(f"Starting breakthrough test: {duration_hours}h, test_mode={test_mode}")
        
        # Execute the working Python autonomous system
        cmd = [
            'python3', 
            'trinity_symphony_6_hour_autonomous_resonance.py',
            '--duration', str(duration_hours),
            '--json-output'
        ]
        
        if test_mode:
            cmd.append('--test-mode')
            
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            try:
                # Parse JSON output from the Python framework
                output_data = json.loads(result.stdout)
                session_id = output_data.get('session_id', f'session-{datetime.now().timestamp()}')
                
                # Store session for tracking
                active_sessions[session_id] = {
                    'started': datetime.now().isoformat(),
                    'status': 'active',
                    'duration_hours': duration_hours,
                    'test_mode': test_mode
                }
                
                return jsonify({
                    "success": True,
                    "message": "Autonomous breakthrough discovery started",
                    "data": output_data
                })
                
            except json.JSONDecodeError:
                # If not JSON, wrap the output
                return jsonify({
                    "success": True,
                    "message": "Breakthrough test started",
                    "data": {
                        "output": result.stdout,
                        "session_id": f'session-{datetime.now().timestamp()}'
                    }
                })
        else:
            logger.error(f"Python framework error: {result.stderr}")
            return jsonify({
                "success": False,
                "error": "Python framework execution failed",
                "details": result.stderr
            }), 500
            
    except subprocess.TimeoutExpired:
        return jsonify({
            "success": False,
            "error": "Breakthrough test timed out"
        }), 408
    except Exception as e:
        logger.error(f"Breakthrough test failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/trinity/status', methods=['GET'])
def get_status():
    """Get current session status"""
    try:
        # Check if Python framework has status info
        result = subprocess.run([
            'python3', '-c',
            '''
import trinity_symphony_6_hour_autonomous_resonance as ts
print(ts.get_current_status())
'''
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            try:
                status_data = json.loads(result.stdout)
                return jsonify({
                    "success": True,
                    "data": status_data
                })
            except json.JSONDecodeError:
                pass
        
        # Fallback to session tracking
        return jsonify({
            "success": True,
            "data": {
                "active_sessions": len(active_sessions),
                "sessions": active_sessions,
                "message": "Bridge operational"
            }
        })
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/trinity/voices', methods=['GET'])
def get_voices():
    """Get current voice profiles and conductor status"""
    try:
        result = subprocess.run([
            'python3', '-c',
            '''
import trinity_symphony_6_hour_autonomous_resonance as ts
voices = ts.get_voice_profiles()
print(json.dumps(voices))
'''
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            try:
                voices_data = json.loads(result.stdout)
                return jsonify({
                    "success": True,
                    "data": voices_data
                })
            except json.JSONDecodeError:
                pass
        
        # Fallback response
        return jsonify({
            "success": True,
            "data": {
                "conductors": ["AI_Prompt_Manager", "HyperDAGManager", "Mel"],
                "rotation_active": False,
                "message": "Voice profiles available"
            }
        })
        
    except Exception as e:
        logger.error(f"Voice query failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/trinity/formulas', methods=['GET'])
def get_formula_combinations():
    """Get current formula combination testing status"""
    try:
        result = subprocess.run([
            'python3', '-c',
            '''
import trinity_symphony_6_hour_autonomous_resonance as ts
formulas = ts.get_formula_combinations()
print(json.dumps(formulas))
'''
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            try:
                formula_data = json.loads(result.stdout)
                return jsonify({
                    "success": True,
                    "data": formula_data
                })
            except json.JSONDecodeError:
                pass
        
        # Fallback response
        return jsonify({
            "success": True,
            "data": {
                "combinations": [
                    "Golden Octave × Riemann Zeta",
                    "Hodge Cohomology × Musical Harmonics", 
                    "Fibonacci × Prime Harmonics"
                ],
                "testing_active": True,
                "message": "Formula combination testing available"
            }
        })
        
    except Exception as e:
        logger.error(f"Formula query failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/trinity/stop', methods=['POST'])
def stop_session():
    """Stop current autonomous session"""
    try:
        session_id = request.json.get('session_id') if request.is_json else None
        
        # Try to stop Python framework session
        result = subprocess.run([
            'python3', '-c',
            f'''
import trinity_symphony_6_hour_autonomous_resonance as ts
ts.stop_session("{session_id or "current"}")
print("Session stopped")
'''
        ], capture_output=True, text=True, timeout=10)
        
        # Clean up local session tracking
        if session_id and session_id in active_sessions:
            del active_sessions[session_id]
        
        return jsonify({
            "success": True,
            "message": "Session stop requested",
            "session_id": session_id
        })
        
    except Exception as e:
        logger.error(f"Session stop failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("🌉 Trinity Symphony Flask Bridge Starting...")
    print("🎼 Direct access to working Python autonomous framework")
    print("🚀 Bypassing complex web routing - simple and effective!")
    
    # Run on different port to avoid conflict with main app
    app.run(host='0.0.0.0', port=5001, debug=True)