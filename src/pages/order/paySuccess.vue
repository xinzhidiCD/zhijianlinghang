<script setup lang='ts'>
import { storeToRefs } from 'pinia'
function goToPage(path: string) {
  uni.$goToPage(path)
}
const setting = useSetting()
const { settingInfo } = storeToRefs(setting) 
</script>

<template>
  <view flex-col-center py100rpx>
    <image src="/static/images/h5/mine/pay-success.png" w196rpx h196rpx></image>
    <view flex gap-84rpx mt100rpx>
      <view class="btn-sub w232rpx !h64rpx" @click="goToPage('/pages/order/order')">查看订单</view>
      <view class="btn-sub-box w232rpx h64rpx" @click="goToPage('/pages/mine/course')">查看课程</view>
    </view>
    <template v-if="settingInfo?.liveConfig?.qrCode">
      <view mt320rpx text-28rpx font-500>添加老师</view>
      <image :src="settingInfo?.liveConfig?.qrCode" w300rpx h300rpx mt32rpx></image>
      <view text="#909193 28rpx" mt40rpx>该二维码已通过安全监测</view>
    </template>
    <view absolute bottom-32rpx w690rpx left-30rpx>
      <view class="font-500 !text-30rpx  btn-sub" @click="goToPage('/pages/home/liveRoom')">返回直播间</view>
    </view>
  </view>
</template>