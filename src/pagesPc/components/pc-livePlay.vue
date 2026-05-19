<script setup lang='ts'>
import { LiveStatusEnum, LiveTypeEnum, MqttMessageStatusEnum } from '@/utils/enum'
import { formatTime } from '@/utils/common'
import { getLiveUserCount, getLiveTeatherInfo, getRoomLike } from '@/api/live'
import { storeToRefs } from 'pinia'
const props = defineProps<{
  liveStatus?: number
  liveInfo?: any
  showCouponBtn?: boolean
}>()
const liveType: any = defineModel('liveType')
const { logout } = useAuth()

const playerRef = ref<HTMLDivElement | null>(null)
const setting = useSetting()
const { settingInfo } = storeToRefs(setting)
function fullscreen() {
  const el = playerRef.value
  if (!el) return
  if (el.requestFullscreen) {
    el.requestFullscreen()
  } else if ((el as any).webkitRequestFullscreen) {
    (el as any).webkitRequestFullscreen()
  } else if ((el as any).mozRequestFullScreen) {
    (el as any).mozRequestFullScreen()
  } else if ((el as any).msRequestFullscreen) {
    (el as any).msRequestFullscreen()
  }
}

//是否显示在线人数
const isOnlineUserCountEnabled = computed(() => {
  return settingInfo.value?.liveConfig?.isOnlineUserCountEnabled
})

// 背景图：优先使用预约背景图（liveInfo中），没有时使用直播封面图
const bgImage = computed(() => {
  return props.liveInfo?.liveConfig?.liveScheduleBgMedia || props.liveInfo?.generalConfig?.backgroundImage || props.liveInfo?.liveCoverImage
})

const prizeDrawRef = ref()

const emit = defineEmits(['showProductDetail', 'timeUpdate', 'seeked', 'play', 'pause'])

// === 回放视频同步相关 ===
const mainPlayerRef = ref()

// 获取当前播放时间
function getCurrentTime(): number {
  return mainPlayerRef.value?.getCurrentTime?.() || 0
}

// 设置播放时间
function seekTo(time: number) {
  mainPlayerRef.value?.seekTo?.(time)
}

// 获取是否正在播放
function getIsPlaying(): boolean {
  return mainPlayerRef.value?.getIsPlaying?.() || false
}

// 事件向上传递
function onPlayerTimeUpdate(time: number) {
  emit('timeUpdate', time)
}
function onPlayerSeeked(time: number) {
  emit('seeked', time)
}
function onPlayerPlay(time: number) {
  emit('play', time)
}
function onPlayerPause(time: number) {
  emit('pause', time)
}

// 外部调用的播放方法
function play() {
  mainPlayerRef.value?.play?.()
}

// 外部调用的暂停方法
function pause() {
  mainPlayerRef.value?.pause?.()
}
function changeLiveType() {
  liveType.value = liveType.value === LiveTypeEnum.ThreeSplit ? LiveTypeEnum.PptThreeSplit : LiveTypeEnum.ThreeSplit
}

const couponObj: any = ref({})
const prizeCountDown = ref()
const noticePopup = ref()
const noticeContent = ref('')
const liveProductRef = ref()
const buyList: any = ref([]) // 正在购买商品队列
// 接收通知消息
function addMessage(msgObj: any) {
  if (msgObj.type === MqttMessageStatusEnum.CouponCountdown) {
    // 优惠券倒计时消息
    const obj = msgObj.content ? JSON.parse(msgObj.content) : {}
    couponObj.value = { ...obj, type: 1 }
  } else if (msgObj.type === MqttMessageStatusEnum.Duration) {
    // 优惠券持续时间
    const obj = msgObj.content ? JSON.parse(msgObj.content) : {}
    couponObj.value = { ...obj, type: 2 }
  } else if (msgObj.type === MqttMessageStatusEnum.LotteryCountdown) {
    // 抽奖倒计时消息
    prizeCountDown.value = msgObj.content
    if (msgObj.content < 4) {
      if (msgObj.content < 1) {
        return prizeDrawRef.value.close()
      }
      prizeDrawRef.value.initCountDown(msgObj.content)
    }
  } else if (msgObj.type === MqttMessageStatusEnum.ProductIntroduction) {
    // 商品讲解消息
    liveProductRef.value.open(msgObj.content)
  } else if (msgObj.type === MqttMessageStatusEnum.CancelProductIntroduction) {
    // 取消商品讲解
    liveProductRef.value.cancel()
  } else if (msgObj.type === MqttMessageStatusEnum.ProductShelves) {
    // 商品上架
    liveProductRef.value.productOpen(msgObj.content)
  } else if (msgObj.type === MqttMessageStatusEnum.Buying) {
    // 正在购买商品消息
    buyList.value.push(JSON.parse(msgObj.content))
    // 处理队列
    processBuyingQueue()
  } else if (msgObj.type === MqttMessageStatusEnum.Announcement) {
    // 公告
    noticeContent.value = msgObj.content
    noticePopup.value.open()
  } else if (msgObj.type === MqttMessageStatusEnum.CouponReceiveResult) {
    // 优惠券领取结果
    couponListRef.value?.showResult(JSON.parse(msgObj.content))
  } else if (msgObj.type === MqttMessageStatusEnum.LotteryResult) {
    // 抽奖结果
    prizeDrawRef.value.showResult(msgObj.content)
  } else if (msgObj.type === MqttMessageStatusEnum.Popularity) {
    // 人气
    userTotal.value = msgObj.content ? JSON.parse(msgObj.content || '{}')?.popularity : 0
  } else if (msgObj.type === MqttMessageStatusEnum.GetLikes) {
    // 获取点赞
    likeNum.value = msgObj.content || 0
  }
}

