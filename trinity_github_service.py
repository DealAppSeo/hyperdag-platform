#!/usr/bin/env python3
"""
Trinity Symphony GitHub Service - Real-Time Collaboration Platform
Enables all AI managers to read/write files and coordinate in real-time
"""

import os
import json
import asyncio
import base64
from datetime import datetime
from typing import Dict, List, Optional, Any
# import aiohttp  # Not needed for sync version
import requests

class TrinityGitHubService:
    """Unified GitHub service for all Trinity Symphony managers"""
    
    def __init__(self):
        self.token = os.getenv('GITHUB_TOKEN')
        self.repo_owner = 'DealAppSeo'
        self.repo_name = 'trinity-symphony-framework'
        self.repo_full = f'{self.repo_owner}/{self.repo_name}'
        self.base_url = 'https://api.github.com'
        self.headers = {
            'Authorization': f'token {self.token}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
        
    def test_access(self) -> Dict[str, Any]:
        """Test GitHub access and permissions"""
        try:
            # Test user access
            user_response = requests.get(f'{self.base_url}/user', headers=self.headers)
            user_data = user_response.json() if user_response.status_code == 200 else None
            
            # Test repo access
            repo_response = requests.get(f'{self.base_url}/repos/{self.repo_full}', headers=self.headers)
            repo_data = repo_response.json() if repo_response.status_code == 200 else None
            
            return {
                'user_access': user_response.status_code == 200,
                'repo_access': repo_response.status_code == 200,
                'user_data': user_data,
                'repo_data': repo_data,
                'permissions': repo_data.get('permissions') if repo_data else None
            }
            
        except Exception as e:
            return {'error': str(e), 'user_access': False, 'repo_access': False}
    
    def read_file(self, file_path: str, branch: str = 'main') -> Dict[str, Any]:
        """Read file content from GitHub repository"""
        try:
            url = f'{self.base_url}/repos/{self.repo_full}/contents/{file_path}'
            params = {'ref': branch}
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 200:
                file_data = response.json()
                content = base64.b64decode(file_data['content']).decode('utf-8')
                return {
                    'success': True,
                    'content': content,
                    'sha': file_data['sha'],
                    'size': file_data['size'],
                    'path': file_data['path']
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}: {response.text}',
                    'status_code': response.status_code
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def write_file(self, file_path: str, content: str, commit_message: str, 
                   branch: str = 'main', manager_name: str = 'Trinity-Manager') -> Dict[str, Any]:
        """Write or update file in GitHub repository"""
        try:
            # First, try to get existing file to get SHA (required for updates)
            existing = self.read_file(file_path, branch)
            
            # Prepare content
            encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
            
            # Prepare commit data
            commit_data = {
                'message': f'[{manager_name}] {commit_message}',
                'content': encoded_content,
                'branch': branch
            }
            
            # If file exists, include SHA for update
            if existing.get('success'):
                commit_data['sha'] = existing['sha']
            
            # Make the API call
            url = f'{self.base_url}/repos/{self.repo_full}/contents/{file_path}'
            response = requests.put(url, headers=self.headers, json=commit_data)
            
            if response.status_code in [200, 201]:
                result = response.json()
                return {
                    'success': True,
                    'commit_sha': result['commit']['sha'],
                    'file_sha': result['content']['sha'],
                    'html_url': result['content']['html_url'],
                    'action': 'updated' if existing.get('success') else 'created'
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}: {response.text}',
                    'status_code': response.status_code
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def list_files(self, directory: str = '', branch: str = 'main') -> Dict[str, Any]:
        """List files in repository directory"""
        try:
            url = f'{self.base_url}/repos/{self.repo_full}/contents/{directory}'
            params = {'ref': branch}
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 200:
                files = response.json()
                return {
                    'success': True,
                    'files': [{'name': f['name'], 'type': f['type'], 'path': f['path']} 
                             for f in files]
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}: {response.text}'
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_issue(self, title: str, body: str, labels: List[str] = None) -> Dict[str, Any]:
        """Create issue for manager-to-manager communication"""
        try:
            issue_data = {
                'title': title,
                'body': body,
                'labels': labels or []
            }
            
            url = f'{self.base_url}/repos/{self.repo_full}/issues'
            response = requests.post(url, headers=self.headers, json=issue_data)
            
            if response.status_code == 201:
                issue = response.json()
                return {
                    'success': True,
                    'issue_number': issue['number'],
                    'html_url': issue['html_url']
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP {response.status_code}: {response.text}'
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def send_manager_message(self, from_manager: str, to_manager: str, 
                           message: str, discovery_type: str = 'insight') -> Dict[str, Any]:
        """Send message between Trinity Symphony managers via GitHub"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Create issue for communication
        title = f'[{discovery_type.upper()}] {from_manager} → {to_manager}'
        body = f"""**From**: {from_manager}
**To**: {to_manager}
**Time**: {timestamp}
**Type**: {discovery_type}

---

{message}

---
*Trinity Symphony Manager Communication System*
"""
        
        labels = ['trinity-symphony', f'from-{from_manager.lower()}', discovery_type]
        return self.create_issue(title, body, labels)
    
    def deploy_trinity_workspace(self) -> Dict[str, Any]:
        """Deploy Trinity Symphony collaborative workspace"""
        workspace_files = {
            'trinity_managers/shared_discoveries.md': self._generate_shared_discoveries_template(),
            'trinity_managers/ai_prompt_manager_notes.md': self._generate_manager_template('AI-Prompt-Manager'),
            'trinity_managers/hyperdagmanager_notes.md': self._generate_manager_template('HyperDAGManager'),
            'trinity_managers/mel_notes.md': self._generate_manager_template('Mel'),
            'trinity_managers/coordination_log.md': self._generate_coordination_log_template(),
            'millennium_problems/riemann_hypothesis.md': self._generate_problem_template('Riemann Hypothesis'),
            'millennium_problems/yang_mills.md': self._generate_problem_template('Yang-Mills Theory'),
            'millennium_problems/navier_stokes.md': self._generate_problem_template('Navier-Stokes'),
            'millennium_problems/p_vs_np.md': self._generate_problem_template('P vs NP'),
            'millennium_problems/hodge_conjecture.md': self._generate_problem_template('Hodge Conjecture'),
            'millennium_problems/bsd_conjecture.md': self._generate_problem_template('BSD Conjecture'),
            'README.md': self._generate_readme()
        }
        
        results = {}
        for file_path, content in workspace_files.items():
            result = self.write_file(
                file_path, 
                content, 
                f'Deploy Trinity Symphony workspace: {file_path}',
                manager_name='Trinity-System'
            )
            results[file_path] = result['success']
        
        return {
            'workspace_deployed': all(results.values()),
            'files_created': sum(results.values()),
            'total_files': len(workspace_files),
            'details': results
        }
    
    def _generate_shared_discoveries_template(self) -> str:
        return """# Trinity Symphony - Shared Discoveries

## Mathematical Insights

### Latest Discoveries
*Most recent insights from all Trinity Symphony managers*

### Golden Ratio Applications
*φ = 1.618... applications across Millennium Problems*

### Musical Mathematics
*Harmonic principles applied to mathematical structures*

### Breakthrough Moments
*Documented moments of mathematical insight*

---
*This file is automatically updated by all Trinity Symphony managers*
"""
    
    def _generate_manager_template(self, manager_name: str) -> str:
        return f"""# {manager_name} - Trinity Symphony Notes

## Current Focus Areas

## Recent Discoveries

## Mathematical Insights

## Collaboration Notes

## Next Actions

---
*Updated by {manager_name} | Trinity Symphony Framework*
"""
    
    def _generate_coordination_log_template(self) -> str:
        return """# Trinity Symphony - Coordination Log

## Real-Time Manager Communication

## Learning Cycles

## Discovery Sharing Events

## Cross-Manager Insights

---
*Automatic coordination tracking for Trinity Symphony managers*
"""
    
    def _generate_problem_template(self, problem_name: str) -> str:
        return f"""# {problem_name} - Trinity Symphony Approach

## Problem Statement

## Current Approaches
### AI-Prompt-Manager Approach
### HyperDAGManager Approach  
### Mel Musical Mathematics Approach

## Breakthrough Insights

## Mathematical Progress

## Next Steps

---
*Trinity Symphony collaborative problem-solving for {problem_name}*
"""
    
    def _generate_readme(self) -> str:
        return """# Trinity Symphony Framework - Private Repository

## Overview
Private workspace for Trinity Symphony AI managers working on Millennium Prize Problems through musical mathematics and collaborative intelligence.

## Managers
- **AI-Prompt-Manager**: Logical/analytical approaches
- **HyperDAGManager**: Chaos/complexity theory approaches  
- **Mel**: Musical mathematics and harmonic approaches

## Real-Time Collaboration
This repository enables real-time coordination between AI managers through:
- Shared discovery files
- Manager-specific notebooks
- Cross-problem insights
- Breakthrough documentation

## Mathematical Framework
Applying musical harmony principles to fundamental mathematics using Trinity Symphony multiplicative intelligence architecture.

---
*Private Repository - Patent Pending Framework*
"""

def test_trinity_github_service():
    """Test the Trinity GitHub service"""
    print("🔧 Testing Trinity Symphony GitHub Service...")
    
    service = TrinityGitHubService()
    
    # Test access
    access_test = service.test_access()
    print(f"✅ User Access: {access_test.get('user_access')}")
    print(f"✅ Repo Access: {access_test.get('repo_access')}")
    
    if access_test.get('user_data'):
        print(f"👤 GitHub User: {access_test['user_data'].get('login')}")
    
    if access_test.get('repo_data'):
        print(f"📁 Repository: {access_test['repo_data'].get('full_name')}")
        print(f"🔒 Private: {access_test['repo_data'].get('private')}")
        
    # Test file operations
    print("\n🧪 Testing File Operations...")
    
    # Test write
    test_content = f"""# Trinity Symphony Test File
Generated: {datetime.now()}
Status: GitHub integration working!
"""
    
    write_result = service.write_file(
        'test_trinity_integration.md',
        test_content,
        'Test Trinity Symphony GitHub integration',
        manager_name='HyperDAGManager'
    )
    
    print(f"✍️ Write Test: {write_result.get('success')}")
    if write_result.get('success'):
        print(f"📄 File URL: {write_result.get('html_url')}")
    
    # Test read
    read_result = service.read_file('test_trinity_integration.md')
    print(f"📖 Read Test: {read_result.get('success')}")
    
    return access_test.get('user_access') and access_test.get('repo_access')

if __name__ == "__main__":
    test_trinity_github_service()