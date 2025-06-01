const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
let win;
let tray;
require('./server.js'); // This starts the HTTP server

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Start hidden
    webPreferences: { nodeIntegration: true }
  });
  win.loadFile('index.html'); // Or your app's entry point
}

app.whenReady().then(() => {
  createWindow();

  const icon = nativeImage.createFromPath('image.ico'); // Use your icon
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => win.show() },
    { label: 'Hide App', click: () => win.hide() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Interview Question Bank');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => win.show());
});

app.on('window-all-closed', (e) => {
  e.preventDefault(); // Prevent app from quitting when window closed
});