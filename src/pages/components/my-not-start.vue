<script setup lang='ts'>
import { LiveTypeEnum } from '@/utils/enum'
import { appointmentLive } from '@/api/live'
import wx from "weixin-js-sdk"

const props = defineProps<{
  liveInfo: any
}>()
const timeData: any = ref({})
function countDownChange(time: any) {
  timeData.value = time
}

const { padZero } = useTool()
const myOfficialAccountRef = ref()

// 背景图：优先使用预约背景图（liveInfo中），没有时使用直播封面图
const bgImage = computed(() => {
  const reserveBg = props.liveInfo?.liveConfig?.liveScheduleBgMedia || props.liveInfo?.generalConfig?.backgroundImage
  if (reserveBg) return reserveBg
  return props.liveInfo?.viewingTemplate === LiveTypeEnum.PureVideo
    ? (props.liveInfo?.liveCoverImageVertical || props.liveInfo?.liveCoverImage)
    : props.liveInfo?.liveCoverImage
})

function handleReservation() {
  if (props.liveInfo?.isAppointment) return
  appointmentLive().then((res: any) => {
    if (res.code === 200) {
      props.liveInfo.isAppointment = true
      uni.$showToast('预约成功')
      myOfficialAccountRef.value?.open()
    }
  })
}
</script>

<template>
  <image :src="bgImage" wfull hfull mode="aspectFill" />
  <view absolute top-0 left-0 wfull hfull flex-center pointer-events-none z-1>
    <view v-if="Object.keys(liveInfo).length" bg="black op-60" class="w468rpx rd-14rpx flex-center flex-col py24rpx" pointer-events-auto>
      <view text="28rpx white" mb-24rpx>距离课程开始还有</view>
      <uv-count-down :time="new Date(liveInfo?.liveStartTime).getTime() - Date.now()" @change="countDownChange">
        <view text="32rpx white">
          <text class="box-time-num">{{ padZero(timeData.hours) }}</text>时
          <text class="box-time-num">{{ padZero(timeData.minutes) }}</text>分
          <text class="box-time-num">{{ padZero(timeData.seconds) }}</text>秒
        </view>
      </uv-count-down>
      <template v-if="liveInfo?.liveConfig?.isLiveScheduleEnabled">
        <view v-if="liveInfo?.isAppointment" class="!w300rpx !bg-[#06B464] btn-sub mt24rpx">已预约</view>
        <view v-else class="!w300rpx btn-sub mt24rpx" @click="handleReservation">预约直播</view>
      </template>
    </view>
  </view>
  <my-official-account ref="myOfficialAccountRef" />
</template>