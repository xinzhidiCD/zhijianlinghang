<template>
  <view>
    <uv-toast ref="toast"></uv-toast>
    <uv-code :seconds="seconds" ref="code" @change="codeChange"></uv-code>
    <view @tap="handleBounceCode">
      <slot :msg="tips"></slot>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { getSmsCode } from '@/api/user'

const props = defineProps<{
  phone: string
}>()

const tips = ref('')
const seconds = ref(60)
const code = ref()
const toast = ref()

function codeChange(text: string) {
  tips.value = text
}

function handleBounceCode() {
  uni.$uv.throttle(getCode, 500)
}

function getCode() {
  if (!uni.$uv.test.mobile(props.phone)) {
    uni.$showToast('请输入正确手机号')
    return
  }
  if (code.value?.canGetCode) {
    getSmsCode({ phonenumber: props.phone }).then(() => {
      uni.$showToast('验证码已发送')
      code.value.start()
    }).finally(() => {
      uni.hideLoading()
    })
  } else {
    uni.$showToast('倒计时结束后再发送')
  }
}
</script>

<style lang="scss"></style>