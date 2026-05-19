<script lang="ts" setup>
import dayjs from "dayjs";
import { getGiftsList, bestowGifts } from '@/api/live'
import { getCollectInfo } from '@/api/user'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  type?: 'video' | 'live' | 'pc',
  liveId?: string
}>()
const popUpRef = ref()
const { getUser } = useAuth()
const totalPoint = ref(0)
const giftCount = ref(0) // 礼物数量
const sendGiftLoading = ref(false)
let sendTimer: any = null // 延迟发送定时器

function open() {
  activeIndex.value = 0
  getCollectInfo(getUser()?.userId).then((res: any) => {
    if (res.code === 200) {
      totalPoint.value = res.data?.totalPoints || 0
    }
  })
  getGiftsList({ pageNum: 1, pageSize: 100, show: true }).then((res: any) => {
    if (res.code === 200) {
      giftList.value = res.rows || []
      giftInfo.value = res.rows[4]
    }
  })
  popUpRef.value.open()
}

const giftList: any = ref([])
const activeIndex = ref(0)
const showGift = ref(false) // 控制礼物显示和动画
const giftQueue: any = ref([]) // 礼物队列

const activeGift = computed(() => {
  return giftList.value[activeIndex.value]
})

function handleSub() {
  if (sendGiftLoading.value) {
    uni.showToast({
      title: '操作频繁',
      icon: 'none'
    })
  }
  // 礼物价格
  const giftPrice = giftList.value[activeIndex.value].giftPrice

  if (totalPoint.value < giftPrice) {
    uni.showToast({
      title: '积分不足',
      icon: 'none'
    })
    if (giftCount.value <= 0) {
      return
    }
  } else {
    giftCount.value++
    totalPoint.value = totalPoint.value - giftPrice
  }

  // 清除之前的定时器
  if (sendTimer) {
    clearTimeout(sendTimer)
  }

  // 设置新的定时器，1秒后发送给后端
  sendTimer = setTimeout(() => {
    sendGiftLoading.value = true
    bestowGifts({
      liveId: props.liveId,
      giftId: giftList.value[activeIndex.value].giftId,
      onceNum: giftCount.value,
    }).finally(() => {
      getCollectInfo(getUser()?.userId).then((res: any) => {
        if (res.code === 200) {
          totalPoint.value = res.data?.totalPoints || 0
          sendGiftLoading.value = false
        }
      })
    })
    giftCount.value = 0
  }, 1000)

  // bestowGifts({
  //   liveId: props.liveId,
  //   giftId: giftList.value[activeIndex.value].giftId,
  // }).then((obj: any) => {
  //   if (obj.code === 200) {
  //     // popUpRef.value.close()
  //     getCollectInfo(getUser()?.userId).then((res: any) => {
  //       if (res.code === 200) {
  //         totalPoint.value = res.data?.totalPoints || 0
  //       }
  //     })
  //   }
  // })
}

const giftInfo: any = ref({})

// 处理礼物队列
function processGiftQueue() {
  if (showGift.value || giftQueue.value.length === 0) {
    return
  }

  const nextGift = giftQueue.value.shift()
  giftInfo.value = nextGift
  showGift.value = true

  setTimeout(() => {
    showGift.value = false
    // 递归处理下一个礼物
    nextTick(() => {
      processGiftQueue()
    })
  }, 2000) // 2秒显示时间
}

function showSpecial(obj: any) {
  const res = JSON.parse(obj || '{}')
  // 将礼物添加到队列
  giftQueue.value.push(res)
  // 处理队列
  processGiftQueue()
}

/**
 * 用户名脱敏方法
 * @param {string} nickname - 需要脱敏的用户昵称
 * @returns {string} 脱敏后的昵称
 */
function desensitizeNickname(nickname: string) {
  // 空值处理：如果昵称为空/undefined/null，返回空字符串
  if (!nickname || typeof nickname !== 'string') {
    return '';
  }

  const len = nickname.length;
  // 1个字符：原字符 + 两个星号
  if (len === 1) {
    return `${nickname}**`;
  }
  // 2个及以上字符：首字符 + 两个星号 + 尾字符
  else {
    const firstChar = nickname.charAt(0);
    const lastChar = nickname.charAt(len - 1);
    return `${firstChar}**${lastChar}`;
  }
}

defineExpose({ open, showSpecial })

const setting = useSetting()
const { settingInfo } = storeToRefs(setting)
watch(() => settingInfo.value, () => {
  if (settingInfo.value?.liveConfig?.isActiveteTippingEnabled || !settingInfo.value?.isChatRoom) {
    popUpRef.value?.close()
  }
})
</script>

