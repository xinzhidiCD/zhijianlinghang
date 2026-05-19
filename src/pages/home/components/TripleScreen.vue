<template>
  <view>
    <!-- 已结束 -->
    <my-ended v-if="LiveStatusEnum.Ended === liveStatus"></my-ended>
    <view v-else class="triple-screen-container" flex flex-col wfull bg="#F7F7F7">
      <view wfull h422rpx relative class="shrink-0">
        <!-- 播放器 -->
        <my-player ref="livePlayerRef" :liveInfo="liveInfo" type="live"
          v-if="LiveStatusEnum.Live === liveStatus || LiveStatusEnum.Playback === liveStatus" wfull hfull
          @time-update="onLiveTimeUpdate" @seeked="onLiveSeeked" @play="onLivePlay" @pause="onLivePause"></my-player>
        <!-- 分享 -->
        <view v-if="!type" class="w116rpx h48rpx bg-black-box absolute top-32rpx right-0" border-rd="[24rpx_0_0_24rpx]"
          @click="liveShareRef.open()">
          <image src="/static/images/h5/common/share.png" w28rpx h28rpx mr6rpx />分享
        </view>

        <!-- 朋友圈 -->
        <view v-if="type" class="h48rpx bg-black-box absolute top-32rpx right-0 flex items-center" border-rd="[24rpx_0_0_24rpx]"
          px24rpx @click="goToMomentsPoster">
          <image src="/static/images/h5/common/share.png" w28rpx h28rpx mr6rpx />朋友圈
        </view>

        <!-- 在线人数 -->
        <view class="bg-black-box absolute top-30rpx left-24rpx"
          v-if="LiveStatusEnum.Live === liveStatus">
          <view class="h72rpx pl6rpx pr32rpx flex items-center">
            <!-- <uv-avatar :src="userAvatar" size="60rpx"></uv-avatar> -->
            <view class="ml6rpx">
              <view v-if="isOnlineUserCountEnabled" text-24rpx>{{ userTotal }}人在线</view>
              <view text-20rpx mt8rpx leading-20rpx>{{ likeNum }} 本场点赞</view>
            </view>
          </view>
        </view>

        <!-- 回放点赞数 -->
        <view v-if="LiveStatusEnum.Playback === liveStatus" class="bg-black-box absolute top-30rpx left-24rpx">
          <view class="h60rpx pl6rpx pr32rpx flex items-center">
            <!-- <uv-avatar :src="userAvatar" size="46rpx"></uv-avatar> -->
            <view class="ml6rpx">
              <view text-22rpx mt8rpx leading-20rpx>{{ likeNum }} 本场点赞</view>
            </view>
          </view>
        </view>

        <!-- 未开始 -->
        <my-not-start :liveInfo="liveInfo" v-if="LiveStatusEnum.NotStarted === liveStatus"></my-not-start>
        <!-- 回放密码 -->
        <my-playback @pass="playbackPasswordPass"
          v-if="LiveStatusEnum.Playback === liveStatus && liveInfo?.isEnableReplayPassword && !camera.isInputPassword"></my-playback>
      </view>
      
      <view h90rpx bg-white flex-center gap-118rpx class="shrink-0">
        <view v-for="c, k in tabList" :key="k" text-30rpx font-500
          :class="[tabIndex === k ? 'text-#333 relative' : 'text-#606266']" @click="tabChange(k)">
          {{ c }}<view v-if="tabIndex === k" class="absolute bottom-[-22rpx] left-0 bg-#0B68F6 wfull h4rpx rd-2rpx">
          </view>
        </view>
      </view>

      <template v-if="tabsContentShow">
        <!-- 聊天 -->
        <my-im ref="imRef" v-if="tabList[tabIndex] === '聊天' && settingInfo?.liveConfig?.isInteractionEnabled"
          :liveInfo="liveInfo" :liveStatus="liveStatus" :showCouponBtn="props.showCouponBtn" @refreshCoupon="emit('refreshCoupon')"></my-im>
        <!-- 课件 -->
        <view v-if="tabList[tabIndex] === '课件' && settingInfo?.liveConfig?.isCoursewareEnabled" py16rpx>
          <my-player ref="coursePlayerRef" :hideRisk="true" :liveInfo="liveInfo" type="course" wfull h470rpx
            @time-update="onCourseTimeUpdate" @seeked="onCourseSeeked" @play="onCoursePlay" @pause="onCoursePause"></my-player>
        </view>
        <!-- 介绍 -->
        <my-live-introduce v-if="tabList[tabIndex] === '介绍' && settingInfo?.liveConfig?.isIntroductionEnabled"
          :liveInfo="liveInfo"></my-live-introduce>
      </template>

      <!-- 分享 -->
      <my-share ref="liveShareRef"></my-share>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { LiveStatusEnum, MqttMessageStatusEnum } from '@/utils/enum'
