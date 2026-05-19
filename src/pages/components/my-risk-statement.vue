<script setup lang='ts'>
import { LiveTypeEnum } from '@/utils/enum'

interface RiskTextData {
  riskAlertContent?: string
  consultantInfoText?: string
  practiceCertificateNoText?: string
}

interface LiveCommonConfig {
  overallBgColor?: string
  consultantInfoFontColor?: string
  consultantInfoBgColor?: string
  practiceCertificateNoFontColor?: string
  practiceCertificateNoBgColor?: string
}

const props = withDefaults(defineProps<{
  isPC?: boolean
  textData?: RiskTextData
  liveCommonConfig?: LiveCommonConfig
  color?: string
  opacity?: number
  size?: number
  speed?: 'slow' | 'normal' | 'fast'
  displayMode?: number
  liveType?: number
}>(), {
  speed: 'normal',
  size: 25,
})

// displayMode -> 动画类型映射
const DISPLAY_MODE_MAP: Record<number, string> = {
  1: 'scroll',
  2: 'marquee',
  3: 'bottom',
}

const SPEED_DURATION: Record<string, number> = {
  slow: 9,
  normal: 6,
  fast: 3,
}

const text = computed(() => props.textData?.riskAlertContent || '我是风险提示')
const animationType = computed(() => (props.displayMode && DISPLAY_MODE_MAP[props.displayMode]) || 'scroll')
const animationDuration = computed(() => SPEED_DURATION[props.speed] || 6)
const lineHeight = computed(() => props.size)

// marquee 模式：容器高度 & 行数计算
const containerRef = ref<HTMLElement>()
const containerHeight = ref(200)
const maxLines = computed(() => Math.max(1, Math.floor(containerHeight.value / lineHeight.value)))

// marquee 定时器逻辑
const currentLine = ref(0)
const showLine = ref(false)
let marqueeTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

const clearAllTimers = () => {
  if (marqueeTimer) { clearTimeout(marqueeTimer); marqueeTimer = null }
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
}

const startMarquee = () => {
  clearAllTimers()
  const playNext = () => {
    showLine.value = true
    hideTimer = setTimeout(() => {
      showLine.value = false
      currentLine.value = (currentLine.value + 1) % maxLines.value
      marqueeTimer = setTimeout(playNext, 500)
    }, animationDuration.value * 1000)
  }
  playNext()
}

const initComponent = () => {
  if (containerRef.value?.parentElement) {
    containerHeight.value = containerRef.value.parentElement.clientHeight
  }
  currentLine.value = 0
  showLine.value = false
  clearAllTimers()
  stopBottomScroll()
  if (animationType.value === 'marquee') {
    startMarquee()
  } else if (animationType.value === 'bottom') {
    nextTick(startBottomScroll)
  }
}

onMounted(initComponent)

watch([() => props.textData, () => props.speed, () => props.displayMode], initComponent)

onUnmounted(() => {
  clearAllTimers()
  stopBottomScroll()
})

// bottom 模式：JS 驱动滚动（文字完全滚出后再从右侧进入）
const bottomScrollRef = ref<HTMLElement>()
const bottomRightRef = ref<HTMLElement>()
let bottomRaf: number | null = null

const startBottomScroll = () => {
  stopBottomScroll()
  const scrollEl = bottomScrollRef.value
  const containerEl = bottomRightRef.value
  if (!scrollEl || !containerEl) return

  const containerW = containerEl.clientWidth
  const textW = scrollEl.scrollWidth
  // 每秒移动的像素 = 总行程 / 动画时长
  const totalDistance = containerW + textW
  const pxPerSecond = totalDistance / animationDuration.value

  let startX = containerW // 从容器右侧外开始
  let lastTime: number | null = null

  const step = (timestamp: number) => {
    if (lastTime === null) lastTime = timestamp
    const delta = (timestamp - lastTime) / 1000
    lastTime = timestamp

    startX -= pxPerSecond * delta

    // 文字完全滚出左侧后，重置到右侧外
    if (startX < -textW) {
      startX = containerW
    }

    scrollEl.style.transform = `translateX(${startX}px)`
    bottomRaf = requestAnimationFrame(step)
  }

  bottomRaf = requestAnimationFrame(step)
}

