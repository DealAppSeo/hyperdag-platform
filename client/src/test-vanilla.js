console.log('=== VANILLA JS TEST STARTING ===');

// Direct DOM manipulation without any imports
const testElement = document.createElement('div');
testElement.innerHTML = `
  <div style="
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100vh; 
    background: linear-gradient(135deg, #1e3a8a, #7c3aed); 
    color: white; 
    padding: 2rem; 
    font-family: system-ui;
    z-index: 9999;
  ">
    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">
      🎉 VANILLA JS WORKS!
    </h1>
    <p style="font-size: 1.25rem; margin-bottom: 2rem;">
      JavaScript is executing successfully. This confirms the basic setup works.
    </p>
    <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 0.5rem;">
      <h3>Next Steps:</h3>
      <p>✅ Vanilla JavaScript working</p>
      <p>🔧 Need to fix React imports</p>
      <p>⚡ Then restore HyperDAG platform</p>
    </div>
  </div>
`;

document.body.appendChild(testElement);
console.log('✅ Vanilla JS test completed successfully');