import { getLiveUserList, getLiveTeatherInfo, getRoomLike, getLiveUserCount } from '@/api/live'
import { getMessageHistory } from '@/api/message'
import { storeToRefs } from 'pinia'
import wx from 'weixin-js-sdk'
const props = defineProps<{
  liveInfo: any
  showCouponBtn?: boolean
}>()
const emit = defineEmits(['refreshCoupon'])

const liveStatus = computed(() => {
  return props.liveInfo?.liveState || LiveStatusEnum.NotStarted
})

//聊天、课件、介绍回放显示
const tabsContentShow = computed(() => {
  // 不是回放
  if (liveStatus.value != LiveStatusEnum.Playback) {
    return true
  }
  // 回放未开启密码
  if (liveStatus.value === LiveStatusEnum.Playback && !props.liveInfo?.isEnableReplayPassword) {
    return true
  }
  //回放开启密码，密码输入正确
  if (liveStatus.value === LiveStatusEnum.Playback && props.liveInfo?.isEnableReplayPassword && camera.isInputPassword) {
    return true
  }
  // 其他
  return false
})

const setting = useSetting()
const { settingInfo } = storeToRefs(setting)
const camera = useCamera()

const liveShareRef = ref()

// === 回放时视频同步相关 ===
const livePlayerRef = ref() // 直播/回放播放器
const coursePlayerRef = ref() // 课件播放器
let isSyncingSeek = false  // 防止进度循环同步
let isSyncingPause = false // 防止暂停循环同步

// 直播视频开始播放时
function onLivePlay(time: number) {
  // 如果课件正在播放，同步直播到课件的进度
  if (coursePlayerRef.value?.getIsPlaying?.()) {
    const courseTime = coursePlayerRef.value.getCurrentTime()
    if (courseTime > 0 && Math.abs(courseTime - time) > 1) {
      setTimeout(() => {
        livePlayerRef.value?.seekTo(courseTime)
      }, 50)
    }
  }
  // 同步课件也播放
  if (liveStatus.value === LiveStatusEnum.Playback && coursePlayerRef.value) {
    setTimeout(() => {
      coursePlayerRef.value?.play()
    }, 50)
  }
}

// 直播视频暂停时，同步课件也暂停
function onLivePause(time: number) {
  if (isSyncingPause) return
  isSyncingPause = true
  if (liveStatus.value === LiveStatusEnum.Playback && coursePlayerRef.value) {
    coursePlayerRef.value.pause()
  }
  setTimeout(() => { isSyncingPause = false }, 300)
}

// 课件视频开始播放时
function onCoursePlay(time: number) {
  // 如果直播正在播放，同步课件到直播的进度
  if (livePlayerRef.value?.getIsPlaying?.()) {
    const liveTime = livePlayerRef.value.getCurrentTime()
    if (liveTime > 0 && Math.abs(liveTime - time) > 1) {
      setTimeout(() => {
        coursePlayerRef.value?.seekTo(liveTime)
      }, 50)
    }
  }
  // 同步直播也播放
  if (liveStatus.value === LiveStatusEnum.Playback && livePlayerRef.value) {
    setTimeout(() => {
      livePlayerRef.value?.play()
    }, 50)
  }
}

// 课件视频暂停时，同步直播也暂停
function onCoursePause(time: number) {
  if (isSyncingPause) return
  isSyncingPause = true
  if (liveStatus.value === LiveStatusEnum.Playback && livePlayerRef.value) {
    livePlayerRef.value.pause()
  }
  setTimeout(() => { isSyncingPause = false }, 300)
}

// 直播视频进度更新时，同步课件视频
function onLiveTimeUpdate(time: number) {
  // 实时同步会很频繁，不做实时同步，只在拖动进度条时同步
}

// 直播视频进度条被拖动时，同步课件视频
function onLiveSeeked(time: number) {
  if (isSyncingSeek) return
  isSyncingSeek = true
  // 确保课件播放器存在才同步
  if (coursePlayerRef.value && liveStatus.value === LiveStatusEnum.Playback) {
    setTimeout(() => {
      coursePlayerRef.value?.seekTo(time)
    }, 50)
  }
  setTimeout(() => { isSyncingSeek = false }, 300)
}

// 课件视频进度更新时，同步直播视频
function onCourseTimeUpdate(time: number) {
  // 实时同步会很频繁，不做实时同步，只在拖动进度条时同步
}

// 课件视频进度条被拖动时，同步直播视频
function onCourseSeeked(time: number) {
  if (isSyncingSeek) return
  isSyncingSeek = true
  // 确保直播播放器存在才同步
  if (livePlayerRef.value && liveStatus.value === LiveStatusEnum.Playback) {
    setTimeout(() => {
      livePlayerRef.value?.seekTo(time)
    }, 50)
  }
  setTimeout(() => { isSyncingSeek = false }, 300)
}

