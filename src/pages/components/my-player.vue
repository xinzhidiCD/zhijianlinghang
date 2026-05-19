<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { LiveTypeEnum, LiveStatusEnum } from '@/utils/enum'
import { storeToRefs } from 'pinia'

// 播放器类型声明
declare global {
  interface Window {
    Aliplayer: any // 阿里云 RTS 播放器
    TcPlayer: any // 腾讯云 WebRTC 播放器
    TCPlayer: any // 腾讯云 WebRTC 播放器(全大写)
  }
}

const props = defineProps<{
  hideFull?: boolean // 是否隐藏全屏按钮
  type: string // live:直播，course 课件
  liveInfo: any
  isPC?: boolean
  playClass?: string
  hideRisk: {
    type: Boolean,
    default: false
  }
}>()

// 定义事件，用于视频进度同步
const emit = defineEmits<{
  timeUpdate: [time: number]
  seeked: [time: number]
  play: [time: number] // 开始播放时触发
  pause: [time: number] // 暂停时触发
}>()
// const liveUrl = ref('https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8') // 播放地址
// 封面图
const poster = computed(() => {
  return props.type === 'live' ? props.liveInfo?.liveCoverImage : ''
})

const videoId = 'artc-player-' + uuidv4()  // 使用时间戳生成简单的ID
let currentPlayer: any = null // 保存当前播放器实例
let isInitialized = false // 防止重复初始化

// 判断是否为 WebRTC 播放地址
const isWebRTC = computed(() => {
  const url = resolutionUrl.value
  return url && (url.startsWith('webrtc://') || url.includes('webrtc'))
})

// 清理播放器
function cleanup() {
  isInitialized = false
  if (currentPlayer) {
    try {
      if (isWebRTC.value) {
        // WebRTC 播放器清理
        currentPlayer.dispose()
      } else {
        // 阿里云播放器清理
        currentPlayer.off()
        currentPlayer.dispose()
      }
    } catch (e) {
      console.log('清理播放器实例时出错:', e)
    }
    currentPlayer = null
  }
  needUserPlay.value = false
  hasPlayed.value = false // 重置播放状态
}

const setting = useSetting()
const { settingInfo } = storeToRefs(setting)
// 摄像头状态
const camera = useCamera()
const { cameraStatus, onlySound, mainUrl, backupUrl } = storeToRefs(camera)
const resolutionUrl = computed(() => {
  return props.type === 'live' ? mainUrl.value : backupUrl.value
})

// 保存上一次的URL,避免重复初始化
const lastResolutionUrl = ref('')

const tentvideoDom = ref()
onMounted(() => {
  initVideo()
})

watch(() => [props.type, resolutionUrl.value], ([newType, newUrl], [oldType, oldUrl]) => {
  // 只有当URL真正变化或type变化时才重新初始化
  if (newType !== oldType || (newUrl !== oldUrl && newUrl !== lastResolutionUrl.value)) {
    console.log('type切换或播放地址变化,清理播放器并重新初始化', { newType, oldType, newUrl, oldUrl })
    lastResolutionUrl.value = newUrl as string
    cleanup()
    nextTick(() => {
      initVideo()
    })
  }
})

// 清晰度下拉
const showQuality = ref(false)
const qualityList: any = ref([])
const currentQuality: any = ref({})

function toggleQuality() {
  showQuality.value = !showQuality.value
  showLine.value = false // 关闭线路下拉
}
function selectQuality(item: any) {
  // 避免重复设置相同的清晰度
  if (currentQuality.value.value === item.value) {
    showQuality.value = false
    return
  }
  currentQuality.value = item
  camera.setResolutionUrl(item)
  showQuality.value = false
}

// 线路选择
const showLine = ref(false)
const lineList = ref<any[]>([])
const currentLine = ref<any>({})

