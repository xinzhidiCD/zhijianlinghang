<template>
  <z-paging ref="paging" v-model="dataList" @query="queryList">
    <view text-24rpx>
      <view wfull h132rpx pt38rpx pl30rpx style="background: linear-gradient(116deg,#64657E 0%,#4A4E64 100%)">
        <view text-white>
          <text text-60rpx font-bold font-din-bold mr16rpx leading-66rpx>{{ totalPoints }}</text>
          <text mb4rpx>可用积分</text>
        </view>
      </view>
      <view p30rpx>
        <view text-28rpx font-500>赚积分</view>
        <view flex flex-col gap-16rpx mt28rpx>
          <view v-for="c, k in list" :key="k" bg="#0B68F6 op-20" rd-4rpx flex-between px24rpx h80rpx text-28rpx>
            <image :src="c.icon" w48rpx h48rpx mr16rpx></image>
            <view flex-1>{{ c.name }}</view>
            <view class="btn-sub w-fit min-w134rpx px16rpx !h48rpx">+{{ c.num }}积分</view>
          </view>
        </view>
      </view>
      <view bg="#FAFAFA" h16rpx></view>
      <view p30rpx>
        <view text-28rpx font-500 mb26rpx>积分明细</view>
        <view v-for="c, k in dataList" :key="k" flex-between py10rpx min-h98rpx border-b="2rpx solid #F6F6F6">
          <view mr40rpx>
            <view text-28rpx>{{ c.operationDetail }}</view>
            <view mt2rpx text="#909193">{{ c.updateTime }}</view>
          </view>
          <view text-28rpx font-500>{{ c.changePoints > 0 ? `+${c.changePoints}` : c.changePoints }}</view>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import { getRecordsList, getCollectInfo, pointChannel } from '@/api/user'
const list: any = ref([])
const { getUser } = useAuth()
const totalPoints = ref(0)
onMounted(() => {
  getCollectInfo(getUser()?.userId).then(res => {
    totalPoints.value = res.data.totalPoints || 0
  })
  pointChannel().then(res => {
    list.value = [
      { name: '邀请用户', icon: '/static/images/h5/mine/course1.png', num: res?.data?.invitePoint },
      { name: '观看直播', icon: '/static/images/h5/mine/course2.png', num: res?.data?.viewPoint }
    ]
  })
})
const paging = ref()
const dataList: any = ref([])
function queryList(pageNo: number, pageSize: number) {
  getRecordsList({
    pageNum: pageNo,
    pageSize: pageSize,
  }).then((res: any) => {
    paging.value.complete(res.rows || []);
  })

}
</script>

<style lang="scss" scoped></style>