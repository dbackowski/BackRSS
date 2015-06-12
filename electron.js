var backRssApi = require('./api');
var electron = require('app');
var BrowserWindow = require('browser-window');
var shell = require('shell');
var Menu = require('menu');
var MenuItem = require('menu-item');

backRssApi.start();

require('crash-reporter').start();

var mainWindow = null;

var menuTemplate = [
  {
    label: 'BackRSS',
    submenu: [
      {
        label: 'About BackRSS',
        click: function() {
          var aboutWindow = new BrowserWindow({ width: 400, height: 150, "node-integration": false, frame: true, resizable: false });

          aboutWindow.loadUrl('http://localhost:8080/about.html');
          console.log('aaaa');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: function() { electron.quit(); }
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

electron.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    electron.quit();
});

electron.on('ready', function() {
  mainWindow = new BrowserWindow({ width: 1200, height: 768, "node-integration": false });

  mainWindow.loadUrl('http://localhost:8080');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });
});