<template>
  <uv-popup ref="popUpRef" mode="bottom" round="24rpx" :overlayStyle="{ 'background': 'rgba(3, 100, 219, 0)' }"
    :bgColor="type === 'pc' ? 'none' : '#252525'" class="pc-custom-popup">
    <view :class="[type === 'pc' ? 'w375px bg-#575757 rd-12px mb140px ml-[calc(100%-865px)]' : 'wfull']" text-white
      pb10rpx pointer-events-auto>
      <view h104rpx flex-between px28rpx>
        <view text-28rpx font-500>礼物</view>
        <image src="/static/images/h5/common/close-gray.png" cursor-pointer w38rpx h38rpx @click="popUpRef.close()" />
      </view>
      <view mt10rpx grid grid-cols-5 gap-row-24rpx px12rpx>
        <view v-for="c, k in giftList" :key="k" flex-col-center cursor-pointer w132rpx pt10rpx
          :class="[activeIndex === k && 'bg-#373737 rd-6rpx']" @click="activeIndex = k">
          <image :src="c.giftIcon" w96rpx h96rpx></image>
          <view v-if="activeIndex !== k" mt10rpx truncate w132rpx text="center 28rpx">{{ c.giftName }}</view>
          <view text="#DC3939 28rpx" leading-40rpx mt4rpx>{{ c.giftPrice }}</view>
          <view v-if="activeIndex === k" bg="#C9303C" wfull h48rpx flex-center rd="[0_0_6rpx_6rpx]"
            @click.stop="handleSub">赠送</view>
        </view>
      </view>
      <view mt20rpx flex-between pl30rpx pr24rpx>
        <view>
          <view>积分消耗：<text text="#DC3939">{{ giftList[activeIndex]?.giftPrice }}</text></view>
          <view mt2rpx>可用积分：<text text="#DC3939">{{ totalPoint }}</text></view>
        </view>
        <view bg="#DC3939" w160rpx h52rpx rd-full flex-center cursor-pointer @click="handleSub">立即赠送</view>
      </view>
    </view>
  </uv-popup>

  <transition name="slide-in-left">
    <view v-if="showGift">
      <view absolute text-24rpx left-0 z-9 wfull flex justify-center
        :class="[type === 'pc' ? 'bottom-41vh flex-col flex-center pr415px' : type === 'live' ? 'bottom-50vh' : 'bottom-65vh']">
        <view class="relative">
          <image :src="giftInfo?.effectUrl" :class="[type === 'pc' ? 'w164px h164px' : 'w210rpx h210rpx']" />
          <view class="giftCountBox" :class="type == 'pc' ? 'text-white' : 'text-[#ed5555f5]'">
            <text>×{{ giftInfo.giftNum }}</text>
          </view>
        </view>
        <view v-if="type === 'pc'" text-white mt16px>
          {{ desensitizeNickname(giftInfo?.nickName) }}<text text="#ECBC47 12px" ml4px>赠送了{{ giftInfo.giftNum }}个{{
            giftInfo?.giftName
          }}</text></view>
      </view>
      <view v-if="type === 'live'" absolute h54rpx bg="#F7E7E7" rd-8rpx left-24rpx bottom-122rpx leading-54rpx px19rpx
        text="#EF7F7F">
        {{ desensitizeNickname(giftInfo?.nickName) }}赠送了{{ giftInfo?.giftNum }}个{{ giftInfo?.giftName }}</view>
      <view v-else-if="type === 'video'" absolute h54rpx rd-full bg="#FB8686" rd-8rpx left-24rpx bottom-50vh
        leading-54rpx px18rpx text-white>
        {{ desensitizeNickname(giftInfo?.nickName) }}赠送了{{ giftInfo.giftNum }}个{{ giftInfo?.giftName }}</view>
    </view>
  </transition>

  <!-- <view v-if="giftCount > 0" absolute text-24rpx right-0 z-9 wfull flex justify-center
    :class="[type === 'pc' ? 'bottom-41vh flex-col' : type === 'live' ? 'bottom-50vh' : 'bottom-65vh']">
    <view :class="[type === 'pc' ? 'w104px h104px' : 'w210rpx h210rpx']" class="relative m-l-[60px]">
      <image :src="activeGift?.giftIcon" :class="[type === 'pc' ? 'w104px h104px' : 'w210rpx h210rpx']" />
      <view class="pc-giftCount absolute left-[110%] text-#fff">
        <text>×{{ giftCount }}</text>
      </view>
    </view>
  </view> -->

</template>

<style scoped>
.giftCountBox {
  position: absolute;
  font-weight: bold;
  font-size: 30px;
  left: 100%;
  top: 50%;
}
</style>