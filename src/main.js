import {
  createSSRApp
} from "vue";
import App from "./App.vue";
import 'uno.css'
import pinia from './store'
import { checkAndRedirect } from '@/utils/platform.ts'
import * as commonUtils from '@/utils/common.ts'
import uvUI from '@climblee/uv-ui'

export function createApp() {
  const app = createSSRApp(App);
  app.use(pinia)
  app.use(uvUI);

  let lastConfiguredUrl = '' // 记录上次配置的URL

  app.mixin({
    onLoad() {
      checkAndRedirect()

      // 只在URL变化时才重新配置微信分享
      const currentUrl = location.href
      if (currentUrl === lastConfiguredUrl) {
        console.log('URL未变化，跳过微信分享配置')
        return
      }

      // 动态导入微信分享配置，避免阻塞启动
      import('@/utils/wechatShare').then(({ weChatShare }) => {
        const userInfo = uni.getStorageSync('loginUser') || {}
        weChatShare.setupGlobalShare({
          title: '领航通',
          desc: '欢迎观看直播',
          liveId: userInfo.liveId || '',
          visitorId: userInfo.userId || '',
          imageUrl: ''
        }).then(() => {
          lastConfiguredUrl = currentUrl // 记录已配置的URL
        })
      }).catch(error => {
        console.error('微信分享模块加载失败:', error)
      })
    },
  })
  // 将所有工具方法挂载到全局
  Object.keys(commonUtils).forEach(key => {
    uni[`$${key}`] = commonUtils[key]
    app.config.globalProperties[`$${key}`] = commonUtils[key]
  })
  return {
    app,
  };
}
