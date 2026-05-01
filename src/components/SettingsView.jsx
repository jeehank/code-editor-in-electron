import React from 'react';

function SettingsView() {
  return (
    <div className="p-8 font-sans text-vscode-text h-full overflow-y-auto">
      <h1 className="text-2xl font-light mb-6 text-vscode-activeText">Settings</h1>
      
      <div className="space-y-6 max-w-2xl">
        {/* Editor Font Size */}
        <div className="bg-vscode-panel p-4 border border-vscode-border">
          <div className="font-semibold mb-1">Editor: Font Size</div>
          <div className="text-xs text-vscode-text/60 mb-3">Controls the font size in pixels.</div>
          <input 
            type="number" 
            defaultValue={14}
            className="bg-[#3c3c3c] border border-transparent focus:border-vscode-accent outline-none px-2 py-1 rounded-sm w-32"
          />
          <div className="text-xs text-vscode-text/40 mt-2 italic">Note: Full settings synchronization is a TODO for the next AI.</div>
        </div>

        {/* Word Wrap */}
        <div className="bg-vscode-panel p-4 border border-vscode-border flex items-center justify-between">
          <div>
            <div className="font-semibold mb-1">Editor: Word Wrap</div>
            <div className="text-xs text-vscode-text/60">Controls how lines should wrap.</div>
          </div>
          <select className="bg-[#3c3c3c] border border-vscode-border outline-none px-2 py-1 rounded-sm">
            <option>on</option>
            <option>off</option>
          </select>
        </div>
        
      </div>
    </div>
  );
}

export default SettingsView;
