<script setup lang='ts'>
import { appointmentLive } from '@/api/live'
const props = defineProps<{
  liveInfo: any
}>()
const timeData: any = ref({})
function countDownChange(time: any) {
  timeData.value = time
}
const { padZero } = useTool()

const officialAccountRef = ref()
function handleReservation() {
  if (props.liveInfo?.isAppointment) return
  appointmentLive().then((res: any) => {
    if (res.code === 200) {
      props.liveInfo.isAppointment = true
      uni.$showToast('预约成功')
      officialAccountRef.value?.open()
    }
  })
}
</script>

<template>
  <div pc-player-full>
    <div w420px rd-8px bg="white op-10" flex-col-center py40px>
      <div text="20px white">距离课程开始还有</div>
      <div v-if="Object.keys(liveInfo).length" mt24px text-white>
        <uv-count-down :time="new Date(liveInfo?.liveStartTime).getTime() - Date.now()" @change="countDownChange">
          <view text-20px leading-43px>
            <text class="pc-time-num">{{ padZero(timeData.hours) }}</text>时
            <text class="pc-time-num">{{ padZero(timeData.minutes) }}</text>分
            <text class="pc-time-num">{{ padZero(timeData.seconds) }}</text>秒
          </view>
        </uv-count-down>
      </div>
      <template v-if="liveInfo?.liveConfig?.isLiveScheduleEnabled">
        <div v-if="liveInfo?.isAppointment" w175px h53px bg="#5EBE6A" flex-center rd-8px mt24px text-white text-18px font-500>
          <img src="/static/images/pc/common/check-white.png" w20px h20px mr8px>
          已预约
        </div>
        <div v-else w175px h53px pc-btn-sub rd-8px mt24px text-18px font-500 @click="handleReservation">
          <img src="/static/images/pc/home/yuyue.png" w20px h20px mr8px>
          预约直播
        </div>
      </template>
    </div>
  </div>
  <pc-official-account ref="officialAccountRef" />
</template>