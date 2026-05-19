<template>
  <view class="bg-main-full">
    <z-paging ref="paging" v-model="dataList" @query="queryList">
      <view p24rpx flex flex-col gap-16rpx text-24rpx>
        <view v-for="c, index in dataList" :key="index" @click="() => toDetail(c)" py16rpx px12rpx rd-12rpx bg-white
          flex>
          <image :src="c.coverImage" w236rpx h168rpx rd-12rpx mr16rpx></image>
          <view flex-1>
            <view font-500>{{ c.title }}</view>
            <view text="#88909B 20rpx" my8rpx>{{ c.synopsi }}</view>
            <view text="#515968 20rpx"> {{ c.validUntil === 0 ? '长期有效' : `有效期 ${c.validUntil}天` }}</view>
            <view mt12rpx flex items-end justify-between>
              <view v-if="c.completion === 0" text="#DC3939" font-500>未学习</view>
              <view v-else-if="c.completion === 100" text="#909193" font-500>已学完</view>
              <view v-else text="#FFAF2A" font-500>已学习{{ c.completion }}%</view>

              <view v-if="!c.isCompleted" class="btn-sub w144rpx h50rpx !text-24rpx font-500"
                :class="[(c.status || !c.signStatus) && '!bg-[#ccc]']">
                {{ c.status ? '已关闭' : !c.signStatus ? '未签约' : '立即学习' }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import { getCourseList } from '@/api/user'
const dataList: any = ref([])
const paging = ref()
function queryList(pageNo: number, pageSize: number) {
  getCourseList({
    pageNum: pageNo,
    pageSize: pageSize
  }).then((res: any) => {
    paging.value.complete(res.rows || [])
  }).catch(() => {
    paging.value.complete(false);
  })

}

function toDetail(obj: any) {
  if (obj.status) return
  uni.$goToPage(`/pages/mine/courseDetails?id=${obj.courseId}`)
}
</script>

<style lang="scss" scoped></style>