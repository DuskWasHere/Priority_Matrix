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
  
  // Initialize the system
  useEffect(() => {
    let mounted = true;
    
    async function initializeSystem() {
      try {
        console.log('[PriorityMatrix] Starting system initialization...');
        setSystemState(prev => ({ ...prev, loading: true, error: null }));
        
        // Auto-detect current file location
        const currentFile = dc.currentFile();
        const currentFolder = currentFile?.path ? currentFile.path.split('/').slice(0, -1).join('/') : "";
        
        // Primary path: same folder as this markdown file
        let detectedBasePath = currentFolder ? `${currentFolder}/` : "PriorityMatrix/";
        let componentPath = `${detectedBasePath}PriorityMatrix.jsx`;
        
        // Check if component exists at primary location
        let componentFile = app.vault.getAbstractFileByPath(componentPath);
        
        // Fallback paths to try
        const fallbackPaths = [
            "PriorityMatrix/PriorityMatrix.jsx",
            "Work/EisenhowerMatrix.jsx", // Legacy support
            "PriorityMatrix.jsx",
            "EisenhowerMatrix.jsx"
        ];
        
        // If primary path doesn't work, try fallbacks
        if (!componentFile) {
            for (const fallbackPath of fallbackPaths) {
                componentFile = app.vault.getAbstractFileByPath(fallbackPath);
                if (componentFile) {
                    componentPath = fallbackPath;
                    // Extract base path for data file location
                    const pathParts = fallbackPath.split('/');
                    detectedBasePath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') + '/' : '';
                    break;
                }
            }
        }
        
        // If still not found, prompt user for path
        if (!componentFile) {
            const userPath = await new Promise((resolve) => {
                const modal = new obsidian.Modal(app);
                modal.titleEl.setText("Priority Matrix Component Not Found");
                
                const content = modal.contentEl;
                content.createEl("p", { 
                    text: "The Priority Matrix component could not be found. Please specify the path to PriorityMatrix.jsx:" 
                });
                
                const input = content.createEl("input", {
                    type: "text",
                    placeholder: "e.g., PriorityMatrix/PriorityMatrix.jsx"
                });
                input.style.width = "100%";
                input.style.marginBottom = "10px";
                
                const buttonContainer = content.createEl("div");
                buttonContainer.style.textAlign = "right";
                
                const confirmBtn = buttonContainer.createEl("button", { text: "Load Component" });
                confirmBtn.onclick = () => {
                    modal.close();
                    resolve(input.value.trim());
                };
                
                const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
                cancelBtn.style.marginLeft = "10px";
                cancelBtn.onclick = () => {
                    modal.close();
                    resolve(null);
                };
                
                modal.open();
                input.focus();
            });
            
            if (!userPath) {
                throw new Error("Priority Matrix component loading cancelled.");
            }
            
            componentPath = userPath;
            componentFile = app.vault.getAbstractFileByPath(componentPath);
            
            if (!componentFile) {
                throw new Error(`Component not found at: ${componentPath}`);
            }
            
            // Extract base path from user-provided path
            const pathParts = componentPath.split('/');
            detectedBasePath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') + '/' : '';
        }
        
        // Check if PriorityMatrix is available
        if (window.PriorityMatrix) {
          console.log('[PriorityMatrix] Clearing existing component...');
          delete window.PriorityMatrix;
        }
        
        // Load the component using dc.require
        console.log('[PriorityMatrix] Loading component from:', componentPath);
        await dc.require(componentPath);
        
        // Verify component loaded
        if (!window.PriorityMatrix && !window.EisenhowerMatrix) {
          throw new Error('Failed to load PriorityMatrix component');
        }
        
        // Handle legacy component support
        if (!window.PriorityMatrix && window.EisenhowerMatrix) {
          window.PriorityMatrix = window.EisenhowerMatrix;
          console.log('[PriorityMatrix] Using legacy EisenhowerMatrix component');
        }
        
        console.log('[PriorityMatrix] Component loaded successfully');
        
        // Update config with detected paths
        setConfig(prev => ({
          ...prev,
          basePath: detectedBasePath,
          componentPath: componentPath
        }));
        
        if (mounted) {
          setSystemState({
            loading: false,
            error: null,
            initialized: true,
            version: "1.0.0"
          });
          console.log('[PriorityMatrix] ✓ System initialization complete');
        }
        
      } catch (error) {
        console.error('[PriorityMatrix] System initialization failed:', error);
        
        if (mounted) {
          setSystemState({
            loading: false,
            error: error.message,
            initialized: false,
            version: "1.0.0"
          });
        }
      }
    }
    
    // Start initialization with error boundary
    initializeSystem().catch(error => {
      console.error('[PriorityMatrix] Critical initialization error:', error);
      if (mounted) {
        setCriticalError(error.message);
      }
    });
    
    return () => {
      mounted = false;
    };
  }, []);

  // Memoized render component
  const renderContent = useMemo(() => {
    // Critical error state
    if (criticalError) {
      return (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <div style={styles.errorTitle}>Critical System Error</div>
          <div style={styles.errorMessage}>{criticalError}</div>
          <div style={styles.errorActions}>
            <button 
              style={styles.reloadButton}
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    
    // Loading state
    if (systemState.loading) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>⚡</div>
          <div style={styles.loadingTitle}>Initializing Priority Matrix</div>
          <div style={styles.loadingMessage}>Loading system components...</div>
        </div>
      );
    }
    
    // Initialization error state
    if (systemState.error) {
      return (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>🔥</div>
          <div style={styles.errorTitle}>Initialization Error</div>
          <div style={styles.errorMessage}>{systemState.error}</div>
          <div style={styles.errorActions}>
            <button 
              style={styles.reloadButton}
              onClick={() => window.location.reload()}
            >
              Retry Initialization
            </button>
          </div>
        </div>
      );
    }
    
    // System ready - render main application
    if (systemState.initialized && window.PriorityMatrix) {
      try {
        const PriorityMatrixComponent = window.PriorityMatrix;
        return <PriorityMatrixComponent />;
      } catch (renderError) {
        console.error('[PriorityMatrix] Render Error:', renderError);
        return (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>🚨</div>
            <div style={styles.errorTitle}>Render Error</div>
            <div style={styles.errorMessage}>
              Failed to render application: {renderError.message}
            </div>
            <div style={styles.errorActions}>
              <button 
                style={styles.reloadButton}
                onClick={() => window.location.reload()}
              >
                Reload Application
              </button>
            </div>
          </div>
        );
      }
    }
    
    // Fallback state
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>❓</div>
        <div style={styles.errorTitle}>Unknown State</div>
        <div style={styles.errorMessage}>
          System is in an unknown state. Please reload the application.
        </div>
        <div style={styles.errorActions}>
          <button 
            style={styles.reloadButton}
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }, [systemState, criticalError, config]);

  return renderContent;
}

// Styles for the application states
const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    padding: '40px',
    backgroundColor: 'var(--background-primary)',
    borderRadius: '8px',
    border: '1px solid var(--background-modifier-border)'
  },
  loadingSpinner: {
    fontSize: '48px',
    animation: 'pulse 2s infinite',
    marginBottom: '20px'
  },
  loadingTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--text-normal)',
    marginBottom: '8px'
  },
  loadingMessage: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    textAlign: 'center'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    padding: '40px',
    backgroundColor: 'var(--background-primary)',
    borderRadius: '8px',
    border: '2px solid var(--background-modifier-error)'
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--text-error)',
    marginBottom: '12px'
  },
  errorMessage: {
    fontSize: '16px',
    color: 'var(--text-normal)',
    textAlign: 'center',
    marginBottom: '24px',
    maxWidth: '500px',
    lineHeight: '1.5'
  },
  errorActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  reloadButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--interactive-accent)',
    color: 'var(--text-on-accent)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

return PriorityMatrixMain;
```