<script setup lang='ts'>
import { matchingUrl } from '@/api/live'
import { storeToRefs } from 'pinia'
const setting = useSetting()
const { settingInfo } = storeToRefs(setting)

const props = defineProps<{
  isPc: {
    default: false,
    type: boolean,
  },
  src?: string
  poster?: string
  type?: string
  playClass?: string
  showFullscreen: {
    type: boolean,
    default: true
  }
  fastForward?: boolean
}>()

const emit = defineEmits<{
  ended: []
  timeUpdate: [time: number]
  seeked: [time: number]
  play: [time: number] // 开始播放时触发，带上当前时间
  pause: [time: number] // 暂停时触发，带上当前时间
}>()

const videoList = ref<Array<{ url: string, poster: string }>>([])
const currentIndex = ref(0)
const isPlaying = ref(false)
const isH5Mobile = ref(false)

// 每个实例的唯一标识，避免多实例 ID 冲突
const uid = `mv-${Math.random().toString(36).slice(2, 8)}`
function videoId(index: number) {
  return `${uid}-${index}`
}

// 自定义控件状态
const currentTime = ref(0)
const duration = ref(0)
const isDraggingProgress = ref(false)
const dragTime = ref(0)
const controlsVisible = ref(true)
let controlsTimer: ReturnType<typeof setTimeout> | null = null

// 进度百分比
const progress = computed(() => {
  if (isDraggingProgress.value) {
    return duration.value ? (dragTime.value / duration.value) * 100 : 0
  }
  return duration.value ? (currentTime.value / duration.value) * 100 : 0
})

// 显示时间
const displayCurrentTime = computed(() => {
  const t = isDraggingProgress.value ? dragTime.value : currentTime.value
  return fmtVideoTime(t)
})
const displayDuration = computed(() => fmtVideoTime(duration.value))

