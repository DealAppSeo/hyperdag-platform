/**
 * Security Testing API
 * 
 * This API provides real security testing capabilities for HyperDAG integrations
 * including SBT verification, authentication flows, ZKP validation, and cross-platform
 * communication security.
 */

import express, { Request, Response } from "express";
import { requireAuth } from "../../middleware/auth-middleware";
import crypto from "crypto";
import axios from "axios";
import https from "https";

const router = express.Router();

// Enable security test routes only for authenticated users
router.use(requireAuth);

/**
 * Helper functions for security tests
 */

// Create signature for testing purposes
function createTestSignature(data: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

// Verify signature for testing purposes
function verifyTestSignature(data: string, signature: string, publicKey: string): boolean {
  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// Generate test key pair for security testing
function generateTestKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

// Simulate attempt to bypass SBT verification with modified data
async function testSbtSignatureBypass(endpoint: string, sbtData: any, keyPair: any) {
  try {
    // Original valid signature
    const dataString = JSON.stringify(sbtData);
    const validSignature = createTestSignature(dataString, keyPair.privateKey);
    
    // Tests for vulnerable signature verification
    const tests = [
      // Test 1: Modified data with original signature
      {
        name: "Modified data with original signature",
        data: { ...sbtData, attributes: { ...sbtData.attributes, value: 999999 }},
        signature: validSignature
      },
      // Test 2: Null signature bypass attempt
      {
        name: "Null signature bypass",
        data: sbtData,
        signature: null
      },
      // Test 3: Empty signature bypass attempt
      {
        name: "Empty signature bypass",
        data: sbtData,
        signature: ""
      },
      // Test 4: SQL injection attempt in signature
      {
        name: "SQL injection in signature field",
        data: sbtData,
        signature: "' OR 1=1 --"
      }
    ];
    
    // Perform the tests
    const results = await Promise.all(tests.map(async (test) => {
      try {
        // Use axios with SSL certificate checking disabled for testing purposes
        const agent = new https.Agent({
          rejectUnauthorized: false
        });
        
        const response = await axios.post(endpoint, {
          data: test.data,
          signature: test.signature
        }, { httpsAgent: agent, timeout: 5000 });
        
        return {
          testName: test.name,
          bypassed: response.status === 200 || response.status === 202,
          status: response.status,
          vulnerabilityFound: true,
          details: `The endpoint accepted an invalid request with ${test.name}`
        };
      } catch (error) {
        // Proper behavior is to reject invalid signatures
        return {
          testName: test.name,
          bypassed: false,
          status: error.response?.status || 500,
          vulnerabilityFound: false,
          details: "The endpoint properly rejected the invalid signature"
        };
      }
    }));
    
    return {
      success: true,
      endpoint,
      tests: results,
      vulnerabilitiesFound: results.filter(r => r.vulnerabilityFound).length,
      overallSecure: results.filter(r => r.vulnerabilityFound).length === 0
    };
  } catch (error) {
    console.error("Error testing SBT signature bypass:", error);
    return {
      success: false,
      endpoint,
      error: error.message || "Unknown error occurred during testing",
      vulnerabilitiesFound: 0,
      overallSecure: false
    };
  }
}

// Test replay attack vulnerabilities
async function testReplayAttack(endpoint: string, validRequest: any) {
  try {
    // Generate a timestamp and nonce for the request
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Add timestamp and nonce to the request
    const request = {
      ...validRequest,
      timestamp,
      nonce
    };
    
    // Attempt to send the same request multiple times
    const tests = [
      // First request should succeed
      {
        name: "Initial valid request",
        request,
        expectedToPass: true
      },
      // Second identical request should be rejected (replay attack)
      {
        name: "Replay attack - same request",
        request,
        expectedToPass: false
      },
      // Request with old timestamp should be rejected
      {
        name: "Expired timestamp attack",
        request: {
          ...request,
          timestamp: timestamp - 3600000 // 1 hour ago
        },
        expectedToPass: false
      }
    ];
    
    // Perform the tests
    const results = await Promise.all(tests.map(async (test, index) => {
      try {
        // Wait a bit between requests
        if (index > 0) await new Promise(resolve => setTimeout(resolve, 1000));
        
        const agent = new https.Agent({
          rejectUnauthorized: false
        });
        
        const response = await axios.post(endpoint, test.request, {
          httpsAgent: agent,
          timeout: 5000
        });
        
        return {
          testName: test.name,
          passed: response.status === 200 || response.status === 202,
          secure: test.expectedToPass === (response.status === 200 || response.status === 202),
          vulnerabilityFound: !test.expectedToPass && (response.status === 200 || response.status === 202),
          details: test.expectedToPass ? 
            "Request was processed as expected" : 
            "Security issue: The endpoint accepted a request that should have been rejected"
        };
      } catch (error) {
        const rejected = error.response?.status >= 400;
        return {
          testName: test.name,
          passed: false,
          secure: test.expectedToPass ? false : true, // If we expect it to fail and it did, that's secure
          vulnerabilityFound: test.expectedToPass && rejected,
          details: test.expectedToPass ? 
            "Security issue: Valid request was rejected" : 
            "The endpoint properly rejected the invalid request"
        };
      }
    }));
    
    return {
      success: true,
      endpoint,
      tests: results,
      vulnerabilitiesFound: results.filter(r => r.vulnerabilityFound).length,
      overallSecure: results.filter(r => r.vulnerabilityFound).length === 0
    };
  } catch (error) {
    console.error("Error testing replay attacks:", error);
    return {
      success: false,
      endpoint,
      error: error.message || "Unknown error occurred during testing",
      vulnerabilitiesFound: 0,
      overallSecure: false
    };
  }
}

// Test MITM vulnerabilities in cross-platform communication
async function testMitmVulnerabilities(endpoint: string) {
  try {
    // Tests for MITM vulnerabilities
    const tests = [
      // Test 1: HTTP Downgrade Attack 
      {
        name: "HTTP Downgrade Attack",
        test: async () => {
          const url = endpoint.replace('https://', 'http://');
          try {
            const response = await axios.get(url, { timeout: 5000 });
            return {
              vulnerabilityFound: response.status === 200,
              details: "The endpoint responds to non-HTTPS requests"
            };
          } catch (error) {
            return {
              vulnerabilityFound: false,
              details: "The endpoint properly rejects non-HTTPS requests"
            };
          }
        }
      },
      // Test 2: Check for HSTS header
      {
        name: "HSTS Header Check",
        test: async () => {
          try {
            const response = await axios.get(endpoint, { timeout: 5000 });
            const hstsHeader = response.headers['strict-transport-security'];
            return {
              vulnerabilityFound: !hstsHeader,
              details: hstsHeader ? 
                "HSTS header is properly set" : 
                "HSTS header is missing, which may allow SSL stripping attacks"
            };
          } catch (error) {
            return {
              vulnerabilityFound: true,
              details: "Could not check HSTS header"
            };
          }
        }
      },
      // Test 3: Check for secure cookies
      {
        name: "Secure Cookies Check",
        test: async () => {
          try {
            const response = await axios.get(endpoint, { timeout: 5000 });
            const cookies = response.headers['set-cookie'] || [];
            const insecureCookies = cookies.filter(cookie => !cookie.includes('Secure;'));
            return {
              vulnerabilityFound: insecureCookies.length > 0,
              details: insecureCookies.length > 0 ? 
                "Found insecure cookies that could be intercepted" : 
                "All cookies are properly secured"
            };
          } catch (error) {
            return {
              vulnerabilityFound: true,
              details: "Could not check cookies security"
            };
          }
        }
      }
    ];
    
    // Perform the tests
    const results = await Promise.all(tests.map(async (test) => {
      try {
        const result = await test.test();
        return {
          testName: test.name,
          ...result
        };
      } catch (error) {
        return {
          testName: test.name,
          vulnerabilityFound: true,
          details: `Error during test: ${error.message || "Unknown error"}`
        };
      }
    }));
    
    return {
      success: true,
      endpoint,
      tests: results,
      vulnerabilitiesFound: results.filter(r => r.vulnerabilityFound).length,
      overallSecure: results.filter(r => r.vulnerabilityFound).length === 0
    };
  } catch (error) {
    console.error("Error testing MITM vulnerabilities:", error);
    return {
      success: false,
      endpoint,
      error: error.message || "Unknown error occurred during testing",
      vulnerabilitiesFound: 0,
      overallSecure: false
    };
  }
}

// Test for ZKP validation vulnerabilities
async function testZkpValidation(endpoint: string, zkpData: any) {
  try {
    // Create invalid ZKP proofs for testing
    const invalidProofs = [
      // Test 1: Empty proof
      {
        name: "Empty proof",
        proof: { 
          proof: "", 
          publicSignals: zkpData.publicSignals 
        }
      },
      // Test 2: Modified public signals
      {
        name: "Modified public signals",
        proof: { 
          proof: zkpData.proof, 
          publicSignals: [...zkpData.publicSignals.slice(0, -1), "999999"] 
        }
      },
      // Test 3: Malformed proof
      {
        name: "Malformed proof structure",
        proof: { 
          proof: "invalid_proof_format", 
          publicSignals: zkpData.publicSignals 
        }
      },
      // Test 4: SQL injection in proof field
      {
        name: "SQL injection attempt",
        proof: { 
          proof: "' OR 1=1 --", 
          publicSignals: zkpData.publicSignals 
        }
      }
    ];
    
    // Perform the tests
    const results = await Promise.all(invalidProofs.map(async (test) => {
      try {
        const agent = new https.Agent({
          rejectUnauthorized: false
        });
        
        const response = await axios.post(endpoint, test.proof, {
          httpsAgent: agent,
          timeout: 5000
        });
        
        return {
          testName: test.name,
          bypassed: response.status === 200 || response.status === 202,
          status: response.status,
          vulnerabilityFound: true,
          details: `The endpoint accepted an invalid ZKP with ${test.name}`
        };
      } catch (error) {
        // Proper behavior is to reject invalid proofs
        return {
          testName: test.name,
          bypassed: false,
          status: error.response?.status || 500,
          vulnerabilityFound: false,
          details: "The endpoint properly rejected the invalid proof"
        };
      }
    }));
    
    return {
      success: true,
      endpoint,
      tests: results,
      vulnerabilitiesFound: results.filter(r => r.vulnerabilityFound).length,
      overallSecure: results.filter(r => r.vulnerabilityFound).length === 0
    };
  } catch (error) {
    console.error("Error testing ZKP validation:", error);
    return {
      success: false,
      endpoint,
      error: error.message || "Unknown error occurred during testing",
      vulnerabilitiesFound: 0,
      overallSecure: false
    };
  }
}

/**
 * API Routes
 */

// Test SBT verification security
router.post("/test/sbt-verification", async (req: Request, res: Response) => {
  try {
    const { endpoint, sbtData, verificationMethod } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: "Endpoint URL is required"
      });
    }
    
    // Generate test key pair for security testing
    const keyPair = generateTestKeyPair();
    
    // Default SBT data if not provided
    const testSbtData = sbtData || {
      id: "sbt_" + crypto.randomBytes(16).toString('hex'),
      owner: req.user?.id.toString() || "test-user",
      issuer: "hyperdag.org",
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      attributes: {
        type: "reputation",
        value: 100
      }
    };
    
    // Run the appropriate security tests based on verification method
    let results;
    if (verificationMethod === "signature") {
      results = await testSbtSignatureBypass(endpoint, testSbtData, keyPair);
    } else if (verificationMethod === "zkp") {
      // Generate test ZKP data
      const zkpData = {
        proof: "test-proof-" + crypto.randomBytes(16).toString('hex'),
        publicSignals: [testSbtData.id, testSbtData.owner, testSbtData.attributes.value.toString()]
      };
      results = await testZkpValidation(endpoint, zkpData);
    } else {
      results = await testSbtSignatureBypass(endpoint, testSbtData, keyPair);
    }
    
    // Return detailed test results
    return res.json({
      success: true,
      data: {
        ...results,
        recommendations: results.overallSecure ? 
          "The SBT verification endpoint appears to be secure." :
          "Security issues were found in the SBT verification. Implement proper signature validation and input sanitization."
      }
    });
  } catch (error) {
    console.error("SBT verification test error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred during security testing"
    });
  }
});

