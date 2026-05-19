<script lang="ts" setup>
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { getLiveCouponList, receiveCoupon } from '@/api/live'

const props = defineProps<{
  isPc?: boolean
}>()

// 直播间配置（购物车是否开启）
const setting = useSetting()
const { settingInfo } = storeToRefs(setting)

const visible = ref(false)
const liveId = ref<any>('')
const couponList = ref<any[]>([])
const loading = ref(false)
// 防抖：记录每个优惠券的loading状态
const receivingMap = ref<Record<number, boolean>>({})

// 结果弹窗（领取成功 / 失败）
const resultVisible = ref(false)
const resultData = ref<any>({})
const resultSuccess = ref(false)

function open(id: any) {
  liveId.value = id
  couponList.value = []
  visible.value = true
  fetchList()
}

function close() {
  visible.value = false
}

function fetchList() {
  if (!liveId.value) return
  loading.value = true
  getLiveCouponList(liveId.value, {
    pageNum: 1,
    pageSize: 999,
    status: 1
  }).then((res: any) => {
    couponList.value = res.rows || res.records || res.data?.rows || res.data?.records || res.data || []
  }).finally(() => {
    loading.value = false
  })
}

// 点击立即领取：只发请求，不立即弹窗，等 MQTT type=9 回调 showResult
function handleReceive(item: any) {
  if (receivingMap.value[item.id]) return
  receivingMap.value[item.id] = true
  receiveCoupon({ couponLiveId: item.id }).catch((err: any) => {
    uni.showToast({ title: err?.msg || '领取失败', icon: 'none' })
  }).finally(() => {
    // 防抖：2 秒内不允许重复点击
    setTimeout(() => {
      receivingMap.value[item.id] = false
    }, 2000)
  })
}

// MQTT type=9 触发：显示领取结果弹窗
function showResult(data: any) {
  resultData.value = data || {}
  resultSuccess.value = !!data?.isCollect
  resultVisible.value = true
}

// 关闭结果弹窗
function closeResult() {
  resultVisible.value = false
}

// 点击「去使用」
function handleUse() {
  const enabled = !!settingInfo.value?.liveConfig?.isYellowCarEnabled
  resultVisible.value = false
  close()
  if (enabled) {
    // 开启购物车：通过全局事件唤起购物车弹窗
    uni.$emit('open-cart-popup')
  } else {
    // 未开启购物车：跳转到我的优惠券页面
    const url = props.isPc ? '/pagesPc/mine/coupon' : '/pages/mine/coupon'
    uni.navigateTo({ url, fail: () => uni.redirectTo({ url }) })
  }
}

