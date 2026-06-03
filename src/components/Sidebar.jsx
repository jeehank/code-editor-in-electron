import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FileCode2, Folder } from 'lucide-react';

function FileNode({ node, onFileSelect, onDeleteFile, activeFile, depth = 0, setContextMenu }) {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    if (isOpen && node.isDirectory && children.length === 0) {
      window.electronAPI.readDir(node.path).then(setChildren);
    }
  }, [isOpen, node]);

  const handleClick = () => {
    if (node.isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node.path);
    }
  };

  const isActive = activeFile === node.path;

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!node.isDirectory) {
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, node });
    }
  };

  return (
    <div>
      <div 
        className={`flex items-center cursor-pointer hover:bg-vscode-hoverBg py-[2px] ${isActive ? 'bg-vscode-activeBg text-vscode-activeText' : 'text-vscode-text/80'}`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="w-4 h-4 flex items-center justify-center mr-1 text-vscode-text/60">
          {node.isDirectory ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div className="w-4" />
          )}
        </div>
        <div className="mr-1 text-vscode-accent">
           {node.isDirectory ? <Folder size={14} className="text-vscode-text/60" /> : <FileCode2 size={14} />}
        </div>
        <span className="truncate leading-none select-none">{node.name}</span>
      </div>
      
      {isOpen && node.isDirectory && (
        <div className="flex flex-col">
          {children.map((child, i) => (
            <FileNode 
              key={child.path + i} 
              node={child} 
              onFileSelect={onFileSelect} 
              onDeleteFile={onDeleteFile}
              activeFile={activeFile} 
              depth={depth + 1} 
              setContextMenu={setContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ workspacePath, onFileSelect, onDeleteFile, activeFile }) {
  const [rootFiles, setRootFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null });

  useEffect(() => {
    if (workspacePath) {
      window.electronAPI.readDir(workspacePath).then(setRootFiles);
    }
  }, [workspacePath]);

  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, node: null });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleDelete = () => {
    if (contextMenu.node) {
      onDeleteFile(contextMenu.node.path);
    }
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  };

  return (
    <div className="flex-1 overflow-y-auto font-sans text-[13px] relative">
      <div className="flex flex-col">
        {rootFiles.map((file, i) => (
          <FileNode 
            key={file.path + i} 
            node={file} 
            onFileSelect={onFileSelect} 
            onDeleteFile={onDeleteFile}
            activeFile={activeFile} 
            setContextMenu={setContextMenu}
          />
        ))}
      </div>

      {contextMenu.visible && (
        <div 
          className="fixed bg-vscode-panel border border-vscode-border shadow-xl z-50 py-1 rounded-sm w-32"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div 
            className="px-4 py-1 text-vscode-text hover:bg-vscode-hoverBg hover:text-vscode-activeText cursor-pointer text-xs"
            onClick={handleDelete}
          >
            Delete
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
