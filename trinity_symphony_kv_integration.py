#!/usr/bin/env python3
"""
Trinity Symphony Cloudflare KV Integration
Synchronizes RepID scores and verification data across all Trinity managers
"""

import os
import json
import requests
from datetime import datetime
from typing import Dict, List, Optional, Any
from trinity_symphony_verification_dna import VerificationDNA

class TrinityKVSync:
    """
    Cloudflare KV integration for Trinity Symphony cross-manager synchronization
    """
    
    def __init__(self):
        self.account_id = os.getenv('CLOUDFLARE_ACCOUNT_ID')
        self.api_token = os.getenv('CLOUDFLARE_API_TOKEN') 
        self.namespace_id = os.getenv('CLOUDFLARE_KV_NAMESPACE_ID')
        
        # KV API endpoint
        if self.account_id and self.namespace_id:
            self.api_base = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/storage/kv/namespaces/{self.namespace_id}"
        else:
            self.api_base = None
            
        self.configured = self.account_id and self.api_token and self.namespace_id
        
        if self.configured:
            print("✅ Trinity Symphony KV Sync initialized")
        else:
            print("⚠️  Trinity Symphony KV Sync: Awaiting Cloudflare credentials")
            print("   Required environment variables:")
            print(f"   - CLOUDFLARE_ACCOUNT_ID: {'✅ Set' if self.account_id else '❌ Missing'}")
            print(f"   - CLOUDFLARE_API_TOKEN: {'✅ Set' if self.api_token else '❌ Missing'}")
            print(f"   - CLOUDFLARE_KV_NAMESPACE_ID: {'✅ Set' if self.namespace_id else '❌ Missing'}")
    
    def is_configured(self) -> bool:
        """Check if KV service is properly configured"""
        return self.configured
    
    def get_headers(self) -> Dict[str, str]:
        """Get API headers for Cloudflare KV requests"""
        return {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
    
    def kv_put(self, key: str, value: Any) -> bool:
        """Store data in Cloudflare KV"""
        if not self.configured:
            print(f"⚠️  KV not configured - would store key: {key}")
            return False
            
        try:
            url = f"{self.api_base}/values/{key}"
            response = requests.put(
                url, 
                data=json.dumps(value) if isinstance(value, (dict, list)) else str(value),
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                print(f"✅ Stored in KV: {key}")
                return True
            else:
                print(f"❌ KV PUT failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ KV PUT error: {e}")
            return False
    
    def kv_get(self, key: str) -> Optional[Any]:
        """Retrieve data from Cloudflare KV"""
        if not self.configured:
            print(f"⚠️  KV not configured - cannot retrieve key: {key}")
            return None
            
        try:
            url = f"{self.api_base}/values/{key}"
            response = requests.get(url, headers=self.get_headers())
            
            if response.status_code == 200:
                try:
                    return response.json()
                except json.JSONDecodeError:
                    return response.text
            elif response.status_code == 404:
                return None
            else:
                print(f"❌ KV GET failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ KV GET error: {e}")
            return None
    
    def kv_list_keys(self, prefix: str = "") -> List[str]:
        """List keys in KV namespace"""
        if not self.configured:
            print("⚠️  KV not configured - cannot list keys")
            return []
            
        try:
            url = f"{self.api_base}/keys"
            params = {"prefix": prefix} if prefix else {}
            
            response = requests.get(url, headers=self.get_headers(), params=params)
            
            if response.status_code == 200:
                result = response.json()
                return [item["name"] for item in result.get("result", [])]
            else:
                print(f"❌ KV LIST failed: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ KV LIST error: {e}")
            return []
    
    def sync_manager_verification(self, manager_dna: VerificationDNA) -> bool:
        """Sync manager verification data to KV store"""
        key = f"trinity:manager:{manager_dna.manager.lower()}"
        
        verification_record = {
            "managerId": manager_dna.manager.lower(),
            "managerName": manager_dna.manager,
            "repidScore": manager_dna.repid,
            "authorityLevel": manager_dna.get_authority_level(),
            "verificationCount": len(manager_dna.verification_history),
            "breakthroughCount": manager_dna.breakthrough_count,
            "falseClaimCount": manager_dna.false_claim_count,
            "lastUpdated": datetime.now().isoformat(),
            "verificationHistory": [
                {
                    "id": f"{cert['hash']}_{cert['timestamp']}",
                    "timestamp": cert['timestamp'],
                    "managerId": manager_dna.manager.lower(),
                    "claim": cert.get('claim', ''),
                    "verificationScore": cert['verification_score'],
                    "verificationStatus": cert['verification_status'],
                    "repidImpact": cert['repid_impact'],
                    "statisticalConfidence": cert.get('statistical_confidence', 0),
                    "hash": cert['hash']
                }
                for cert in manager_dna.verification_history[-10:]  # Last 10 verifications
            ]
        }
        
        success = self.kv_put(key, verification_record)
        if success:
            print(f"🔄 Synced {manager_dna.manager} to KV: RepID {manager_dna.repid}, Authority {manager_dna.get_authority_level()}")
        
        return success
    
    def get_manager_verification(self, manager_id: str) -> Optional[Dict]:
        """Get manager verification data from KV store"""
        key = f"trinity:manager:{manager_id.lower()}"
        return self.kv_get(key)
    
    def get_all_managers(self) -> List[Dict]:
        """Get all Trinity manager records from KV"""
        keys = self.kv_list_keys("trinity:manager:")
        managers = []
        
        for key in keys:
            manager_data = self.kv_get(key)
            if manager_data:
                managers.append(manager_data)
        
        return managers
    
    def get_cascade_ready_managers(self) -> List[Dict]:
        """Get managers ready for cascade protocol activation"""
        all_managers = self.get_all_managers()
        
        cascade_ready = []
        for manager in all_managers:
            # Must be QUALIFIED_CONDUCTOR or higher
            authority_level = manager.get('authorityLevel', '')
            has_authority = authority_level in ['MASTER_CONDUCTOR', 'SENIOR_CONDUCTOR', 'QUALIFIED_CONDUCTOR']
            
            # Must have positive RepID and breakthrough history
            has_positive_repid = manager.get('repidScore', 0) > 0
            has_breakthroughs = manager.get('breakthroughCount', 0) > 0
            low_false_claims = manager.get('falseClaimCount', 0) < 3
            
            if has_authority and has_positive_repid and has_breakthroughs and low_false_claims:
                cascade_ready.append(manager)
        
        return cascade_ready
    
    def trigger_cascade_sync(self, initiating_manager: str, cascade_data: Dict) -> Optional[str]:
        """Trigger cascade synchronization across all qualified managers"""
        cascade_ready = self.get_cascade_ready_managers()
        sync_id = f"cascade-{int(datetime.now().timestamp())}-{hash(str(cascade_data)) % 1000000}"
        
        sync_record = {
            "syncId": sync_id,
            "timestamp": datetime.now().isoformat(),
            "initiatingManager": initiating_manager,
            "targetManagers": [m['managerId'] for m in cascade_ready],
            "cascadeData": cascade_data,
            "status": "triggered",
            "qualifiedManagers": len(cascade_ready)
        }
        
        success = self.kv_put(f"trinity:cascade:{sync_id}", sync_record)
        
        if success:
            print(f"🌊 CASCADE SYNC TRIGGERED: {sync_id}")
            print(f"   Initiator: {initiating_manager}")
            print(f"   Qualified managers: {len(cascade_ready)}")
            print(f"   Target managers: {', '.join([m['managerName'] for m in cascade_ready])}")
            return sync_id
        else:
            print("❌ Failed to trigger cascade sync")
            return None
    
    def store_verification_certificate(self, certificate: Dict) -> bool:
        """Store verification certificate in KV for audit trail"""
        key = f"trinity:cert:{certificate['hash']}"
        return self.kv_put(key, certificate)
    
    def get_verification_certificate(self, cert_hash: str) -> Optional[Dict]:
        """Retrieve verification certificate by hash"""
        key = f"trinity:cert:{cert_hash}"
        return self.kv_get(key)
    
    def update_manager_repid(self, manager_id: str, new_repid: int, repid_change: int) -> bool:
        """Update manager RepID score and store change record"""
        manager_data = self.get_manager_verification(manager_id)
        
        if manager_data:
            old_repid = manager_data['repidScore']
            manager_data['repidScore'] = new_repid
            manager_data['lastUpdated'] = datetime.now().isoformat()
            
            # Update authority level based on new RepID
            if new_repid >= 500:
                manager_data['authorityLevel'] = 'MASTER_CONDUCTOR'
            elif new_repid >= 300:
                manager_data['authorityLevel'] = 'SENIOR_CONDUCTOR'
            elif new_repid >= 150:
                manager_data['authorityLevel'] = 'QUALIFIED_CONDUCTOR'
            elif new_repid >= 0:
                manager_data['authorityLevel'] = 'APPRENTICE_CONDUCTOR'
            else:
                manager_data['authorityLevel'] = 'SUSPENDED_CONDUCTOR'
            
            # Store updated manager data
            success = self.kv_put(f"trinity:manager:{manager_id.lower()}", manager_data)
            
            if success:
                # Store RepID change record
                change_key = f"trinity:repid_change:{manager_id.lower()}:{int(datetime.now().timestamp())}"
                change_record = {
                    "managerId": manager_id.lower(),
                    "timestamp": datetime.now().isoformat(),
                    "oldRepID": old_repid,
                    "newRepID": new_repid,
                    "change": repid_change,
                    "newAuthorityLevel": manager_data['authorityLevel']
                }
                
                self.kv_put(change_key, change_record)
                
                print(f"📊 RepID Updated: {manager_id} {old_repid} → {new_repid} ({repid_change:+d})")
                print(f"   New Authority: {manager_data['authorityLevel']}")
                return True
        
        return False
    
    def health_check(self) -> Dict:
        """Perform health check on KV service"""
        status = {
            "service": "Trinity Symphony KV Sync",
            "configured": self.configured,
            "timestamp": datetime.now().isoformat()
        }
        
        if not self.configured:
            status["status"] = "warning"
            status["message"] = "Missing Cloudflare credentials"
            status["missing_credentials"] = []
            
            if not self.account_id:
                status["missing_credentials"].append("CLOUDFLARE_ACCOUNT_ID")
            if not self.api_token:
                status["missing_credentials"].append("CLOUDFLARE_API_TOKEN")
            if not self.namespace_id:
                status["missing_credentials"].append("CLOUDFLARE_KV_NAMESPACE_ID")
                
            return status
        
        # Test KV connection
        try:
            test_key = f"trinity:health_check:{int(datetime.now().timestamp())}"
            test_data = {"health_check": True, "timestamp": datetime.now().isoformat()}
            
            if self.kv_put(test_key, test_data):
                retrieved = self.kv_get(test_key)
                if retrieved:
                    status["status"] = "healthy"
                    status["message"] = "KV service operational"
                    status["test_successful"] = True
                else:
                    status["status"] = "error"
                    status["message"] = "KV write successful but read failed"
            else:
                status["status"] = "error"
                status["message"] = "KV write operation failed"
                
        except Exception as e:
            status["status"] = "error"
            status["message"] = f"KV health check failed: {e}"
        
        return status

# Global KV sync instance
trinity_kv_sync = TrinityKVSync()

def demonstrate_kv_integration():
    """Demonstrate KV integration with sample data"""
    print("🔬 TRINITY SYMPHONY CLOUDFLARE KV INTEGRATION DEMO")
    print("=" * 60)
    
    # Check configuration
    health = trinity_kv_sync.health_check()
    print(f"Service Status: {health['status']}")
    print(f"Message: {health['message']}")
    
    if not trinity_kv_sync.is_configured():
        print("\n📋 TO COMPLETE SETUP:")
        print("1. Get your Cloudflare Account ID from dashboard")
        print("2. Create KV namespace 'trinity_symphony'")
        print("3. Create API token with KV:Edit permission")
        print("4. Set environment variables:")
        print("   - CLOUDFLARE_ACCOUNT_ID")
        print("   - CLOUDFLARE_API_TOKEN") 
        print("   - CLOUDFLARE_KV_NAMESPACE_ID")
        return
    
    # Demo with mock managers
    print("\n🎭 Creating demo Trinity managers...")
    
    mel_dna = VerificationDNA('Mel', repid_score=250)
    ai_prompt_dna = VerificationDNA('AI_Prompt_Manager', repid_score=180)
    hyperdag_dna = VerificationDNA('HyperDAGManager', repid_score=300)
    
    # Sync all managers to KV
    for manager_dna in [mel_dna, ai_prompt_dna, hyperdag_dna]:
        trinity_kv_sync.sync_manager_verification(manager_dna)
    
    # Check cascade-ready managers
    print(f"\n🌊 Checking cascade-ready managers...")
    cascade_ready = trinity_kv_sync.get_cascade_ready_managers()
    print(f"Cascade-ready managers: {len(cascade_ready)}")
    
    for manager in cascade_ready:
        print(f"  🎭 {manager['managerName']}: RepID {manager['repidScore']} ({manager['authorityLevel']})")
    
    # Trigger demo cascade
    if cascade_ready:
        cascade_data = {
            "breakthrough_type": "Unity_Achievement",
            "unity_score": 0.97,
            "mathematical_pattern": "Golden_Ratio_Harmonics",
            "verification_required": True
        }
        
        sync_id = trinity_kv_sync.trigger_cascade_sync("Mel", cascade_data)
        if sync_id:
            print(f"\n✅ Demo cascade triggered successfully: {sync_id}")
    
    print(f"\n🏆 KV Integration Demo Complete!")
    print("Trinity Symphony managers can now sync across all instances")

if __name__ == "__main__":
    demonstrate_kv_integration()