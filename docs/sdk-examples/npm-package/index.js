/**
 * HyperDAG ZKP Reputation SDK
 * 
 * JavaScript client library for interacting with the HyperDAG ZKP Reputation API.
 * This SDK allows third-party developers to verify credentials and access reputation
 * scores through our privacy-preserving zero-knowledge proof system.
 */

class HyperDAGClient {
  /**
   * Initialize a new HyperDAG API client
   * 
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - Your HyperDAG API key
   * @param {string} [config.baseUrl='https://api.hyperdag.org'] - API base URL
   * @param {number} [config.timeout=30000] - Request timeout in ms
   * @param {number} [config.maxRetries=3] - Max number of retries for failed requests
   */
  constructor({ apiKey, baseUrl = 'https://api.hyperdag.org', timeout = 30000, maxRetries = 3 }) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * Make an authenticated request to the HyperDAG API
   * 
   * @private
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    const fetchOptions = {
      ...options,
      headers,
      timeout: this.timeout
    };

    let lastError = null;
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        if (!response.ok) {
          const error = new Error(data.message || 'API request failed');
          error.status = response.status;
          error.code = data.error?.code;
          error.details = data.error?.details;
          throw error;
        }

        return data;
      } catch (error) {
        lastError = error;
        attempts++;
        
        // Only retry network errors and 5xx server errors
        if (!this._isRetryableError(error) || attempts >= this.maxRetries) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempts) * 100 + Math.random() * 100)
        );
      }
    }

    throw lastError;
  }

  /**
   * Determine if an error should trigger a retry
   * 
   * @private
   * @param {Error} error - The error to check
   * @returns {boolean} Whether the error is retryable
   */
  _isRetryableError(error) {
    // Network errors or 5xx server errors
    return (
      !error.status || // Network error
      (error.status >= 500 && error.status < 600) // Server error
    );
  }

  /**
   * Verify a ZKP proof
   * 
   * @param {Object} params - Verification parameters
   * @param {string} params.proof - The ZKP proof string
   * @param {string[]} params.publicSignals - Public signals for the proof
   * @param {string} params.type - Type of proof ('identity', 'reputation', 'credential', 'custom')
   * @returns {Promise<Object>} Verification result
   */
  async verifyProof({ proof, publicSignals, type }) {
    return this._request('/api/developer/zkp/verify', {
      method: 'POST',
      body: JSON.stringify({ proof, publicSignals, type })
    });
  }

  /**
   * Get a user's reputation data
   * 
   * @param {string} commitment - The user's identity commitment
   * @returns {Promise<Object>} User reputation data
   */
  async getReputation(commitment) {
    return this._request(`/api/developer/reputation/${commitment}`);
  }

  /**
   * Get a user's public credentials
   * 
   * @param {string} commitment - The user's identity commitment
   * @returns {Promise<Object>} User credentials
   */
  async getCredentials(commitment) {
    return this._request(`/api/developer/credentials/${commitment}`);
  }

  /**
   * Verify a specific credential
   * 
   * @param {Object} params - Verification parameters
   * @param {number} params.credentialId - ID of the credential to verify
   * @param {string} params.commitment - The user's identity commitment
   * @param {string} [params.proof] - Optional proof to verify credential ownership
   * @returns {Promise<Object>} Verification result
   */
  async verifyCredential({ credentialId, commitment, proof }) {
    return this._request('/api/developer/credentials/verify', {
      method: 'POST',
      body: JSON.stringify({ credentialId, commitment, proof })
    });
  }

  /**
   * Calculate compatibility between two users
   * 
   * @param {Object} params - Compatibility parameters
   * @param {string} params.commitment1 - First user's identity commitment
   * @param {string} params.commitment2 - Second user's identity commitment
   * @param {string} [params.context] - Optional context for the compatibility calculation
   * @returns {Promise<Object>} Compatibility result
   */
  async calculateCompatibility({ commitment1, commitment2, context }) {
    return this._request('/api/developer/compatibility', {
      method: 'POST',
      body: JSON.stringify({ commitment1, commitment2, context })
    });
  }
}

module.exports = { HyperDAGClient };