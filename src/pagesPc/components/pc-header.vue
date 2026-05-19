<script setup lang='ts'>
const props = defineProps<{
  liveInfo: any
}>()
const getStatusText = () => {
  switch (Number(props.liveInfo?.liveState)) {
    case 0:
      return '直播未开始'
    case 1:
      return '直播进行中'
    case 3:
      return '直播回放中'
    case 2:
      return '直播已结束'
    default:
      return '直播未开始'
  }
}
</script>

<template>
  <div h65px pl32px pr28px flex-between border-b="1px solid #E5E6EB">
    <div flex items-center>
      <img src="/static/images/pc/home/live-play.png" w20px h20px mr8px>
      <div text-18px>{{ liveInfo?.liveName }}</div>
    </div>
    <div flex items-center text="#88909B">
      <img src="/static/images/pc/home/pline.png" w14px h14px mr4px>
      ID:{{ liveInfo?.liveRoomNo }}
      <img src="/static/images/pc/home/time.png" w14px h14px ml40px mr4px>{{ getStatusText() }}
    </div>
  </div>
</template>