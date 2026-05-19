<script setup lang='ts'>
import { getLiveReplayList, matchingUrl } from '@/api/live'
defineProps<{
  type?: string
}>()
const popUpRef = ref()
const replayList: any = ref([])
function open(initFirst?: boolean) {
  getLiveReplayList({
    pageNum: 1,
    pageSize: 1000
  }).then(res => {
    replayList.value = (res.rows || []).filter((x: any) => x.state)
    if (initFirst) {
      if (replayList.value.length)
        playUrl(replayList.value[0])
    } else {
      popUpRef.value.open()
    }
  })
}
const camera = useCamera()
async function playUrl(obj: any) {
  // 处理主 URL（可能是逗号分隔的多个）
  const mainUrlSource = obj.liveReplayReplaceUrl || obj.liveReplayUrl
  let mainUrl = ''
  if (mainUrlSource) {
    const mainUrls = mainUrlSource.split(',').map((s: string) => s.trim()).filter(Boolean)
    const mainResults = await Promise.all(mainUrls.map((url: string) => matchingUrl({ url })))
    mainUrl = mainResults.map(res => res?.data || '').filter(Boolean).join(',')
  }

  // 处理备用 URL（可能是逗号分隔的多个）
  let backupUrl = ''
  if (obj.liveReplayAssistUrl) {
    const backupUrls = obj.liveReplayAssistUrl.split(',').map((s: string) => s.trim()).filter(Boolean)
    const backupResults = await Promise.all(backupUrls.map((url: string) => matchingUrl({ url })))
    backupUrl = backupResults.map(res => res?.data || '').filter(Boolean).join(',')
  }

  camera.setResolutionUrl({
    mainUrl,
    backupUrl
  })
  popUpRef.value?.close()
}
defineExpose({
  open
})

</script>


<template>
  <uv-popup ref="popUpRef" mode="bottom" round="24rpx" :bgColor="type === 'pc' ? 'none' : 'white'"
    class="pc-custom-popup" :overlayStyle="{ 'background': 'rgba(3, 100, 219, 0)' }">
    <view relative wfull :class="[type === 'pc' ? 'w375px bg-white rd-8px  mb140px ml-[calc(100%-865px)]' : 'wfull']"
      pointer-events-auto>
      <view h108rpx border-b="2rpx solid #F6F6F6" text="28rpx center" font-500 leading-108rpx>系列回放列表</view>
      <image src="/static/images/h5/common/close-gray.png" cursor-pointer w32rpx h32rpx absolute top-38rpx right-32rpx
        @click="popUpRef.close()"></image>
      <view px30rpx py8rpx overflow-auto :class="[type === 'pc' ? 'h440px' : 'h55vh']">
        <view v-for="c, k in replayList" :key="k" cursor-pointer border-b="2rpx solid #F6F6F6" h118rpx flex-between
          @click="playUrl(c)">
          <view>
            <view text-28rpx>{{ c.liveName }}</view>
            <view mt2rpx text="#909193 24rpx">{{ c.actualStartTime }}-{{ c.actualEndTime }}</view>
          </view>
          <image src="/static/images/h5/common/play.png" cursor-pointer w40rpx h40rpx></image>
        </view>
      </view>
    </view>
  </uv-popup>
</template>
