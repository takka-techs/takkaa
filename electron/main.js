import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store settings like backup path
const settingsPath = path.join(app.getPath('userData'), 'takka_settings.json');
function getSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    return { backupPath: path.join(app.getPath('documents'), 'Takka_Backup.json') };
  }
}
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

let mainWindow;

// حدود وخطوة الزوم
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setVisualZoomLevelLimits(1, 3);
  });

  // التحكم في الزوم بالكيبورد: Ctrl/Cmd + = / - / 0
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isZoomModifier = input.control || input.meta; // Cmd على ماك، Ctrl على ويندوز/لينكس
    if (!isZoomModifier || input.type !== 'keyDown') return;

    const wc = mainWindow.webContents;
    const currentZoom = wc.getZoomFactor();

    if (input.key === '=' || input.key === '+') {
      // Zoom In
      event.preventDefault();
      const newZoom = Math.min(ZOOM_MAX, +(currentZoom + ZOOM_STEP).toFixed(2));
      wc.setZoomFactor(newZoom);
    } else if (input.key === '-' || input.key === '_') {
      // Zoom Out
      event.preventDefault();
      const newZoom = Math.max(ZOOM_MIN, +(currentZoom - ZOOM_STEP).toFixed(2));
      wc.setZoomFactor(newZoom);
    } else if (input.key === '0') {
      // Reset Zoom (الخط يرجع طبيعي)
      event.preventDefault();
      wc.setZoomFactor(1);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  Menu.setApplicationMenu(null);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      mainWindow.setMenuBarVisibility(false);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for backup
ipcMain.handle('get-backup-path', () => {
  return getSettings().backupPath;
});

ipcMain.handle('set-backup-path', async () => {
  const settings = getSettings();
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'تحديد مسار الحفظ التلقائي للنسخة الاحتياطية',
    defaultPath: settings.backupPath || path.join(app.getPath('documents'), 'Takka_Backup.json'),
    filters: [{ name: 'JSON Backup', extensions: ['json'] }]
  });

  if (!canceled && filePath) {
    settings.backupPath = filePath;
    saveSettings(settings);
    return filePath;
  }
  return null;
});

ipcMain.handle('save-backup', async (event, data) => {
  const settings = getSettings();
  const backupPath = settings.backupPath;
  if (!backupPath) {
    return { success: false, error: 'مسار الحفظ غير محدد' };
  }
  try {
    fs.writeFileSync(backupPath, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    return { success: true, path: backupPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});