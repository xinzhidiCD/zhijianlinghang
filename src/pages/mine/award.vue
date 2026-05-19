<template>
  <z-paging ref="paging" v-model="dataList" @query="queryList">
    <template #top>
      <image src="/static/images/h5/mine/award.png" wfull h390rpx relative z-1></image>
      <view px24rpx mt="-105rpx" relative z-2 bg-white pt20rpx>
        <view mb32rpx h76rpx p8rpx rd-full flex text-28rpx bg="#FF835B op-20">
          <view v-for="c, k in tabList" :key="k" @click="tabChange(k)" flex-1 h60rpx flex-center
            :class="[tabIndex === k && 'text-white font-500 bg-#FF835B rd-full']">
            {{ c }}
          </view>
        </view>
        <view mb14rpx flex-between text-28rpx font-500 text-center>
          <view w260rpx>抽奖时间</view>
          <view w150rpx>抽奖结果</view>
        </view>
      </view>
    </template>
    <view px24rpx v-for="c, k in dataList" :key="k" h90rpx text-center text-28rpx flex-between
      border-b="2rpx solid #F6F6F6">
      <view w260rpx>{{ c.winTime }}</view>
      <view w150rpx>{{ c.isWinners === 2 ? c.prizeName : '未中奖' }}</view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import { getPrizeList } from '@/api/user'

const tabList = ['抽奖记录', '我的奖品']
const tabIndex = ref(0)
const paging = ref()
function tabChange(index: number) {
  tabIndex.value = index
  paging.value.reload()
}

const dataList: any = ref([])
function queryList(pageNo: number, pageSize: number) {
  const data: any = {
    pageNum: pageNo,
    pageSize: pageSize,
  }
  if (tabIndex.value === 1) {
    data['isWinners'] = 2
  }
  getPrizeList(data).then((res) => {
    paging.value.complete(res.rows || []);
  })

}
</script>

<style lang="scss" scoped></style>