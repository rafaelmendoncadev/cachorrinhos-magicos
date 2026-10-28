import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 820,
    minWidth: 720,
    minHeight: 640,
    title: 'Cachorrinho Mágico: Classificação Mágica',
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5188/';
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
