<script lang="ts" setup>
import { getCouponOrderList } from '@/api/order'
import dayjs from "dayjs";

const props = defineProps<{
  productId?: string,
  productNum?: number,
  payPrice: number
}>()
const couponArr: any = defineModel('couponArr')
const tabList = [
  { id: 1, name: '可用优惠券' },
  { id: 0, name: '不可用优惠券' }
]
const tabVal = ref(1)

const couponList: any = ref([])
function initCoupon() {
  couponList.value = []
  getCouponOrderList({
    pageNum: 1,
    pageSize: 1000,
    status: tabVal.value,
    productId: props.productId,
    productNum: props.productNum
  }).then(res => {
    if (res.code === 200) {
      let coupons = res.rows || []
      const currentTimestamp = dayjs().valueOf()
      coupons = coupons.map((el: any) => {
        if (el.isFixedTime === 0) {
          const timestamp = dayjs(el.expirationTime).valueOf()
          el.countDownTime = timestamp - currentTimestamp
        }
        return el
      })
      couponList.value = coupons
    }
  })
}

function couponFinish(index: number) {
  couponList.value[index].isFixedTime = 1
  initCoupon()
}

onMounted(() => {
  initCoupon()
})
function tabChange(e: number) {
  tabVal.value = e
  initCoupon()
}

const emit = defineEmits(['change'])
function couponChange(obj: any) {
  if (!useredCoupon.value.includes(obj.id)) return
  const delIndex = couponArr.value.findIndex((x: number) => x === obj.id)
  if (delIndex !== -1) {
    couponArr.value.splice(delIndex, 1)
  } else {
    couponArr.value.push(obj.id)
  }
  emit('change')
}

// 判断可用券中哪些可以点击
const useredCoupon = computed(() => {
  if (couponList.value.length === 0) return []
  const activeIndex = couponList.value.findIndex((x: { id: number }) => couponArr.value[0] === x.id)
  console.log('activeIndex', activeIndex, couponArr.value[0])
  if (couponArr.value.length === 0) {
    // 没选择-全都都可选
    return couponList.value.map((x: { id: number }) => x.id)
  }

  else if (couponList.value[activeIndex]?.isStacking === 0) {
    // 不可叠加-除当前都不可选
    return [couponArr.value[0]]
  } else {
    // 可叠加-同类型可选
    const arr = couponList.value.filter((x: { couponType: number }) => x.couponType === couponList.value[activeIndex].couponType)
    return [...arr.filter((x: any) => x.minPrice <= props.payPrice).map((x: { id: number }) => x.id), ...couponArr.value]
  }
})
</script>

<template>
  <view wfull bg="#EEEEEE" h76rpx p8rpx rd-10rpx flex text-28rpx>
    <view flex-1 flex-center rd-10rpx cursor-pointer v-for="(item, index) in tabList" :key="index"
      @click="tabChange(item.id)" :class="tabVal === item.id ? ' font-500 bg-white' : 'text-#909193'">
      {{ item.name }}
    </view>
  </view>
  <view v-if="couponList.length" mt24rpx flex flex-col gap-24rpx text-24rpx>
    <view v-for="c, k in couponList" :key="k" @click="couponChange(c)"
      class="wfull overflow-hidden relative flex h154rpx rd-16rpx bg-op-12"
      :class="[(tabVal === 0 || !useredCoupon.includes(c.id)) ? 'bg-#999999' : 'bg-#FF838D cursor-pointer']">
      <view w236rpx h154rpx class="flex-center flex-col text-white" :style="{
        background: (tabVal === 0 || !useredCoupon.includes(c.id))
          ? '#999999' : 'linear-gradient(91deg, #FF505C 0%, #FE4A86 100%)'
      }">
        <template v-if="c.couponType === 2">
          <view text="28rpx white" font-bold font-din-bold>
            <text text-48rpx leading-56rpx>{{ c.discount }}</text>折
          </view>
          <view mt12rpx>折扣券</view>
        </template>
        <template v-else>
          <view text="28rpx white" font-bold font-din-bold>
            ¥<text text-48rpx leading-56rpx>{{ c.money }}</text>
          </view>
          <view mt12rpx>满减券</view>
        </template>
      </view>
      <view flex-1 flex items-center pl32rpx pr36rpx>
        <view flex-1>
          <view text-28rpx font-500 leading-40rpx
            :class="[(tabVal === 0 || !useredCoupon.includes(c.id)) && 'text-#999']">{{
              c.couponName }}</view>
          <view text="#909193" my4rpx>满{{ c.minPrice }}元可用</view>
          <view text="#909193">
            <text v-if="c.isFixedTime === 0 && c.status === 0">
              <uv-count-down @finish="couponFinish(k)" :time="c.countDownTime" format="DD天HH:mm:ss后过期"></uv-count-down>
            </text>
            <text v-else-if="c.isFixedTime === 0">领取后{{ c.day }}天有效</text>
            <text v-else>{{ c.useStartTime }} - {{ c.useEndTime }}</text>
          </view>
        </view>
        <!-- 不可用 -->
        <view v-if="tabVal === 0" absolute right-16rpx top-36rpx>
          <!-- （0：未使用，1：已使用, 2:已失效）-->
          <image v-if="c.status === 2" src="/static/images/h5/home/expire.png" w112rpx h102rpx />
          <image v-else-if="c.status === 1" src="/static/images/h5/home/used.png" w112rpx h102rpx />
          <image v-else-if="c.status === 0" src="/static/images/h5/home/unused.png" w112rpx h102rpx />
        </view>
        <!-- 可用 -->
        <template v-if="tabVal === 1 && useredCoupon.includes(c.id)">
          <image v-if="couponArr.includes(c.id)" src="/static/images/h5/common/checked-red.png" w32rpx h32rpx />
          <image v-else src="/static/images/h5/common/circle.png" w32rpx h32rpx />
        </template>
      </view>
    </view>
  </view>
</template>