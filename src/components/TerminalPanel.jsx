import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

function TerminalPanel({ workspacePath }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#cccccc',
        selectionBackground: '#3a3d41'
      },
      fontFamily: '"Consolas", "Courier New", monospace',
      fontSize: 13,
      cursorBlink: true,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to Electron IPC
    window.electronAPI.spawnTerminal(workspacePath);

    term.onData((data) => {
      window.electronAPI.writeTerminal(data);
    });

    window.electronAPI.onTerminalData((data) => {
      term.write(data);
    });

    const handleResize = () => {
      fitAddon.fit();
      window.electronAPI.resizeTerminal(term.cols, term.rows);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial size
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  return <div ref={terminalRef} className="w-full h-full" />;
}

export default TerminalPanel;
