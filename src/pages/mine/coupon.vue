<script lang="ts" setup>
import { getCouponList } from '@/api/user'

const tabList = [
  { id: 0, name: '可用优惠券' },
  { id: 1, name: '不可用优惠券' }
]
const tabVal = ref(0)

const paging = ref()
const dataList: any = ref([])
function queryList(pageNo: number, pageSize: number) {
  getCouponList({
    pageNum: pageNo,
    pageSize: pageSize,
    status: tabVal.value
  }).then((res: any) => {
    paging.value.complete(res.rows || []);
  })

}
function tabChange(e: number) {
  tabVal.value = e
  paging.value.reload()
}
function copyCode(code: string) {
  uni.setClipboardData({
    data: code,
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' })
    }
  })
}

</script>

<template>
  <z-paging ref="paging" v-model="dataList" @query="queryList">
    <view py22rpx px24rpx>
      <view wfull bg="#EEEEEE" h76rpx p8rpx rd-10rpx flex text-28rpx>
        <view flex-1 flex-center rd-10rpx v-for="(item, index) in tabList" :key="index" @click="tabChange(item.id)"
          :class="tabVal === item.id ? ' font-500 bg-white' : 'text-#909193'">
          {{ item.name }}
        </view>
      </view>
      <view mt24rpx flex flex-col gap-24rpx text-24rpx>
        <view v-for="c, k in dataList" :key="k" cursor-pointer
          class="wfull overflow-hidden relative flex min-h-180rpx rd-16rpx bg-op-12"
          :class="[tabVal === 1 ? 'bg-#999999' : 'bg-#FF838D']">
          <view w236rpx class="self-stretch flex-center flex-col text-white" :style="{
            background: tabVal === 1
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
              <view text-28rpx font-500 leading-40rpx :class="[tabVal === 1 && 'text-#999']">{{ c.couponName }}</view>
              <view text="#909193" my4rpx>满{{ c.minPrice }}元可用</view>
              <view text="#909193">
                <text v-if="c.isFixedTime === 0">领取后{{ c.day }}天有效</text>
                <text v-else>{{ c.useStartTime }} - {{ c.useEndTime }}</text>
              </view>
              <view v-if="c.writeOffCode" flex items-center gap8rpx mt4rpx>
                <text text="#FF505C">核销码：{{ c.writeOffCode }}</text>
                <view
                  class="flex-shrink-0 whitespace-nowrap"
                  px12rpx py4rpx rd8rpx text-24rpx text-white cursor-pointer
                  style="background:#FF505C;line-height:1.4;"
                  @click.stop="copyCode(c.writeOffCode)"
                >复制</view>
              </view>
            </view>
            <view v-if="tabVal === 1" absolute right-16rpx top-36rpx>
              <image v-if="c.status === 2" src="/static/images/h5/home/expire.png" w112rpx h102rpx />
              <image v-else src="/static/images/h5/home/used.png" w112rpx h102rpx />
            </view>
          </view>
        </view>
      </view>
    </view>
  </z-paging>
</template>