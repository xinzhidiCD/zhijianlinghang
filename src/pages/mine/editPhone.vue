<template>
  <view bg="#FAFAFA" wfull h100vh pt40rpx>
<!--    <view v-if="phone" pb40rpx pl30rpx text-28rpx font-500>当前手机号：{{ phone }}</view>-->
    <view h112rpx pl30rpx flex items-center bg-white>
      <my-form flex-1 v-model="editPhone" type="number" placeholder="请输入手机号" fontSize="32rpx"></my-form>
    </view>
    <view h112rpx pl30rpx flex items-center bg-white mt16rpx>
      <my-form flex-1 v-model="code" type="number" placeholder="请输入验证码" fontSize="32rpx">
        <template #suffix>
          <view flex items-center>
            <my-countDown :phone="editPhone">
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
    <view class="btn-sub w690rpx mt25vh ml30rpx" @click="handleDebounceSub">确认修改</view>
  </view>
</template>

<script lang="ts" setup>
import { getUserInfo, bindPhone } from '@/api/user'
const phone = ref('')
const editPhone = ref('')
const code = ref('')

onMounted(() => {
  getUserInfo().then((res: any) => {
    phone.value = res.data?.phone || ''
  })
})

function handleSub() {
  if (!uni.$uv.test.mobile(editPhone.value)) {
    uni.$showToast('请输入正确手机号')
    return
  }
  if (!code.value) {
    uni.$showToast('请输入验证码')
    return
  }
  bindPhone({
    phone: editPhone.value,
    code: code.value
  }).then(() => {
    uni.$showToast('修改成功')
    uni.navigateBack()
  })
}

const handleDebounceSub = () => (
  uni.$uv.throttle(handleSub, 500)
)
</script>

<style lang="scss" scoped></style>
