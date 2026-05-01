import React from 'react';
import { Files, Search, Blocks, Settings } from 'lucide-react';

function ActivityBar({ activeTab, setActiveTab }) {
  const icons = [
    { id: 'explorer', icon: Files },
    { id: 'search', icon: Search },
    { id: 'extensions', icon: Blocks },
  ];

  return (
    <div className="w-12 bg-vscode-activityBar flex flex-col items-center py-2 justify-between border-r border-vscode-border">
      <div className="flex flex-col w-full">
        {icons.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full h-12 flex items-center justify-center relative ${
              activeTab === id ? 'text-vscode-activeText' : 'text-vscode-text/40 hover:text-vscode-text'
            }`}
          >
            {activeTab === id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-vscode-accent" />
            )}
            <Icon strokeWidth={activeTab === id ? 2 : 1.5} size={28} />
          </button>
        ))}
      </div>
      <div className="flex flex-col w-full">
        <button 
          onClick={() => setActiveTab('settings')}
          className={`w-full h-12 flex items-center justify-center relative ${
            activeTab === 'settings' ? 'text-vscode-activeText' : 'text-vscode-text/40 hover:text-vscode-text'
          }`}
        >
          {activeTab === 'settings' && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-vscode-accent" />
          )}
          <Settings strokeWidth={1.5} size={28} />
        </button>
      </div>
    </div>
  );
}

export default ActivityBar;
