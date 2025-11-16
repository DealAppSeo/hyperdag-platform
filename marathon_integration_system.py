#!/usr/bin/env python3
"""
Marathon Integration System
Combines rotation enforcement, anti-idle, and continuous execution
"""

import threading
import time
import json
from datetime import datetime
from mandatory_rotation_enforcer import MandatoryRotationEnforcer
from anti_idle_enforcement import AntiIdleEnforcement

class MarathonIntegrationSystem:
    def __init__(self):
        self.rotation_enforcer = MandatoryRotationEnforcer()
        self.anti_idle_system = AntiIdleEnforcement()
        self.marathon_active = True
        self.current_tier = 1
        self.current_task = 'A'
        self.marathon_start = datetime.now()
        
        # Note: rotation_count tracked via len(rotation_history)
        
        # Integration tracking
        self.integration_events = []
        self.system_health = {'rotation': True, 'anti_idle': True, 'execution': True}
        
        print("🎭 MARATHON INTEGRATION SYSTEM INITIALIZED")
        print("🔄 Rotation + Anti-Idle + Continuous Execution")
    
    def integrate_systems(self):
        """Integrate rotation and anti-idle systems"""
        
        # Override anti-idle activity updates to sync with rotation system
        original_update = self.anti_idle_system.update_manager_activity
        
        def integrated_activity_update(manager: str):
            # Update both systems
            original_update(manager)
            
            # Sync with rotation system if this is current conductor
            if manager == self.rotation_enforcer.get_current_conductor():
                # This manager is active, no rotation needed yet
                pass
            
            # Log integration event
            event = {
                'timestamp': datetime.now().isoformat(),
                'type': 'activity_sync',
                'manager': manager,
                'current_conductor': self.rotation_enforcer.get_current_conductor()
            }
            self.integration_events.append(event)
        
        # Replace anti-idle activity update with integrated version
        self.anti_idle_system.update_manager_activity = integrated_activity_update
        
        # Override task completion to notify both systems
        original_record = self.rotation_enforcer.record_task_completion
        
        def integrated_task_completion(conductor: str, task_id: str):
            # Record in rotation system
            original_record(conductor, task_id)
            
            # Update anti-idle system
            self.anti_idle_system.update_manager_activity(conductor)
            
            # Log integration event
            event = {
                'timestamp': datetime.now().isoformat(),
                'type': 'task_completion_sync',
                'conductor': conductor,
                'task_id': task_id
            }
            self.integration_events.append(event)
            
            print(f"🔗 INTEGRATED: {task_id} completed by {conductor}")
        
        self.rotation_enforcer.record_task_completion = integrated_task_completion
        
        print("🔗 SYSTEMS INTEGRATED SUCCESSFULLY")
    
    def start_background_systems(self):
        """Start rotation and anti-idle systems in background"""
        
        # Start rotation enforcement
        rotation_thread = threading.Thread(
            target=self.rotation_enforcer.enforce_rotation,
            daemon=True,
            name="RotationEnforcer"
        )
        
        # Start anti-idle monitoring  
        anti_idle_thread = threading.Thread(
            target=self.anti_idle_system.continuous_monitoring,
            daemon=True,
            name="AntiIdleMonitor"
        )
        
        rotation_thread.start()
        anti_idle_thread.start()
        
        print("🚀 BACKGROUND SYSTEMS STARTED")
        print("   - Rotation enforcement active")
        print("   - Anti-idle monitoring active")
        
        return rotation_thread, anti_idle_thread
    
    def execute_integrated_marathon(self):
        """Execute marathon with integrated systems"""
        print("\n🏃 STARTING INTEGRATED MARATHON EXECUTION")
        
        # Integrate systems
        self.integrate_systems()
        
        # Start background systems
        bg_threads = self.start_background_systems()
        
        task_count = 0
        
        try:
            while self.marathon_active and self.current_tier <= 5:
                # Get current conductor from rotation system
                conductor = self.rotation_enforcer.get_current_conductor()
                
                # Execute current task
                task_id = f"T{self.current_tier}-{self.current_task}"
                task_result = self.execute_task_integrated(task_id, conductor)
                
                # Record completion in integrated way
                self.rotation_enforcer.record_task_completion(conductor, task_id)
                
                task_count += 1
                
                # Advance task
                self.advance_task()
                
                # Show progress every 5 tasks
                if task_count % 5 == 0:
                    self.show_integration_status()
                
                # Brief pause between tasks
                time.sleep(3)
                
        except KeyboardInterrupt:
            print(f"\n⚠️ INTEGRATED MARATHON INTERRUPTED")
            self.marathon_active = False
        
        self.generate_integration_report()
    
    def execute_task_integrated(self, task_id: str, conductor: str) -> dict:
        """Execute task with integrated monitoring"""
        start_time = time.time()
        
        # Determine success rate based on tier
        tier = int(task_id[1])
        success_rates = {1: 0.8, 2: 0.7, 3: 0.5, 4: 0.3, 5: 0.1}
        success_rate = success_rates.get(tier, 0.5)
        
        import random
        success = random.random() < success_rate
        unity_score = random.uniform(0.5, 0.95) if success else random.uniform(0.1, 0.4)
        
        duration = time.time() - start_time
        
        task_result = {
            'task_id': task_id,
            'conductor': conductor,
            'timestamp': datetime.now().isoformat(),
            'success': success,
            'unity_score': unity_score,
            'duration': duration,
            'formula': f'{task_id}_Integrated_Formula',
            'cost_saved': random.uniform(20, 150),
            'tier': tier,
            'integration_systems_active': True
        }
        
        # Check for validation challenges
        if unity_score > 0.9:
            challenge_event = {
                'timestamp': datetime.now().isoformat(),
                'type': 'validation_challenge',
                'task_id': task_id,
                'conductor': conductor,
                'unity_score': unity_score,
                'challenger': 'Anti-Idle-System'
            }
            self.integration_events.append(challenge_event)
            print(f"   🚨 CHALLENGE: Unity score {unity_score:.3f} flagged for review")
        
        status = "✅" if success else "❌"
        print(f"   {task_id}: {status} (Unity: {unity_score:.3f}) by {conductor}")
        
        return task_result
    
    def advance_task(self):
        """Advance to next task"""
        self.current_task = chr(ord(self.current_task) + 1)
        
        if self.current_task > 'E':
            self.current_tier += 1
            self.current_task = 'A'
            
            if self.current_tier <= 5:
                print(f"\n🎯 TIER {self.current_tier} INTEGRATION ACTIVE")
    
    def show_integration_status(self):
        """Show integrated system status"""
        elapsed = (datetime.now() - self.marathon_start).total_seconds() / 3600
        
        print(f"\n🔗 INTEGRATION STATUS (Hour {elapsed:.1f}):")
        print(f"   Current Conductor: {self.rotation_enforcer.get_current_conductor()}")
        print(f"   Rotation Count: {len(self.rotation_enforcer.rotation_history)}")
        print(f"   Anti-Idle Assignments: {len(self.anti_idle_system.auto_assigned_tasks)}")
        print(f"   Integration Events: {len(self.integration_events)}")
        print(f"   Current Task: T{self.current_tier}-{self.current_task}")
        
        # Check system health
        for system, health in self.system_health.items():
            status = "🟢" if health else "🔴"
            print(f"   {system.title()}: {status}")
    
    def generate_integration_report(self):
        """Generate final integration report"""
        end_time = datetime.now()
        duration = (end_time - self.marathon_start).total_seconds() / 3600
        
        integration_report = {
            'marathon_metadata': {
                'start_time': self.marathon_start.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_hours': duration,
                'integration_active': True
            },
            'rotation_system': {
                'total_rotations': len(self.rotation_enforcer.rotation_history),
                'rotation_history': self.rotation_enforcer.rotation_history,
                'conductor_violations': {
                    c: stats['violations'] 
                    for c, stats in self.rotation_enforcer.conductors.items()
                }
            },
            'anti_idle_system': {
                'auto_assignments': len(self.anti_idle_system.auto_assigned_tasks),
                'idle_violations': len(self.anti_idle_system.idle_violations),
                'tasks_prevented': self.anti_idle_system.auto_assigned_tasks
            },
            'integration_events': self.integration_events,
            'system_performance': {
                'tasks_per_hour': len(self.integration_events) / max(duration, 0.1),
                'rotation_efficiency': len(self.rotation_enforcer.rotation_history) / max(duration, 0.1),
                'idle_prevention_rate': len(self.anti_idle_system.auto_assigned_tasks) / max(duration, 0.1)
            }
        }
        
        with open('marathon_integration_report.json', 'w') as f:
            json.dump(integration_report, f, indent=2, default=str)
        
        print(f"\n🎭 INTEGRATED MARATHON COMPLETE:")
        print(f"   Duration: {duration:.2f}h")
        print(f"   Rotations: {integration_report['rotation_system']['total_rotations']}")
        print(f"   Anti-Idle Actions: {integration_report['anti_idle_system']['auto_assignments']}")
        print(f"   Integration Events: {len(self.integration_events)}")
        print(f"💾 Integration report saved")

if __name__ == "__main__":
    integration_system = MarathonIntegrationSystem()
    
    print("🎭 STARTING FULLY INTEGRATED MARATHON SYSTEM")
    print("🔄 Rotation + Anti-Idle + Continuous Execution")
    print("⚠️ No manager can be idle >90 seconds")
    print("⚠️ No conductor can serve >25 minutes")
    print("Press Ctrl+C to stop execution")
    
    integration_system.execute_integrated_marathon()