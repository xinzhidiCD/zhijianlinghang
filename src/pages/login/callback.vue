<script lang="ts" setup>
import { userlogin } from '@/api/login'
import { getUserInfo } from '@/api/user'
const { setToken, setUser } = useAuth()

const query: any = ref({})
onLoad((options: any) => {
  if (options.code) {
    query.value = { code: options.code, ...JSON.parse(options.state || '{}') }
    if(query.value.visitorId) {
      uni.setStorageSync("visitorId", query.value.visitorId);
    }
    console.log('query.value>>>', query.value);
    handleWxCallback()
  }
})

function handleWxCallback() {
  userlogin({
    clientId: import.meta.env.VITE_CLIENT_ID,
    grantType: 'wx',
    loginType: 'h5',
    tenantId: import.meta.env.VITE_TENANT_ID,
    code: query.value?.code,
    param: query.value?.param || '',
    liveId: query.value.liveId || '',
    visitorId: query.value.visitorId || '',
    uuid: Date.now(),
  }).then(res => {
    console.log(res)
    setToken(res.data.access_token)
    const { aliConfigId, wxConfigId, unionId, userId, liveId, liveRoomNo } = res.data || {}
    setUser({
      unionId,
      userId,
      liveId,
      liveRoomNo,
      aliConfigId,
      wxConfigId
    })
    uni.redirectTo({
      url: '/pages/home/home'
    })
    // 去掉手机号绑定
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
</script>

<template>
  <view>
    <image src="/static/images/h5/login/top-bg.png" wfull h358rpx />
    <view px60rpx mt60rpx>
      <view class="text-[#0B68F6] text-48rpx font-bold leading-66rpx">“您好”</view>
      <view class="text-[#0B68F6] text-48rpx font-bold leading-66rpx mt-16rpx">欢迎来到领航通</view>
      <view btn-sub mt-176rpx mb-32rpx>
        <uv-loading-icon color="#fff" size="36rpx" class="mr-20rpx"></uv-loading-icon>
        微信登录中...
      </view>
    </view>
  </view>
</template>
