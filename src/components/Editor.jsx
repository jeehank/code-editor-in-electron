import React from 'react';
import MonacoEditor from '@monaco-editor/react';

function Editor({ content, onChange, activeFile }) {
  const handleEditorChange = (value) => {
    onChange(value || '');
  };

  let language = 'plaintext';
  if (activeFile) {
    const ext = activeFile.split('.').pop().toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        language = 'javascript';
        break;
      case 'ts':
      case 'tsx':
        language = 'typescript';
        break;
      case 'html':
        language = 'html';
        break;
      case 'css':
        language = 'css';
        break;
      case 'json':
        language = 'json';
        break;
      case 'md':
      case 'markdown':
        language = 'markdown';
        break;
      case 'py':
        language = 'python';
        break;
      case 'cpp':
      case 'c':
      case 'h':
        language = 'cpp';
        break;
      case 'txt':
        language = 'plaintext';
        break;
      default:
        language = 'plaintext';
    }
  }

  return (
    <div className="w-full h-full">
      <MonacoEditor
        height="100%"
        language={language}
        theme="vs-dark"
        value={content}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: '"Consolas", "Courier New", monospace',
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 16 }
        }}
      />
    </div>
  );
}

export default Editor;