// 根据 livePlatformIds 动态设置可用线路
const availableLines = computed(() => {
  const platformIds = props.liveInfo?.livePlatformIds || []
  const lines = []

  if (platformIds.includes(1)) {
    lines.push({ label: '线路1', value: 'aliyun', id: 1 })
  }
  if (platformIds.includes(2)) {
    lines.push({ label: '线路2', value: 'tencent', id: 2 })
  }

  return lines
})

// 监听可用线路变化，更新 lineList 和默认线路
watch(availableLines, (lines) => {
  lineList.value = lines
  if (lines.length > 0 && !currentLine.value.value) {
    // 检查是否有线路2可用，且用户之前选择过线路2
    const savedLine = uni.getStorageSync('selectedLine')
    const hasLine2 = lines.find(line => line.id === 2)

    if (savedLine && savedLine.id === 2 && hasLine2) {
      // 如果数据中有线路2，且用户之前选择过线路2，自动切换到线路2
      currentLine.value = hasLine2
    } else {
      currentLine.value = lines[0]
    }
  }
}, { immediate: true })

function toggleLine() {
  showLine.value = !showLine.value
  showQuality.value = false // 关闭清晰度下拉
}
function selectLine(item: any) {
  currentLine.value = item
  showLine.value = false
  // 持久化线路2的选择
  if (item.id === 2) {
    uni.setStorageSync('selectedLine', item)
  } else {
    uni.removeStorageSync('selectedLine')
  }
  // 根据选择的线路更新清晰度的播放地址
  if (props.liveInfo.liveState === LiveStatusEnum.Live) {
    updateQualityUrls()
  }
}

function updateQualityUrls() {
  const isAliyun = currentLine.value.value === 'aliyun'
  qualityList.value = [
    {
      label: '原画',
      value: 'OD',
      mainUrl: isAliyun ? props.liveInfo?.playLiveUrl : props.liveInfo?.playLiveUrlTencent,
      backupUrl: isAliyun ? props.liveInfo?.playLive3PUrl : props.liveInfo?.playLive3PUrlTencent
    },
    {
      label: '超清',
      value: 'HD',
      mainUrl: isAliyun ? props.liveInfo?.ludMainUrl : props.liveInfo?.ludMainUrlTencent,
      backupUrl: isAliyun ? props.liveInfo?.ludBackupUrl : props.liveInfo?.ludBackupUrlTencent
    },
    {
      label: '高清',
      value: 'SD',
      mainUrl: isAliyun ? props.liveInfo?.lhdMainUrl : props.liveInfo?.lhdMainUrlTencent,
      backupUrl: isAliyun ? props.liveInfo?.lhdBackupUrl : props.liveInfo?.lhdBackupUrlTencent
    }
  ]
  // 保持当前清晰度,更新URL
  const currentValue = currentQuality.value.value
  const newQuality = qualityList.value.find((q: any) => q.value === currentValue) || qualityList.value[0]

  // 只有当URL真正发生变化时才更新
  if (currentQuality.value.mainUrl !== newQuality.mainUrl ||
    currentQuality.value.backupUrl !== newQuality.backupUrl) {
    currentQuality.value = newQuality
    camera.setResolutionUrl(newQuality)
  } else {
    currentQuality.value = newQuality
  }
}
watch(() => props.liveInfo, (obj) => {
  if (obj.liveState === LiveStatusEnum.Live) {
    updateQualityUrls()
  }
}, { deep: true, immediate: true })

const myVideoRef = ref()
async function initVideo() {
  if (props.liveInfo?.isReplay) {
    nextTick(() => {
      myVideoRef.value.initVideo()
    })
    return
  }
  if ((props.type === 'live' && !mainUrl.value) || (props.type === 'course' && !backupUrl.value)) {
    return
  }
  if (isInitialized) {
    console.log('已初始化，跳过重复初始化')
    return
  }

  isInitialized = true

  // #ifdef H5
  const container = document.getElementById(videoId) as any
  if (!container && !isWebRTC.value) {
    console.error('找不到播放器容器:', videoId)
    isInitialized = false
    return
  }

  // 根据 URL 判断使用哪个播放器
  const useWebRTC = isWebRTC.value

  if (resolutionUrl.value) {
    // 根据播放器类型初始化
    if (useWebRTC) {
      initWebRTCPlayer()
    } else {
      initRtcPlayer(container)
    }
  } else {
    console.log('没有可用的播放地址')
    isInitialized = false
  }
  // #endif
}