const stopBottomScroll = () => {
  if (bottomRaf !== null) {
    cancelAnimationFrame(bottomRaf)
    bottomRaf = null
  }
}

// 移动端纯视频模式下 bottom 上移
const isBottomOffset = computed(() =>
  animationType.value === 'bottom' && !props.isPC && props.liveType === LiveTypeEnum.PureVideo
)

// 根容器样式
const rootStyle = computed(() => ({
  color: props.color,
  opacity: props.opacity ? props.opacity / 100 : 1,
  fontSize: `${props.size}px`,
}))
</script>

<template>
  <div
    ref="containerRef"
    class="risk-statement overflow-hidden"
    :class="[
      `risk-statement--${animationType}`,
      animationType === 'bottom' && isPC && 'risk-statement--bottom-pc',
      isBottomOffset && 'risk-statement--bottom-offset',
    ]"
    :style="rootStyle"
  >
    <!-- 跑马灯模式 -->
    <div v-if="animationType === 'marquee'" class="marquee-container">
      <div
        v-show="showLine"
        class="marquee-line"
        :style="{
          animationDuration: `${animationDuration}s`,
          top: `${currentLine * lineHeight}px`,
        }"
      >
        {{ text }}
      </div>
    </div>

    <!-- 横向滚动模式 -->
    <span
      v-else-if="animationType === 'scroll'"
      :style="{ animationDuration: `${animationDuration}s` }"
    >
      {{ text }}
    </span>

    <!-- 底部栏模式 -->
    <div
      v-else-if="animationType === 'bottom'"
      class="flex w-full"
      :style="{ background: liveCommonConfig?.overallBgColor }"
    >
      <div class="bottom-left">
        <div
          class="leftItem"
          :style="{
            color: liveCommonConfig?.consultantInfoFontColor,
            background: liveCommonConfig?.consultantInfoBgColor,
          }"
        >
          <span>投资顾问：</span>
          <span>{{ textData?.consultantInfoText }}</span>
        </div>
        <div
          class="leftItem"
          :style="{
            color: liveCommonConfig?.practiceCertificateNoFontColor,
            background: liveCommonConfig?.practiceCertificateNoBgColor,
          }"
        >
          <span>执业编号：</span>
          <span>{{ textData?.practiceCertificateNoText }}</span>
        </div>
      </div>
      <div ref="bottomRightRef" class="bottom-right">
        <div ref="bottomScrollRef" class="bottomScroll">
          {{ text }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.risk-statement {
  position: absolute;
  z-index: 9;
  white-space: nowrap;
  pointer-events: none;
}

// 横向滚动（使用 transform 避免回流）
.risk-statement--scroll {
  bottom: 0;
  left: 0;
  width: 100%;

  span {
    display: inline-block;
    animation: scroll-horizontal linear infinite;
  }
}

// 跑马灯
.risk-statement--marquee {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  .marquee-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .marquee-line {
    position: absolute;
    left: 0;
    white-space: nowrap;
    animation: marquee-line-scroll linear infinite;
  }
}

// 底部栏（公共样式）
.risk-statement--bottom {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60rpx;
  display: flex;

  .bottom-left {
    flex-shrink: 0;

    .leftItem {
      padding: 0 20rpx;
      height: 30rpx;
      line-height: 30rpx;
      font-size: 20rpx;
    }
  }

  .bottom-right {
    flex: 1;
    overflow: hidden;
    position: relative;

    .bottomScroll {
      position: absolute;
      left: 0;
      top: 0;
      height: 60rpx;
      line-height: 60rpx;
      will-change: transform;
    }
  }
}

// 移动端纯视频模式 bottom 上移
.risk-statement--bottom-offset {
  bottom: 146rpx;
}

// PC 底部栏覆盖
.risk-statement--bottom-pc {
  height: 52px;

  .bottom-left .leftItem {
    padding: 0 20px;
    height: 26px;
    line-height: 26px;
    font-size: 14px;
  }

  .bottom-right .bottomScroll {
    width: auto;
    height: 52px;
    line-height: 52px;
  }
}

@keyframes marquee-line-scroll {
  0% { left: 0 }
  100% { left: 100% }
}

@keyframes scroll-horizontal {
  0% { transform: translateX(100vw) }
  100% { transform: translateX(-100%) }
}
</style>