function fmtVideoTime(sec: number) {
  sec = Math.floor(sec || 0)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// 自定义swiper相关状态
const swiperRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startX = ref(0)
const currentTranslate = ref(0)
const prevTranslate = ref(0)
const animationId = ref(0)
const dragThreshold = 50

try {
  const sys = uni.getSystemInfoSync() as any
  isH5Mobile.value = sys.osName === 'android' || sys.osName === 'ios' || sys.osName === 'harmonyos'
} catch (e) {
  isH5Mobile.value = false
}

// ========== 自定义控件方法 ==========

function getVideoEl(): HTMLVideoElement | null {
  const wrapper = document.getElementById(videoId(currentIndex.value))
  if (!wrapper) return null
  return wrapper.querySelector('.uni-video-container > video') as HTMLVideoElement
    || wrapper.querySelector('video') as HTMLVideoElement
    || null
}

function togglePlay() {
  const video = getVideoEl()
  if (!video) return
  if (video.paused) {
    video.play()
  } else {
    video.pause()
  }
}

function tryUpdateDuration(video: HTMLVideoElement) {
  const d = video.duration
  if (d && isFinite(d) && !isNaN(d) && d > 0) {
    duration.value = d
  }
}

function onTimeUpdate() {
  const video = getVideoEl()
  if (!video || isDraggingProgress.value) return
  currentTime.value = video.currentTime
  // 某些浏览器/HLS流在 loadedmetadata 时 duration 还不可用，在 timeupdate 中持续补获
  if (!duration.value) {
    tryUpdateDuration(video)
  }
  // 触发时间更新事件，供外部同步使用
  emit('timeUpdate', currentTime.value)
}

function onLoadedMetadata() {
  const video = getVideoEl()
  if (!video) return
  tryUpdateDuration(video)
}

function onDurationChange() {
  const video = getVideoEl()
  if (!video) return
  tryUpdateDuration(video)
}

// 进度条点击跳转
function seekByClick(e: MouseEvent) {
  const bar = (e.currentTarget as HTMLElement)
  const rect = bar.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const video = getVideoEl()
  if (video && duration.value) {
    video.currentTime = percent * duration.value
    currentTime.value = video.currentTime
    // 通知外部进度被点击跳转
    emit('seeked', currentTime.value)
  }
}

// 获取当前播放时间（供外部调用）
function getCurrentTime(): number {
  return currentTime.value
}

// 设置播放时间（供外部同步调用）
function seekTo(time: number) {
  const video = getVideoEl()
  if (video && time >= 0) {
    video.currentTime = time
    currentTime.value = time
  }
}

// 进度条拖拽（兼容touch和mouse）
const progressBarRef = ref<HTMLElement | null>(null)

function onProgressDragStart(e: TouchEvent | MouseEvent) {
  e.stopPropagation()
  isDraggingProgress.value = true
  dragTime.value = currentTime.value
  resetControlsTimer()

  if ('touches' in e) {
    document.addEventListener('touchmove', onProgressDragMove, { passive: false })
    document.addEventListener('touchend', onProgressDragEnd)
  } else {
    document.addEventListener('mousemove', onProgressDragMove)
    document.addEventListener('mouseup', onProgressDragEnd)
  }
}

function onProgressDragMove(e: TouchEvent | MouseEvent) {
  if (!isDraggingProgress.value || !progressBarRef.value) return
  if ('touches' in e) e.preventDefault()
  const rect = progressBarRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  dragTime.value = percent * duration.value
}

function onProgressDragEnd() {
  if (!isDraggingProgress.value) return
  const video = getVideoEl()
  if (video && duration.value) {
    video.currentTime = dragTime.value
    currentTime.value = dragTime.value
    // 通知外部进度被拖动
    emit('seeked', dragTime.value)
  }
  isDraggingProgress.value = false
  document.removeEventListener('touchmove', onProgressDragMove)
  document.removeEventListener('touchend', onProgressDragEnd)
  document.removeEventListener('mousemove', onProgressDragMove)
  document.removeEventListener('mouseup', onProgressDragEnd)
  startControlsTimer()
}

// 全屏状态跟踪
const isFullscreen = ref(false)

function onFullscreenChange() {
  isFullscreen.value = !!(document.fullscreenElement
    || (document as any).webkitFullscreenElement
    || (document as any).mozFullScreenElement
    || (document as any).msFullscreenElement)
  // 全屏时根据 fastForward 动态切换 controlslist
  const video = getVideoEl()
  if (video) {
    if (isFullscreen.value && props.fastForward) {
      video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate')
      video.controls = false
    } else if (isFullscreen.value) {
      // 全屏但不禁止快进，用原生controls但去掉下载/画中画
      video.setAttribute('controlslist', 'nodownload noremoteplayback')
      video.controls = false
    } else {
      video.controls = false
    }
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
  document.addEventListener('mozfullscreenchange', onFullscreenChange)
  document.addEventListener('MSFullscreenChange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
  document.removeEventListener('mozfullscreenchange', onFullscreenChange)
  document.removeEventListener('MSFullscreenChange', onFullscreenChange)
})

function handleFullscreen() {
  const video = getVideoEl()
  if (!video) return
  
  // 记录全屏期间最后的播放时间（用于处理原生控件拖动进度条）
  let lastKnownTime = video.currentTime
  
  // 全屏期间持续跟踪进度（无论是播放进度还是拖动）
  const trackTime = () => { lastKnownTime = video.currentTime }
  video.addEventListener('timeupdate', trackTime)
  video.addEventListener('seeked', trackTime)
  
  // 全屏退出时的处理
  const onFullscreenExit = () => {
    // 移除全屏期间监听器
    video.removeEventListener('timeupdate', trackTime)
    video.removeEventListener('seeked', trackTime)
    
    // 延迟获取时间，确保 DOM 状态稳定后再读取
    // 直接使用已捕获的 video 变量，而不是重新查找 DOM
    setTimeout(() => {
      const time = video.currentTime > 0 ? video.currentTime : lastKnownTime
      currentTime.value = time
      emit('seeked', time)
    }, 300)
  }
  
  // iOS Safari 需要用 webkitEnterFullscreen（只能在真正的 video 元素上调用）
  if (typeof (video as any).webkitEnterFullscreen === 'function') {
    video.addEventListener('webkitendfullscreen', onFullscreenExit, { once: true })
    ;(video as any).webkitEnterFullscreen()
  } else if (video.requestFullscreen) {
    document.addEventListener('fullscreenchange', function handler() {
      if (!document.fullscreenElement) {
        onFullscreenExit()
        document.removeEventListener('fullscreenchange', handler)
      }
    })
    video.requestFullscreen()
  } else if ((video as any).webkitRequestFullscreen) {
    document.addEventListener('webkitfullscreenchange', function handler() {
      if (!(document as any).webkitFullscreenElement) {
        onFullscreenExit()
        document.removeEventListener('webkitfullscreenchange', handler)
      }
    })
    ;(video as any).webkitRequestFullscreen()
  } else if ((video as any).mozRequestFullScreen) {
    document.addEventListener('mozfullscreenchange', function handler() {
      if (!(document as any).mozFullScreenElement) {
        onFullscreenExit()
        document.removeEventListener('mozfullscreenchange', handler)
      }
    })
    ;(video as any).mozRequestFullScreen()
  } else if ((video as any).msRequestFullscreen) {
    document.addEventListener('MSFullscreenChange', function handler() {
      if (!(document as any).msFullscreenElement) {
        onFullscreenExit()
        document.removeEventListener('MSFullscreenChange', handler)
      }
    })
    ;(video as any).msRequestFullscreen()
  }
}

// 控件显示/隐藏（3秒无操作自动隐藏）
function resetControlsTimer() {
  if (controlsTimer) clearTimeout(controlsTimer)
  controlsTimer = null
}

function startControlsTimer() {
  resetControlsTimer()
  if (isPlaying.value) {
    controlsTimer = setTimeout(() => {
      controlsVisible.value = false
    }, 3000)
  }
}

function onVideoAreaClick() {
  if (controlsVisible.value && isPlaying.value) {
    controlsVisible.value = false
    resetControlsTimer()
  } else {
    controlsVisible.value = true
    startControlsTimer()
  }
}

function onControlsMouseEnter() {
  resetControlsTimer()
}

function onControlsMouseLeave() {
  startControlsTimer()
}

// ========== 视频初始化和swiper逻辑 ==========

async function initVideo() {
  // #ifdef H5
  await nextTick()

  const srcList = props.src ? props.src.split(',').map(s => s.trim()).filter(Boolean) : []

  if (props.type === 'liveVideo') {
    videoList.value = srcList.map(url => ({
      url,
      poster: props.poster || ''
    }))
  } else {
    const urlPromises = srcList.map(url => matchingUrl({ url }))
    const results = await Promise.all(urlPromises)
    videoList.value = results.map((res, index) => ({
      url: res?.data || srcList[index],
      poster: props.poster || ''
    }))
  }

  if (videoList.value.length > 0) {
    setTimeout(() => {
      playVideo(0)
    }, 300)
  }
  // #endif
}

function onVideoEnded() {
  isPlaying.value = false
  controlsVisible.value = true
  resetControlsTimer()

  if (currentIndex.value < videoList.value.length - 1) {
    currentIndex.value++
    setTimeout(() => {
      playVideo(currentIndex.value)
    }, 500)
  } else {
    emit('ended')
  }
}

function onVideoPlay() {
  isPlaying.value = true
  startControlsTimer()
  // 播放开始时再次尝试获取 duration（部分 HLS 流此时才可用）
  if (!duration.value) {
    const video = getVideoEl()
    if (video) tryUpdateDuration(video)
  }
  // 通知外部开始播放，带上当前时间
  emit('play', currentTime.value)
}

function onVideoPause() {
  isPlaying.value = false
  controlsVisible.value = true
  resetControlsTimer()
  // 通知外部暂停，带上当前时间
  emit('pause', currentTime.value)
}

// 外部调用的播放方法
function play() {
  const video = getVideoEl()
  if (video && video.paused) {
    video.play()
  }
}

// 外部调用的暂停方法
function pause() {
  const video = getVideoEl()
  if (video && !video.paused) {
    video.pause()
  }
}

function playVideo(index?: number | MouseEvent) {
  // #ifdef H5
  const targetIndex = typeof index === 'number' ? index : currentIndex.value
  currentIndex.value = targetIndex

  const id = videoId(currentIndex.value)
  const video = uni.createVideoContext(id)
  if (video) {
    video?.play()
  }
  // #endif
}

// ========== Swiper触摸逻辑 ==========

function isVideoControlArea(e: TouchEvent | MouseEvent): boolean {
  const target = e.target as HTMLElement
  if (!target) return false
  if (target.closest('.video-custom-controls') ||
    target.closest('.progress-bar-wrap') ||
    target.closest('.progress-thumb')) {
    return true
  }
  return false
}

function onTouchStart(e: TouchEvent | MouseEvent) {
  if (props.isPc) return
  if (isVideoControlArea(e)) return

  isDragging.value = true
  startX.value = 'touches' in e ? e.touches[0].clientX : e.clientX

  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
}

function onTouchMove(e: TouchEvent | MouseEvent) {
  if (!isDragging.value || props.isPc) return

  const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX
  let diff = currentX - startX.value

  const isAtStart = currentIndex.value === 0 && diff > 0
  const isAtEnd = currentIndex.value === videoList.value.length - 1 && diff < 0

  if (isAtStart || isAtEnd) {
    diff = 0
  }

  currentTranslate.value = prevTranslate.value + diff
}

function onTouchEnd() {
  if (!isDragging.value || props.isPc) return

  isDragging.value = false
  const movedBy = currentTranslate.value - prevTranslate.value

  if (movedBy < -dragThreshold && currentIndex.value < videoList.value.length - 1) {
    switchToIndex(currentIndex.value + 1)
  } else if (movedBy > dragThreshold && currentIndex.value > 0) {
    switchToIndex(currentIndex.value - 1)
  } else {
    setPositionByIndex()
  }
}

function switchToIndex(newIndex: number) {
  const oldId = videoId(currentIndex.value)
  const oldVideo = uni.createVideoContext(oldId)
  if (oldVideo) {
    oldVideo.pause()
  }

  currentIndex.value = newIndex
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  controlsVisible.value = true
  setPositionByIndex()
}

function setPositionByIndex() {
  if (!swiperRef.value) return
  const width = swiperRef.value.offsetWidth
  currentTranslate.value = -currentIndex.value * width
  prevTranslate.value = currentTranslate.value
}

function swiperCurrentChange(type: number) {
  if (type === 1 && currentIndex.value > 0) {
    switchToIndex(currentIndex.value - 1)
  }
  if (type === 2 && currentIndex.value < videoList.value.length - 1) {
    switchToIndex(currentIndex.value + 1)
  }
}

const swiperStyle = computed(() => {
  if (!swiperRef.value) {
    return {
      transform: `translateX(${-currentIndex.value * 100}%)`,
      transition: isDragging.value ? 'none' : 'transform 0.3s ease-out'
    }
  }
  return {
    transform: `translateX(${currentTranslate.value}px)`,
    transition: isDragging.value ? 'none' : 'transform 0.3s ease-out'
  }
})

watch(currentIndex, () => {
  nextTick(() => {
    setPositionByIndex()
  })
})

onMounted(() => {
  nextTick(() => {
    setPositionByIndex()
  })
})

defineExpose({ initVideo, getCurrentTime, seekTo, isPlaying, play, pause })
</script>

<template>
  <div class="videoSwiper" relative bg="#2d2d2d" :class="{ 'fast-forward-mode': props.fastForward }">
    <!-- 自定义swiper -->
    <div v-if="videoList.length > 0" ref="swiperRef" class="custom-swiper" @touchstart="onTouchStart"
      @touchmove="onTouchMove" @touchend="onTouchEnd" @mousedown="onTouchStart" @mousemove="onTouchMove"
      @mouseup="onTouchEnd" @mouseleave="onTouchEnd">
      <div class="swiper-track" :style="swiperStyle">
        <div v-for="(item, index) in videoList" :key="index" class="swiper-slide">
          <div relative wfull hfull @click="onVideoAreaClick">
            <video :id="videoId(index)" :src="item.url" object-fit="contain" :poster="item.poster"
              :enable-progress-gesture="false" :controls="false" controlslist="nodownload" playsinline
              webkit-playsinline :style="{ width: '100%', height: '100%' }" @ended="onVideoEnded" @play="onVideoPlay"
              @pause="onVideoPause" @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata"
              @durationchange="onDurationChange" :autoplay="type === 'liveVideo' && index === 0"></video>
          </div>
        </div>
      </div>

      <!-- 自定义控件（移到 swiper-track 外部，避免被 will-change: transform 创建的层叠上下文限制） -->
      <div class="video-custom-controls" :class="{ 'controls-visible': controlsVisible, 'is-pc': props.isPc }"
        @click.stop @mouseenter="onControlsMouseEnter" @mouseleave="onControlsMouseLeave">

        <!-- 进度条（fastForward=true 时隐藏） -->
        <div v-if="!props.fastForward" ref="progressBarRef" class="progress-bar-wrap" @click.stop="seekByClick">
          <div class="progress-bg">
            <div class="progress-filled" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="progress-thumb" :style="{ left: progress + '%' }" @touchstart.stop="onProgressDragStart"
            @mousedown.stop="onProgressDragStart"></div>
        </div>

        <!-- 底部按钮栏 -->
        <div class="controls-bar" :class="{ 'no-progress': props.fastForward }">
          <!-- 播放/暂停 -->
          <div class="ctrl-btn" @click.stop="togglePlay">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="white" width="20" height="20">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="white" width="20" height="20">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </div>

          <!-- 时间 -->
          <div class="ctrl-time">
            {{ displayCurrentTime }} / {{ displayDuration }}
          </div>

          <div class="ctrl-spacer"></div>

          <!-- 全屏 -->
          <div class="ctrl-btn" @click.stop="handleFullscreen">
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 大播放按钮（暂停时居中显示） -->
      <div v-if="!isPlaying && duration > 0" class="big-play-btn" @click.stop="togglePlay">
        <svg viewBox="0 0 24 24" fill="white" width="48" height="48" opacity="0.85">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      <!-- 指示器 -->
      <div class="swiper-indicators" v-if="videoList.length > 1" :style="{ bottom: '16px' }">
        <span v-for="(_, index) in videoList" :key="index" class="indicator-dot"
          :class="{ active: index === currentIndex }" @click.stop="switchToIndex(index)"></span>
      </div>
    </div>

    <template v-if="props.isPc && videoList.length > 1">
      <div @click="swiperCurrentChange(1)" class="cBtn absolute left-[16px] top-[50%] -translate-y-1/2 z-[1000]">
        <uv-icon name="arrow-left" color="#ffffff" size="24"></uv-icon>
      </div>
      <div @click="swiperCurrentChange(2)" class="cBtn absolute right-[16px] top-[50%] -translate-y-1/2 z-[1000]">
        <uv-icon name="arrow-right" color="#ffffff" size="24"></uv-icon>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.videoSwiper {
  .cBtn {
    display: none;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 50%;
    padding: 6px;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.55);
    }
  }

  &:hover .cBtn {
    display: block;
  }
}