const loading = ref(false) // 播放loading

// 初始化 WebRTC 播放器
function initWebRTCPlayer() {
  tentvideoDom.value.innerHTML = `
   <video id="${videoId}" preload="auto" class="wfull hfull" playsinline webkit-playsinline autoplay>
      </video>`

  if (currentPlayer) {
    return
  }

  // 使用 nextTick 确保 video 元素已经渲染
  nextTick(() => {
    // 再次检查，确保 DOM 完全更新
    setTimeout(() => {
      try {
        // 确保容器内有 video 元素
        const videoEl = document.getElementById(videoId) as HTMLVideoElement
        if (!videoEl) {
          console.error('找不到 video 元素:')
          isInitialized = false
          return
        }

        const tcPlayer = new window.TCPlayer(videoId, {
          sources: [
            resolutionUrl.value
          ]
        });

        currentPlayer = tcPlayer
        needUserPlay.value = true

        // WebRTC 播放器事件监听
        tcPlayer.on('playing', () => {
          needUserPlay.value = false
          hasPlayed.value = true
          loading.value = false
          // 设置音量
          if (camera.volume !== undefined) {
            setTimeout(() => setVolume(camera.volume), 200)
          }
        })

        tcPlayer.on('pause', () => {
          needUserPlay.value = true
          loading.value = false
        })

        tcPlayer.on('waiting', () => {
          if (!needUserPlay.value) {
            loading.value = true
          }
        })

        tcPlayer.on('error', (error: any) => {
          console.error('WebRTC 播放错误:', error)
          loading.value = false
          needUserPlay.value = true
        })

        tcPlayer.on('loadedmetadata', () => {
          if (camera.volume !== undefined) {
            setVolume(camera.volume)
          }
        })

      } catch (error) {
        console.error('创建 WebRTC 播放器失败:', error)
        needUserPlay.value = true
        isInitialized = false
      }
    }, 100)
  })
}

// 初始化阿里云 RTS 播放器
function initRtcPlayer(container: HTMLElement) {
  if (currentPlayer) {
    return
  }

  try {
    container.innerHTML = ''

    const aliPlayer = new window.Aliplayer({
      id: container.id,
      source: resolutionUrl.value,
      width: '100%',
      height: '100%',
      autoplay: true,
      isLive: true,
      playsinline: true,
      volume: camera.volume / 100, // 初始化音量(不初始化就无法改变音量，擦)
      skinLayout: [
        {
          name: "bigPlayButton",
          align: "blabs",
          x: 30,
          y: 80,
        },
        {
          name: "controlBar",
          align: "blabs",
          x: 0,
          y: 0,
          children: [
            { name: "fullScreenButton", align: "tr", x: 10, y: 12 }
          ]
        }
      ]
    })

    currentPlayer = aliPlayer
    // console.log('播放器创建成功')
    needUserPlay.value = true

    // 添加播放事件监听来隐藏手动播放按钮
    aliPlayer.on('play', () => {
      needUserPlay.value = false
      hasPlayed.value = true // 标记已经播放过
      // 只有在实际开始播放时才显示loading
      loading.value = true
      // 播放开始时确保音量设置生效
      if (camera.volume !== undefined) {
        setTimeout(() => setVolume(camera.volume), 200)
      }
    })

    aliPlayer.on('pause', () => {
      needUserPlay.value = true
      loading.value = false
    })

    // 监听播放器真正开始播放视频（有画面输出）
    aliPlayer.on('playing', () => {
      loading.value = false
    })

    // 监听数据加载完成，可以播放时
    aliPlayer.on('canplay', () => {
      // 确保音量设置生效
      if (camera.volume !== undefined) {
        setVolume(camera.volume)
      }
      // 如果不是在播放状态，不显示loading
      if (needUserPlay.value) {
        loading.value = false
      }
    })

    // 监听元数据加载完成 - 这是设置音量的最佳时机
    aliPlayer.on('loadedmetadata', () => {
      if (camera.volume !== undefined) {
        setVolume(camera.volume)
      }
    })

    // 监听等待数据（缓冲）
    aliPlayer.on('waiting', () => {
      // 只有在播放状态下才显示缓冲loading
      if (!needUserPlay.value) {
        loading.value = true
      }
    })

    aliPlayer.on('error', (error: any) => {
      console.error('播放错误:', error)
      loading.value = false
      needUserPlay.value = true
    })

    // 播放器准备好后强制设置样式
    aliPlayer.on('ready', () => {
      // 播放器准备好后设置初始音量
      setTimeout(() => {
        if (camera.volume !== undefined) {
          setVolume(camera.volume)
        }
      }, 100)
    })

  } catch (error) {
    console.error('创建失败:', error)
    needUserPlay.value = true
    isInitialized = false
  }
}

