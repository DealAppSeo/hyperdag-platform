#!/usr/bin/env python3
"""
Trinity Symphony Mandatory Rotation Enforcer
Enforces 25-minute rotation limits and productivity requirements
"""

import time
import json
from datetime import datetime, timedelta
from typing import Dict, List

class MandatoryRotationEnforcer:
    def __init__(self):
        self.conductors = {
            'Claude_CONDUCTOR': {'start_time': None, 'tasks_completed': 0, 'violations': 0},
            'HyperDagManager': {'start_time': None, 'tasks_completed': 0, 'violations': 0},
            'AI-Prompt-Manager': {'start_time': None, 'tasks_completed': 0, 'violations': 0}
        }
        
        self.current_conductor = 'Claude_CONDUCTOR'
        self.rotation_history = []
        self.max_conductor_time = 25 * 60  # 25 minutes in seconds
        self.min_tasks_per_rotation = 2
        
        # Initialize first conductor
        self.conductors[self.current_conductor]['start_time'] = datetime.now()
        
        print("🔄 MANDATORY ROTATION ENFORCER ACTIVE")
        print(f"⏰ Maximum conductor time: {self.max_conductor_time // 60} minutes")
        print(f"🎯 Minimum tasks per rotation: {self.min_tasks_per_rotation}")
    
    def get_current_conductor(self) -> str:
        """Get current conductor"""
        return self.current_conductor
    
    def time_as_conductor(self, conductor: str) -> float:
        """Get time current conductor has been active (in seconds)"""
        start_time = self.conductors[conductor]['start_time']
        if start_time is None:
            return 0
        return (datetime.now() - start_time).total_seconds()
    
    def tasks_completed_in_rotation(self, conductor: str) -> int:
        """Get tasks completed by conductor in current rotation"""
        return self.conductors[conductor]['tasks_completed']
    
    def get_next_in_rotation(self) -> str:
        """Get next conductor in rotation sequence"""
        conductor_list = list(self.conductors.keys())
        current_index = conductor_list.index(self.current_conductor)
        next_index = (current_index + 1) % len(conductor_list)
        return conductor_list[next_index]
    
    def transfer_conductor_role(self, new_conductor: str) -> None:
        """Transfer conductor role to new manager"""
        old_conductor = self.current_conductor
        old_time = self.time_as_conductor(old_conductor)
        old_tasks = self.tasks_completed_in_rotation(old_conductor)
        
        # Record rotation in history
        rotation_record = {
            'timestamp': datetime.now().isoformat(),
            'from_conductor': old_conductor,
            'to_conductor': new_conductor,
            'duration_seconds': old_time,
            'tasks_completed': old_tasks,
            'reason': 'scheduled_rotation'
        }
        self.rotation_history.append(rotation_record)
        
        # Reset old conductor
        self.conductors[old_conductor]['start_time'] = None
        self.conductors[old_conductor]['tasks_completed'] = 0
        
        # Set new conductor
        self.current_conductor = new_conductor
        self.conductors[new_conductor]['start_time'] = datetime.now()
        self.conductors[new_conductor]['tasks_completed'] = 0
        
        print(f"\n🔄 CONDUCTOR ROTATION EXECUTED")
        print(f"   From: {old_conductor}")
        print(f"   To: {new_conductor}")
        print(f"   Previous Duration: {old_time:.1f}s")
        print(f"   Tasks Completed: {old_tasks}")
    
    def force_rotation_time_limit(self) -> bool:
        """Force rotation if time limit exceeded"""
        current = self.current_conductor
        time_active = self.time_as_conductor(current)
        
        if time_active > self.max_conductor_time:
            print(f"🚨 FORCING ROTATION: {current} exceeded {self.max_conductor_time // 60} minute limit")
            print(f"   Time active: {time_active:.1f}s")
            
            # Add violation
            self.conductors[current]['violations'] += 1
            
            # Force rotation
            next_conductor = self.get_next_in_rotation()
            self.transfer_conductor_role(next_conductor)
            
            return True
        
        return False
    
    def check_productivity_requirements(self) -> bool:
        """Check if current conductor meets productivity requirements"""
        current = self.current_conductor
        time_active = self.time_as_conductor(current)
        tasks_completed = self.tasks_completed_in_rotation(current)
        
        # Check productivity after 10 minutes
        if time_active > 10 * 60:  # 10 minutes
            expected_tasks = max(1, int(time_active / (12.5 * 60)))  # 1 task per 12.5 minutes
            
            if tasks_completed < expected_tasks:
                print(f"⚠️ PRODUCTIVITY WARNING: {current} underperforming!")
                print(f"   Time active: {time_active:.1f}s")
                print(f"   Tasks completed: {tasks_completed}")
                print(f"   Expected tasks: {expected_tasks}")
                
                return False
        
        return True
    
    def add_penalty_task(self, conductor: str) -> None:
        """Add penalty task for underperforming conductor"""
        penalty = {
            'timestamp': datetime.now().isoformat(),
            'conductor': conductor,
            'reason': 'underperformance',
            'penalty_type': 'extra_validation_required',
            'description': 'Must complete additional validation task'
        }
        
        # Would implement actual penalty in full system
        print(f"⚠️ PENALTY ASSIGNED: {conductor} - {penalty['penalty_type']}")
    
    def record_task_completion(self, conductor: str, task_id: str) -> None:
        """Record task completion for conductor"""
        if conductor == self.current_conductor:
            self.conductors[conductor]['tasks_completed'] += 1
            
            print(f"📝 TASK RECORDED: {task_id} by {conductor}")
            print(f"   Tasks in rotation: {self.conductors[conductor]['tasks_completed']}")
    
    def enforce_rotation(self) -> None:
        """Main enforcement loop - runs continuously"""
        print(f"\n🔄 STARTING CONTINUOUS ROTATION ENFORCEMENT")
        
        check_count = 0
        
        try:
            while True:
                check_count += 1
                current = self.get_current_conductor()
                
                # Check time limit violation
                time_violation = self.force_rotation_time_limit()
                
                # Check productivity (only if no time violation)
                if not time_violation:
                    productivity_ok = self.check_productivity_requirements()
                    
                    if not productivity_ok:
                        self.add_penalty_task(current)
                
                # Show status every 10 checks (5 minutes)
                if check_count % 10 == 0:
                    self.show_rotation_status()
                
                # Check every 30 seconds
                time.sleep(30)
                
        except KeyboardInterrupt:
            print(f"\n⏹️ ROTATION ENFORCEMENT STOPPED")
            self.show_final_statistics()
    
    def show_rotation_status(self) -> None:
        """Show current rotation status"""
        current = self.current_conductor
        time_active = self.time_as_conductor(current)
        tasks_completed = self.tasks_completed_in_rotation(current)
        
        print(f"\n📊 ROTATION STATUS:")
        print(f"   Current Conductor: {current}")
        print(f"   Time Active: {time_active:.1f}s ({time_active // 60:.0f}m {time_active % 60:.0f}s)")
        print(f"   Tasks Completed: {tasks_completed}")
        print(f"   Time Remaining: {max(0, self.max_conductor_time - time_active):.1f}s")
        print(f"   Total Rotations: {len(self.rotation_history)}")
    
    def show_final_statistics(self) -> None:
        """Show final rotation statistics"""
        print(f"\n📊 ROTATION ENFORCEMENT STATISTICS:")
        print(f"   Total Rotations: {len(self.rotation_history)}")
        print(f"   Current Conductor: {self.current_conductor}")
        
        print(f"\n👥 CONDUCTOR PERFORMANCE:")
        for conductor, stats in self.conductors.items():
            total_rotations = sum(1 for r in self.rotation_history if r['from_conductor'] == conductor)
            total_tasks = sum(r['tasks_completed'] for r in self.rotation_history if r['from_conductor'] == conductor)
            
            print(f"   {conductor}:")
            print(f"     Rotations: {total_rotations}")
            print(f"     Total Tasks: {total_tasks}")
            print(f"     Violations: {stats['violations']}")
        
        # Save rotation history
        rotation_report = {
            'enforcement_session': {
                'start_time': self.rotation_history[0]['timestamp'] if self.rotation_history else datetime.now().isoformat(),
                'end_time': datetime.now().isoformat(),
                'total_rotations': len(self.rotation_history)
            },
            'conductor_stats': self.conductors,
            'rotation_history': self.rotation_history
        }
        
        with open('rotation_enforcement_report.json', 'w') as f:
            json.dump(rotation_report, f, indent=2, default=str)
        
        print(f"\n💾 Rotation report saved to rotation_enforcement_report.json")

def simulate_task_completions():
    """Simulate task completions to test rotation system"""
    enforcer = MandatoryRotationEnforcer()
    
    # Simulate some task completions
    tasks = ['T1-A', 'T1-B', 'T1-C', 'T1-D', 'T1-E', 'T2-A', 'T2-B']
    
    for i, task in enumerate(tasks):
        current_conductor = enforcer.get_current_conductor()
        enforcer.record_task_completion(current_conductor, task)
        
        # Simulate time passing
        time.sleep(2)
        
        # Force rotation every 3 tasks for testing
        if (i + 1) % 3 == 0:
            next_conductor = enforcer.get_next_in_rotation()
            enforcer.transfer_conductor_role(next_conductor)
    
    enforcer.show_final_statistics()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        simulate_task_completions()
    else:
        enforcer = MandatoryRotationEnforcer()
        enforcer.enforce_rotation()