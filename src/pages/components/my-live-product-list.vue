<script lang="ts" setup>
import { getLiveProducts } from '@/api/live'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  type?: string,
  roomId?: string
}>()
const popUpRef = ref()
const productList: any = ref([])
function open() {
  popUpRef.value.open()
  getLiveProducts({
    pageNum: 1,
    pageSize: 100,
    roomId: props.roomId,
    status: 1
  }).then(res => {
    productList.value = res.rows || []
  })
}
const emit = defineEmits(['select'])
function toDetail(productId: string) {
  popUpRef.value.close()
  if (props.type === 'pc') {
    emit('select', productId)
  } else {
    goToPage(`/pages/home/productDetail?productId=${productId}`)
  }
}
function goToPage(url: string) {
  uni.$goToPage(url)
}

function toOrder() {
  if (props.type === 'pc') {
    goToPage('/pagesPc/mine/order')
  } else {
    goToPage('/pages/order/order')
  }
}

const setting = useSetting()
const { settingInfo } = storeToRefs(setting)
watch(() => settingInfo.value, () => {
  if (!settingInfo.value?.liveConfig?.isYellowCarEnabled || !settingInfo.value?.isChatRoom) {
    popUpRef.value?.close()
  }
})

defineExpose({ open })
</script>

<template>
  <uv-popup ref="popUpRef" mode="bottom" round="24rpx" :bgColor="type === 'pc' ? 'none' : 'white'"
    class="pc-custom-popup" :overlayStyle="{ 'background': 'rgba(3, 100, 219, 0)' }" :customStyle="{ 'z-index': 9999 }" :zIndex="9999">
    <view
      :class="[type === 'pc' ? 'w375px bg-#F2F3F5 rd-8px  mb140px ml-[calc(100%-865px)] h500px' : 'wfull h-[calc(100vh-372rpx)]']"
      flex flex-col pointer-events-auto>
      <view h70rpx flex-between pl28rpx pr32rpx style="align-items: center">
        <view flex items-center cursor-pointer @click="toOrder">
          <image src="/static/images/h5/home/order.png" w48rpx h48rpx />
          <view text="#0B68F6 28rpx">订单</view>
        </view>
        <view font-500 text-28rpx>商品列表</view>
        <image src="/static/images/h5/common/close-gray.png" cursor-pointer w32rpx h32rpx @click="popUpRef.close()" />
      </view>
      <view flex-1 overflow-auto pt30rpx px24rpx flex flex-col gap-16rpx bg="#F7F8FA">
        <view v-for="c, k in productList" :key="k" class="p12rpx bg-white cursor-pointer wfull h208rpx flex"
          @click="toDetail(c.productId)">
          <image :src="c.coverImage" class="w236rpx h184rpx rd-4rpx mr16rpx flex-shrink-0" />
          <view flex-1>
            <view font-500 leading-34rpx>{{ c.title }}</view>
            <view text="#0B68F6 20rpx" my8rpx truncate max-w400rpx>{{ c.sellingPoints }}
            </view>
            <view text="#909193 20rpx">已售
              {{ settingInfo?.liveConfig?.isItemSoldNumEnabled ? (c.salesVolume + c.virtualSales) : '***' }} |
              {{ c.quota === 0 ? '不限制' : `每人限${c.quota}份` }}
            </view>
            <view h50rpx flex-between wfull mt24rpx>
              <view>
                <text text="#DC3939 16rpx" font-500>¥ <text text-36rpx>{{ c.price / 100 }}</text></text>
                <text v-if="c.originalPrice" text="#909193 20rpx" line-through ml10rpx>¥ {{ c.originalPrice / 100
                }}</text>
              </view>
              <view w160rpx h70rpx btn-error :class="[type === 'pc' && '!rd-4px']" @click.stop="toDetail(c.productId)">
                去购买
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </uv-popup>
</template>
