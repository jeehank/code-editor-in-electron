export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vscode: {
          bg: '#1e1e1e',
          sidebar: '#252526',
          activityBar: '#333333',
          statusBar: '#007acc',
          titleBar: '#3c3c3c',
          panel: '#1e1e1e',
          border: '#3c3c3c',
          text: '#cccccc',
          activeText: '#ffffff',
          hoverBg: '#2a2d2e',
          activeBg: '#37373d',
          accent: '#007acc',
          error: '#f48771',
          warning: '#cca700',
          syntaxKeyword: '#c586c0',
          syntaxFunction: '#dcdcaa',
          syntaxVariable: '#9cdcfe',
          syntaxString: '#ce9178',
          syntaxNumber: '#b5cea8',
          syntaxComment: '#6a9955',
          syntaxOperator: '#d4d4d4'
        }
      },
      fontFamily: {
        mono: ['"Consolas"', '"Courier New"', 'monospace'],
        sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif']
      }
    },
  },
  plugins: [],
}
