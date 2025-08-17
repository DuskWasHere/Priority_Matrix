---
cssclasses:
  - max
  - hide-properties_reading
  - full-view
  - no-inline
---
```datacorejsx
function PriorityMatrixMain() {
  const { useState, useEffect, useMemo } = dc;
  
  // Main folder path for Priority Matrix components
  const [mainFolderPath, setMainFolderPath] = useState("PriorityMatrix");
  const [hasCheckedFolders, setHasCheckedFolders] = useState(false);
  const [componentsFound, setComponentsFound] = useState(false);
  const [dataFolderReady, setDataFolderReady] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Application state
  const [systemState, setSystemState] = useState({
    loading: true,
    error: null,
    initialized: false,
    version: "1.0.0"
  });
  
  const [config, setConfig] = useState({
    basePath: "PriorityMatrix/",
    componentPath: "PriorityMatrix/PriorityMatrix.jsx",
    theme: {
      title: "Priority Matrix",
      mode: "auto" // auto, light, dark
    }
  });

  // Error boundary state
  const [criticalError, setCriticalError] = useState(null);
  
  // Create expected paths based on main folder
  const getComponentPath = () => `${mainFolderPath}/PriorityMatrix.jsx`;
  const getDataPath = () => `${mainFolderPath}/priority_matrix_data.json`;
  
  // Check if a specific file exists
  async function fileExists(path) {
    try {
      const file = app.vault.getAbstractFileByPath(path);
      return file !== null && !file.children; // True if file exists and isn't a directory
    } catch (error) {
      return false;
    }
  }
  
  // Check if a folder exists
  async function folderExists(path) {
    try {
      const folder = app.vault.getAbstractFileByPath(path);
      return folder !== null && folder.children !== undefined; // True if folder exists
    } catch (error) {
      return false;
    }
  }

  // Initialize the Priority Matrix system
  async function initializeSystem(path) {
    try {
      setIsLoading(true);

      // Clear existing component if present
      if (window.PriorityMatrix) {
        delete window.PriorityMatrix;
      }
      
      // Set the global data path BEFORE loading the component
      window.PriorityMatrixDataPath = `${path}/priority_matrix_data.json`;
      
      // Load the component
      const componentPath = getComponentPath();
      await dc.require(componentPath);
      
      if (!window.PriorityMatrix && !window.EisenhowerMatrix) {
        throw new Error("Component not loaded properly");
      }

      // Handle legacy component support
      if (!window.PriorityMatrix && window.EisenhowerMatrix) {
        window.PriorityMatrix = window.EisenhowerMatrix;
      }
      
      setIsInitialized(true);
      setError("");
      return true;
    } catch (err) {
      setError(`Failed to initialize: ${err.message}`);
      setIsInitialized(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // Check if files exist when component mounts or mainFolderPath changes
  useEffect(() => {
    async function checkComponentsAndDataFolder() {
      try {
        // Skip checking if already initialized
        if (isInitialized) return;
        
        setIsLoading(true);
        
        // Check for the main component
        const componentPath = getComponentPath();
        const hasComponent = await fileExists(componentPath);
        
        // Update state
        setComponentsFound(hasComponent);
        setDataFolderReady(true); // Data is optional for Priority Matrix
        setHasCheckedFolders(true);
        setError("");

        // If component is found, initialize the system
        if (hasComponent) {
          await initializeSystem(mainFolderPath);
        }
      } catch (error) {
        setError(`Error checking folders: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Only check folders if we have a main folder path
    if (mainFolderPath) {
      checkComponentsAndDataFolder();
    } else {
      setHasCheckedFolders(true);
      setIsLoading(false);
    }
  }, [mainFolderPath, isInitialized]);
  
  // Create folders if needed
  async function createFolder(path) {
    try {
      // First check if it already exists
      const exists = await folderExists(path);
      if (exists) {
        return true;
      }
      
      await app.vault.createFolder(path);
      return true;
    } catch (error) {
      setError(`Error creating folder ${path}: ${error.message}`);
      return false;
    }
  }
  
  // Update the markdown file to save the folder path
  async function updateMarkdownFile(folderPath) {
    try {
      // Get the current file
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        return false;
      }
      
      // Read the current content
      const content = await app.vault.read(activeFile);
      
      // Create regex to find the useState line with the folder path
      const pathRegex = /const \[mainFolderPath, setMainFolderPath\] = useState\(['"](.*?)['"]\);/;
      
      // Replace the path with the new one
      const updatedContent = content.replace(
        pathRegex, 
        `const [mainFolderPath, setMainFolderPath] = useState("${folderPath}");`
      );
      
      // Save the updated content back to the file
      await app.vault.modify(activeFile, updatedContent);
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Handle setup completion
  async function handleSetupComplete(folder) {
    try {
      // Update state with the new folder path first
      setMainFolderPath(folder);
      
      // Update the markdown file with the new path
      const updated = await updateMarkdownFile(folder);
      if (updated) {
        new Notice(`Priority Matrix path updated to: ${folder}`);
      } else {
        setError(`Failed to update Priority Matrix path in markdown file`);
      }
      
      // Mark setup as complete
      setIsSetupComplete(true);
      setDataFolderReady(true); // Data is optional
    } catch (err) {
      setError(`Setup error: ${err.message}`);
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div style={{
        padding: "20px",
        textAlign: "center",
        backgroundColor: "var(--background-primary)",
        borderRadius: "8px"
      }}>
        Loading Priority Matrix...
      </div>
    );
  }
  
  // If components are found and initialized, render Priority Matrix
  if (componentsFound && isInitialized && window.PriorityMatrix) {
    const PriorityMatrixComponent = window.PriorityMatrix;
    return <PriorityMatrixComponent />;
  }
  
  // If component wasn't found or not checked yet, show setup UI
  if (!componentsFound) {
    return <SetupComponent 
      onComplete={handleSetupComplete} 
      initialPath={mainFolderPath}
      error={error}
      componentsChecked={hasCheckedFolders}
    />;
  }
  
  // If Priority Matrix component should be loaded but isn't
  return (
    <div style={{ 
      color: "var(--text-error)", 
      padding: "20px",
      backgroundColor: "var(--background-modifier-error)",
      borderRadius: "8px",
      textAlign: "center"
    }}>
      Error: Priority Matrix component not found in folder "{mainFolderPath}". The component was detected but failed to load.
    </div>
  );
}

// Setup component - separate component for better hook handling
function SetupComponent({ onComplete, initialPath, error: parentError, componentsChecked }) {
  const { useState } = dc;
  const [folderPath, setFolderPath] = useState(initialPath || "");
  const [error, setError] = useState(parentError || "");
  const [isProcessing, setIsProcessing] = useState(false);
  
  async function handleSetup() {
    if (!folderPath.trim()) {
      setError("Please enter a folder path");
      return;
    }
    
    setIsProcessing(true);
    setError("");
    
    try {
      // Check if folder exists
      const folderExists = app.vault.getAbstractFileByPath(folderPath);
      if (!folderExists) {
        setError(`Folder "${folderPath}" not found. Please enter a valid folder path containing the Priority Matrix components.`);
        setIsProcessing(false);
        return;
      }
      
      // Now call onComplete with the validated folder path
      onComplete(folderPath);
    } catch (err) {
      setError(`Setup error: ${err.message}`);
      setIsProcessing(false);
    }
  }
  
  return (
    <div style={{
      backgroundColor: "var(--background-primary)",
      padding: "20px",
      borderRadius: "8px",
      border: "1px solid var(--background-modifier-border)",
      maxWidth: "500px",
      margin: "0 auto"
    }}>
      <h3 style={{ margin: "0 0 16px 0", textAlign: "center" }}>Priority Matrix Setup</h3>
      
      {componentsChecked && (
        <div style={{
          backgroundColor: "var(--background-secondary)",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "16px",
          fontSize: "14px"
        }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
            Priority Matrix components not found!
          </p>
          <p style={{ margin: "0" }}>
            Please enter the folder where Priority Matrix components are located.
            This should be a folder containing "PriorityMatrix.jsx" file.
          </p>
        </div>
      )}
      
      <p style={{ marginBottom: "16px" }}>
        Where are your Priority Matrix components located?
      </p>
      
      <div style={{ marginBottom: "16px" }}>
        <dc.Textbox
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="Folder path (e.g., PriorityMatrix)"
          style={{ width: "100%", padding: "8px" }}
        />
      </div>
      
      {(error || parentError) && (
        <div style={{
          backgroundColor: "rgba(255, 0, 0, 0.1)",
          color: "var(--text-normal)",
          border: "1px solid rgba(255, 0, 0, 0.3)",
          padding: "10px",
          borderRadius: "4px",
          marginBottom: "16px"
        }}>
          {error || parentError}
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
        <dc.Button
          onClick={handleSetup}
          disabled={isProcessing || !folderPath.trim()}
          style={{
            backgroundColor: "var(--interactive-accent)",
            color: "var(--text-on-accent)",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            cursor: isProcessing ? "default" : "pointer",
            opacity: isProcessing ? 0.7 : 1
          }}
        >
          {isProcessing ? "Checking..." : "Find Priority Matrix"}
        </dc.Button>
      </div>
    </div>
  );
}

// Render the main app component
return <PriorityMatrixMain />;
```