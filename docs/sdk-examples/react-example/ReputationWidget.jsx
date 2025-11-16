import React, { useState, useEffect } from 'react';
import { HyperDAGClient } from 'hyperdag-zkp-sdk';

// Initialize the HyperDAG client with your API key
const client = new HyperDAGClient({
  apiKey: process.env.REACT_APP_HYPERDAG_API_KEY
});

/**
 * ReputationWidget - A React component to display a user's reputation
 * and credentials from the HyperDAG ZKP system
 * 
 * @param {Object} props Component props
 * @param {string} props.commitment The user's identity commitment
 * @param {boolean} props.showCredentials Whether to display credentials
 * @param {string} props.theme Theme for the widget (light, dark)
 */
const ReputationWidget = ({ commitment, showCredentials = true, theme = 'light' }) => {
  const [reputation, setReputation] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!commitment) {
      setError('Identity commitment is required');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch reputation data
        const repData = await client.getReputation(commitment);
        
        if (repData.success) {
          setReputation(repData.data);
        } else {
          setError(repData.message);
          setLoading(false);
          return;
        }
        
        // Fetch credentials if requested
        if (showCredentials) {
          const credData = await client.getCredentials(commitment);
          
          if (credData.success) {
            setCredentials(credData.data.credentials || []);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, [commitment, showCredentials]);

  if (loading) {
    return (
      <div className={`reputation-widget ${theme}`}>
        <div className="loading">Loading reputation data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`reputation-widget ${theme}`}>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  // Determine reputation level class
  const getLevelClass = (level) => {
    switch (level) {
      case 5: return 'level-5';
      case 4: return 'level-4';
      case 3: return 'level-3';
      case 2: return 'level-2';
      default: return 'level-1';
    }
  };

  return (
    <div className={`reputation-widget ${theme}`}>
      <div className="reputation-header">
        <div className={`reputation-score ${getLevelClass(reputation.level)}`}>
          {reputation.score}
        </div>
        <div className="reputation-details">
          <div className="reputation-level">Level {reputation.level}</div>
          {reputation.verified && <div className="verified-badge">✓ Verified</div>}
          <div className="last-updated">Updated: {new Date(reputation.lastUpdated).toLocaleDateString()}</div>
        </div>
      </div>
      
      {showCredentials && credentials.length > 0 && (
        <div className="credentials-section">
          <h3>Verified Credentials</h3>
          <ul className="credentials-list">
            {credentials.map((cred) => (
              <li key={cred.id} className="credential-item">
                <div className="credential-name">{cred.name}</div>
                <div className="credential-type">{cred.type}</div>
                <div className="credential-issuer">Issued by: {cred.issuer}</div>
                {cred.issuedDate && (
                  <div className="credential-date">
                    Issued: {new Date(cred.issuedDate).toLocaleDateString()}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReputationWidget;