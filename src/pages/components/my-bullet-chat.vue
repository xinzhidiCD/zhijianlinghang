<script lang="ts" setup>

const ANIMATION_DURATION = 3000 // ms
const SEND_INTERVAL = 1000 // ms
const TRACK_COUNT = 2 // 轨道数

const barrageList: any = ref([]) // 当前显示的弹幕
const barrageQueue: any = ref([]) // 等待队列
const isProcessing = ref(false) // 是否正在处理队列
let trackIndex = 0
let sendTimer: any = null

// 处理弹幕队列
function processQueue() {
  if (isProcessing.value || barrageQueue.value.length === 0) return

  isProcessing.value = true
  const next = barrageQueue.value.shift()
  barrageList.value.push(next)

  setTimeout(() => {
    const idx = barrageList.value.findIndex((i: { id: number }) => i.id === next.id)
    if (idx > -1) barrageList.value.splice(idx, 1)
  }, ANIMATION_DURATION)

  // 延迟处理下一个弹幕
  sendTimer = setTimeout(() => {
    isProcessing.value = false
    processQueue() // 递归处理下一个
  }, SEND_INTERVAL)
}

function addBarrage(name: string, msg: string) {
  const item = {
    name,
    msg,
    id: Date.now() + Math.random(),
    track: trackIndex
  }
  barrageQueue.value.push(item)
  trackIndex = (trackIndex + 1) % TRACK_COUNT // 循环分配轨道

  // 触发队列处理
  processQueue()
}

// 清理定时器
onUnmounted(() => {
  if (sendTimer) clearTimeout(sendTimer)
})

defineExpose({
  addBarrage
})
</script>

<template>
  <view class="barrage-wrap">
    <view v-for="item in barrageList" :key="item.id" class="barrage-item" :data-id="item.id"
      :style="{ top: `${item.track * 80}rpx` }">
      <image src="/static/images/h5/home/wrap.png" w36rpx h36rpx mr8rpx />
      {{ item.name }}<text ml50rpx>{{ item.msg }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.barrage-wrap {
  position: absolute;
  width: 100%;
  z-index: 10;
  pointer-events: none;
}

.barrage-item {
  position: absolute;
  max-width: 350rpx;
  height: 58rpx;
  background: rgba(255, 106, 63, .5);
  color: #fff;
  border-radius: 29rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  font-size: 24rpx;
  animation: barrage-move 6s linear forwards;
}

@keyframes barrage-move {
  0% {
    transform: translateX(100vw);
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  90% {
    opacity: 1;
  }

  100% {
    transform: translateX(-1000rpx);
    opacity: 0;
  }
}
</style>