// 格式化过期时间
function formatExpire(time: any) {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

defineExpose({ open, close, showResult })
</script>

<template>
  <view>
    <!-- 遮罩层 -->
    <view v-if="visible" class="coupon-mask" @click="close"></view>
    <!-- 底部抽屉 -->
    <view class="coupon-drawer" :class="{ 'coupon-drawer--show': visible }">
      <!-- 标题栏 -->
      <view class="coupon-header">
        <view class="coupon-title">领取优惠券</view>
        <image src="/static/images/h5/home/close-modal.png" class="coupon-close" @click="close" />
      </view>
      <!-- 分割线 -->
      <view class="coupon-line" />
      <!-- 列表 -->
      <view v-if="loading" class="coupon-empty">
        <uv-loading-icon />
      </view>
      <view v-else-if="couponList.length === 0" class="coupon-empty">
        <view class="coupon-empty-text">暂无可领取优惠券</view>
      </view>
      <scroll-view v-else scroll-y class="coupon-scroll">
        <view v-for="item in couponList" :key="item.id" class="coupon-item">
          <view class="coupon-name">{{ item.couponName }}</view>
          <view class="receive-btn" :class="{ 'receive-btn--loading': receivingMap[item.id] }" @click="handleReceive(item)">
            <text>{{ receivingMap[item.id] ? '领取中' : '立即领取' }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 领取结果弹窗 -->
    <view v-if="resultVisible" class="success-mask" @click.self="closeResult">
      <view class="success-card">
        <template v-if="resultSuccess">
          <!-- 成功：优惠券卡面 -->
          <view class="success-coupon-bg">
            <!-- 封面图（可选） -->
            <image v-if="resultData.couponImage" :src="resultData.couponImage" class="success-coupon-image" mode="aspectFill" />
            <view v-else class="success-coupon-amount">
              <template v-if="Number(resultData.couponType) === 1">
                <view class="amount-text">¥<text class="amount-num">{{ resultData.money }}</text></view>
                <view class="amount-label">优惠抵用券</view>
              </template>
              <template v-else>
                <view class="amount-text"><text class="amount-num">{{ resultData.discount }}</text>折</view>
                <view class="amount-label">折扣券</view>
              </template>
            </view>
          </view>
          <!-- 成功内容区 -->
          <view class="success-content">
            <view class="success-name">{{ resultData.couponName }}</view>
            <view class="success-meta">
              <text v-if="Number(resultData.minPrice) > 0">满{{ resultData.minPrice }}元可用</text>
              <text v-else>无门槛</text>
            </view>
            <view v-if="resultData.expirationTime" class="success-meta">
              <text>有效期至 {{ formatExpire(resultData.expirationTime) }}</text>
            </view>
            <view class="success-hint">已放入优惠券中心</view>
            <view class="success-btn-group">
              <view class="success-btn success-btn--plain" @click="closeResult">我知道了</view>
              <view class="success-btn success-btn--primary" @click="handleUse">去使用</view>
            </view>
          </view>
        </template>
        <template v-else>
          <!-- 失败：仅显示原因 -->
          <view class="fail-card">
            <image src="/static/images/h5/home/close-modal.png" class="fail-icon" />
            <view class="fail-title">领取失败</view>
            <view class="fail-msg">{{ resultData.mage || '优惠券已领取完了' }}</view>
            <view class="success-btn success-btn--primary fail-btn" @click="closeResult">我知道了</view>
          </view>
        </template>
        <!-- 右上关闭 -->
        <image src="/static/images/h5/home/close-modal.png" class="success-close" @click="closeResult" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.coupon-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}
.coupon-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 9999;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  &--show {
    transform: translateY(0);
  }
}
.coupon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 32rpx 28rpx;
}
.coupon-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #111;
}
.coupon-close {
  width: 48rpx;
  height: 48rpx;
}
.coupon-line {
  height: 2rpx;
  background: #f0f0f0;
  margin: 0 32rpx 24rpx;
}
.coupon-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}
.coupon-empty-text {
  font-size: 28rpx;
  color: #999;
}
.coupon-scroll {
  max-height: 55vh;
  padding: 0 32rpx 48rpx;
}
.coupon-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 93%;
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  border: 1rpx solid #ffe0e0;
  box-shadow: 0 4rpx 20rpx rgba(255, 84, 98, 0.06);
}
.coupon-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 500;
  color: #222;
  padding-right: 24rpx;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.receive-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg, #ff5462 0%, #ff8069 100%);
  color: #fff;
  font-size: 26rpx;
  font-weight: 500;
  padding: 0 32rpx;
  height: 64rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  &--loading {
    opacity: 0.6;
    pointer-events: none;
  }
}

// 领取结果弹窗
.success-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.success-card {
  position: relative;
  width: 580rpx;
  border-radius: 24rpx;
  overflow: visible;
  background: #fff;
  margin-bottom: 80rpx;
}
.success-coupon-bg {
  width: 100%;
  height: 240rpx;
  background-image: url('/static/images/h5/home/coupon-bg.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
}
.success-coupon-image {
  width: 100%;
  height: 100%;
}
.success-coupon-amount {
  text-align: center;
  color: #fff;
  padding-left: 80rpx;
}
.amount-text {
  font-size: 28rpx;
  font-weight: bold;
}
.amount-num {
  font-size: 72rpx;
  line-height: 72rpx;
  font-weight: bold;
}
.amount-label {
  font-size: 24rpx;
  margin-top: 8rpx;
  opacity: 0.9;
}
.success-content {
  padding: 32rpx 40rpx 40rpx;
  text-align: center;
  background: #fff;
  border-radius: 0 0 24rpx 24rpx;
}
.success-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #222;
  margin-bottom: 12rpx;
}
.success-meta {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 6rpx;
}
.success-hint {
  font-size: 24rpx;
  color: #999;
  margin: 20rpx 0 28rpx;
}
.success-btn-group {
  display: flex;
  gap: 20rpx;
}
.success-btn {
  flex: 1;
  font-size: 28rpx;
  font-weight: 500;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.success-btn--plain {
  background: #f5f5f5;
  color: #555;
}
.success-btn--primary {
  background: linear-gradient(135deg, #ff5462 0%, #ff8069 100%);
  color: #fff;
}
.success-close {
  position: absolute;
  bottom: -80rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 60rpx;
}

// 失败弹窗
.fail-card {
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
  background: #fff;
  border-radius: 24rpx;
}
.fail-icon {
  width: 96rpx;
  height: 96rpx;
  margin-bottom: 20rpx;
  opacity: 0.6;
}
.fail-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #222;
  margin-bottom: 16rpx;
}
.fail-msg {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 40rpx;
  line-height: 1.6;
}
.fail-btn {
  width: 60%;
  margin: 0 auto;
  flex: none;
}
</style>