const isShowingBuy = ref(false) // 是否正在显示购买商品
const buyInfo: any = ref({}) // 具体信息
function processBuyingQueue() {
  if (isShowingBuy.value || buyList.value.length === 0) {
    return
  }
  isShowingBuy.value = true
  const nextBuy = buyList.value.shift()
  buyInfo.value = nextBuy
  setTimeout(() => {
    isShowingBuy.value = false
    // 递归处理下一个购买商品
    nextTick(() => {
      processBuyingQueue()
    })
  }, 10000) // 10秒显示时间
}

const userTotal = ref(0) // 直播间用户总数
const userAvatar = ref('') // 直播间用户列表
const teacherName = ref('')
const { getUser } = useAuth()

const likeNum = ref(0) // 点赞数
watch(() => props.liveInfo, (newVal) => {
  if (newVal?.id) {
    getRoomLike({
      roomId: newVal.id
    }).then((res: any) => {
      likeNum.value = res.data || 0
    })
  }
}, { immediate: true })

onMounted(() => {
  getLiveUserCount({ id: getUser()?.liveId }).then((res: any) => {
    userTotal.value = res.data?.popularity || 0
  })
  getLiveTeatherInfo().then((res: any) => {
    // 处理老师信息
    teacherName.value = res.data?.nickName
    userAvatar.value = res.data?.avatar
  })
})

defineExpose({
  addMessage,
  getCurrentTime,
  seekTo,
  getIsPlaying,
  play,
  pause
});

const couponListRef = ref()

function handleCoupon() {
  const liveId = props.liveInfo?.id || getUser()?.liveId
  couponListRef.value.open(liveId)
}
</script>

