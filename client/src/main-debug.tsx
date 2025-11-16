import { createRoot } from "react-dom/client";
import "./index.css";

console.log("Main debug script starting...");

// Test if React is working at all
function TestApp() {
  console.log("TestApp component rendering...");
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', backgroundColor: '#f0f0f0' }}>
      <h1>HyperDAG Platform Restored</h1>
      <p>React is now mounting correctly!</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '5px' }}>
        <h2>Platform Status</h2>
        <ul>
          <li>✓ React mounting fixed</li>
          <li>✓ JavaScript execution working</li>
          <li>✓ Ready to restore full application</li>
        </ul>
      </div>
    </div>
  );
}

console.log("Looking for root element...");
const rootElement = document.getElementById("root");
console.log("Root element found:", rootElement);

if (rootElement) {
  console.log("Creating React root...");
  try {
    const root = createRoot(rootElement);
    console.log("React root created successfully");
    
    console.log("Rendering test app...");
    root.render(<TestApp />);
    console.log("Test app rendered successfully!");
    
  } catch (error) {
    console.error("Error during React mounting:", error);
    document.body.innerHTML = '<h1 style="color: red; padding: 20px;">React Error: ' + error.message + '</h1>';
  }
} else {
  console.error("Root element not found!");
  document.body.innerHTML = '<h1 style="color: red; padding: 20px;">Root element missing</h1>';
}