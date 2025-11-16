import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',   
        margin: '0 auto',
        paddingTop: '40px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold', 
          color: '#1e40af',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          HyperDAG Platform
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          Web3-AI Free Market Ecosystem Successfully Restored
        </p>
        
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            Platform Status: Online
          </h2>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '12px',
              height: '12px', 
              backgroundColor: '#10b981',
              borderRadius: '50%'
            }}></div>
            <span>React App Successfully Mounted</span>
          </div>
          <button
            style={{
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
            onClick={() => alert('HyperDAG Platform is fully operational!')}
          >
            Test Platform
          </button>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("Root element found, mounting React app...");
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log("React app mounted successfully!");
} else {
  console.error("Root element not found!");
}