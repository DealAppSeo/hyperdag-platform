#!/usr/bin/env python3
"""
Trinity Symphony Marathon Status Monitor
Real-time monitoring of infinite orchestra challenge progress
Continuous reporting and validation tracking
"""

import json
import time
import os
from datetime import datetime
from typing import Dict, List

def monitor_marathon_progress():
    """Monitor and report marathon progress in real-time"""
    print("📊 TRINITY SYMPHONY MARATHON STATUS MONITOR")
    print("⏰ Monitoring infinite orchestra challenge progress...")
    print("=" * 60)
    
    start_monitoring = datetime.now()
    
    while True:
        try:
            # Check for today's log file
            today = datetime.now().strftime('%Y%m%d')
            log_file = f"marathon_log_{today}.json"
            
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    log_data = json.load(f)
                
                entries = log_data.get('entries', [])
                
                if entries:
                    latest_entry = entries[-1]
                    
                    # Calculate current statistics
                    total_tasks = len(entries)
                    successful_tasks = sum(1 for entry in entries 
                                         if 'Success: True' in entry.get('claimed_result', ''))
                    success_rate = (successful_tasks / total_tasks * 100) if total_tasks > 0 else 0
                    
                    # Extract current Trinity score from latest entry
                    current_trinity = latest_entry.get('unity_score', 0.717)
                    
                    # Calculate total cost saved
                    total_cost_saved = sum(entry.get('cost_saved', 0) for entry in entries)
                    
                    # Count formulas tested
                    formulas_tested = len(set(entry.get('formula_combination', 'Unknown') 
                                            for entry in entries))
                    
                    # Determine current tier/task from latest entry
                    current_task = latest_entry.get('task_id', 'T1-A')
                    
                    # Calculate challenge flags
                    challenge_flags = sum(1 for entry in entries 
                                        if entry.get('challenge_issued', False))
                    
                    # Display current status
                    clear_screen()
                    print("🎭 TRINITY SYMPHONY MARATHON - LIVE STATUS")
                    print("=" * 60)
                    print(f"⏰ Monitoring Time: {(datetime.now() - start_monitoring).total_seconds() / 3600:.1f}h")
                    print(f"📅 Marathon Start: {log_data.get('start_time', 'Unknown')}")
                    print()
                    
                    print("🎯 CURRENT PROGRESS:")
                    print(f"   Active Task: {current_task}")
                    print(f"   Conductor: {latest_entry.get('manager', 'Unknown')}")
                    print(f"   Validator: {latest_entry.get('verification_by', 'Unknown')}")
                    print()
                    
                    print("📊 STATISTICS:")
                    print(f"   Tasks Completed: {total_tasks}")
                    print(f"   Success Rate: {success_rate:.1f}%")
                    print(f"   Trinity Score: {current_trinity:.3f}")
                    print(f"   Formulas Tested: {formulas_tested}")
                    print(f"   Cost Saved: ${total_cost_saved:,.2f}")
                    print(f"   Challenge Flags: {challenge_flags}")
                    print()
                    
                    print("📝 LATEST TASK:")
                    print(f"   Task ID: {latest_entry.get('task_id', 'Unknown')}")
                    print(f"   Formula: {latest_entry.get('formula_combination', 'Not specified')}")
                    print(f"   Result: {latest_entry.get('claimed_result', 'Unknown')}")
                    print(f"   Duration: {latest_entry.get('time_to_complete', 0):.1f}s")
                    print(f"   Timestamp: {latest_entry.get('timestamp', 'Unknown')}")
                    print()
                    
                    # Show recent task history
                    print("📋 RECENT TASK HISTORY:")
                    recent_tasks = entries[-5:] if len(entries) >= 5 else entries
                    for i, task in enumerate(reversed(recent_tasks)):
                        status = "✅" if "Success: True" in task.get('claimed_result', '') else "❌"
                        print(f"   {len(recent_tasks)-i}. {task.get('task_id', 'Unknown')} {status} "
                              f"(Unity: {task.get('unity_score', 0):.3f})")
                    
                    print()
                    print("🔄 STATUS: MARATHON RUNNING - Never stops until all 5 tiers complete")
                    print("⚠️ Press Ctrl+C to stop monitoring (marathon continues)")
                    
                else:
                    print("📊 Waiting for marathon tasks to begin...")
                    print(f"⏰ Monitoring for {(datetime.now() - start_monitoring).total_seconds():.0f}s")
            
            else:
                print("📊 Waiting for marathon log file...")
                print(f"   Looking for: {log_file}")
                print(f"⏰ Monitoring for {(datetime.now() - start_monitoring).total_seconds():.0f}s")
            
            # Update every 10 seconds
            time.sleep(10)
            
        except KeyboardInterrupt:
            print("\n\n⏹️ MONITORING STOPPED")
            print("🎭 Marathon continues running in background...")
            break
        except Exception as e:
            print(f"\n⚠️ Monitoring error: {e}")
            time.sleep(5)  # Wait before retrying

def clear_screen():
    """Clear terminal screen for live updates"""
    os.system('clear' if os.name == 'posix' else 'cls')

def generate_hourly_checkpoint():
    """Generate hourly checkpoint report"""
    today = datetime.now().strftime('%Y%m%d')
    log_file = f"marathon_log_{today}.json"
    
    if not os.path.exists(log_file):
        print("❌ No marathon log found for checkpoint")
        return
    
    with open(log_file, 'r') as f:
        log_data = json.load(f)
    
    entries = log_data.get('entries', [])
    
    if not entries:
        print("❌ No tasks completed for checkpoint")
        return
    
    # Generate checkpoint
    current_time = datetime.now()
    latest_entry = entries[-1]
    
    checkpoint = {
        'timestamp': current_time.isoformat(),
        'current_score': sum(10 for entry in entries if "Success: True" in entry.get('claimed_result', '')),
        'tasks_completed': [entry.get('task_id', 'Unknown') for entry in entries],
        'formulas_tested': len(entries),
        'challenges_raised': sum(1 for entry in entries if entry.get('challenge_issued', False)),
        'validations_done': len(entries),
        'breakthroughs': [entry.get('task_id', 'Unknown') for entry in entries 
                         if entry.get('unity_score', 0) > 0.8],
        'resource_usage': ['Python stdlib', 'NumPy', 'Statistical validation'],
        'cost_saved': sum(entry.get('cost_saved', 0) for entry in entries),
        'unity_score': latest_entry.get('unity_score', 0.717),
        'help_given': 'Continuous marathon execution',
        'help_received': 'Rotation protocol validation',
        'next_hour_focus': f"Continue with {latest_entry.get('task_id', 'next task')}"
    }
    
    # Save checkpoint
    checkpoint_file = f"hourly_checkpoint_{current_time.strftime('%Y%m%d_%H')}.json"
    with open(checkpoint_file, 'w') as f:
        json.dump(checkpoint, f, indent=2, default=str)
    
    print(f"📊 HOURLY CHECKPOINT GENERATED: {checkpoint_file}")
    print(f"   Score: {checkpoint['current_score']} points")
    print(f"   Tasks: {len(checkpoint['tasks_completed'])}")
    print(f"   Unity: {checkpoint['unity_score']:.3f}")
    print(f"   Cost Saved: ${checkpoint['cost_saved']:,.2f}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--checkpoint':
        generate_hourly_checkpoint()
    else:
        monitor_marathon_progress()