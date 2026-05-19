<script setup lang='ts'>
const popupRef = ref()
const codeRef = ref()
const preOrderNo = ref('')
function open(no: string) {
  preOrderNo.value = no
  popupRef.value.open()
}
defineExpose({ open })

function paySub(obj: any) {
  codeRef.value.open(obj)
}
</script>

<template>
  <uv-popup ref="popupRef" mode="center" bgColor="none" class="pc-custom-popup">
    <div w375px bg="#F2F3F5" rd-8px mr421px relative pointer-events-auto>
      <div h54px flex-center relative font-500>
        确认订单<img src="/static/images/pc/common/close-gray.png"
          class="w16px h16px cursor-pointer absolute top-19px right-16px" @click="popupRef.close()">
      </div>
      <div px12px>
        <my-confirm type="pc" :preOrderNo="preOrderNo" @success="paySub"></my-confirm>
      </div>
    </div>
  </uv-popup>
  <pc-payCode type="confirm" ref="codeRef"></pc-payCode>
</template>