<template>
  <div relative>
    <div ref="playerRef" bg="#2D2D2D" wfull hfull>
      <my-player ref="mainPlayerRef" isPC wfull hfull hideFull :liveInfo="liveInfo"
        :type="liveType === LiveTypeEnum.PptThreeSplit ? 'course' : 'live'" playClass="w130px h130px"
        v-if="(liveStatus === LiveStatusEnum.Live || liveStatus === LiveStatusEnum.Playback)"
        @time-update="onPlayerTimeUpdate" @seeked="onPlayerSeeked" @play="onPlayerPlay" @pause="onPlayerPause"></my-player>
      <image v-else :src="bgImage" wfull hfull mode="aspectFill" />
    </div>
    <img v-if="liveStatus === LiveStatusEnum.NotStarted || liveStatus === LiveStatusEnum.Ended"
      src="/static/images/pc/common/close.png" @click="logout()"
      class="cursor-pointer w12px h12px absolute z-2 top-20px right-20px">
    <div v-if="liveStatus !== LiveStatusEnum.Playback" absolute bottom-0 left-0 h52px wfull text-white bg-white bg-op-10
      flex-between pl20px pr24px z-1>
      <div flex items-center>
        <img src="/static/images/pc/home/pfill.png" w16px h14px mr8px>{{ teacherName }}
      </div>
      <div flex items-center gap-24px>
        <!-- <img v-if="liveType !== LiveTypeEnum.PureVideo" src="/static/images/pc/home/transfer.png" w20px h20px
          cursor-pointer @click="changeLiveType">
        <img src="/static/images/pc/home/fullscreen.png" w20px h20px cursor-pointer @click="fullscreen"> -->
      </div>
    </div>

    <template v-if="liveStatus !== LiveStatusEnum.Playback">
      <div v-if="liveType !== LiveTypeEnum.PureVideo" @click="changeLiveType" absolute cursor-pointer flex-center w70px
        h25px rd-2px bg="white op-10" text-white class="top-20px right-180px" z-10>
        切换
      </div>
      <div @click="fullscreen" absolute cursor-pointer flex-center w70px h25px rd-2px bg="white op-10" text-white
        class="top-20px right-90px" z-10>
        全屏
      </div>
    </template>

    <!-- 未开始 -->
    <pc-notStart :liveInfo="liveInfo" v-if="LiveStatusEnum.NotStarted === liveStatus"></pc-notStart>
    <!-- 直播中 -->
    <div v-if="liveStatus === LiveStatusEnum.Live">
      <div text-white bg-black>
        <div absolute top-20px left-20px h32px pr10px pl5px flex items-center bg="#000 op-60" rd-full>
          <!-- <uv-avatar :src="userAvatar" size="24px"></uv-avatar> -->
          <div class="ml8px">
            <div v-if="isOnlineUserCountEnabled" text-12px leading-12px>{{ userTotal }}人在线</div>
            <div text-11px leading-12px mt-2px>{{ likeNum }}本场点赞</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 直播回放点赞 -->
    <div v-if="liveStatus === LiveStatusEnum.Playback">
      <div text-white>
        <div absolute top-20px left-20px h32px pr10px pl5px flex items-center bg="#000 op-60" rd-full>
          <!-- <uv-avatar :src="userAvatar" size="24px"></uv-avatar> -->
          <div class="ml8px">
            <div text-11px leading-12px mt-2px>{{ likeNum }}本场点赞</div>
          </div>
        </div>
      </div>
    </div>
    <!-- 抽奖/优惠券 -->
    <div absolute bottom-150px right-24px flex-col-center min-w35px text-white z-10>
      <div v-if="prizeCountDown > 0" flex-col-center>
        <img src="/static/images/pc/home/prize.png" w50px h50px cursor-pointer @click="prizeDrawRef.open(liveInfo.id)">
        <div bg-black-box text-10px w35px h13px>
          {{ formatTime(prizeCountDown) }}
        </div>
      </div>
      <div
        v-if="showCouponBtn"
        relative flex flex-col-center cursor-pointer @click="handleCoupon">
        <img src="/static/images/pc/home/coupon.png" w64px h64px mt12px>
        <div bg-black-box text-12px text-white px6px h16px>优惠券</div>
      </div>
    </div>

    <!-- 点赞 -->
    <pc-thumb w50px h50px bg="white op-20" absolute z-1 bottom-90px right-24px></pc-thumb>

    <!-- 弹出层 -->

    <!-- 商品购买 -->
    <transition name="slide-in-left">
      <div v-if="isShowingBuy" absolute w291px left-12px bottom-105px pc-bg-white-box p8px pr14px flex-between>
        <img :src="buyInfo.coverImage" w46px h46px rd-2px>
        <div mx8px flex-1>
          <div><span text="#ECBC47" mr4px>{{ buyInfo?.maskedNickName
              }}</span>{{ settingInfo?.liveConfig?.promptText || '正在购买' }}</div>
          <div mt6px>{{ buyInfo?.productTitle }}</div>
        </div>
        <div text-white font-500 w74px h32px cursor-pointer rd-full bg="#DF4F48" flex-center
          @click="emit('showProductDetail', buyInfo?.prodcutId)">{{ settingInfo?.liveConfig?.shortcutKeyName || '马上抢' }}
        </div>
      </div>
    </transition>
    <!-- 公告弹出 -->
    <pc-popup-warn ref="noticePopup" title="公告" icon="/static/images/pc/home/pin2.png">
      <div py40px px45px leading-24px line-clamp-4 break-words>
        {{ noticeContent }}
      </div>
    </pc-popup-warn>

    <!-- 抽奖 -->
    <my-prize-draw type="pc" ref="prizeDrawRef"></my-prize-draw>
    <!-- 优惠券列表抽屉 -->
        <my-coupon-list ref="couponListRef" :isPc="true"></my-coupon-list>
    <!-- 商品弹出 -->
    <my-live-product ref="liveProductRef" type="pc" @select="emit('showProductDetail', $event)"></my-live-product>
    <!-- 已结束 -->
    <pc-liveTip v-if="liveStatus === LiveStatusEnum.Ended" title="额...该直播已结束啦"
      icon="/static/images/pc/home/ended.png"></pc-liveTip>

  </div>
</template>

<style lang="scss" scoped></style>
