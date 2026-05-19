<script>
export default {
  onLaunch: function () {
    console.log('App Launch')

    // iOS URL 缓存解决方案
    // #ifdef H5
    this.handleIOSUrlCache();

    // 检查是否为电脑浏览器环境，如果是则设置固定font-size为16px
    const systemInfo = uni.getSystemInfoSync();
    if (systemInfo.platform === "windows" || systemInfo.platform === "mac") {
      this.setFixedFontSize();
    }
    // #endif
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
  methods: {
    // #ifdef H5
    // iOS URL 缓存处理方法
    handleIOSUrlCache() {
      let isIOS = function () {
        var isIphone = navigator.userAgent.includes('iPhone');
        var isIpad = navigator.userAgent.includes('iPad');
        return isIphone || isIpad;
      }

      // 获取当前完整的URL路径
      let ourl = window.location.href.split('#')[0];

      // 存储当前URL到localStorage，供后续iOS系统使用
      if (!isIOS()) {
        localStorage.setItem('shurl', ourl);
        // 安卓设备：直接使用当前URL
        localStorage.setItem('wechat_share_url', ourl);
      } else {
        // 如果是iOS系统，则从localStorage获取之前缓存的URL
        let cachedUrl = localStorage.getItem('shurl');
        if (cachedUrl) {
          ourl = cachedUrl;
        }
        // iOS设备：使用缓存的URL
        localStorage.setItem('wechat_share_url', ourl);
      }

      // 处理分享链接
      var shilink = window.location.href.split('#')[0];

      // 处理分享链接
      if (isIOS()) {
        // 解决iOS分享链接失效问题，为当前链接添加时间戳参数，这样每次都是新链接
        shilink = shilink + (shilink.includes('?') ? '&' : '?') + 'timestamp=' + new Date().getTime();
      }

      // console.log('iOS URL Cache - isIOS:', isIOS(), 'ourl:', ourl, 'shilink:', shilink);
    },

    setFixedFontSize() {
      // 给html元素添加一个类名标识这是PC环境
      document.documentElement.classList.add('pc-platform');

      // 设置固定字体大小并监听变化
      const setFontSize = () => {
        document.documentElement.style.fontSize = '16px !important';
      };

      // 立即设置
      setFontSize();

      // 延迟设置，确保覆盖其他可能的设置
      setTimeout(setFontSize, 100);
      setTimeout(setFontSize, 500);
      setTimeout(setFontSize, 1000);

      // 监听窗口resize事件，防止其他代码重新设置font-size
      window.addEventListener('resize', setFontSize);

      // 使用MutationObserver监听html元素style属性变化
      const observer = new MutationObserver(() => {
        if (document.documentElement.style.fontSize !== '16px') {
          setFontSize();
        }
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style']
      });
    }
    // #endif
  }
}
</script>

<style>
/*每个页面公共css */
@import '@/static/css/common.scss';

/* 电脑浏览器环境下强制设置HTML字体大小为16px */
/* #ifdef H5 */
html.pc-platform {
  font-size: 16px !important;
}

/* #endif */
</style>
