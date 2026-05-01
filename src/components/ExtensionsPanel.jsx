import React from 'react';

function ExtensionsPanel() {
  return (
    <div className="flex flex-col h-full font-sans text-[13px] text-vscode-text">
      <div className="p-4 border-b border-vscode-border">
        <input 
          type="text" 
          placeholder="Search Extensions in Marketplace"
          className="w-full bg-[#3c3c3c] border border-transparent focus:border-vscode-accent outline-none text-vscode-text px-2 py-1.5 rounded-sm shadow-inner text-xs"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 text-center text-vscode-text/50">
        No extensions installed.
      </div>
    </div>
  );
}

export default ExtensionsPanel;
