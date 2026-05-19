<script setup lang='ts'>
import { checkLiveReplayPassword } from '@/api/live'
const popupRef = ref()
function open() {
  popupRef.value.open()
}
defineExpose({ open })

// 回放密码
const password = ref('')
const toastRef = ref()
const playbackListRef = ref()
const camera = useCamera()
function popSub() {
  if (!password.value) return uni.$showToast('请输入密码')
  checkLiveReplayPassword({ replayPassword: password.value }).then(res => {
    if (!res?.data) {
      toastRef.value.showToast({ title: '密码错误，请联系对应客服！', type: 'warn' })
      setTimeout(() => {
        uni.$goToPage('/pagesPc/home/error')
      }, 500)
    } else {
      camera.setInputPassword(true)
      setTimeout(() => {
        playbackListRef.value.open(true)
      }, 500)
    }
    password.value = ''
    popupRef.value.close()
  })
}
</script>

<template>
  <uv-popup ref="popupRef" round="4px" :close-on-click-overlay="false" @close="popupRef.close()">
    <div w430px h242px>
      <div h56px border-b="1px solid #E5E6EB" px20px flex-between>
        <div text-16px font-500>进入直播间</div>
        <!-- <img src="/static/images/pc/common/pop-close.png" cursor-pointer w12px h12px @click="popupRef.close()"> -->
      </div>
      <div py36px px20px>
        <div wfulll h48px bg="#F2F3F5" rd-2px px16px flex items-center>
          <my-form type="password" v-model="password" fontSize="14px" placeholder="请输入直播间回放密码"></my-form>
        </div>
      </div>
      <div border-t="1px solid #E5E6EB" pt16px pr24px flex justify-end>
        <div pc-btn-sub w60px h32px rd-2px @click="popSub">确定</div>
      </div>
    </div>
  </uv-popup>
  <pc-toast ref="toastRef"></pc-toast>
  <!-- 回放列表 -->
  <my-playback-list ref="playbackListRef" type="pc"></my-playback-list>
</template>