.custom-swiper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  touch-action: pan-y;
}

.swiper-track {
  display: flex;
  height: 100%;
  will-change: transform;
}

.swiper-slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
}

.swiper-indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 1000;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  transition: background-color 0.3s;
  cursor: pointer;

  &.active {
    background-color: #fff;
  }
}

/* ========== 自定义控件样式 ========== */
.video-custom-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 998;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  padding: 20px 12px 6px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  user-select: none;

  &.controls-visible {
    opacity: 1;
    pointer-events: auto;
  }
}

.progress-bar-wrap {
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
}

.progress-bg {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1.5px;
  overflow: hidden;
  transition: height 0.15s;

  .progress-bar-wrap:hover &,
  .is-pc .progress-bar-wrap:hover & {
    height: 5px;
  }
}

.progress-filled {
  height: 100%;
  background: #fff;
  border-radius: 1.5px;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  margin-top: -7px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.15s;
  touch-action: none;
  cursor: grab;

  .progress-bar-wrap:hover &,
  .controls-visible & {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
    transform: scale(1.2);
  }
}

// 移动端样式优化
@media (max-width: 750px) {
  .video-custom-controls {
    padding: 10px 6px 2px;
  }

  .progress-bar-wrap {
    height: 14px;
  }

  .progress-thumb {
    opacity: 1;
    width: 10px;
    height: 10px;
    margin-left: -5px;
    margin-top: -5px;
  }

  .controls-bar {
    gap: 6px;
    margin-top: 0;
  }

  .ctrl-btn {
    width: 26px;
    height: 26px;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .ctrl-time {
    font-size: 10px;
  }

  .big-play-btn {
    width: 48px;
    height: 48px;

    svg {
      width: 36px;
      height: 36px;
    }
  }
}

.controls-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
}

.ctrl-time {
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.ctrl-spacer {
  flex: 1;
}

/* 大播放按钮 */
.big-play-btn {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 15;
  cursor: pointer;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.6);
  }
}

// PC端hover时进度条更粗
.is-pc {
  .progress-bar-wrap:hover .progress-bg {
    height: 5px;
  }

  .progress-bar-wrap:hover .progress-thumb {
    opacity: 1;
  }
}

// fastForward 时 controls-bar 顶部无间距
.controls-bar.no-progress {
  margin-top: 8px;
}

// 全屏时隐藏原生video控件条（webkit）
video::-webkit-media-controls-timeline,
video::-webkit-media-controls-time-remaining-display,
video::-webkit-media-controls-mute-button,
video::-webkit-media-controls-volume-slider,
video::-webkit-media-controls-overflow-button {
  // 全屏时如果是 fastForward 则通过 JS 设置 controls=false，CSS兜底
  display: none !important;
}

// fastForward 全屏：完全隐藏原生控件栏
.fast-forward-mode video::-webkit-media-controls {
  display: none !important;
}
.fast-forward-mode video::-webkit-media-controls-enclosure {
  display: none !important;
}
</style>
