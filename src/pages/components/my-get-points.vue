<script lang="ts" setup>
defineProps<{
  type?: string
}>()
const popUpRef = ref()
const text = ref('')
const { getUser } = useAuth()
function open(content: string) {
  const obj = JSON.parse(content || '{}')
  text.value = obj?.msg
  if (getUser()?.userId === obj?.userId) {
    popUpRef.value.open()
    setTimeout(() => {
      popUpRef.value.close()
    }, 5000)
  }

}
defineExpose({ open })
</script>

<template>
  <uv-popup ref="popUpRef" mode="center" :overlayStyle="{ 'background': 'rgba(3, 100, 219, 0)' }" round="20rpx"
    bgColor="none" class="pc-custom-popup">
    <view :class="[type === 'pc' && 'mr421px']" flex-col-center rd-20rpx pt28rpx w310rpx h224rpx
      style="background: linear-gradient( 180deg, #FFE7AB 0%, #FFFFFF 50%)">
      <image src="/static/images/h5/home/points.png" w110rpx h110rpx mb24rpx></image>
      <view text-24rpx>{{ text }}</view>
    </view>
  </uv-popup>
</template>