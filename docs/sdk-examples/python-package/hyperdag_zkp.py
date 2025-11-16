"""
HyperDAG ZKP Reputation SDK

Python client library for interacting with the HyperDAG ZKP Reputation API.
This SDK allows third-party developers to verify credentials and access reputation
scores through our privacy-preserving zero-knowledge proof system.
"""

import json
import time
import random
import requests
from typing import Dict, List, Union, Optional, Any


class HyperDAGAPIError(Exception):
    """Exception raised for HyperDAG API errors"""
    
    def __init__(self, message: str, code: str = None, details: Dict = None, status: int = None):
        self.message = message
        self.code = code
        self.details = details
        self.status = status
        super().__init__(self.message)


class HyperDAGClient:
    """
    Client for the HyperDAG ZKP Reputation API
    """
    
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.hyperdag.org",
        timeout: int = 30,
        max_retries: int = 3
    ):
        """
        Initialize a new HyperDAG API client
        
        Args:
            api_key: Your HyperDAG API key
            base_url: API base URL
            timeout: Request timeout in seconds
            max_retries: Max number of retries for failed requests
        """
        if not api_key:
            raise ValueError("API key is required")
        
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
    
    def _request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Dict = None,
        params: Dict = None,
        headers: Dict = None
    ) -> Dict:
        """
        Make an authenticated request to the HyperDAG API
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            data: Request body data
            params: URL parameters
            headers: Additional HTTP headers
            
        Returns:
            API response as a dictionary
            
        Raises:
            HyperDAGAPIError: When the API returns an error
        """
        url = f"{self.base_url}{endpoint}"
        default_headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        if headers:
            default_headers.update(headers)
        
        request_kwargs = {
            "method": method,
            "url": url,
            "timeout": self.timeout,
            "headers": default_headers
        }
        
        if data is not None:
            request_kwargs["json"] = data
        
        if params is not None:
            request_kwargs["params"] = params
        
        last_error = None
        attempts = 0
        
        while attempts < self.max_retries:
            try:
                response = self.session.request(**request_kwargs)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.HTTPError as e:
                # Handle API error responses
                status_code = e.response.status_code
                try:
                    error_data = e.response.json()
                    error_message = error_data.get("message", "API request failed")
                    error_code = error_data.get("error", {}).get("code")
                    error_details = error_data.get("error", {}).get("details")
                except (ValueError, KeyError):
                    error_message = f"API request failed: {str(e)}"
                    error_code = None
                    error_details = None
                
                error = HyperDAGAPIError(
                    message=error_message,
                    code=error_code,
                    details=error_details,
                    status=status_code
                )
                
                # Only retry server errors (5xx)
                if 500 <= status_code < 600 and attempts < self.max_retries - 1:
                    last_error = error
                    attempts += 1
                    self._backoff(attempts)
                    continue
                
                raise error
            
            except (requests.exceptions.ConnectionError, 
                    requests.exceptions.Timeout,
                    requests.exceptions.RequestException) as e:
                # Retry on network errors
                last_error = HyperDAGAPIError(f"Network error: {str(e)}")
                attempts += 1
                
                if attempts >= self.max_retries:
                    break
                
                self._backoff(attempts)
        
        # If we've exhausted retries, raise the last error
        if last_error:
            raise last_error
        
        raise HyperDAGAPIError("Request failed with an unknown error")
    
    def _backoff(self, attempt: int) -> None:
        """
        Implement exponential backoff between retries
        
        Args:
            attempt: The current attempt number (starting at 1)
        """
        backoff_time = (2 ** attempt * 0.1) + (random.randint(0, 100) / 1000)
        time.sleep(backoff_time)
    
    def verify_proof(
        self,
        proof: str,
        public_signals: List[str],
        proof_type: str
    ) -> Dict[str, Any]:
        """
        Verify a ZKP proof
        
        Args:
            proof: The ZKP proof string
            public_signals: Public signals for the proof
            proof_type: Type of proof ('identity', 'reputation', 'credential', 'custom')
            
        Returns:
            Verification result dictionary
        """
        return self._request(
            endpoint="/api/developer/zkp/verify",
            method="POST",
            data={
                "proof": proof,
                "publicSignals": public_signals,
                "type": proof_type
            }
        )
    
    def get_reputation(self, commitment: str) -> Dict[str, Any]:
        """
        Get a user's reputation data
        
        Args:
            commitment: The user's identity commitment
            
        Returns:
            User reputation data dictionary
        """
        return self._request(
            endpoint=f"/api/developer/reputation/{commitment}"
        )
    
    def get_credentials(self, commitment: str) -> Dict[str, Any]:
        """
        Get a user's public credentials
        
        Args:
            commitment: The user's identity commitment
            
        Returns:
            User credentials dictionary
        """
        return self._request(
            endpoint=f"/api/developer/credentials/{commitment}"
        )
    
    def verify_credential(
        self,
        credential_id: int,
        commitment: str,
        proof: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verify a specific credential
        
        Args:
            credential_id: ID of the credential to verify
            commitment: The user's identity commitment
            proof: Optional proof to verify credential ownership
            
        Returns:
            Verification result dictionary
        """
        data = {
            "credentialId": credential_id,
            "commitment": commitment
        }
        
        if proof:
            data["proof"] = proof
        
        return self._request(
            endpoint="/api/developer/credentials/verify",
            method="POST",
            data=data
        )
    
    def calculate_compatibility(
        self,
        commitment1: str,
        commitment2: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate compatibility between two users
        
        Args:
            commitment1: First user's identity commitment
            commitment2: Second user's identity commitment
            context: Optional context for the compatibility calculation
            
        Returns:
            Compatibility result dictionary
        """
        data = {
            "commitment1": commitment1,
            "commitment2": commitment2
        }
        
        if context:
            data["context"] = context
        
        return self._request(
            endpoint="/api/developer/compatibility",
            method="POST",
            data=data
        )