// 全屏功能 - 使用播放器原生全屏
function fullscreen() {
  // 优先使用播放器自身的全屏方法，这样在iOS上也能正常工作
  if (currentPlayer) {
    try {
      if (isWebRTC.value) {
        // WebRTC 播放器全屏
        if (typeof currentPlayer.requestFullscreen === 'function') {
          currentPlayer.requestFullscreen()
          return
        }
      } else {
        // 阿里云播放器全屏
        if (typeof currentPlayer.requestFullScreen === 'function') {
          currentPlayer.requestFullScreen()
          return
        }
      }
    } catch (e) {
      console.log('播放器全屏方法调用失败:', e)
    }
  }

  // 如果播放器全屏方法不可用，尝试查找video元素进行全屏
  const container = document.getElementById(videoId)
  if (container) {
    const videoEl = container.querySelector('video') as HTMLVideoElement
    if (videoEl && typeof (videoEl as any).webkitEnterFullscreen === 'function') {
      // iOS Safari特有的视频全屏方法
      try {
        // 监听iOS全屏退出事件，自动恢复播放
        videoEl.addEventListener('webkitendfullscreen', handleiOSFullscreenExit, { once: true })
        ;(videoEl as any).webkitEnterFullscreen()
        return
      } catch (e) {
        console.log('iOS视频全屏调用失败:', e)
      }
    }
  }

  // 备用方案：容器元素全屏（主要用于其他浏览器）
  const el = document.getElementById(videoId)
  if (!el) return

  try {
    if (el.requestFullscreen) {
      el.requestFullscreen()
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen()
    } else if ((el as any).mozRequestFullScreen) {
      (el as any).mozRequestFullScreen()
    } else if ((el as any).msRequestFullscreen) {
      (el as any).msRequestFullscreen()
    }
  } catch (e) {
    console.error('容器全屏调用失败:', e)
  }
}

// iOS全屏退出后自动恢复播放
function handleiOSFullscreenExit() {
  // iOS退出全屏后视频会自动暂停，需要手动恢复播放
  setTimeout(() => {
    if (currentPlayer) {
      try {
        currentPlayer.play()
        needUserPlay.value = false
      } catch (e) {
        console.log('iOS全屏退出后恢复播放失败:', e)
      }
    }
  }, 100)
}

// 设置音量
watch(
  () => camera.volume,
  (val) => {
    setVolume(val)
  },
  { immediate: true } // 立即执行一次，确保初始音量设置生效
)
function setVolume(val: number) {
  try {
    if (currentPlayer) {
      if (isWebRTC.value) {
        // WebRTC 播放器设置音量
        currentPlayer.volume(val / 100)
      } else {
        // 阿里云播放器设置音量
        currentPlayer.setVolume(val / 100)
      }
    }
  } catch (e) {
    console.error('设置音量失败:', e)
  }
}

