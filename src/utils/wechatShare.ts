import { getWeChatJSSDKConfig } from '@/api/setting'

// 全局微信分享配置
export class WeChatShareManager {
  private static instance: WeChatShareManager
  private shareConfig: any = {}
  private isConfiguring = false // 防止重复配置
  private initialUrl = '' // 保存页面初始URL，用于iOS微信JSSDK

  static getInstance() {
    if (!WeChatShareManager.instance) {
      WeChatShareManager.instance = new WeChatShareManager()
      // 初始化时保存URL
      WeChatShareManager.instance.saveInitialUrl()
    }
    return WeChatShareManager.instance
  }

  // 保存页面初始URL
  private saveInitialUrl() {
    if (typeof window !== 'undefined') {
      // 优先使用App.vue中处理好的URL
      const appProcessedUrl = localStorage.getItem('wechat_share_url')
      if (appProcessedUrl) {
        this.initialUrl = appProcessedUrl
        console.log('使用App.vue处理的URL:', this.initialUrl)
        return
      }

      // 兜底逻辑：如果没有App处理的URL，使用原来的逻辑
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
      
      if (isIOS) {
        // iOS设备：尝试从localStorage获取缓存的URL
        const cachedUrl = localStorage.getItem('shurl')
        if (cachedUrl) {
          this.initialUrl = cachedUrl
          console.log('使用iOS缓存URL:', this.initialUrl)
        } else {
          this.initialUrl = window.location.href.split('#')[0]
          console.log('iOS设备但无缓存URL，使用当前URL:', this.initialUrl)
        }
      } else {
        // 非iOS设备：直接使用当前URL
        this.initialUrl = window.location.href.split('#')[0]
        console.log('非iOS设备，使用当前URL:', this.initialUrl)
      }
    }
  }

  // 设置全局分享内容
  async setupGlobalShare(options: {
    title?: string
    desc?: string
    liveId?: string
    visitorId?: string
    imageUrl?: string
  }) {
    // 防止重复配置
    if (this.isConfiguring) {
      console.log('微信分享配置正在进行中，跳过重复调用')
      return
    }

    // 检查是否在微信浏览器中
    if (!this.isWeChatBrowser()) {
      // console.log('非微信浏览器，跳过分享配置')
      return
    }

    // 检查白名单页面，白名单页面跳过分享配置
    const whiteList = [
      "pagesPc/login/login",
      "pages/login/login",
      "pagesPc/login/callback",
      "pages/login/callback",
      "pages/agree",
      "pages/home/invite",
    ]
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage?.route || "";
    
    if (whiteList.includes(route)) {
      console.log('白名单页面，跳过微信分享配置但保存URL:', route)
      return
    }

    // 检查是否有token，没有token不调用接口
    const { getToken} = useAuth()
    if (!getToken()) {
      console.log('未登录用户，跳过微信分享配置')
      return
    }

    this.isConfiguring = true // 标记正在配置

    try {
      // 等待微信SDK加载完成
      await this.waitForWeChatSDK()

      // 获取JSSDK配置
      const config = await this.getJSSDKConfig()
      if (!config) {
        console.log('获取微信配置失败')
        return
      }

      // 获取微信SDK
      const wechatSDK = this.getWeChatSDK()
      if (!wechatSDK) {
        console.log('微信SDK不可用')
        return
      }

      // 检查config方法是否存在
      if (typeof wechatSDK.config !== 'function') {
        console.error('微信SDK config方法不存在，SDK可能未正确加载')
        return
      }

      // 配置微信SDK
      try {
        wechatSDK.config({
          debug: false,
          appId: config.appId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: [
            'updateAppMessageShareData', 'updateTimelineShareData', // 新API
          ]
        })
      } catch (configError) {
        console.error('调用微信config失败:', configError)
        return
      }

      // 设置分享内容
      wechatSDK.ready(() => {
        this.setShareContent(wechatSDK, options)
        console.log('全局微信分享配置完成')
      })

      wechatSDK.error((res: any) => {
        console.error('微信分享配置失败:', res)
      })

    } catch (error) {
      console.error('设置全局分享失败:', error)
    } finally {
      this.isConfiguring = false // 重置配置状态
    }
  }

