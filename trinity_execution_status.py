#!/usr/bin/env python3
"""
Trinity Symphony Marathon - Real-time Status and Progress Tracker
Shows actual progress through the Infinite Orchestra Challenge
"""

import json
import os
import time
from datetime import datetime

def check_marathon_status():
    """Check current marathon status from log files"""
    
    print("🎭 TRINITY SYMPHONY MARATHON - CURRENT STATUS")
    print("=" * 60)
    
    # Check for log files
    today = datetime.now().strftime('%Y%m%d')
    log_file = f"marathon_log_{today}.json"
    final_report = "trinity_continuous_final_report.json"
    
    if os.path.exists(final_report):
        with open(final_report, 'r') as f:
            report = json.load(f)
        
        print("📊 FINAL REPORT AVAILABLE:")
        print(f"   Duration: {report['marathon_metadata']['duration_hours']:.2f}h")
        print(f"   Trinity: {report['trinity_progression']['baseline']:.3f} → {report['trinity_progression']['final']:.3f}")
        print(f"   Enhancement: +{report['trinity_progression']['enhancement']:.3f}")
        print(f"   Tasks: {report['task_statistics']['total_tasks']}")
        print(f"   Success Rate: {report['task_statistics']['successful_tasks']}/{report['task_statistics']['total_tasks']}")
        print(f"   Cost Saved: ${report['resource_efficiency']['total_cost_saved']:.2f}")
        print(f"   Status: {report['marathon_metadata']['completion_status']}")
        
    elif os.path.exists(log_file):
        with open(log_file, 'r') as f:
            log_data = json.load(f)
        
        entries = log_data.get('entries', [])
        
        if entries:
            latest = entries[-1]
            successful = sum(1 for e in entries if "Success: True" in e.get('claimed_result', ''))
            
            print("📈 MARATHON IN PROGRESS:")
            print(f"   Start Time: {log_data.get('start_time', 'Unknown')}")
            print(f"   Tasks Completed: {len(entries)}")
            print(f"   Success Rate: {successful}/{len(entries)} ({successful/len(entries)*100:.1f}%)")
            print(f"   Latest Task: {latest.get('task_id', 'Unknown')}")
            print(f"   Current Trinity: {latest.get('unity_score', 0.717):.3f}")
            print(f"   Total Cost Saved: ${sum(e.get('cost_saved', 0) for e in entries):.2f}")
            print(f"   Marathon Hour: {latest.get('marathon_hour', 0):.1f}")
            
            print(f"\n📋 RECENT TASKS:")
            for task in entries[-5:]:
                success = "✅" if "Success: True" in task.get('claimed_result', '') else "❌"
                print(f"   {task.get('task_id', 'Unknown')}: {success} (Unity: {task.get('unity_score', 0):.3f})")
        else:
            print("📊 Marathon started but no tasks completed yet")
    else:
        print("📊 No marathon activity detected")
        print(f"   Looking for: {log_file}")
    
    # Check for checkpoint files
    checkpoint_files = [f for f in os.listdir('.') if f.startswith('hourly_checkpoint_')]
    if checkpoint_files:
        latest_checkpoint = sorted(checkpoint_files)[-1]
        print(f"\n📊 Latest Checkpoint: {latest_checkpoint}")
        
        try:
            with open(latest_checkpoint, 'r') as f:
                checkpoint = json.load(f)
            
            print(f"   Hour: {checkpoint.get('hour', 0)}")
            print(f"   Score: {checkpoint.get('current_score', 0)} points")
            print(f"   Unity: {checkpoint.get('unity_score', 0.717):.3f}")
            print(f"   Current Tier: {checkpoint.get('current_tier', 1)}")
            print(f"   Current Task: {checkpoint.get('current_task', 'A')}")
        except:
            print("   (Checkpoint file corrupted)")
    
    print(f"\n⏰ Status checked at: {datetime.now().isoformat()}")

def show_live_progress():
    """Show live progress updates"""
    print("🔄 LIVE PROGRESS MONITORING (Updates every 30 seconds)")
    print("Press Ctrl+C to stop monitoring")
    
    try:
        while True:
            check_marathon_status()
            print("\n" + "="*60)
            print("Updating in 30 seconds...")
            time.sleep(30)
            
            # Clear screen
            os.system('clear' if os.name == 'posix' else 'cls')
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Monitoring stopped")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--live':
        show_live_progress()
    else:
        check_marathon_status()