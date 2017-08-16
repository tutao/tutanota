const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const shell = require('electron').shell;

let main_window;

//When app is ready
app.on('ready', () => {
  //Create main window
  main_window = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'graphics/linux.png')
  });

  //Load main window url
  main_window.loadURL(url.format({
    pathname: path.join(__dirname, 'update_checker.html'),
    protocol: 'file:',
    slashes: true
  }));

  //Developer tools
  //main_window.toggleDevTools();

  //Set main window title
  main_window.setTitle("Tutanota");

  //On main window close exit the application
  main_window.on('closed', () => {
    main_window = null;
    app.exit();
  });

  //Open all new window in the default browser instead
  main_window.webContents.on("new-window", (event, url, frame_name, disposition, options) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});