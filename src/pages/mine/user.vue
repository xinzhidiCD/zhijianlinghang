<template>
  <view bg="#FAFAFA" wfull h100vh pt16rpx>
    <view h112rpx bg-white flex-between px32rpx>
      <view text-32rpx>头像</view>
      <!-- <my-upload width="80rpx" height="80rpx" :maxCount="1" @getUploadImg="uploadSuccess"> -->
      <view w80rpx h80rpx relative>
        <uv-avatar :src="avatar" size="80rpx"></uv-avatar>
        <!-- <image src="/static/images/h5/mine/camera.png" w48rpx h48rpx top-16rpx left-16rpx absolute></image> -->
      </view>
      <!-- </my-upload> -->
    </view>
    <view h112rpx bg-white flex-between px32rpx mt16rpx text-32rpx>
      用户名称
      <my-form v-model="nickName" disabled inputAlign="right" fontSize="32rpx" placeholderStyle="color: #909193;"
        placeholder="请输入用户名称" flex-1 ml16rpx></my-form>
    </view>
    <!-- <view h112rpx bg-white flex-between px32rpx mt16rpx text-32rpx>
      手机号
      <view flex items-center text="black op-40" @click="$goToPage('/pages/mine/editPhone')">
        {{ phone }}
        <image src="/static/images/h5/common/right-bold.png" w48rpx h48rpx ml8rpx></image>
      </view>
    </view> -->
    <!-- <view class="btn-sub w690rpx mt25vh ml30rpx" @click="handleDebounceSub">保存</view> -->
  </view>
</template>

<script lang="ts" setup>
import { getUserInfo, editUserInfo } from '@/api/user'

const phone: any = ref('')
const nickName = ref('')
const avatar = ref('')
onShow(() => {
  getUserInfo().then((res: any) => {
    nickName.value = res.data?.nickName || ''
    phone.value = res.data?.phone || ''
    avatar.value = res.data?.avatar
  })
})
function uploadSuccess(url: string) {
  avatar.value = url || ''
}

const handleSub = () => {
  if (!nickName.value) {
    uni.$showToast('请输入昵称')
    return
  }
  editUserInfo({
    nickName: nickName.value,
    avatar: avatar.value
  }).then(() => {
    uni.$showToast('修改成功')

  })
}
const handleDebounceSub = () => uni.$uv.throttle(handleSub, 500)

</script>

<style lang="scss" scoped></style>