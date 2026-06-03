const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const os = require('os');
let pty;
try {
  pty = require('node-pty');
} catch (e) {
  console.log('node-pty not available, falling back or erroring');
}

let mainWindow;
let ptyProcess;
let forceClose = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#1e1e1e'
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (e) => {
    if (forceClose) return;
    e.preventDefault();
    mainWindow.webContents.send('window-close-request');
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle('window:close', () => mainWindow.close());
ipcMain.handle('window:close-confirm', () => {
  forceClose = true;
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('dialog:showMessageBox', async (_, options) => {
  return await dialog.showMessageBox(mainWindow, options);
});

async function readDirectoryRecursive(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        isDirectory: true,
        path: fullPath,
        children: []
      });
    } else {
      result.push({ name: entry.name, isDirectory: false, path: fullPath });
    }
  }
  return result.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
    return a.isDirectory ? -1 : 1;
  });
}

ipcMain.handle('fs:readDir', async (_, dirPath) => {
  try {
    return await readDirectoryRecursive(dirPath);
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('fs:saveFile', async (_, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
});

async function searchInDirectory(dirPath, query, results) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await searchInDirectory(fullPath, query, results);
      } else {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          if (content.includes(query)) {
            const lines = content.split('\n');
            const matches = [];
            lines.forEach((line, index) => {
              if (line.includes(query)) {
                matches.push({ line: index + 1, text: line.trim() });
              }
            });
            if (matches.length > 0) {
              results.push({ file: fullPath, matches });
            }
          }
        } catch (e) {
        }
      }
    }
  } catch (error) {
    console.error('Error searching directory:', error);
  }
}

ipcMain.handle('fs:searchWorkspace', async (_, dirPath, query) => {
  if (!dirPath || !query) return [];
  const results = [];
  await searchInDirectory(dirPath, query, results);
  return results;
});

ipcMain.handle('fs:createFile', async (_, filePath) => {
  try {
    await fs.writeFile(filePath, '', { flag: 'wx' });
    return true;
  } catch (error) {
    console.error('Error creating file:', error);
    return false;
  }
});

ipcMain.handle('fs:deleteFile', async (_, filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
});

ipcMain.handle('terminal:spawn', (_, cwd) => {
  if (!pty) return false;
  const shell = process.env[process.platform === 'win32' ? 'COMSPEC' : 'SHELL'] || 'cmd.exe';
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: cwd || process.env.HOME || process.env.USERPROFILE,
    env: process.env
  });

  ptyProcess.onData((data) => {
    if (mainWindow) {
      mainWindow.webContents.send('terminal:data', data);
    }
  });
  return true;
});

ipcMain.handle('terminal:write', (_, data) => {
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.handle('terminal:resize', (_, cols, rows) => {
  if (ptyProcess) {
    ptyProcess.resize(cols, rows);
  }
});
