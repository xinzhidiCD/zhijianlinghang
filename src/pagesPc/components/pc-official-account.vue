<script setup lang='ts'>
const popupRef = ref()
function open() {
  popupRef.value.open()
}
defineExpose({ open })
</script>

<template>
  <uv-popup ref="popupRef" mode="center" bgColor="none" class="pc-custom-popup">
    <div w375px bg="#F2F3F5" rd-8px relative pointer-events-auto>
      <div h54px flex-center relative font-500>
        关注公众号<img src="/static/images/pc/common/close-gray.png"
          class="w16px h16px cursor-pointer absolute top-19px right-16px" @click="popupRef.close()">
      </div>
      <div class="p-20px flex items-center flex-col">
        <img class="w-[300px] h-[30px]]" src="/static/images/gzh.jpg" alt="">
        <div class="text-center text-16px  mt-15px">
          扫描上方二维码关注公众号
        </div>
        <div class="text-center text-16px mt-15px">获取最新动态</div>
        <div @click="popupRef.close()" class="pc-btn-sub  mt-15px text-16px p-y-[6px] p-x-[15px] rd-4px">我知道了</div>
      </div>
    </div>
  </uv-popup>
  <pc-payCode type="confirm" ref="codeRef"></pc-payCode>
</template>