const { app, BrowserWindow, screen, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let tray = null;
let win = null;
let clickThrough = true;
let clickThroughShortcut = 'Control+Shift+F10' //Shortcut sa arati text boxul pentru trimis mesaje
const showInputCSS = 'input#messageinput{ background-color: rgba(0, 0, 0, 0.15); border: 0px} .form-group {padding-left: 0px !important; width: 300px !important; display: block} #messageinput::placeholder{opacity: 0;} #messageinput, fieldset#messagefieldset, #messageform{ max-height: 35px; display: block }'

function createTray() {
  const iconPath = path.join(__dirname, 'tray-icon.ico'); 
  const trayIcon = nativeImage.createFromPath(iconPath);

  if (trayIcon.isEmpty()) {
    console.error(' Tray icon failed to load:', iconPath);
    return;
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Wf Overlay');
  tray.setContextMenu(createTrayMenu());
}

function createTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: clickThrough ? 'Disable ClickThrough' : 'Enable ClickThrough',
      click: () => {
        clickThrough = !clickThrough;
        if (win) {
          win.setIgnoreMouseEvents(clickThrough);
        }

        if(!clickThrough){
          win.webContents.insertCSS(showInputCSS)
          .then(() => {
            console.log('Show input css injected');
          })
        }else {
           win.webContents.insertCSS(`.form-group {display: none}`)
          .then(() => {
            console.log('Hide input css injected');
          })
        }
        tray.setContextMenu(createTrayMenu());
      }
    },
    {
      label: 'Show App',
      click: () => {
        if (win) win.show();
      }
    },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const winHeight = 200;

  win = new BrowserWindow({
    width: width,
    height: winHeight,
    x: 0,
    y: height - winHeight,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    autoHideMenuBar: true,
    backgroundColor: '#01000000',
    titleBarStyle: 'hidden',
    acceptFirstMouse: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);
  win.removeMenu();

  if (clickThrough) {
    win.setIgnoreMouseEvents(true);
  }

  win.webContents.on('did-finish-load', () => {
    const defaultCSS = `
 body { background-color: transparent !important; margin: 0px auto; overflow: hidden; border: 0 !important}.card-header.pt-1, #logo_block, .navbar, .sidebar, span, .badge, div#more_messages, div#pushalertwrapper, button.btn.btn-primary.px-3.px-md-4, .user_avatar { display: none !important} div{ background-color: transparent !important; color: #fff} div {text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;} ::-webkit-scrollbar{ display: none} img{
max-height: 30px !important} div{ font-size: 24px } 
      .thebodywrapper{max-width: 100% !important; margin: 0 !important} .row {display: block !important} .main{max-width: 100% !important, width: 100% !important} .card{ border: 0 !important} 
    .form-group {display: none}; .card{ border: 0 !important}  #pushalertwrapper + div { display: none; } .card .card-body.p-2.p-md-3{ padding-left: 5px !important} .golddd{text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; -webkit-text-fill-color: #000}
    .golddd{text-shadow: -1px -0.05px 0 #c3a343, 0.05px -0.05px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000 !important;}
      `;

    const extraCSS = fs.readFileSync(path.join(__dirname, 'user-style.css'), 'utf-8');

    win.webContents.insertCSS(defaultCSS + extraCSS)
      .then(() => {
        console.log('Default CSS injected!');
      })
      .catch((err) => {
        console.error('Failed to inject custom CSS:', err);
      });
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadURL('https://wap-forum.info/#');
}

function registerShortcuts() {
  globalShortcut.register(clickThroughShortcut, () => {
    clickThrough = !clickThrough;
    if (win) win.setIgnoreMouseEvents(clickThrough);

      if(!clickThrough){
          win.show();
    win.focus();
        win.webContents.insertCSS(showInputCSS)
        .then(() => {
          console.log('Show input css injected');

          if (win && win.webContents) {
        const script = `
          try {
            const el = document.getElementById('messageinput');
            if (el) {
              el.style.display = 'block';
              el.focus();
              'input shown and focused';
            } else {
              'input not found';
            }
          } catch (e) {
            'error: ' + e.message;
          }
        `;
        win.webContents.executeJavaScript(script)
        .then(() => console.log('Input showed'))
        .catch(console.error);
      }
        })
      }else {
       const script = `
          try {
            const el = document.getElementById('messageinput');
            if (el) {
              el.style.display = 'none';
              'input hidden';
            } else {
              'input not found';
            }
          } catch (e) {
            'error: ' + e.message;
          }
      `;
      win.webContents.executeJavaScript(script)
        .then(() => console.log('Input hidden'))
        .catch(console.error);
      }
  
    console.log('ClickThrough:', clickThrough);
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.disableHardwareAcceleration();



app.whenReady().then(() => {
  createTray();
  createWindow(); 
  registerShortcuts();
});


// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});
