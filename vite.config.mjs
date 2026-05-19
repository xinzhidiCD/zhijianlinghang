// vite.config.mjs
import { defineConfig } from 'vite'
import uniImport from '@dcloudio/vite-plugin-uni'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'

const uni = uniImport.default || uniImport  // 兼容处理

export default defineConfig({
  plugins: [
    uni(),     // 使用默认导出
    UnoCSS(),
    AutoImport({
      imports: ['vue', {
        '@dcloudio/uni-app': [
          'onLoad',
          'onShow',
          'onHide'
          // 你还可以加其它如 onShow、onReady 等
        ]
      }],
      dirs: ['src/composables'],
      dts: 'src/auto-imports.d.ts', // 可选，生成类型声明
      eslintrc: {
        enabled: true, // 自动为 ESLint 生成全局声明
      },
    }),
  ],
  server: {
    proxy: {  
      '/api': {
        target: 'https://api2.linghang.xinzhidi.cn',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