// 播放器状态
const needUserPlay = ref(false)
// 是否已经播放过（用于控制全屏按钮显示）
const hasPlayed = ref(false)

// 手动播放
function manualPlay() {
  if (currentPlayer) {
    try {
      currentPlayer.play()
    } catch (e) {
      console.error('手动播放调用失败:', e)
    }
  }
}

// 组件卸载时清理播放器
onUnmounted(() => {
  cleanup()
})

// === 回放时视频同步相关方法 ===

// 获取当前播放时间
function getCurrentTime(): number {
  if (props.liveInfo?.isReplay && myVideoRef.value) {
    return myVideoRef.value.getCurrentTime()
  }
  return 0
}

// 设置播放时间（用于同步）
function seekTo(time: number) {
  if (props.liveInfo?.isReplay && myVideoRef.value) {
    myVideoRef.value.seekTo(time)
  }
}

// 处理 my-video 的 timeUpdate 事件，向上传递
function onVideoTimeUpdate(time: number) {
  emit('timeUpdate', time)
}

// 处理 my-video 的 seeked 事件，向上传递
function onVideoSeeked(time: number) {
  emit('seeked', time)
}

// 处理 my-video 的 play 事件，向上传递
function onVideoPlay(time: number) {
  emit('play', time)
}

// 处理 my-video 的 pause 事件，向上传递
function onVideoPause(time: number) {
  emit('pause', time)
}

// 获取是否正在播放
function getIsPlaying(): boolean {
  if (props.liveInfo?.isReplay && myVideoRef.value) {
    return myVideoRef.value.isPlaying
  }
  return false
}

// 外部调用的播放方法
function play() {
  if (props.liveInfo?.isReplay && myVideoRef.value) {
    myVideoRef.value.play()
  }
}

// 外部调用的暂停方法
function pause() {
  if (props.liveInfo?.isReplay && myVideoRef.value) {
    myVideoRef.value.pause()
  }
}

defineExpose({
  getCurrentTime,
  seekTo,
  getIsPlaying,
  play,
  pause
})

</script>

