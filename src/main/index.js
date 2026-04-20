const path = require('path');
const { app, BrowserWindow } = require('electron');

require('./db');

const { registerFoodGroupHandlers } = require('./ipc/food-group.handlers');
const { registerFoodHandlers } = require('./ipc/food.handlers');
const { registerTableHandlers } = require('./ipc/table.handlers');
const { registerComboHandlers } = require('./ipc/combo.handlers');
const { registerOrderHandlers } = require('./ipc/order.handlers');
const { registerAnalyticsHandlers } = require('./ipc/analytics.handlers');

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  return mainWindow;
}

app.whenReady().then(() => {
  registerFoodGroupHandlers();
  registerFoodHandlers();
  registerTableHandlers();
  registerComboHandlers();
  registerOrderHandlers();
  registerAnalyticsHandlers();

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
