<script setup lang='ts'>
import { getUserAgreement, getPrivacyAgreement } from '@/api/setting'

const content = ref('')
onLoad((options) => {
  // 页面加载时的逻辑
  if (options?.type === '1') {
    getUserAgreement().then((res) => {
      content.value = res?.msg
    })
  } else {
    getPrivacyAgreement().then((res) => {
      content.value = res?.msg
    })
  }
})
</script>

<template>
  <uv-parse :content="content"></uv-parse>
</template>