<template>
  <!-- 没有课件的处理 -->
  <view v-if="type === 'course' && !liveInfo?.playLive3PUrl && liveInfo.liveState === LiveStatusEnum.Live" flex-center
    flex-col>
    <image src="/static/images/h5/common/no-course.png" class="w152rpx h140rpx"></image>
    <view mt30rpx text="#999 30rpx">暂无课件</view>
  </view>
  <!-- 回放 -->
  <view v-else-if="liveInfo?.isReplay" relative>
    <my-video :isPc="isPC" ref="myVideoRef" type="liveVideo" :src="resolutionUrl"
      :poster="poster" :playClass="playClass" wfull hfull
      :fastForward="!!settingInfo?.liveConfig?.fastForward"
      @time-update="onVideoTimeUpdate" @seeked="onVideoSeeked" @play="onVideoPlay" @pause="onVideoPause"></my-video>
    <!-- 风险提示 -->
    <my-risk-statement v-if="settingInfo?.liveConfig?.isRiskAlertEnabled && type === 'live'" :isPC="isPC"
      :textData="settingInfo?.riskAlertType === 2 ? settingInfo?.liveConfig : settingInfo?.liveCommonConfig"
      :liveCommonConfig="settingInfo.liveCommonConfig" :color="settingInfo?.liveCommonConfig?.displayFontColour"
      :speed="['', 'slow', 'normal', 'fast'][settingInfo?.liveCommonConfig?.displayScrollSpeed]"
      :opacity="settingInfo?.liveCommonConfig?.displayTransparency"
      :size="settingInfo?.liveCommonConfig?.displayFontSize"
      :displayMode="settingInfo?.liveConfig?.riskAlertType === 2 ? settingInfo?.liveConfig?.displayMode : settingInfo?.liveCommonConfig?.displayMode"
      :liveType="liveInfo?.viewingTemplate">
    </my-risk-statement>
  </view>

  <!-- 直播 -->
  <view v-else relative overflow-hidden bg="#2d2d2d" class="group" @mouseenter="showQuality = false; showLine = false">

    <!-- 阿里云播放器容器 -->
    <div v-if="!isWebRTC" :id="videoId" wfull hfull></div>

    <!-- 腾讯云 WebRTC 播放器容器 -->
    <div v-else wfull hfull ref="tentvideoDom">

    </div>
    <!-- 自定义loading蒙层 -->
    <div v-if="loading" class="player-loading-mask">
      <div class="player-loading-spinner"></div>
    </div>

    <!-- 封面图 -->
    <div v-if="needUserPlay && poster" class="absolute inset-0">
      <image :src="poster" class="w-full h-full object-cover" />
    </div>

    <!-- 手动播放按钮 -->
    <div v-if="needUserPlay" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-2 cursor-pointer">
      <image src="/static/images/h5/common/play-circle.png" :class="[playClass || 'w120rpx h120rpx']"
        @click="manualPlay" />
    </div>

    <!-- 全屏图标（已隐藏，保留全屏逻辑） -->
    <!-- <image v-if="LiveTypeEnum.PureVideo !== liveInfo?.viewingTemplate && !hideFull && hasPlayed"
      src="/static/images/h5/common/expand.png"
      class="w36rpx h36rpx right-24rpx bottom-16rpx absolute z-9 cursor-pointer" @click="fullscreen" /> -->

    <!-- 老师摄像头关闭 -->
    <pc-liveTip v-if="isPC && cameraStatus === 'close'" title="老师摄像头已关闭"
      icon="/static/images/pc/home/close-camera.png"></pc-liveTip>

    <pc-liveTip v-if="onlySound" title="直播画面已关闭" icon="/static/images/pc/home/close-camera.png"></pc-liveTip>
    <template v-if="isPC && hideFull">
      <!-- 只听声音 -->
      <div v-if="isPC && cameraStatus === 'open'" group-hover:op-100 op-0 absolute top-16px right-16px w72px h29px
        rd-4px flex-center cursor-pointer text="12px white" bg="#305EF6" @click.stop="camera.setOnlySound(!onlySound)">
        {{ onlySound ? '打开画面' : '只听声音' }}
      </div>
    </template>
    
    <!-- H5底部控制栏 -->
    <div v-if="!isPC && hasPlayed" 
      class="absolute flex items-center z-10"
      :class="[
        (liveInfo?.viewingTemplate === LiveTypeEnum.PureVideo) ? 
          (settingInfo?.liveConfig?.isRiskAlertEnabled ? 'right-24rpx bottom-220rpx' : 'right-24rpx bottom-160rpx') :
        (settingInfo?.liveConfig?.isRiskAlertEnabled && !props.hideRisk) ? 
          ((settingInfo?.liveConfig?.riskAlertType === 2 ? settingInfo?.liveConfig?.displayMode : settingInfo?.liveCommonConfig?.displayMode) === 3 ? 'left-0 right-0 px-12px justify-between bottom-80rpx' : 'left-0 right-0 px-12px justify-between bottom-20rpx') : 
        'left-0 right-0 px-12px justify-between bottom-16rpx'
      ]">
      <!-- 左侧：线路和画质 -->
      <div class="flex items-center gap-12px">
        <!-- 线路选择 -->
        <div v-if="cameraStatus == 'open' && liveInfo.liveState !== LiveStatusEnum.Playback && type === 'live'"
          relative cursor-pointer flex-center w80px h25px rd-2px bg="white op-10" text-white
          @click.stop="toggleLine">
          {{ currentLine.label }}
          <img src="/static/images/pc/home/down.png" w10px h10px ml8px>
          <div v-if="showLine" absolute left-0 bottom-28px w80px bg-white rd-2px shadow z-10 flex flex-col text-black>
            <div v-for="item in lineList" :key="item.value" px12px py8px cursor-pointer hover:bg="#f2f3f5"
              :style="{ color: currentLine.value === item.value ? '#305EF6' : '' }" @click.stop="selectLine(item)">
              {{ item.label }}
            </div>
          </div>
        </div>
        <!-- 清晰度下拉 -->
        <div v-if="cameraStatus == 'open' && liveInfo.liveState !== LiveStatusEnum.Playback && type === 'live'"
          relative cursor-pointer flex-center w62px h25px rd-2px bg="white op-10" text-white
          @click.stop="toggleQuality">
          {{ currentQuality.label }}
          <img src="/static/images/pc/home/down.png" w10px h10px ml8px>
          <div v-if="showQuality" absolute left-0 bottom-28px w62px bg-white rd-2px shadow z-10 flex flex-col text-black>
            <div v-for="item in qualityList" :key="item.value" px12px py8px cursor-pointer hover:bg="#f2f3f5"
              :style="{ color: currentQuality.value === item.value ? '#305EF6' : '' }" @click.stop="selectQuality(item)">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧：全屏 -->
      <div v-if="LiveTypeEnum.PureVideo !== liveInfo?.viewingTemplate && !hideFull"
        cursor-pointer flex-center w60px h25px rd-2px bg="white op-10" text-white
        @click.stop="fullscreen">
        全屏
      </div>
    </div>

    <!-- PC端控制按钮保持原样 -->
    <template v-if="isPC && hideFull && cameraStatus == 'open' && liveInfo.liveState !== LiveStatusEnum.Playback">
      <!-- 清晰度下拉 -->
      <div absolute cursor-pointer flex-center w62px h25px rd-2px bg="white op-10" text-white
        class="bottom-68px left-100px"
        @click.stop="toggleQuality">
        {{ currentQuality.label }}
        <img src="/static/images/pc/home/down.png" w10px h10px ml8px>
        <div v-if="showQuality" absolute left-0 bottom-28px w62px bg-white rd-2px shadow z-10 flex flex-col text-black>
          <div v-for="item in qualityList" :key="item.value" px12px py8px cursor-pointer hover:bg="#f2f3f5"
            :style="{ color: currentQuality.value === item.value ? '#305EF6' : '' }" @click.stop="selectQuality(item)">
            {{ item.label }}
          </div>
        </div>
      </div>
      <!-- 线路选择 -->
      <div absolute cursor-pointer flex-center w80px h25px rd-2px bg="white op-10" text-white
        class="bottom-68px left-12px"
        @click.stop="toggleLine">
        {{ currentLine.label }}
        <img src="/static/images/pc/home/down.png" w10px h10px ml8px>
        <div v-if="showLine" absolute left-0 bottom-28px w80px bg-white rd-2px shadow z-10 flex flex-col text-black>
          <div v-for="item in lineList" :key="item.value" px12px py8px cursor-pointer hover:bg="#f2f3f5"
            :style="{ color: currentLine.value === item.value ? '#305EF6' : '' }" @click.stop="selectLine(item)">
            {{ item.label }}
          </div>
        </div>
      </div>
    </template>

    <!-- 风险提示 -->
    <my-risk-statement v-if="settingInfo?.liveConfig?.isRiskAlertEnabled && !props.hideRisk" :isPC="isPC"
      :textData="settingInfo?.riskAlertType === 2 ? settingInfo?.liveConfig : settingInfo?.liveCommonConfig"
      :liveCommonConfig="settingInfo.liveCommonConfig" :color="settingInfo?.liveCommonConfig?.displayFontColour"
      :speed="['', 'slow', 'normal', 'fast'][settingInfo?.liveCommonConfig?.displayScrollSpeed]"
      :opacity="settingInfo?.liveCommonConfig?.displayTransparency"
      :size="settingInfo?.liveCommonConfig?.displayFontSize" :displayMode="settingInfo?.liveConfig?.riskAlertType === 2 ?
        settingInfo?.liveConfig?.displayMode : settingInfo?.liveCommonConfig?.displayMode"
      :liveType="liveInfo?.viewingTemplate"></my-risk-statement>
  </view>
</template>
