import { useState, useEffect, useCallback } from 'react';
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
  const [panes, setPanes] = useState([]);
  const [activePaneIndex, setActivePaneIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState('explorer');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [newFilePrompt, setNewFilePrompt] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWorkspace = async () => {
    const folderPath = await window.electronAPI.openFolderDialog();
    if (folderPath) {
      setWorkspacePath(folderPath);
    }
  };

  const openFile = async (filePath) => {
    const existingIndex = panes.findIndex(p => p.filePath === filePath);
    if (existingIndex !== -1) {
      setActivePaneIndex(existingIndex);
      return;
    }

    try {
      const content = await window.electronAPI.readFile(filePath);
      const newPane = {
        filePath,
        content,
        originalContent: content
      };

      setPanes(prevPanes => {
        const nextPanes = [...prevPanes];
        if (activePaneIndex >= 0 && activePaneIndex < nextPanes.length) {
          const activePane = nextPanes[activePaneIndex];
          if (!activePane.filePath) {
            nextPanes[activePaneIndex] = newPane;
            return nextPanes;
          } else {
            nextPanes.splice(activePaneIndex + 1, 0, newPane);
            setActivePaneIndex(activePaneIndex + 1);
            return nextPanes;
          }
        } else {
          nextPanes.push(newPane);
          setActivePaneIndex(nextPanes.length - 1);
          return nextPanes;
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveCurrentFile = useCallback(async () => {
    if (activePaneIndex >= 0 && activePaneIndex < panes.length) {
      const pane = panes[activePaneIndex];
      if (pane.filePath && pane.content !== pane.originalContent) {
        try {
          await window.electronAPI.saveFile(pane.filePath, pane.content);
          setPanes(prevPanes => {
            const nextPanes = [...prevPanes];
            nextPanes[activePaneIndex] = {
              ...nextPanes[activePaneIndex],
              originalContent: pane.content
            };
            return nextPanes;
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [activePaneIndex, panes]);

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
    if (activePaneIndex >= 0 && activePaneIndex < panes.length) {
      const activePane = panes[activePaneIndex];
      if (activePane.filePath) {
        setTimeout(() => {
          window.electronAPI.writeTerminal(`node "${activePane.filePath}"\r`);
        }, 500);
      }
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
        setPanes(prevPanes => {
          const nextPanes = prevPanes.filter(p => p.filePath !== filePath);
          if (nextPanes.length === 0) {
            setActivePaneIndex(-1);
          } else if (activePaneIndex >= nextPanes.length) {
            setActivePaneIndex(nextPanes.length - 1);
          }
          return nextPanes;
        });
        if (workspacePath) {
          loadWorkspaceSilent(workspacePath);
        }
      } else {
        alert("Failed to delete file. Please ensure the app has been restarted.");
      }
    }
  };

  const loadWorkspaceSilent = async (path) => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCloseFolder = () => {
    setWorkspacePath(null);
    setPanes([]);
    setActivePaneIndex(-1);
    setFileMenuOpen(false);
  };

  const handleCloseEditor = () => {
    window.electronAPI.close();
  };

  const splitPane = (index) => {
    const paneToCopy = panes[index];
    const newPane = {
      filePath: paneToCopy ? paneToCopy.filePath : null,
      content: paneToCopy ? paneToCopy.content : '',
      originalContent: paneToCopy ? paneToCopy.originalContent : '',
    };
    
    setPanes(prevPanes => {
      const nextPanes = [...prevPanes];
      nextPanes.splice(index + 1, 0, newPane);
      return nextPanes;
    });
    setActivePaneIndex(index + 1);
  };

  const closePane = async (index) => {
    const pane = panes[index];
    const isDirty = pane.filePath && pane.content !== pane.originalContent;
    
    if (isDirty) {
      const fileName = pane.filePath.split(/[/\\]/).pop();
      const result = await window.electronAPI.showMessageBox({
        type: 'warning',
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        title: 'Save Changes',
        message: `Do you want to save the changes you made to ${fileName}?`,
        detail: "Your changes will be lost if you don't save them."
      });

      if (result.response === 0) {
        try {
          await window.electronAPI.saveFile(pane.filePath, pane.content);
        } catch (e) {
          console.error(e);
          return;
        }
      } else if (result.response === 2) {
        return;
      }
    }
    
    setPanes(prevPanes => {
      const nextPanes = prevPanes.filter((_, i) => i !== index);
      if (nextPanes.length === 0) {
        setActivePaneIndex(-1);
      } else if (activePaneIndex >= nextPanes.length) {
        setActivePaneIndex(nextPanes.length - 1);
      } else if (activePaneIndex === index) {
        setActivePaneIndex(Math.max(0, index - 1));
      }
      return nextPanes;
    });
  };

  const updatePaneContent = (index, newContent) => {
    setPanes(prevPanes => {
      const nextPanes = [...prevPanes];
      if (index >= 0 && index < nextPanes.length) {
        nextPanes[index] = {
          ...nextPanes[index],
          content: newContent
        };
      }
      return nextPanes;
    });
  };

  useEffect(() => {
    const handleCloseRequest = async () => {
      const unsavedPanes = panes.filter(p => p.filePath && p.content !== p.originalContent);
      for (const pane of unsavedPanes) {
        const fileName = pane.filePath.split(/[/\\]/).pop();
        const result = await window.electronAPI.showMessageBox({
          type: 'warning',
          buttons: ['Save', "Don't Save", 'Cancel'],
          defaultId: 0,
          cancelId: 2,
          title: 'Save Changes',
          message: `Do you want to save the changes you made to ${fileName}?`,
          detail: "Your changes will be lost if you don't save them."
        });

        if (result.response === 0) {
          try {
            await window.electronAPI.saveFile(pane.filePath, pane.content);
          } catch (e) {
            console.error(e);
            return;
          }
        } else if (result.response === 2) {
          return;
        }
      }
      window.electronAPI.confirmClose();
    };

    window.electronAPI.onWindowCloseRequest(handleCloseRequest);
  }, [panes]);

  const activeFile = (activePaneIndex >= 0 && activePaneIndex < panes.length) ? panes[activePaneIndex].filePath : null;

  const getLanguageName = (filePath) => {
    if (!filePath) return 'Plain Text';
    const ext = filePath.split('.').pop().toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx': return 'JavaScript';
      case 'ts':
      case 'tsx': return 'TypeScript';
      case 'html': return 'HTML';
      case 'css': return 'CSS';
      case 'json': return 'JSON';
      case 'md':
      case 'markdown': return 'Markdown';
      case 'py': return 'Python';
      case 'cpp':
      case 'c':
      case 'h': return 'C++';
      default: return 'Plain Text';
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-vscode-bg text-vscode-text select-none relative">
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
          <button className="px-4 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center" onClick={handleCloseEditor}><X size={16}/></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ActivityBar activeTab={activeTab} setActiveTab={setActiveTab} />

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

        <div className="flex-1 flex flex-col bg-vscode-bg min-w-0">
          <div className="flex-1 flex flex-col relative min-h-0">
            {activeTab === 'settings' ? (
              <SettingsView />
            ) : panes.length > 0 ? (
              <div className="flex-1 flex overflow-hidden divide-x divide-vscode-border">
                {panes.map((pane, index) => {
                  const isActive = index === activePaneIndex;
                  const isDirty = pane.filePath && pane.content !== pane.originalContent;
                  const fileName = pane.filePath ? pane.filePath.split(/[/\\]/).pop() : 'Untitled';

                  return (
                    <div 
                      key={index} 
                      className={`flex-1 flex flex-col min-w-0 relative ${isActive ? 'ring-1 ring-inset ring-vscode-accent/30' : ''}`}
                      onClick={() => setActivePaneIndex(index)}
                    >
                      <div className="flex items-center justify-between h-[35px] bg-vscode-sidebar border-b border-vscode-border">
                        <div className="flex items-center h-full px-4 bg-vscode-bg border-r border-vscode-border text-sm min-w-[120px] justify-between group">
                          <span className={isDirty ? "text-vscode-text italic truncate pr-2" : "text-vscode-activeText truncate pr-2"}>
                            {fileName}
                          </span>
                          <div className="flex items-center space-x-1">
                            {isDirty && <span className="w-2 h-2 rounded-full bg-vscode-text/50"></span>}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                closePane(index);
                              }} 
                              className="text-vscode-text/40 hover:text-vscode-text hover:bg-vscode-hoverBg rounded p-0.5 ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center pr-2 space-x-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              splitPane(index);
                            }}
                            title="Split Editor Right"
                            className="text-vscode-text/60 hover:text-vscode-text hover:bg-vscode-hoverBg p-1 rounded"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M1.5 2.5A1.5 1.5 0 0 1 3 1h10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 13 15H3a1.5 1.5 0 0 1-1.5-1.5v-11zM3 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h4.5V2H3zm5.5 12H13a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5H8.5v12z"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {pane.filePath && (
                        <div className="h-[22px] px-4 text-xs text-vscode-text/60 flex items-center border-b border-vscode-border shadow-sm truncate">
                          {pane.filePath.replace(/\\/g, ' > ').replace(/\//g, ' > ')}
                        </div>
                      )}

                      <div className="flex-1 overflow-hidden relative">
                        <Editor 
                          content={pane.content} 
                          activeFile={pane.filePath}
                          onChange={(newContent) => {
                            updatePaneContent(index, newContent);
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-vscode-text/30 font-sans">
                <div className="text-center">
                  <div className="text-8xl font-thin mb-4 select-none">VS</div>
                  <div>Open a file or folder to start</div>
                </div>
              </div>
            )}
          </div>

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
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">
            {getLanguageName(activeFile)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
