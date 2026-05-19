<template>
  <view v-if="Object.keys(productInfo).length">
    <view wfull h422rpx>
      <uv-swiper :list="productInfo.productGalleries.map((x: { imageUrl: string }) => x.imageUrl)"
        height="422rpx"></uv-swiper>
    </view>
    <view p24rpx>
      <view h58rpx flex-between wfull>
        <view>
          <text text="#DC3939 24rpx" font-bold>¥ <text text-42rpx>{{ productInfo?.products?.price / 100 }}</text></text>
          <text text="#909193 28rpx" line-through ml10rpx>¥ {{ productInfo?.products?.originalPrice / 100 }}</text>
        </view>
        <view text="#909193 28rpx">{{ productInfo?.products?.validUntil === 0 ? '长期有效' :
          `${productInfo?.products?.validUntil}天有效` }}</view>
      </view>
      <view font-500 text-30rpx leading-42rpx mt16rpx>{{ productInfo?.products?.title }}</view>
      <view text-28rpx mt14rpx mb16rpx>{{ productInfo?.products?.sellingPoints }}</view>
      <view text="#909193 24rpx">已售{{ settingInfo?.liveConfig?.isItemSoldNumEnabled ?
        (productInfo?.products?.salesVolume + productInfo?.liveProducts?.virtualSales) : '***' }} |
        {{ productInfo?.products?.quota === 0 ? '不限制' : `每人限${productInfo?.products?.quota}份` }}</view>
    </view>
    <view bg="#FAFAFA" h16rpx></view>
    <view py28rpx px24rpx>
      <view v-if="tabList.length === 1" text-30rpx font-500>商品详情</view>
      <view v-else h67rpx flex gap-60rpx>
        <view v-for="c, k in tabList" :key="k" text-30rpx font-500
          :class="[tabIndex === k ? 'text-#333 relative' : 'text-#606266']" @click="tabIndex = k">
          {{ c }}<view v-if="tabIndex === k" class="absolute bottom-0 left-38rpx bg-#0B68F6 w56rpx h4rpx rd-2rpx">
          </view>
        </view>
      </view>
      <view v-if="tabIndex === 0">
        <view my28rpx text-28rpx leading-40rpx>
          <uv-parse :content="productInfo?.products?.description"></uv-parse>
        </view>
      </view>
      <view v-else>
        <view v-for="(c, k) in productInfo?.productCourseRelations" :key="k" mt20rpx>
          <view text-28rpx font-500 my24rpx>{{ c.title }}({{ c.coursesChapters.length }})
          </view>
          <view v-for="(chapter, i) in c.coursesChapters" :key="i">
            <view class="h96rpx flex-between px28rpx rd-8rpx bg-#F9F9F9">
              <view text-28rpx>{{ i + 1 }}.{{ chapter.title }}</view>
            </view>
            <view>
              <view v-for="(sub, j) in chapter.coursesKnobbles" :key="j"
                class="h96rpx pl52rpx text-28rpx flex items-center">
                {{ i + 1 }}.{{ j + 1 }}{{ sub.title }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view h100rpx></view>
    <view h100rpx pl32rpx bg-white pr24rpx flex-between wfull fixed bottom-0 left-0
      shadow="[0rpx_0rpx_8rpx_0rpx_rgba(0,0,0,0.08)]">
      <view text="#DC3939 28rpx" font-din-bold font-bold>¥ <text text-48rpx>
          {{ productInfo?.products?.price / 100 }}
        </text></view>
      <view w300rpx h70rpx btn-error text-32rpx @click="goPay">去购买</view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { getLiveProductDetail } from "@/api/live";
import { preOrder } from '@/api/order'
import { storeToRefs } from 'pinia'

const setting = useSetting()
const { settingInfo } = storeToRefs(setting)

const tabList: any = ref([])
const tabIndex = ref(0)
const productInfo = ref<any>({})
const { getUser } = useAuth()
onLoad((options) => {
  getLiveProductDetail(options?.productId, getUser()?.liveId).then((res: any) => {
    productInfo.value = res.data
    tabIndex.value = 0
    if (res.data?.products?.productType === 1) {
      tabList.value = ['商品详情', '商品目录']
    } else {
      tabList.value = ['商品详情']
    }
  })
})

// 去支付
const { openLink } = useTool()
function goPay() {
  if (productInfo.value?.products?.productType !== 1) {
    openLink(productInfo.value?.products?.externalLink)
    return
  }
  preOrder({ productId: productInfo.value?.products?.productId, liveId: getUser()?.liveId }).then((res: any) => {
    uni.$goToPage(`/pages/home/confirm?preOrderNo=${res.data.preOrderNo}`)
  })
}
</script>

<style lang="scss" scoped></style>
