const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { fork, exec } = require('child_process');
const http = require('http');

let mainWindow = null;
let serverProcess = null;

const BACKEND_PORT = 5000;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 1. Single Instance Lock (منع تشغيل أكثر من نسخة واحدة إطلاقاً)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // 2. دورة حياة التطبيق عند الجاهزية
  app.whenReady().then(() => {
    if (isDev) {
      // في بيئة التطوير: السيرفرات تعمل بواسطة concurrently في طرفيات منفصلة،
      // لذا نفتح نافذة واحدة فقط فوراً دون إعادة استدعاء fork
      createMainWindow();
    } else {
      // في وضع الإنتاج: تشغيل سيرفر الـ Backend في وضع Node الخالص (بدون نوافذ)
      startBackendInProduction(() => {
        createMainWindow();
      });
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

// 3. تشغيل الـ Backend في وضع الإنتاج فقط
function startBackendInProduction(onReady) {
  const serverPath = path.join(__dirname, 'backend', 'server.js');
  const userDataPath = path.join(app.getPath('userData'), 'data');

  // مهم جداً: ELECTRON_RUN_AS_NODE يضمن تشغيل الملف كـ Node خالص بدون فتح نافذة Electron GUI ثانية
  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: BACKEND_PORT,
      DATA_DIR: userDataPath
    },
    stdio: 'ignore'
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron] خطأ في تشغيل سيرفر الـ Backend:', err);
    dialog.showErrorBox('خطأ في السيرفر', 'تعذر تشغيل خادم البيانات الداخلي.');
  });

  waitForBackend(onReady);
}

// فحص جاهزية السيرفر قبل فتح النافذة
function waitForBackend(callback, retries = 35) {
  if (retries === 0) {
    dialog.showErrorBox('مهلة الاتصال', 'استغرق خادم البيانات وقتاً طويلاً للبدء.');
    return;
  }

  const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/health`, (res) => {
    if (res.statusCode === 200) {
      callback();
    } else {
      setTimeout(() => waitForBackend(callback, retries - 1), 300);
    }
  });

  req.on('error', () => {
    setTimeout(() => waitForBackend(callback, retries - 1), 300);
  });

  req.setTimeout(800, () => {
    req.destroy();
    setTimeout(() => waitForBackend(callback, retries - 1), 300);
  });
}

// 4. إنشاء نافذة الواجهة (نافذة واحدة ومحمية ضد التكرار)
function createMainWindow() {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    title: 'NovaMag | Point de Vente & Gestion de Stock',
    autoHideMenuBar: true, // إخفاء القائمة العلوية لتفادي تداخل مفاتيح Alt و F1-F12
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Gestionnaires IPC Impression Directe et Matériel
  ipcMain.removeHandler('get-printers');
  ipcMain.handle('get-printers', async () => {
    if (!mainWindow) return [];
    try {
      return await mainWindow.webContents.getPrintersAsync();
    } catch (e) {
      return [];
    }
  });

  ipcMain.removeHandler('print-direct');
  ipcMain.handle('print-direct', async (event, { html, deviceName, silent = true }) => {
    let printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    return new Promise((resolve) => {
      printWin.webContents.print({
        silent: silent,
        printBackground: true,
        deviceName: deviceName || ''
      }, (success, failureReason) => {
        try {
          printWin.close();
        } catch (e) {}
        printWin = null;
        resolve({ success, failureReason });
      });
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL(`http://localhost:${BACKEND_PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 5. إغلاق السيرفر بأمان عند غلق التطبيق
function killBackend() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

app.on('before-quit', killBackend);
app.on('will-quit', killBackend);
app.on('window-all-closed', () => {
  killBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