  // 等待微信SDK加载完成
  private waitForWeChatSDK(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      const checkSDK = () => {
        if (this.getWeChatSDK()) {
          console.log('微信SDK已加载')
          resolve()
          return
        }
        
        if (Date.now() - startTime > timeout) {
          console.log('微信SDK加载超时')
          resolve() // 不reject，让后续逻辑自己处理
          return
        }
        
        setTimeout(checkSDK, 100)
      }
      
      checkSDK()
    })
  }

  // 获取JSSDK配置
  private async getJSSDKConfig() {
    // 获取用于微信SDK的URL
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    let sdkUrl = ''
    
    if (isIOS) {
      // iOS设备：使用缓存的初始URL
      sdkUrl = this.initialUrl || location.href.split('#')[0]
    } else {
      // 安卓设备：使用当前URL
      sdkUrl = location.href.split('#')[0]
    }
    
    console.log('微信SDK使用的URL:', sdkUrl)
    console.log('是否iOS设备:', isIOS)
    
    try {
      // 每次都调用接口获取最新配置，确保URL签名正确
      const res = await getWeChatJSSDKConfig({ url: sdkUrl })
      const config = res.data || {}
      
      console.log('获取微信配置成功')
      return config
    } catch (error) {
      console.error('获取微信配置失败:', error)
      return null
    }
  }

  // 生成分享配置对象
  private generateShareConfig(options: any) {
    const shareUrl = `${location.origin}/pages/login/login?liveId=${options.liveId || ''}&visitorId=${options.visitorId || ''}`
    
    return {
      title: options.title || '直播分享',
      desc: options.desc || '欢迎观看直播',
      link: shareUrl,
      imgUrl: options.imageUrl || ''
    }
  }

  private setShareContent(wechatSDK: any, options: any) {
    const shareConfig = this.generateShareConfig(options)

    // 新API：设置分享给朋友
    if (typeof wechatSDK.updateAppMessageShareData === 'function') {
      wechatSDK.updateAppMessageShareData({
        ...shareConfig,
        success: () => console.log('好友分享内容设置成功'),
        fail: (error: any) => console.error('好友分享内容设置失败:', error)
      })
    }

    // 新API：设置分享到朋友圈（去掉描述）
    if (typeof wechatSDK.updateTimelineShareData === 'function') {
      const timelineConfig = { ...shareConfig }
      delete timelineConfig.desc
      wechatSDK.updateTimelineShareData({
        ...timelineConfig,
        success: () => console.log('朋友圈分享内容设置成功'),
        fail: (error: any) => console.error('朋友圈分享内容设置失败:', error)
      })
    }

    this.shareConfig = options
  }

  private isWeChatBrowser() {
    return typeof navigator !== 'undefined' && /micromessenger/i.test(navigator.userAgent)
  }

  private getWeChatSDK() {
    // 检查window对象是否存在
    if (typeof window === 'undefined') {
      console.log('非浏览器环境')
      return null
    }

    const win = window as any

    // 优先使用官方wx
    if (win.wx && typeof win.wx === 'object' && typeof win.wx.config === 'function') {
      console.log('使用官方 wx SDK')
      return win.wx
    }

    // 备用jWeixin
    if (win.jWeixin && typeof win.jWeixin === 'object' && typeof win.jWeixin.config === 'function') {
      console.log('使用 jWeixin SDK')
      return win.jWeixin
    }

    console.log('微信SDK未找到或未正确加载')
    return null
  }


  // 获取分享链接（用于复制）
  getShareUrl(liveId?: string, visitorId?: string) {
    const config = this.generateShareConfig({ liveId, visitorId })
    return config.link
  }

}

// 导出单例
export const weChatShare = WeChatShareManager.getInstance()
