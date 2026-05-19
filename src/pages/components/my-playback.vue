<script setup lang='ts'>
import { checkLiveReplayPassword } from '@/api/live'
const popupRef = ref()
const password = ref('')
const playbackListRef = ref()
const camera = useCamera()
const emit = defineEmits(['pass'])
function pwdSub() {
  if (!password.value) return uni.$showToast('请输入密码')
  checkLiveReplayPassword({ replayPassword: password.value }).then(res => {
    password.value = ''
    if (!res?.data) {
      uni.$showToast('密码错误，请联系对应客服')
      setTimeout(() => {
        // uni.$goToPage('/pages/home/error')
        uni.reLaunch({
          url: '/pages/home/error'
        })
      }, 500)
    } else {
      camera.setInputPassword(true)
      // 先调用 open，再关闭 popup
      if (playbackListRef.value && typeof playbackListRef.value.open === 'function') {
        playbackListRef.value.open(true)
      }
      emit('pass')
    }
    // 最后关闭密码弹窗
    popupRef.value.close()
  }).catch(err => {
    console.error('checkLiveReplayPassword error:', err)
  })
}
onMounted(() => {
  popupRef.value.open()
})

</script>

<template>
  <!-- 回放密码验证 -->
  <uv-popup ref="popupRef" mode="center" round="18rpx" :close-on-click-overlay="false" @close="popupRef.close()">
    <view w630rpx h348rpx px40rpx pt32rpx>
      <view text-28rpx font-500 text-center>进入直播间</view>
      <view border="2rpx solid #EEEEEE" mt36rpx mb56rpx rd-8rpx h72rpx pl16rpx pr18rpx flex items-center>
        <my-form v-model="password" type="password" placeholder="请输入直播间回放密码" fontSize="24rpx"></my-form>
      </view>
      <view class="btn-sub mt56rpx" @click="pwdSub">确认</view>
    </view>
  </uv-popup>
  <!-- 回放列表 -->
  <my-playback-list ref="playbackListRef"></my-playback-list>
</template>