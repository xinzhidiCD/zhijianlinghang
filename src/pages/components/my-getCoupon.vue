<script lang="ts" setup>
import dayjs from "dayjs";
import { getCouponInfo, receiveCoupon, getUserPower } from '@/api/live'
defineProps<{
  type?: string
}>()
const popUpRef = ref()

const popUpType = ref()
function open() {
  popUpType.value = 1
  popUpRef.value.open()
}
const timeData: any = ref({})
function countDownChange(time: any) {
  timeData.value = time
  if (time.seconds === 0) {
    popUpType.value = 2
  }
}

const isReceive = ref(false)
const batchId = ref('')
const countDownTime = ref<any>(null)

watch(batchId, () => {
  countDownTime.value = null
  isReceive.value = false
})

function couponFinish() {
  countDownTime.value = null
}

function getCoupon() {
  if (!isReceive.value) {
    popUpRef.value.close()
    receiveCoupon({ batchId: batchId.value }).then(res => {
      if (res.code == 200) {
        uni.$showToast('领取成功')
      } else {
        uni.$showToast('领取失败')
      }
    })
  }
}

function initCoupon(couponId: string, bId?: string, expirationTime?: string, isCollect?: boolean) {
  if (bId && !isCollect) {
    batchId.value = bId
    getUserPower({ batchId: bId }).then(res => {
      isReceive.value = res.data ? true : false
      popUpRef.value.open()
    })
  }
  if (expirationTime) {
    const currentTimestamp = dayjs().valueOf()
    const timestamp = dayjs(expirationTime).valueOf()
    const time = timestamp - currentTimestamp
    if (time <= 0) {
      countDownTime.value = null
    } else {
      countDownTime.value = time
    }
  } else {
    countDownTime.value = null
  }
  getCouponInfo(couponId).then((res: any) => {
    couponInfo.value = res.data || {}
    popUpRef.value.open()
  })
}
// 优惠券领取结果
const { getUser } = useAuth()
const couponInfo: any = ref({})
function showResult(data: any) {
  const { expirationTime, isCollect } = data
  if (data.userId != getUser()?.userId) return
  if (data.isCollect) {
    batchId.value = data.batchId
    popUpType.value = 2
    isReceive.value = true
    initCoupon(data.couponId, data.batchId, expirationTime, isCollect)
  } else {
    uni.showToast({
      title: '优惠券已领取完了',
      icon: 'none'
    })
  }
}
defineExpose({ initCoupon, showResult })
</script>

<template>
  <uv-popup ref="popUpRef" mode="center" bgColor="none" class="pc-custom-popup">
    <view :class="[type === 'pc' && 'mr421px']" pointer-events-auto>
      <!-- 抽奖倒计时 -->
      <view v-if="popUpType === 1" w342rpx h346rpx relative>
        <image src="/static/images/h5/home/bell.png" w342rpx h346rpx />
        <view absolute wfull top-160rpx left-0 flex flex-col items-center>
          <view leading-34rpx font-600 mb15rpx>优惠券倒计时</view>
          <uv-count-down :time="4 * 1000" format="ss" @change="countDownChange">
            <view text-85rpx leading-80rpx font-bold font-din-bold class="gradient-text">{{ timeData.seconds }}</view>
          </uv-count-down>
        </view>
      </view>
      <!-- 优惠券 -->
      <view v-else class="w650rpx coupon-bg rd-18rpx p24rpx">
        <view bg-white wfull rd-12rpx pt36rpx pb24rpx>
          <view w342rpx h168rpx pt36rpx text-white mx-auto
            class="bg-[url(/static/images/h5/home/coupon-bg.png)] bg-cover">
            <view text-center text-28rpx wfull pl58rpx>
              <template v-if="couponInfo?.couponType === 1">
                <view font-bold font-din-bold>¥<text text-56rpx leading-56rpx>{{ couponInfo.money }}</text></view>
                <view mt10rpx font-500>优惠抵用券</view>
              </template>
              <template v-else>
                <view font-bold font-din-bold><text text-56rpx leading-56rpx>{{ couponInfo.discount }}</text>折</view>
                <view mt10rpx font-500>折扣券</view>
              </template>
            </view>
          </view>
          <view v-if="isReceive" mt20rpx mb18rpx text="center 24rpx">
            <uv-count-down v-if="countDownTime" @finish="couponFinish" :time="countDownTime"
              format="DD天HH:mm:ss后过期"></uv-count-down>
            <text v-else>已放入优惠券中心</text>
          </view>
          <view v-else mt20rpx mb18rpx text="center 24rpx">
            <text v-if="couponInfo.isFixedTime === 0">领取后{{ couponInfo.day }}天内有效</text>
            <text v-else-if="couponInfo.isFixedTime === 1">有效期：{{ couponInfo?.useStartTime }} ~ {{
              couponInfo?.useEndTime
              }}</text>
          </view>
          <view cursor-pointer text-24rpx text-white font-500 h62rpx rd-full flex-center w-350rpx mx-auto
            :class="[isReceive ? 'bg-#ccc' : 'mt32rpx bg-#FF5462']" @click="getCoupon">
            {{ isReceive ? '已经领取' : '立即领取' }}
          </view>
        </view>
      </view>
      <view v-if="popUpType > 1" flex justify-center mt16rpx>
        <image src="/static/images/h5/home/close-modal.png" cursor-pointer w60rpx h60rpx @click="popUpRef.close()">
        </image>
      </view>
    </view>
  </uv-popup>
</template>
<style lang="scss" scoped>
.coupon-bg {
  background: linear-gradient(180deg, #FF5266 0%, #FF7580 100%);
}

.gradient-text {
  background: linear-gradient(180deg, #FFB349 0%, #FF8300 100%), #FF5B00;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  /* 兼容性处理 */
  background-clip: text;
  color: transparent;
}
</style>