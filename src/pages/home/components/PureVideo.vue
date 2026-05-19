<script lang="ts" setup>
import { LiveStatusEnum, LiveTypeEnum, MqttMessageStatusEnum } from '@/utils/enum'
import { getLiveUserList, getRoomLike, getLiveTeatherInfo, getLiveUserCount } from '@/api/live'
import { storeToRefs } from 'pinia'
import wx from "weixin-js-sdk";

const props = defineProps<{
  liveInfo: any
  showCouponBtn?: boolean
}>()

const { logout } = useAuth()

// 是否在小程序webview中
const isInMiniProgram = computed(() => !!uni.getStorageSync('type'))

// 跳转朋友圈海报页面
function goToMomentsPoster() {
  const lName = props.liveInfo?.liveName || ''
  const lTime = props.liveInfo?.liveStartTime || ''
  const covImg = props.liveInfo?.liveCoverImage || ''

  const parts = [
    `liveName=${encodeURIComponent(lName)}`,
    `liveTime=${encodeURIComponent(lTime)}`,
    `coverImage=${encodeURIComponent(covImg)}`
  ]

  wx.miniProgram.navigateTo({
    url: `/pages/posterShare/index?${parts.join('&')}`
  })
}

// 处理关闭按钮点击
function handleClose() {
  // 判断是否是从小程序进来的
  if (uni.getStorageSync('type')) {
    // 跳转到小程序的个人中心页面
    wx.miniProgram.switchTab({ url: '/pages/mine/index' })
  } else {
    // 正常退出登录
    logout()
  }
}

const liveStatus = computed(() => {
  // return 3
  return props.liveInfo?.liveState || LiveStatusEnum.NotStarted
})
const liveType = computed(() => {
  // return 3
  return props.liveInfo?.viewingTemplate
})

const videoMainRef = ref()
function addMessage(msg: any) {
  if (msg.type === MqttMessageStatusEnum.GetLikes) {
    // 获取点赞
    likeNum.value = msg.content || 0
  } else if (msg.type === MqttMessageStatusEnum.Popularity) {
    // 人气
    userTotal.value = msg.content ? JSON.parse(msg.content || '{}')?.popularity : 0
  } else {
    videoMainRef.value?.addMessage(msg)
  }
}
function setHistory(history: any) {
  videoMainRef.value?.setHistory(history)
}
defineExpose({
  addMessage,
  setHistory
})
const emit = defineEmits(['refreshCoupon'])

const camera = useCamera()
const userTotal = ref(0) // 直播间用户总数
const userAvatarList: any = ref([]) // 直播间用户列表
const teacherInfo: any = ref({})
const { getUser } = useAuth()

const setting = useSetting()
const { settingInfo } = storeToRefs(setting)

// 是否显示在线用户头像
const isOnlineUserCountEnabled = computed(() => {
  return settingInfo.value?.liveConfig?.isOnlineUserCountEnabled
})

onMounted(() => {
  getLiveUserList({ pageNum: 1, pageSize: 100, roomId: getUser()?.liveId }).then((res: any) => {
    // 只获取头像列表，人数使用 MQTT 推送的人气数据
    const avatarLst = (res.rows || []).filter((x: { avatar: string, userType: number }) => x.avatar && x.userType !== 5)
    userAvatarList.value = avatarLst.length > 0 ? avatarLst : []
    if (userAvatarList.value.length > 0) {
      userAvatarList.value = userAvatarList.value.slice(0, 3) // 只显示前三个用户头像
    }
  })
  getLiveTeatherInfo().then((res: any) => {
    // 处理老师信息
    teacherInfo.value = res?.data || {}
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

</script>

<template>
  <view class="pure-video-page">
    <view wfull hfull overflow-hidden>
      <!-- 未开始 -->
      <template v-if="LiveStatusEnum.NotStarted === liveStatus">
        <my-not-start v-if="LiveTypeEnum.PureVideo === liveType" :liveInfo="liveInfo"></my-not-start>
        <view v-else flex flex-col hfull bg="#F7F7F7">
          <view wfull class="h-[38%]" relative>
            <my-not-start :liveInfo="liveInfo"></my-not-start>
          </view>
          <view wfull class="h-[30%]" text="#AAAEB7" bg="#F2F3F5" flex-center>直播未开始，暂不支持查看课件内容</view>
        </view>
      </template>

      <!-- 已结束 -->
      <my-ended v-if="LiveStatusEnum.Ended === liveStatus"></my-ended>
      <!-- 回放密码 -->
      <my-playback
        v-if="LiveStatusEnum.Playback === liveStatus && liveInfo?.isEnableReplayPassword && !camera.isInputPassword"></my-playback>
      <!-- 直播中/回放 -->
      <view v-if="LiveStatusEnum.Live === liveStatus || LiveStatusEnum.Playback === liveStatus" hfull>
        <!-- 纯视频 -->
        <template v-if="LiveTypeEnum.PureVideo === liveType">
          <my-player v-if="LiveStatusEnum.Live === liveStatus" :liveInfo="liveInfo" type="live" wfull
            hfull></my-player>
          <view v-else wfull hfull bg="#2d2d2d" flex items-center>
            <my-player :liveInfo="liveInfo" type="live" wfull></my-player>
          </view>
        </template>
        <!-- ppt三分屏 -->
        <view v-else flex flex-col hfull bg="#F7F7F7">
          <my-player :liveInfo="liveInfo" wfull class="h-[38%]" type="live"></my-player>
          <my-player :liveInfo="liveInfo" wfull class="h-[30%]" type="course" :hideRisk="true" mt="-1px"></my-player>
          <view flex-1></view>
        </view>
      </view>
    </view>
    <view v-if="LiveStatusEnum.Ended !== liveStatus" absolute wfull flex flex-col hfull top-0 left-0
      pointer-events-none>
      <view p24rpx flex-between>
        <view class="bg-black-box bg-op-30 h72rpx p6rpx flex justify-start items-center pr-30rpx">
          <!-- <uv-avatar :src="teacherInfo?.avatar" size="60rpx"></uv-avatar> -->
          <view ml16rpx>
            <view leading-24rpx text-24rpx>{{ teacherInfo?.nickName }}</view>
            <view text-20rpx mt8rpx leading-20rpx>{{ likeNum }}本场点赞</view>
          </view>
        </view>
        <view flex items-center gap-8rpx>
          <template v-if="liveStatus === LiveStatusEnum.Live && isOnlineUserCountEnabled">
            <view v-for="c, k in userAvatarList" :key="k" w54rpx h54rpx border="2rpx solid #fff op-60" rd-full>
              <uv-avatar :src="c.avatar" size="50rpx"></uv-avatar>
            </view>
            <view class="bg-black-box bg-op-30 min-w38rpx px4rpx h38rpx text-24rpx">{{ userTotal }}</view>
          </template>
          <view v-if="isInMiniProgram" class="bg-black-box bg-op-60 h48rpx px20rpx flex items-center rd-24rpx mr-8rpx pointer-events-auto" @click="goToMomentsPoster">
            <text text-22rpx color-white>朋友圈</text>
          </view>
          <image src="/static/images/h5/common/close-white-48.png" w48rpx h48rpx pointer-events-auto @click="handleClose()">
          </image>
        </view>
      </view>

      <my-video-main ref="videoMainRef" :liveInfo="liveInfo" :showCouponBtn="props.showCouponBtn" @refreshCoupon="emit('refreshCoupon')"></my-video-main>

    </view>
  </view>
</template>


<style lang="scss" scoped>
.pure-video-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
