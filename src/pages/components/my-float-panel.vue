<script lang="ts" setup>
import { formatTime } from '@/utils/common'

const props = defineProps<{
  prizeCountDown: number
  couponObj: any
  noticeOpen: boolean
  showCouponBtn?: boolean
}>()

const emit = defineEmits<{
  (e: 'openPrize'): void
  (e: 'handleCoupon'): void
}>()

// 拖拽相关状态
const isDragging = ref(false)
const position = ref({ x: 0, y: 92 })
const startPos = ref({ x: 0, y: 0 })
const startOffset = ref({ x: 0, y: 0 })
const panelRef = ref<HTMLElement | null>()

function rpx2px(rpx: number) {
  const screenWidth = window.innerWidth || 375
  return (rpx / 750) * screenWidth
}

const PADDING = rpx2px(20)

onMounted(() => {
  nextTick(() => {
    const panel = panelRef.value
    if (panel) {
      const rect = (panel as any).$el?.getBoundingClientRect() || panel.getBoundingClientRect?.()
      const panelWidth = rect?.width || rpx2px(70)
      console.log(panelWidth)
      position.value = {
        x: window.innerWidth - panelWidth - rpx2px(20),
        y: rpx2px(130)
      }
    }
  })
})

watch(() => props.noticeOpen, (val) => {
  position.value.y = rpx2px(val ? 124 : 92)
}, { immediate: false })

const grantTimeInitialized = ref(false)
watch(() => props.couponObj?.grantTime, (val) => {
  if (val && !grantTimeInitialized.value) {
    grantTimeInitialized.value = true
    nextTick(() => {
      const panel = panelRef.value
      if (panel) {
        const rect = (panel as any).$el?.getBoundingClientRect() || panel.getBoundingClientRect?.()
        const panelWidth = rect?.width || rpx2px(70)
        position.value = {
          x: window.innerWidth - panelWidth - rpx2px(20),
          y: rpx2px(130)
        }
      }
    })
  }
})

function onTouchStart(e: TouchEvent) {
  isDragging.value = true
  const touch = e.touches[0]
  startPos.value = { x: touch.clientX, y: touch.clientY }
  startOffset.value = { ...position.value }
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()
  const touch = e.touches[0]
  const deltaX = touch.clientX - startPos.value.x
  const deltaY = touch.clientY - startPos.value.y
  let newX = startOffset.value.x + deltaX
  let newY = startOffset.value.y + deltaY
  const panel = panelRef.value
  const rect = (panel as any)?.$el?.getBoundingClientRect() || panel?.getBoundingClientRect?.()
  const panelWidth = rect?.width || rpx2px(78)
  const panelHeight = rect?.height || rpx2px(150)
  newX = Math.max(PADDING, Math.min(window.innerWidth - panelWidth - PADDING, newX))
  newY = Math.max(PADDING, Math.min(window.innerHeight - panelHeight - PADDING, newY))
  position.value = { x: newX, y: newY }
}

function onTouchEnd() {
  isDragging.value = false
}
</script>

<template>
  <view ref="panelRef" class="float-panel" :style="{
    left: position.x + 'px',
    top: position.y + 'px',
  }" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <view v-if="prizeCountDown > 0" flex-col-center>
      <image src="/static/images/h5/home/gift.png" w54rpx h54rpx @click.stop="emit('openPrize')" />
      <view class="bg-black-box mt12rpx mb16rpx w70rpx h26rpx text-20rpx">
        {{ formatTime(prizeCountDown) }}
      </view>
    </view>
    <view
      v-if="showCouponBtn"
      flex-col-center relative @click.stop="emit('handleCoupon')">
      <image src="/static/images/h5/home/money.png" w78rpx h78rpx />
      <view class="bg-black-box mt4rpx w70rpx h26rpx text-20rpx text-white text-center">优惠券</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.float-panel {
  position: fixed;
  z-index: 998;
  min-width: 70rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
