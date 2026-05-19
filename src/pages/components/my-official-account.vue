<script setup lang='ts'>
const popupRef = ref()
function open() {
  popupRef.value.open()
}
defineExpose({ open })
</script>

<template>
  <uv-popup ref="popupRef" mode="center" bgColor="none" class="pc-custom-popup">
    <div w600rpx bg="#F2F3F5" rd-8px relative pointer-events-auto>
      <div h54rpx flex-center relative font-500>
        关注公众号<img src="/static/images/pc/common/close-gray.png"
          class="w30rpx h30rpx cursor-pointer absolute top-20rpx right-20rpx" @click="popupRef.close()">
      </div>
      <div class="p-20rpx flex items-center flex-col">
        <img class="w-[500rpx] h-[500rpx]]" src="/static/images/gzh.jpg" alt="">
        <div class="text-center text-26rpx  mt-20rpx">
          扫描上方二维码关注公众号
        </div>
        <div class="text-center text-26rpx mt-20rpx">获取最新动态</div>
        <div @click="popupRef.close()" class="pc-btn-sub  mt-15rpx text-28rpx p-y-[10rpx] p-x-[24rpx] rd-8rpx">我知道了</div>
      </div>
    </div>
  </uv-popup>
</template>