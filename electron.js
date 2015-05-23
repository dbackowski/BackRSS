var backRssApi = require('./api');
var electron = require('app');
var BrowserWindow = require('browser-window');
var shell = require('shell');

backRssApi.start();

require('crash-reporter').start();

var mainWindow = null;

electron.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    electron.quit();
});

electron.on('ready', function() {
  mainWindow = new BrowserWindow({width: 1200, height: 768, "node-integration": false});

  mainWindow.loadUrl('http://localhost:8080');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });
});