// Test authentication flow security
router.post("/test/auth-flow", async (req: Request, res: Response) => {
  try {
    const { endpoint, includeToken } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: "Endpoint URL is required"
      });
    }
    
    // Create a valid request with proper authentication
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Generate test key pair for security testing
    const keyPair = generateTestKeyPair();
    
    // Default valid auth request
    const validRequest = {
      userId: req.user?.id || "test-user",
      timestamp,
      nonce,
      token: includeToken ? "valid-token-" + crypto.randomBytes(16).toString('hex') : null
    };
    
    // Sign the request
    const requestString = JSON.stringify(validRequest);
    validRequest.signature = createTestSignature(requestString, keyPair.privateKey);
    
    // Test for replay attack vulnerabilities
    const results = await testReplayAttack(endpoint, validRequest);
    
    // Return detailed test results
    return res.json({
      success: true,
      data: {
        ...results,
        recommendations: results.overallSecure ? 
          "The authentication flow appears to be secure against replay attacks." :
          "Security issues were found in the authentication flow. Implement proper replay protection with nonce validation and timestamp checking."
      }
    });
  } catch (error) {
    console.error("Authentication flow test error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred during security testing"
    });
  }
});

// Test ZKP validation security
router.post("/test/zkp-validation", async (req: Request, res: Response) => {
  try {
    const { endpoint, proofType } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: "Endpoint URL is required"
      });
    }
    
    // Default ZKP data based on proof type
    const zkpData = {
      proof: "valid-zkp-proof-" + crypto.randomBytes(32).toString('hex'),
      publicSignals: [
        "0x" + crypto.randomBytes(32).toString('hex'),
        "0x" + crypto.randomBytes(16).toString('hex'),
        "100"
      ]
    };
    
    // Test ZKP validation security
    const results = await testZkpValidation(endpoint, zkpData);
    
    // Return detailed test results
    return res.json({
      success: true,
      data: {
        ...results,
        recommendations: results.overallSecure ? 
          "The ZKP validation endpoint appears to be secure." :
          "Security issues were found in the ZKP validation. Implement proper ZKP verification with circuit validation."
      }
    });
  } catch (error) {
    console.error("ZKP validation test error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred during security testing"
    });
  }
});

// Test cross-platform integration security
router.post("/test/cross-platform", async (req: Request, res: Response) => {
  try {
    const { endpoint, includeCredentials } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: "Endpoint URL is required"
      });
    }
    
    // Test MITM vulnerabilities in cross-platform communication
    const results = await testMitmVulnerabilities(endpoint);
    
    // Return detailed test results
    return res.json({
      success: true,
      data: {
        ...results,
        recommendations: results.overallSecure ? 
          "The cross-platform endpoint appears to be secure against MITM attacks." :
          "Security issues were found in the cross-platform integration. Implement HSTS headers, secure cookies, and enforce HTTPS."
      }
    });
  } catch (error) {
    console.error("Cross-platform test error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred during security testing"
    });
  }
});

export default router;