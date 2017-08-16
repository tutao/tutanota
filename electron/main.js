const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

let main_window;

function CreateWindow () {

  main_window = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'graphics/linux.png')
  });

  main_window.loadURL(url.format({
    pathname: path.join(__dirname, 'update_checker.html'),
    protocol: 'file:',
    slashes: true
  }));

  //main_window.toggleDevTools();

  main_window.setTitle("Tutanota");

  main_window.on('closed', () => {
    main_window = null;
  });
}

app.on('ready', CreateWindow);
