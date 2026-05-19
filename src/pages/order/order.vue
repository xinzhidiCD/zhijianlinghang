<template>
  <z-paging ref="paging" v-model="dataList" @query="queryList">
    <template #top>
      <view pt24rpx bg-white>
        <view mx30rpx h72rpx flex items-center px32rpx bg="#F4F4F4" rd-36rpx>
          <image src="/static/images/h5/mine/search.png" w36rpx h36rpx mr12rpx></image>
          <my-form flex-1 v-model="keyword" placeholder="搜索"></my-form>
        </view>
        <view mt28rpx px30rpx>
          <uv-tabs :list="statusList" lineWidth="56rpx" lineHeight="4rpx" lineColor="#0B68F6" :current="current"
            :activeStyle="{
              color: '#303133',
              fontWeight: '500',
            }" :inactiveStyle="{
              color: '#606266',
              fontWeight: '500',
            }" itemStyle=" height: 66rpx;align-items:flex-start;" @change="tabChange"></uv-tabs>
        </view>
      </view>
    </template>
    <view px12rpx pt24rpx flex flex-col gap-24rpx text-28rpx>
      <view v-for="item, index in dataList" :key="index" @click="toDetail(item)" bg-white rd-4rpx p16rpx pb32rpx>
        <view flex>
          <view text="#606266" font-500 flex-1>订单号：{{ item.orderNo }}</view>
          <view :class="[
            (OrderStatusEnum.PendingPayment === item.orderStatus || ContractStatusEnum.SignFailed === item.signStatus) ? 'text-[#DC3939]' :
              (ContractStatusEnum.Signing === item.signStatus || ContractStatusEnum.RealNamePendingReview === item.signStatus || ContractStatusEnum.SigningPendingReview === item.signStatus) ? 'text-[#0B68F6]' :
                OrderStatusEnum.Completed === item.orderStatus ? 'text-[#06B464]' : 'text-[#909193]'
          ]">
            {{ getOrderStatusText(item.orderStatus, item.signStatus) }}
          </view>
        </view>
        <view mt28rpx flex items-center>
          <image :src="item.productImg" w220rpx h160rpx mr16rpx></image>
          <view flex-1 h160rpx flex-col-between>
            <view font-500 truncate>{{ item.productName }}</view>
            <view flex-between>
              <view font-500>
                ¥<text text-36rpx>{{ item.productPrice }}</text>
              </view>
              <view text="#909193">x{{ item.productNum }}</view>
            </view>
          </view>
        </view>

        <!-- 操作状态栏 -->
        <view mt24rpx flex-between text-28rpx>
          <template v-if="item.orderStatus === OrderStatusEnum.PendingPayment">
            <view>待付款：<text text="#F53F3F">¥{{ item.payPrice }}</text></view>
            <view btn-error w128rpx h48rpx>付款</view>
          </template>
          <template v-else-if="item.orderStatus === OrderStatusEnum.Refunded">
            <view>退款金额：¥{{ item.refundPrice }}</view>
            <view v-if="item.viewUrl" class="btn-sub w140rpx !h48rpx" @click.stop="openLink(item.viewUrl)">
              查看合同
            </view>
            <view v-else>实付款：¥{{ item.payPrice }}</view>
          </template>
          <template
            v-else-if="((item.signStatus === ContractStatusEnum.Signing || ContractStatusEnum.SignFailed === item.signStatus) ||
              (item.isRealName && item.signStatus === ContractStatusEnum.RealNamePendingReview) || item.signStatus === ContractStatusEnum.SigningPendingReview)
              && ContractStatusEnum.RealNamePendingReview !== item.signStatus && ContractStatusEnum.SigningPendingReview !== item.signStatus"">
            <view>已付款：¥{{ item.payPrice }}</view>
            <view class=" btn-sub w140rpx !h48rpx" @click.stop="toLink(item.orderNo)">
            {{ ContractStatusEnum.SignFailed === item.signStatus ? '重新签约' : item.isRealName ? '去签约' : '去实名' }}
        </view>
</template>
<template v-else-if="item.orderStatus === OrderStatusEnum.Completed">
  <view>已付款：¥{{ item.payPrice }}</view>
  <view v-if="item.viewUrl" class="btn-sub w140rpx !h48rpx" @click.stop="openLink(item.viewUrl)">
    查看合同
  </view>
</template>
<view v-else>已付款：¥{{ item.payPrice }}</view>
</view>

</view>
</view>
</z-paging>
</template>

<script lang="ts" setup>
import { OrderStatusEnum, ContractStatusEnum } from '@/utils/enum'
import { getOrderList, getContractSignLink } from '@/api/order'
import { getOrderStatusText } from '@/utils/common'
const keyword = ref('')
const statusList = [
  {
    name: '全部',
    id: -1
  },
  {
    name: '待付款',
    id: OrderStatusEnum.PendingPayment
  },
  {
    name: '签约中',
    id: 'sign-' + ContractStatusEnum.Signing
  },
  {
    name: '已完成',
    id: OrderStatusEnum.Completed
  },
  {
    name: '签约失败',
    id: 'sign-' + ContractStatusEnum.SignFailed
  },
  {
    name: '已取消',
    id: OrderStatusEnum.Cancelled
  },
  {
    name: '退款',
    id: OrderStatusEnum.Refunded
  }
]
const orderStatus = ref(-1)
const current = ref(0)
onLoad((options) => {
  orderStatus.value = options?.status ? Number(options?.status) : -1
  current.value = statusList.findIndex(item => item.id === orderStatus.value);
});
function tabChange(item: { id: number, index: number }) {
  orderStatus.value = item.id;
  current.value = item.index;
  paging.value.reload()
}

const dataList: any = ref([])
const paging = ref()

function openLink(url: string) {
  window.open(url, '_blank')
}
function initList() {
  paging.value.reload()
}
function keywordChange() {
  uni.$uv.debounce(initList, 500)
}
watch(() => keyword.value, () => {
  keywordChange()
})
function queryList(pageNo: number, pageSize: number) {
  const data: any = {
    pageNum: pageNo,
    pageSize: pageSize,
    keyWord: keyword.value,
  }
  if (String(orderStatus.value).startsWith('sign-')) {
    data.signStatus = String(orderStatus.value).replace('sign-', '')
  } else {
    data.status = orderStatus.value >= 0 ? orderStatus.value : ''
  }
  getOrderList(data).then((res: any) => {
    const list = (res?.rows || []).map((x: any) => ({
      ...x,
      orderStatus: Number(x.orderStatus)
    }))
    paging.value.complete(list);
  })

}

// 签约
function toLink(orderNo: string) {
  const linkUrl = `${import.meta.env.VITE_DOMAIN}/pages/order/orderDetail?orderNo=${orderNo}`
  uni.showLoading({
    title: '加载中',
    mask: true
  })
  getContractSignLink({ orderNo, verifyUrl: linkUrl + '&signStatus=5', signUrl: linkUrl + '&signStatus=6' }).then((res: any) => {
    window.location.href = res.data?.url
  }).finally(() => {
    uni.hideLoading()
  })
}

function toDetail(item: any) {
  uni.$goToPage(`/pages/order/orderDetail?orderNo=${item.orderNo}`)
}
</script>

<style lang="scss">
page {
  background: #FAFAFA;
}
</style>