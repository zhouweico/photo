const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})

// 配置 Electron builder
// Electron Builder配置选项 https://www.electron.build/configuration/configuration
// Example https://www.electron.build/api/programmatic-usage
module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        appId: "org.weilabs.photo",
        productName: "Photo",
        copyright: "Copyright © 2023 ${author}",
        mac: {
          icon: "src/assets/icons/icon.icns",
          category: "public.app-category.graphics-design",
        },
        win: {
          icon: "src/assets/icons/icon.ico",
        },
        linux: {
          icon: "src/assets/icons/icon.png",
          category: "Graphics",
        }
      }
    }
  }
}

// 配置本地 python 路径
process.env.PYTHON_PATH = '/usr/local/bin/python'