// 根据配置动态生成 tab 列表
const tabList = computed(() => {
  const tabs = []
  if (settingInfo.value?.liveConfig?.isInteractionEnabled) {
    tabs.push('聊天')
  }
  // 课件tab已隐藏：主播端已合成单流推流，用户端无需单独查看课件
  // if (settingInfo.value?.liveConfig?.isCoursewareEnabled) {
  //   tabs.push('课件')
  // }
  if (settingInfo.value?.liveConfig?.isIntroductionEnabled) {
    tabs.push('介绍')
  }
  return tabs
})

//是否显示在线人数
const isOnlineUserCountEnabled = computed(() => {
  return settingInfo.value?.liveConfig?.isOnlineUserCountEnabled
})

const tabIndex = ref(0)

function tabChange(index: number) {
  const selectedTab = tabList.value[index]

  if (liveStatus.value === LiveStatusEnum.NotStarted && selectedTab === '课件') {
    uni.$showToast('直播未开始，暂不能查看课件内容')
    return
  }
  
  // 切换到课件tab时，同步课件视频到直播视频的当前位置（回放模式）
  if (selectedTab === '课件' && liveStatus.value === LiveStatusEnum.Playback && livePlayerRef.value) {
    const currentTime = livePlayerRef.value.getCurrentTime()
    nextTick(() => {
      setTimeout(() => {
        if (coursePlayerRef.value && currentTime > 0) {
          coursePlayerRef.value.seekTo(currentTime)
        }
      }, 500) // 等待课件播放器初始化完成
    })
  }
  
  tabIndex.value = index
  if (index === 0) {
    getMessageHistory({ roomId: props.liveInfo?.id, joinDate: Date.now(), pageSize: 50 }).then((res: any) => {
      imRef.value?.setHistory(res.data);
    })
  }
}

const imRef = ref()
const userTotal = ref(0) // 直播间用户总数

function addMessage(msg: any) {
  if (msg.type === MqttMessageStatusEnum.GetLikes) {
    likeNum.value = msg.content || 0
  }
  if (msg.type === MqttMessageStatusEnum.Popularity) {
    return userTotal.value = msg.content ? JSON.parse(msg.content || '{}')?.popularity : 0
  }
  imRef.value?.addMessage(msg)
}
function setHistory(history: any) {
  imRef.value?.setHistory(history)
}

// 密码输入通过
function playbackPasswordPass() {
  const index = tabList.value.findIndex((el) => el == '聊天')
  if (index != -1) {
    nextTick(() => {
      tabChange(index)
    })
  }
}

const userAvatar = ref('') // 直播间用户列表
const { getUser } = useAuth()
const type = ref() //判断是否是小程序进来
onMounted(() => {
  type.value =  uni.getStorageSync("type") || 0;
  // 人数使用 MQTT 推送的人气数据，不再从接口获取
  getLiveTeatherInfo().then((res: any) => {
    // 处理老师信息
    userAvatar.value = res.data?.avatar
  })
})

const likeNum = ref(0) // 点赞数

watch(() => props.liveInfo, (newVal) => {
  if (newVal?.id) {
    getRoomLike({
      roomId: newVal.id
    }).then((res: any) => {
      likeNum.value = res.data || 0
    })
    // 获取初始人气
    getLiveUserCount({
      id: newVal.id
    }).then((res: any) => {
      userTotal.value = res.data?.popularity || 0
    })
  }
}, { immediate: true })

// 跳转朋友圈海报页面
function goToMomentsPoster() {
  const user = getUser()
  const lId = user?.liveId || ''
  const vId = user?.userId || ''
  const wxCb = uni.getStorageSync('wxCallback') || ''
  const lName = props.liveInfo?.liveName || ''
  const lTime = props.liveInfo?.liveStartTime || ''
  const covImg = props.liveInfo?.liveCoverImage || ''
  
  const parts = [
    `liveId=${encodeURIComponent(lId)}`,
    `visitorId=${encodeURIComponent(vId)}`,
    `wxCallback=${encodeURIComponent(wxCb)}`,
    `liveName=${encodeURIComponent(lName)}`,
    `liveTime=${encodeURIComponent(lTime)}`,
    `coverImage=${encodeURIComponent(covImg)}`
  ]
  
  wx.miniProgram.navigateTo({
    url: `/pages/posterShare/index?${parts.join('&')}`
  })
}

defineExpose({
  addMessage,
  setHistory
})
</script>

<style lang="scss" scoped>
.triple-screen-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.shrink-0 {
  flex-shrink: 0;
}
</style>
