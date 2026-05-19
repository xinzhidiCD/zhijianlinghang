<template>
  <view py40rpx px30rpx text-24rpx>
    <view text-28rpx font-500>反馈类型</view>
    <view flex gap-12rpx mt32rpx mb48rpx>
      <view v-for="c, k in typeList" :key="k" w144rpx h50rpx flex-center rd-4rpx
        :class="[typeVal === k ? 'text-#0B68F6 bg-#0B68F6 bg-op-10' : 'bg-#EEEEEE']" @click="typeVal = k">
        {{ c }}
      </view>
    </view>
    <view text-28rpx font-500 mb32rpx>反馈内容</view>
    <view border="2rpx solid #EEEEEE" rd-8rpx p16rpx>
      <my-form v-model="content" type="textarea" height="418rpx" count :maxlength="200"></my-form>
    </view>
    <view class="mt280rpx font-500 !text-30rpx btn-sub" @click="handSub">提交</view>
  </view>
</template>

<script lang="ts" setup>
import { addFeedback } from '@/api/user'
const typeList = ['服务问题', '直播问题', '课程问题', '其他']
const typeVal = ref(0)

const content = ref('')
function handSub() {
  if (!content.value) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' })
    return
  }
  uni.showLoading({ title: '提交中...' })
  addFeedback({ feedbackType: typeVal.value + 1, feedbackContent: content.value }).then(() => {
    uni.showToast({ title: '提交成功', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  }).finally(() => {
    uni.hideLoading()
  })
}
</script>

<style lang="scss" scoped></style>