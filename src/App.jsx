import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ActivityBar from './components/ActivityBar';
import TerminalPanel from './components/TerminalPanel';
import SearchPanel from './components/SearchPanel';
import ExtensionsPanel from './components/ExtensionsPanel';
import SettingsView from './components/SettingsView';
import { Minus, Square, X } from 'lucide-react';

function App() {
  const [workspacePath, setWorkspacePath] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('explorer'); // explorer, search, extensions
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [newFilePrompt, setNewFilePrompt] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const autoSaveInfo = useRef({ activeFile, fileContent, unsavedChanges });

  useEffect(() => {
    autoSaveInfo.current = { activeFile, fileContent, unsavedChanges };
  }, [activeFile, fileContent, unsavedChanges]);

  const loadWorkspace = async () => {
    const folderPath = await window.electronAPI.openFolderDialog();
    if (folderPath) {
      setWorkspacePath(folderPath);
    }
  };

  const openFile = async (filePath) => {
    if (unsavedChanges) {
      await saveCurrentFile();
    }
    try {
      const content = await window.electronAPI.readFile(filePath);
      setActiveFile(filePath);
      setFileContent(content);
      setUnsavedChanges(false);
    } catch (e) {
      console.error("Failed to read file", e);
    }
  };

  const saveCurrentFile = useCallback(async () => {
    const { activeFile, fileContent, unsavedChanges } = autoSaveInfo.current;
    if (activeFile && unsavedChanges) {
      try {
        await window.electronAPI.saveFile(activeFile, fileContent);
        setUnsavedChanges(false);
      } catch (e) {
        console.error("Failed to save file", e);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentFile();
    }, 30000);
    return () => clearInterval(interval);
  }, [saveCurrentFile]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setIsTerminalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentFile]);

  const handleRun = () => {
    setIsTerminalOpen(true);
    if (activeFile) {
      setTimeout(() => {
        // Send a node command to terminal to run current file
        // Requires quotes in case of spaces in path
        window.electronAPI.writeTerminal(`node "${activeFile}"\r`);
      }, 500);
    }
  };

  const handleNewFile = () => {
    if (!workspacePath) return alert('Please open a folder first.');
    setFileMenuOpen(false);
    setNewFileName('');
    setNewFilePrompt(true);
  };

  const confirmNewFile = async () => {
    if (!newFileName.trim()) {
      setNewFilePrompt(false);
      return;
    }
    const newPath = workspacePath + (workspacePath.includes('\\') ? '\\' : '/') + newFileName;
    const created = await window.electronAPI.createFile(newPath);
    if (created) {
      // Force refresh explorer or just open it
      openFile(newPath);
    } else {
      alert('File already exists or could not be created. Please ensure you have restarted the application server!');
    }
    setNewFilePrompt(false);
  };

  const handleDeleteFile = async (filePath) => {
    if (confirm(`Are you sure you want to delete ${filePath.split(/[/\\]/).pop()}?`)) {
      const deleted = await window.electronAPI.deleteFile(filePath);
      if (deleted) {
        if (activeFile === filePath) {
          setActiveFile(null);
          setFileContent('');
        }
        // Ideally we refresh the exact folder tree, but for simplicity we reload the workspace root
        if (workspacePath) {
          loadWorkspaceSilent(workspacePath);
        }
      } else {
        alert("Failed to delete file. Please ensure the app has been restarted.");
      }
    }
  };

  const loadWorkspaceSilent = async (path) => {
    // Increment refreshKey to force Sidebar remount
    setRefreshKey(prev => prev + 1);
  };

  const handleCloseFolder = () => {
    setWorkspacePath(null);
    setActiveFile(null);
    setFileContent('');
    setUnsavedChanges(false);
    setFileMenuOpen(false);
  };

  const handleCloseEditor = () => {
    window.electronAPI.close();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-vscode-bg text-vscode-text select-none relative">
      {/* New File Modal */}
      {newFilePrompt && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-start justify-center z-50 pt-20">
          <div className="bg-vscode-panel border border-vscode-border shadow-2xl p-4 w-96 rounded shadow-black/50">
            <div className="text-sm font-semibold mb-3">Create New File</div>
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. styles.css or app.js"
              className="w-full bg-[#3c3c3c] border border-vscode-border focus:border-vscode-accent outline-none text-vscode-text px-3 py-1.5 rounded-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmNewFile();
                if (e.key === 'Escape') setNewFilePrompt(false);
              }}
            />
            <div className="flex justify-end space-x-2 mt-4 text-xs">
              <button className="px-3 py-1 hover:bg-vscode-hoverBg rounded border border-transparent" onClick={() => setNewFilePrompt(false)}>Cancel</button>
              <button className="px-3 py-1 bg-vscode-accent text-white rounded hover:bg-opacity-80" onClick={confirmNewFile}>Create File</button>
            </div>
          </div>
        </div>
      )}

      {/* Title Bar */}
      <div className="h-[30px] bg-vscode-titleBar flex items-center justify-between pl-2 [app-region:drag]">
        <div className="flex items-center text-xs space-x-4 [app-region:no-drag]">
          <span className="font-semibold px-2">The Ashmi Editor</span>
          <div className="flex space-x-2 text-vscode-text/80 cursor-default relative">
            <span 
              className="hover:bg-vscode-hoverBg px-2 py-1 rounded cursor-pointer"
              onClick={() => setFileMenuOpen(!fileMenuOpen)}
            >
              File
            </span>
            {fileMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-vscode-panel border border-vscode-border shadow-lg z-50 py-1">
                <div className="px-4 py-1.5 hover:bg-vscode-hoverBg cursor-pointer" onClick={handleNewFile}>New File...</div>
                <div className="px-4 py-1.5 hover:bg-vscode-hoverBg cursor-pointer" onClick={loadWorkspace}>Open Folder...</div>
                <div className="w-full border-t border-vscode-border my-1"></div>
                <div className="px-4 py-1.5 hover:bg-vscode-hoverBg cursor-pointer" onClick={handleCloseFolder}>Close Folder</div>
                <div className="w-full border-t border-vscode-border my-1"></div>
                <div className="px-4 py-1.5 hover:bg-vscode-hoverBg cursor-pointer" onClick={handleCloseEditor}>Exit</div>
              </div>
            )}
            <span className="hover:bg-vscode-hoverBg px-2 py-1 rounded">Edit</span>
            <span className="hover:bg-vscode-hoverBg px-2 py-1 rounded">Selection</span>
            <span className="hover:bg-vscode-hoverBg px-2 py-1 rounded">View</span>
            <span className="hover:bg-vscode-hoverBg px-2 py-1 rounded cursor-pointer" onClick={handleRun}>Run</span>
          </div>
        </div>
        <div className="flex h-full [app-region:no-drag]">
          <button className="px-4 hover:bg-vscode-hoverBg transition-colors flex items-center justify-center" onClick={() => window.electronAPI.minimize()}><Minus size={14}/></button>
          <button className="px-4 hover:bg-vscode-hoverBg transition-colors flex items-center justify-center" onClick={() => window.electronAPI.maximize()}><Square size={12}/></button>
          <button className="px-4 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center" onClick={() => window.electronAPI.close()}><X size={16}/></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Sidebar */}
        <div className="w-64 bg-vscode-sidebar border-r border-vscode-border flex flex-col">
          <div className="px-4 py-2 text-xs uppercase tracking-wider text-vscode-text/70">
            {activeTab === 'explorer' && 'Explorer'}
            {activeTab === 'search' && 'Search'}
            {activeTab === 'extensions' && 'Extensions'}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'explorer' && (
              workspacePath ? (
                <Sidebar key={refreshKey} workspacePath={workspacePath} onFileSelect={openFile} onDeleteFile={handleDeleteFile} activeFile={activeFile} />
              ) : (
                <div className="p-4 flex justify-center">
                  <button onClick={loadWorkspace} className="bg-vscode-accent text-white px-4 py-1.5 rounded text-sm w-full hover:bg-opacity-80">
                    Open Folder
                  </button>
                </div>
              )
            )}
            {activeTab === 'search' && <SearchPanel workspacePath={workspacePath} onFileSelect={openFile} />}
            {activeTab === 'extensions' && <ExtensionsPanel />}
          </div>
        </div>

        {/* Main Editor & Terminal Area */}
        <div className="flex-1 flex flex-col bg-vscode-bg min-w-0">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col relative min-h-0">
            {activeTab === 'settings' ? (
              <SettingsView />
            ) : activeFile ? (
              <>
                {/* Editor Tabs */}
                <div className="flex items-center h-[35px] bg-vscode-sidebar border-b border-vscode-border">
                  <div className="flex items-center h-full px-4 bg-vscode-bg border-r border-vscode-border text-sm min-w-[120px]">
                    <span className={unsavedChanges ? "text-vscode-text italic" : "text-vscode-activeText"}>
                      {activeFile.split(/[/\\]/).pop()}
                    </span>
                    {unsavedChanges && <span className="ml-2 w-2 h-2 rounded-full bg-vscode-text/50"></span>}
                  </div>
                </div>
                {/* Breadcrumbs */}
                <div className="h-[22px] px-4 text-xs text-vscode-text/60 flex items-center border-b border-vscode-border shadow-sm">
                  {activeFile.replace(/\\/g, ' > ').replace(/\//g, ' > ')}
                </div>
                <div className="flex-1 overflow-hidden relative">
                  <Editor 
                    content={fileContent} 
                    activeFile={activeFile}
                    onChange={(newContent) => {
                      setFileContent(newContent);
                      setUnsavedChanges(true);
                    }} 
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-vscode-text/30 font-sans">
                <div className="text-center">
                  <div className="text-8xl font-thin mb-4 select-none">VS</div>
                  <div>Open a file or folder to start</div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Panel */}
          {isTerminalOpen && (
            <div className="h-64 border-t border-vscode-border flex flex-col bg-vscode-panel">
              <div className="flex items-center justify-between px-4 py-1 border-b border-vscode-border text-xs">
                <div className="flex space-x-4">
                  <span className="text-vscode-activeText border-b border-vscode-accent cursor-pointer">TERMINAL</span>
                  <span className="text-vscode-text/60 cursor-pointer hover:text-vscode-text">OUTPUT</span>
                  <span className="text-vscode-text/60 cursor-pointer hover:text-vscode-text">PROBLEMS</span>
                </div>
                <div className="flex space-x-2">
                  <button className="hover:bg-vscode-hoverBg p-1 rounded" onClick={() => setIsTerminalOpen(false)}><X size={14}/></button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden p-2">
                <TerminalPanel workspacePath={workspacePath} />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="h-6 bg-vscode-statusBar flex items-center px-2 text-xs text-white justify-between select-none">
        <div className="flex items-center space-x-3">
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">main*</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded flex items-center gap-1"><X size={12}/> 0 ⚠️ 0</span>
          <span 
            className="cursor-pointer hover:bg-white/20 px-1 rounded font-mono"
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          >
            {'>_ Terminal'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">Ln 1, Col 1</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">UTF-8</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">JavaScript</span>
        </div>
      </div>
    </div>
  );
}

export default App;
