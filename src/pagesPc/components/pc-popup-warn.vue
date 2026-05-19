<script setup lang='ts'>
defineProps<{
  title: string,
  icon: string,
  popClass?: string
}>()
const popupRef = ref()
function open() {
  popupRef.value.open()
}
defineExpose({ open })
</script>

<template>
  <uv-popup ref="popupRef" round="4px" @close="popupRef.close()">
    <div :class="[popClass || 'w404px']" pb30px>
      <div pt24px pl32px flex items-center>
        <img src="/static/images/pc/home/pin2.png" w18px h18px mr8px>
        <div text-16px font-500>{{ title }}</div>
      </div>
      <slot></slot>
      <div flex justify-center gap-12px>
        <div w60px h32px bg="#F2F3F5" text="#515968" rd-2px flex-center cursor-pointer @click="popupRef.close()">
          取消
        </div>
        <div pc-btn-sub w60px h32px text-white rd-2px @click="popupRef.close()">
          确定
        </div>
      </div>
    </div>
  </uv-popup>
</template>