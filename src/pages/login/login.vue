<script lang="ts" setup>
import { parseHrefParams } from '@/utils/common'
import { userlogin } from '@/api/login'
import { getUserInfo } from '@/api/user'

let stateStr = ''
const { setToken, setUser, getToken } = useAuth()
onLoad((options: any) => {
 if(options.token && options.type) {
   setToken(options.token);
   let info = JSON.parse(options.loginInfo)
   setUser({
     aliConfigId:info.aliConfigId,
     wxConfigId:info.wxConfigId,
     unionId:info.unionId,
     userId:info.userId,
     liveId:info.liveId,
     liveRoomNo:info.liveRoomNo
   })
   uni.setStorageSync("type", options.type);
   uni.setStorageSync("wxCallback", options.wxCallback);
   uni.redirectTo({
     url: '/pages/home/home'
   })
 }
  stateStr = Object.keys(options).length ? JSON.stringify(options || {}) : (uni.getStorageSync('wxCallback') || '{}');
  // 存在token了，自动登录
  if (options?.param && getToken()) {
    userlogin({
      clientId: import.meta.env.VITE_CLIENT_ID,
      grantType: 'auto',
      tenantId: import.meta.env.VITE_TENANT_ID,
      param: options?.param || '',
      uuid: Date.now(),
    }).then(res => {
      console.log(res)
      setToken(res.data.access_token)
      const { aliConfigId, wxConfigId, unionId, userId, liveId, liveRoomNo } = res.data || {}
      setUser({
        aliConfigId,
        wxConfigId,
        unionId,
        userId,
        liveId,
        liveRoomNo
      })
      uni.setStorageSync("wxCallback", JSON.stringify({ param: options?.param }));
      uni.redirectTo({
        url: '/pages/home/home'
      })
      // 注释绑定手机号
      // getUserInfo().then(userInfo => {
      //   if (res.data?.isSkipPhone || userInfo.data?.phone) {
      //     uni.redirectTo({
      //       url: '/pages/home/home'
      //     })
      //   } else {
      //     // 如果没有绑定手机号，跳转到绑定手机号页面
      //     uni.redirectTo({
      //       url: '/pages/login/bindPhone'
      //     })
      //   }
      // })

    })
  }
})
// onShow(() => {
//  if (uni.getStorageSync("wxCallback") && uni.getStorageSync("type")) {
//    uni.redirectTo({
//      url: '/pages/home/liveRoom'
//    })
//  }
// })
onMounted(() => {
  const href = location.href.split('#/')[0]
  const paramsObj = parseHrefParams(href);
  if (paramsObj?.code) {
    checked.value = true
    console.log('paramsObj666>>>', paramsObj)
    setTimeout(() => {
      uni.setStorageSync("wxCallback", paramsObj?.state);
      uni.navigateTo({
        url: `/pages/login/callback?code=${paramsObj?.code}&state=${paramsObj?.state}`
      })
    })
  }
})
const checked = ref(false)
function handleWx() {
  if (stateStr === '{}') {
    uni.$showToast('请通过分享的邀请链接进入')
    return
  }
  if (!checked.value) {
    return uni.$showToast('请先同意《用户服务协议》和《隐私政策》')
  }
  const appId = import.meta.env.VITE_WX_SERVICE_APPID
  let baseUrl = import.meta.env.VITE_DOMAIN;
  const url = encodeURIComponent(baseUrl);
  window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${url}&response_type=code&scope=snsapi_userinfo&state=${stateStr}#wechat_redirect`
}

function toAgree(type: number) {
  uni.navigateTo({
    url: `/pages/agree?type=${type}`
  })
}
</script>

<template>
  <view>
    <image src="/static/images/h5/login/top-bg.png" wfull h358rpx />
    <view px60rpx mt60rpx>
      <view class="text-[#0B68F6] text-48rpx font-bold leading-66rpx">“您好”</view>
      <view class="text-[#0B68F6] text-48rpx font-bold leading-66rpx mt-16rpx">欢迎来到领航通</view>
      <view btn-sub mt-176rpx mb-32rpx @tap="handleWx">微信快捷登录</view>
      <view pl52rpx flex items-center>
        <view w32rpx h32rpx @click="checked = !checked">
          <image v-if="checked" src="/static/images/h5/common/checked.png" w32rpx h32rpx />
          <view v-else border="2rpx solid #E8E8E8" w32rpx h32rpx rd-full></view>
        </view>

        <view ml14rpx text-24rpx>登录即同意<text class="text-#0B68F6" @click="toAgree(1)">《用户服务协议》</text>和<text
            class="text-#0B68F6" @click="toAgree(2)">《隐私政策》</text></view>
      </view>
    </view>
  </view>
</template>
