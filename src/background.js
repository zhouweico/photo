'use strict'

import { app, protocol, BrowserWindow, dialog, Menu, nativeTheme } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path'
import fs from 'fs'
import os from 'os'
import ExifReader from 'exifreader'

const exifErrors = ExifReader.errors;
const isDevelopment = process.env.NODE_ENV !== 'production'

const template = [
  {
    label: 'Photo',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  {
    label: '文件',
    submenu: [{
      label: '打开文件',
      click: function () {
        dialog.showOpenDialog({
          defaultPath: app.getPath('downloads'),
          properties: ['openFile', 'multiSelections'],
          filters: [{
            name: 'Images',
            extensions: ['jpg', 'png', 'gif', 'webp']
          }]
        }).then(
          arg => {
            if (arg && arg.filePaths.length) {
              getFiles(arg.filePaths);
            }
          }
        );
      }
    }, {
      label: '打开文件夹',
      click: function () {
        dialog.showOpenDialog({
          defaultPath: app.getPath('downloads'),
          properties: ['openDirectory'],
          filters: [{
            name: 'Images',
            extensions: ['jpg', 'png', 'gif', 'webp']
          }]
        }).then(
          directory => {
            if (directory && directory.filePaths.length) {
              loadFiles(directory.filePaths[0]);
            }
          }
        );
      }
    }]
  },
  {
    label: '主题',
    submenu: [{
      label: '浅色',
      type: 'radio',
      checked: false,
      click: async () => {
        updateTheme('light');
      }
    }, {
      label: '深色',
      type: 'radio',
      checked: false,
      click: async () => {
        updateTheme('dark');
      }
    }, {
      label: '跟随系统',
      type: 'radio',
      checked: true,
      click: async () => {
        updateTheme('system');
      }
    }]
  },
  {
    label: '帮助',
    submenu: [
      {
        label: '帮助',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://zhouwei.co/photo')
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

var updateTheme = function (theme) {
  if (theme === 'light') {
    nativeTheme.themeSource = 'light'
    win.setBackgroundColor('black')
  } else if (theme === 'dark') {
    nativeTheme.themeSource = 'dark'
    win.setBackgroundColor('white')
  } else {
    nativeTheme.themeSource = 'system'
    win.setBackgroundColor('white')
  }
};

var loadFiles = function (dir) {
  var el = [];
  fs.readdir(dir, function (err, files) {
    if (files && files.length) {
      for (var i = 0; i < files.length; i++) {
        if (path.extname(files[i]).toLowerCase() === '.jpg' || path.extname(files[i]).toLowerCase() === '.png' || path.extname(files[i]).toLowerCase() === '.gif' || path.extname(files[i]).toLowerCase() === '.webp') {
          el.push({
            src: path.join(dir, files[i]),
            thumb: './assets/image/default.png',
            metaData: getMetaData(path.join(dir, files[i]))
          });
        }
      };
    };

    if (Array.isArray(el) && el.length) {
      //展示
    };
  });
};

var getFiles = function (filePaths) {
  var el = [];
  if (filePaths && filePaths.length) {
    for (var i = 0; i < filePaths.length; i++) {
      if (path.extname(filePaths[i]).toLowerCase() === '.jpg' || path.extname(filePaths[i]).toLowerCase() === '.png' || path.extname(filePaths[i]).toLowerCase() === '.gif' || path.extname(filePaths[i]).toLowerCase() === '.webp') {
        el.push({
          src: filePaths[i],
          thumb: './assets/image/default.png',
          metaData: getMetaData(filePaths[i])
        });
      }
    };
  };

  if (Array.isArray(el) && el.length) {
    //展示
  };
};

var getMetaData = function (file) {
  console.log(file);
  tags = ExifReader.load(file, { expanded: true }).then(function (tags) {
    // The MakerNote tag can be really large. Remove it to lower memory
    // usage if you're parsing a lot of files and saving the tags.
    if (tags.exif) {
      delete tags.exif['MakerNote'];
    }

    // If you want to extract the thumbnail you can save it like this:
    if (tags['Thumbnail'] && tags['Thumbnail'].image) {
      fs.writeFileSync(path.join(os.tmpdir(), 'thumbnail.jpg'), Buffer.from(tags['Thumbnail'].image));
    }

    // If you want to extract images from the multi-picture metadata (MPF) you can save them like this:
    if (tags['mpf'] && tags['mpf']['Images']) {
      for (let i = 0; i < tags['mpf']['Images'].length; i++) {
        fs.writeFileSync(path.join(os.tmpdir(), `mpf-image-${i}.jpg`), Buffer.from(tags['mpf']['Images'][i].image));
        // You can also read the metadata from each of these images too:
        // ExifReader.load(tags['mpf']['Images'][i].image, {expanded: true});
      }
    }

    listTags(tags);
  }).catch(function (error) {
    if (error instanceof exifErrors.MetadataMissingError) {
      console.log('No Exif data found');
    }

    console.error(error);
    process.exit(1);
  });
  console.log(tags);
}

function listTags(tags) {
  for (const group in tags) {
    for (const name in tags[group]) {
      if (group === 'gps') {
        console.log(`${group}:${name}: ${tags[group][name]}`);
      } else if ((group === 'Thumbnail') && (name === 'type')) {
        console.log(`${group}:${name}: ${tags[group][name]}`);
      } else if ((group === 'Thumbnail') && (name === 'image')) {
        console.log(`${group}:${name}: <image>`);
      } else if ((group === 'Thumbnail') && (name === 'base64')) {
        console.log(`${group}:${name}: <base64 encoded image>`);
      } else if ((group === 'mpf') && (name === 'Images')) {
        console.log(`${group}:${name}: ${getMpfImagesDescription(tags[group][name])}`);
      } else if ((group === 'xmp') && (name === '_raw')) {
        console.log(`${group}:${name}: <XMP data string>`);
      } else if (Array.isArray(tags[group][name])) {
        console.log(`${group}:${name}: ${tags[group][name].map((item) => item.description).join(', ')}`);
      } else {
        console.log(`${group}:${name}: ${typeof tags[group][name].description === 'string' ? tags[group][name].description.trim() : tags[group][name].description}`);
      }
    }
  }
}

function getMpfImagesDescription(images) {
  return images.map(
    (image, index) => `(${index}) ` + Object.keys(image).map((key) => {
      if (key === 'image') {
        return `${key}: <image>`;
      }
      if (key === 'base64') {
        return `${key}: <base64 encoded image>`;
      }
      return `${key}: ${image[key].description}`;
    }).join(', ')
  ).join('; ');
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

var win;

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
