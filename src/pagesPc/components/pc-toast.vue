<script setup lang='ts'>
const popup = ref()
const popObj: any = ref({})
let timer: any = null
function showToast(params: any) {
  if (timer) clearTimeout(timer)
  popObj.value = params
  popup.value.open()
  timer = setTimeout(() => {
    popup.value.close()
  }, 3000);
}
defineExpose({
  showToast
})
</script>

<template>
  <uv-popup ref="popup" bgColor="none" mode="top" :overlay="false">
    <div wfull mt80px flex-center>
      <div wfit h56px rd-8px min-w164px flex-center px24px bg-white>
        <img v-if="popObj.type === 'warn'" src="/static/images/pc/common/warn.png" w24px h24px mr12px>
        <img v-else src="/static/images/pc/common/check.png" w24px h24px mr12px>
        <div text-16px>{{ popObj.title }}</div>
      </div>
    </div>
  </uv-popup>
</template>