var backRssApi = require('./api');
var electron = require('app');
var BrowserWindow = require('browser-window');
var shell = require('shell');
var Menu = require('menu');
var MenuItem = require('menu-item');

backRssApi.start();

var mainWindow = null;
var aboutWindow = null;
var menuTemplate = null;

if (process.platform !== 'darwin') {
  menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'Ctrl+Q',
          click: function() {
            backRssApi.stop();
            electron.quit();
          }
        },
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Ctrl+Z',
          selector: 'undo:'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Ctrl+Z',
          selector: 'redo:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'Ctrl+X',
          selector: 'cut:'
        },
        {
          label: 'Copy',
          accelerator: 'Ctrl+C',
          selector: 'copy:'
        },
        {
          label: 'Paste',
          accelerator: 'Ctrl+V',
          selector: 'paste:'
        },
        {
          label: 'Select All',
          accelerator: 'Ctrl+A',
          selector: 'selectAll:'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About BackRSS',
          click: function() {
            if (!aboutWindow) {
              aboutWindow = new BrowserWindow({ width: 400, height: 120, "node-integration": false, frame: true,
                                                resizable: false, "always-on-top": true });
              aboutWindow.loadUrl('http://localhost:8080/about.html');

              aboutWindow.on('closed', function () {
                aboutWindow = null;
              });
            }
          }
        }
      ]
    }
  ];
} else {
  menuTemplate = [
    {
      label: 'BackRSS',
      submenu: [
        {
          label: 'About BackRSS',
          click: function() {
            if (!aboutWindow) {
              aboutWindow = new BrowserWindow({ width: 400, height: 120, "node-integration": false, frame: true,
                                                resizable: false, "always-on-top": true });
              aboutWindow.setMenu(null);
              aboutWindow.loadURL('http://localhost:8080/about.html');

              aboutWindow.on('closed', function () {
                aboutWindow = null;
              });
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() {
            backRssApi.stop();
            electron.quit();
          }
        },
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'Command+Z',
          selector: 'undo:'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+Command+Z',
          selector: 'redo:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'Command+X',
          selector: 'cut:'
        },
        {
          label: 'Copy',
          accelerator: 'Command+C',
          selector: 'copy:'
        },
        {
          label: 'Paste',
          accelerator: 'Command+V',
          selector: 'paste:'
        },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:'
        }
      ]
    },
  ];
}

function createMainWindow() {
  mainWindow = new BrowserWindow({ width: 1200, height: 768, "node-integration": false, icon: __dirname + '/public/images/icon.png'});
  mainWindow.loadURL('http://localhost:8080');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });
}

electron.on('ready', createMainWindow);

electron.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    electron.quit();
});

electron.on('activate', function () {
  if (mainWindow === null) {
    createMainWindow();
  }
});
