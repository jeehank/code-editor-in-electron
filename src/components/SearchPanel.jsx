import React, { useState } from 'react';
import { FileCode2 } from 'lucide-react';

function SearchPanel({ workspacePath, onFileSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      if (!workspacePath) {
        alert("Please open a workspace first!");
        return;
      }
      if (!query.trim()) return;

      setIsSearching(true);
      try {
        const res = await window.electronAPI.searchWorkspace(workspacePath, query);
        setResults(res);
      } catch (err) {
        console.error("Search failed", err);
      }
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 font-sans text-[13px] text-vscode-text h-full flex flex-col">
      <div className="mb-2">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search (Press Enter)"
          className="w-full bg-[#3c3c3c] border border-transparent focus:border-vscode-accent outline-none text-vscode-text px-2 py-1 rounded-sm shadow-inner"
        />
      </div>
      <div className="mb-4 text-xs text-vscode-text/60">
        {isSearching ? 'Searching...' : `${results.length} files found`}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {results.map((result, i) => (
          <div key={i} className="mb-4">
            <div 
              className="flex items-center text-vscode-activeText mb-1 cursor-pointer hover:underline"
              onClick={() => onFileSelect(result.file)}
            >
              <FileCode2 size={14} className="mr-1 text-vscode-accent"/>
              <span className="truncate">{result.file.replace(workspacePath, '')}</span>
            </div>
            {result.matches.map((match, j) => (
              <div 
                key={j} 
                className="pl-5 pr-2 py-0.5 text-vscode-text/80 hover:bg-vscode-hoverBg cursor-pointer truncate"
                onClick={() => onFileSelect(result.file)}
                title={match.text}
              >
                <span className="text-vscode-text/40 mr-2">{match.line}</span>
                {match.text}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchPanel;
