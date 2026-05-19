<script setup lang='ts'>
// 收银台
import { payment, getPaymentResult } from '@/api/order'

const iframeRef = ref()
const popTipRef = ref()
onLoad((options: any) => {
  console.log('收银台参数', options)
  if (isWechatBrowser()) {
    nextTick(() => {
      popTipRef.value && popTipRef.value.open()
      // 轮询查询支付结果
      initResult(options.orderNo)
    })
  } else {
    initPayment(options.orderNo, options.payType, options.aliConfigId)
  }

})
function isWechatBrowser() {
  // 获取 User-Agent 并转为小写
  const userAgent = navigator.userAgent.toLowerCase();
  // 判断是否包含 'micromessenger'
  return userAgent.indexOf('micromessenger') !== -1;
}
// 这里只会有支付宝进入
function initPayment(orderNo: string, payType: string, aliConfigId: string) {
  payment({ orderNo, deviceType: 1, payType, configId: aliConfigId }).then((res: any) => {
    setTimeout(() => {
      if (payType === '1') {
        // 微信
        nextTick(() => {
          iframeRef.value.src = res.data?.data?.h5Url
        })
      } else {
        // 支付宝
        if (res.data?.tl) {
          // 通联直接链接展示
          nextTick(() => {
            iframeRef.value.src = res.data?.data;
          })
        } else {
          nextTick(() => {
            iframeRef.value.srcdoc = res?.data?.data;  // 直接将HTML内容注入iframe
          })
        }

      }

    }, 500)
  })
}

let interval: any = null;
function initResult(orderNo: string) {
  interval = setInterval(() => {
    getPaymentResult(orderNo).then((res: any) => {
      if (res?.data) {
        clearInterval(interval)
        uni.redirectTo({
          url: `/pages/order/paySuccess`
        })
      }
    })
  }, 5000) // 每5秒查询一次
}

onUnmounted(() => {
  // 离开页面时清除定时器
  clearInterval(interval)
})
</script>

<template>
  <iframe ref="iframeRef" width="100%" style="height: 100vh;width: 100%;" frameborder="0"
    sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups"></iframe>
  <uv-popup ref="popTipRef" mode="top" bgColor="none">
    <view flex flex-col items-end>
      <image src="/static/images/h5/common/ysj.png" class="w136rpx h146rpx mr46rpx" />
      <view class="mr12rpx flex-center share-btn text-white text-28rpx font-500">点击右上角“…”按钮前往浏览器支付</view>
    </view>
  </uv-popup>
</template>