<template>
  <view bg="#FAFAFA" h100vh>
    <view py40rpx pl30rpx text-32rpx font500>登录成功，请绑定手机号</view>
    <view h112rpx pl30rpx flex items-center bg-white>
      <my-form flex-1 v-model="phone" type="number" placeholder="请输入手机号" fontSize="32rpx"></my-form>
    </view>
    <view h112rpx pl30rpx flex items-center bg-white mt16rpx>
      <my-form flex-1 v-model="code" type="number" placeholder="请输入验证码" fontSize="32rpx">
        <template #suffix>
          <view flex items-center>
            <my-countDown :phone="phone">
              <template #default="{ msg }">
                <view border-l="2rpx solid #DDDDDD" px46rpx text="#0B68F6 32rpx" font-500>
                  {{ msg }}
                </view>
              </template>
            </my-countDown>
          </view>
        </template>
      </my-form>
    </view>
    <view absolute bottom-32rpx w690rpx left-30rpx>
      <view class="btn-sub mb32rpx !text-30rpx" @click="handleDebounceSub">确认</view>
      <view class="btn-sub !bg-white !text-#909193 !text-30rpx" @click="handleSkip">跳过</view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { bindPhone } from '@/api/user'
import { skipBindPhone } from '@/api/login'
const phone = ref('')
const code = ref('')
function toHome() {
  uni.reLaunch({
    url: '/pages/home/home'
  })
}
function handleSkip() {
  skipBindPhone().then(() => {
    toHome()
  })
}

function handleSub() {
  if (!uni.$uv.test.mobile(phone.value)) {
    uni.$showToast('请输入正确手机号')
    return
  }
  if (!code.value) {
    uni.$showToast('请输入验证码')
    return
  }
  bindPhone({
    phone: phone.value,
    code: code.value
  }).then(() => {
    uni.$showToast('绑定成功')
    toHome()
  })
}

const handleDebounceSub = () => (
  uni.$uv.throttle(handleSub, 500)
)
</script>

<style lang="scss" scoped></style>