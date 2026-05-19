<template>
  <view bg="#FAFAFA" wfull h100vh>
    <image src="/static/images/h5/mine/top-bg.png" wfull h270rpx></image>
    <view absolute top-0 left-0 wfull>
      <view h176rpx flex items-center px32rpx>
        <uv-avatar :src="userInfo.avatar" size="96rpx"></uv-avatar>
        <view flex-1 mx24rpx truncate text-28rpx font-500>{{ userInfo.nickName }}</view>
        <view border="1rpx solid #FFFFFF" rd-6rpx bg="white op-30" flex-center w128rpx h46rpx
          @click="goPage('/pages/mine/user')">个人资料</view>
      </view>
      <view rd-16rpx h256rpx bg-white>
        <view h94rpx flex-between px24rpx>
          <view text-32rpx font-500>我的订单</view>
          <view flex items-center @click="goPage('/pages/order/order')">
            <view text="28rpx #333 op-50" leading-40rpx>全部订单</view>
            <image src="/static/images/h5/common/arrow-right.png" w32rpx h32rpx></image>
          </view>
        </view>
        <view h162rpx pt14rpx px66rpx flex-between>
          <view v-for="c, k in tabList" :key="k" flex-col-center
            @click="goPage(`/pages/order/order?status=${c.status}`)">
            <image :src="c.icon" w64rpx h64rpx></image>
            <view mt12rpx text-28rpx>{{ c.name }}</view>
          </view>
        </view>
      </view>
      <view px24rpx bg-white mt16rpx rd-16rpx>
        <view flex items-center h96rpx border-b="2rpx solid #F6F6F6" v-for="c, k in menuList" :key="k"
          @click="handleMenu(c)">
          <image :src="c.icon" w48rpx h48rpx></image>
          <view mx16rpx text-28rpx flex-1>{{ c.name }}</view>
          <image src="/static/images/h5/common/right-gray.png" w48rpx h48rpx></image>
        </view>
      </view>
      <view w690rpx ml30rpx mt24rpx font-500 h88rpx bg-white rd-44rpx flex-center text="#F53F3F 28rpx" @click="logout">
        退出登录
      </view>
      <view flex-col-center mt52rpx>
        <view text="#0B68F6 24rpx" font-500>点此关注公众号，接收更多信息</view>
        <view text="#909193 24rpx" mt10rpx mb16rpx>或扫描下方二维码关注</view>
        <img src="/static/images/gzh.jpg" w176rpx h176rpx />
      </view>
    </view>
    <view absolute right-0 top-420rpx bg="#0B68F6" text="white 28rpx" flex-center pl12rpx w172rpx h60rpx
      border-rd="[200rpx_0rpx_0rpx_200rpx]" @click="$goToPage('/pages/home/liveRoom')">返回直播</view>
  </view>
</template>

<script lang="ts" setup>
import { OrderStatusEnum } from '@/utils/enum'
import { getUserInfo } from '@/api/user'
const { logout } = useAuth()

const tabList = ref([
  { name: '待付款', icon: '/static/images/h5/mine/tab1.png', status: OrderStatusEnum.PendingPayment },
  { name: '已完成', icon: '/static/images/h5/mine/tab2.png', status: OrderStatusEnum.Completed },
  { name: '已取消', icon: '/static/images/h5/mine/tab3.png', status: OrderStatusEnum.Cancelled },
  { name: '退款', icon: '/static/images/h5/mine/tab4.png', status: OrderStatusEnum.Refunded }
])
const menuList = [
  { name: '我的课程', icon: '/static/images/h5/mine/menu1.png', path: '/pages/mine/course' },
  { name: '我的积分', icon: '/static/images/h5/mine/menu2.png', path: '/pages/mine/points' },
  { name: '优惠券', icon: '/static/images/h5/mine/menu3.png', path: '/pages/mine/coupon' },
  { name: '我的奖品', icon: '/static/images/h5/mine/menu4.png', path: '/pages/mine/award' },
  { name: '意见反馈', icon: '/static/images/h5/mine/menu5.png', path: '/pages/mine/feedback' },
]
function handleMenu(item: { path?: string }) {
  if (item.path) {
    goPage(item.path)
  } else {
    uni.$showToast('功能开发中')
  }
}
function goPage(path: string) {
  uni.$goToPage(path)
}

const userInfo: any = ref({})

onShow(() => {
  // 页面显示时获取用户信息
  getUserInfo().then((res: any) => {
    userInfo.value = res.data || {}
  })
})
</script>

<style lang="scss" scoped></style>