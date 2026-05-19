<script setup lang='ts'>
import { OrderStatusEnum, ContractStatusEnum } from '@/utils/enum'
import { getOrderInfo, getContractSignLink, updateSignStatus } from '@/api/order'

// 手机号脱敏处理：保留前3位和后4位，中间替换为*
function maskPhone(phone: string) {
  if (!phone || phone.length < 8) return phone
  const start = phone.slice(0, 3)
  const end = phone.slice(-4)
  const middle = '*'.repeat(phone.length - 7)
  return start + middle + end
}

const orderStatus = ref<OrderStatusEnum | 'all' | undefined>(undefined)
const orderInfo: any = ref({})
const orderNos = ref<any>('')
onLoad((options: any) => {
  orderNos.value = options.orderNo
  setTimeout(()=>{
    getInfo()
  },300)
  //判断是否是从法大大跳转回来的
  if (options.signStatus) {
    updateSignStatus({ orderNo: options.orderNo, signStatus: options.signStatus })
    orderInfo.value.signStatus = options.signStatus
  }
})

function getInfo() {
  getOrderInfo(orderNos.value).then((res: any) => {
    if (res.code === 200) {
      orderStatus.value = Number(res.data.orderStatus)
      orderInfo.value = res.data
      showList.value = [
        { name: '订单编号', value: res.data?.orderNo, show: [OrderStatusEnum.PendingPayment, OrderStatusEnum.Completed, OrderStatusEnum.Cancelled], signShow: [ContractStatusEnum.Signing, ContractStatusEnum.SignFailed] },
        { name: '创建时间', value: res.data?.createTime, show: [OrderStatusEnum.PendingPayment, OrderStatusEnum.Completed, OrderStatusEnum.Cancelled], signShow: [ContractStatusEnum.Signing, ContractStatusEnum.SignFailed] },
        { name: '付款时间', value: res.data?.payTime, show: [OrderStatusEnum.Completed], signShow: [ContractStatusEnum.Signing, ContractStatusEnum.SignFailed] },
        { name: '支付方式', value: res.data?.payType == 1 ? '微信支付' : '支付宝支付', show: [OrderStatusEnum.Completed], signShow: [ContractStatusEnum.Signing, ContractStatusEnum.SignFailed] },
        { name: '关闭时间', value: res.data?.expirationTime, show: [OrderStatusEnum.Cancelled], signShow: [] },
        { name: '取消原因', value: res.data?.cancelReason, show: [OrderStatusEnum.Cancelled], signShow: [] },
        { name: '退款编号', value: res.data?.tradeNo, show: [OrderStatusEnum.Refunded], signShow: [] },
        { name: '退款时间', value: res.data?.refundTime, show: [OrderStatusEnum.Refunded], signShow: [] },
        { name: '退款金额', value: '¥' + res.data?.refundPrice, show: [OrderStatusEnum.Refunded], signShow: [] },
        { name: '退款说明', value: res.data?.refundReason, show: [OrderStatusEnum.Refunded], signShow: [] },
        // { name: '手机号', value: maskPhone(res.data?.userPhone), show: ['all'], signShow: [] },
      ]
    }
  })
}

// 显示信息
const showList: any = ref([])

const payList = ref([
  { id: 2, name: '支付宝支付', icon: '/static/images/pc/order/zfb.png' },
  { id: 1, name: '微信支付', icon: '/static/images/pc/order/wx.png' }
])
const payVal = ref(1)
const codeRef = ref()
function toSuccess() {
  codeRef.value.open({ orderNo: orderInfo.value.orderNo, payType: payVal.value })
}

// 处理支付组件返回的新订单号
function handleUpdateOrder(newOrderNo: string) {
  orderNos.value = newOrderNo
  getInfo()
}

// 签约
const btnLoading = ref(false)
function toLink(orderNo: string) {
  const linkUrl = location.href
  btnLoading.value = true
  getContractSignLink({ orderNo, verifyUrl: linkUrl + '&signStatus=5', signUrl: linkUrl + '&signStatus=6' }).then((res: any) => {
    window.location.href = res.data?.url
  }).finally(() => {
    btnLoading.value = false
  })
}

function openLink(url: string) {
  window.open(url, '_blank')
}

function toOrderList() {
  uni.redirectTo({
    url: '/pagesPc/mine/order'
  })
}
</script>

<template>
  <pc-mine-layout>
    <div v-if="Object.keys(orderInfo).length" p16px>
      <div pb13px border-b="1px solid #E5E6EB">
        <div flex items-center cursor-pointer w-fit @click="toOrderList">
          <img src="/static/images/pc/common/pg-left.png" w16px h16px mr4px>
          <div text-16px font-500>订单详情</div>
        </div>
      </div>
      <div v-if="orderStatus === OrderStatusEnum.PendingPayment" bg="#DF4F48 op-8" pc-order-top-box>
        <img src="/static/images/pc/order/pend.png" w36px h36px mr16px>
        <div text="#DF4F48 16px">
          <div font-500>待付款</div>
          <div mt5px flex>交易将在<uv-count-down
              :time="orderInfo.expire * 60 * 1000 - (Date.now() - new Date(orderInfo.createTime).getTime())"
              format="HH小时mm分钟"></uv-count-down>后关闭，请及时支付！
          </div>
        </div>
      </div>
      <!-- 退款 -->
      <div v-else-if="orderStatus === OrderStatusEnum.Refunded" bg="#EC8432 op-8" pc-order-top-box>
        <img src="/static/images/pc/order/refund.png" w36px h36px mr16px>
        <div text="18px #EC8432" font-500>退款完成</div>
      </div>
      <div
        v-else-if="ContractStatusEnum.Signing === orderInfo.signStatus || ContractStatusEnum.RealNamePendingReview === orderInfo.signStatus || ContractStatusEnum.SigningPendingReview === orderInfo.signStatus"
        pc-order-top-box bg="#FFB423 op-8">
        <img src="/static/images/pc/order/wait.png" w36px h36px mr16px>
        <div>
          <div text="18px #FFB423" font-500>签约中</div>
          <div mt5px text="#999">
            {{ ContractStatusEnum.RealNamePendingReview === orderInfo.signStatus ? '实名信息审核中，请耐心等待' :
              (ContractStatusEnum.SigningPendingReview === orderInfo.signStatus ? '签约信息审核中，请耐心等待' : '')
            }}
          </div>
        </div>
      </div>
      <div
        v-else-if="ContractStatusEnum.SignFailed === orderInfo.signStatus || orderInfo.signStatus === ContractStatusEnum.Refused"
        pc-order-top-box bg="#DF4F48 op-8">
        <img src="/static/images/pc/order/error.png" w36px h36px mr16px>
        <div text="18px #DF4F48" font-500>签约失败</div>
      </div>
      <div v-else-if="OrderStatusEnum.Completed === orderStatus" pc-order-top-box bg="#57B142 op-8">
        <img src="/static/images/pc/order/success.png" w36px h36px mr16px>
        <div text="18px #57B142" font-500>已完成</div>
      </div>
      <!-- 已取消 -->
      <div v-else-if="orderStatus === OrderStatusEnum.Cancelled" bg="#F2F3F5" pc-order-top-box>
        <img src="/static/images/pc/order/cancel.png" w36px h36px mr16px>
        <div text="18px #808590" font-500>已取消</div>
      </div>
      <div flex items-center text-16px font-500>
        <img :src="orderInfo.productImg" w162px h77px mr16px>
        <div flex-1 line-clamp-2 mr16px>{{ orderInfo.productName }}</div>
        <div mr100px>x{{ orderInfo.productNum }}</div>
        <div>¥ {{ orderInfo.productPrice }}</div>
      </div>
      <!-- 退款 -->
      <div v-if="orderStatus === OrderStatusEnum.Refunded" text="16px #515968" font-500 h51px flex-between
        border-t="1px solid #E5E6EB" border-b="1px solid #E5E6EB">
        订单金额<div text="#DF4F48">¥{{ orderInfo.payPrice }}</div>
      </div>
      <template v-else>
        <div mt16px flex-between text-16px font-500>
          <div text="#515968">配送方式</div>在线发放
        </div>
        <div mt13px flex-between text-16px font-500 border-b="1px solid #E5E6EB" pb13px>
          <div text="#515968">备注</div>{{ orderInfo.remark }}
        </div>
        <div mt16px flex-between text="#515968 16px" font-500>
          优惠券<div text="#DF4F48">-¥{{ orderInfo.discountPrice }}</div>
        </div>
        <div mt13px flex-between text="#515968 16px" font-500 border-b="1px solid #E5E6EB" pb13px>
          合计<div text="#DF4F48">¥{{ orderInfo.totalPrice }}</div>
        </div>
      </template>
      <!-- 信息 -->
      <div mt16px flex flex-col gap-13px text-16px>
        <div v-for="c, k in showList.filter((x: any) => (orderStatus !== undefined && x.show.includes(orderStatus)) || x.show.includes('all')
          || x.signShow.includes(orderInfo.signStatus))" :key="k" flex font-500>
          <div text="#515968" w170px>{{ c.name }}</div>
          <div>{{ c.value }}</div>
        </div>
      </div>
      <template v-if="orderStatus === OrderStatusEnum.PendingPayment">
        <div mt37px flex justify-center gap-20px>
          <div v-for="c, k in payList" :key="k" flex-center cursor-pointer w351px h100px border="1px solid #E5E6EB"
            rd-4px :class="[payVal === c.id && '!border-#305EF6']" @click="payVal = c.id">
            <img v-if="payVal === c.id" src="/static/images/pc/order/checked.png" w28px h28px>
            <img v-else src="/static/images/pc/order/check.png" w28px h28px>
            <img :src="c.icon" w40px h40px mx16px>
            <div text-18px font-500>{{ c.name }}</div>
          </div>
        </div>
        <div flex justify-end mt40px>
          <div pc-btn-error w130px h40px rd-4px font-500 text-18px @click="toSuccess">付款</div>
        </div>
      </template>
      <!-- 去签约 -->
      <div v-else-if="((ContractStatusEnum.Signing === orderInfo.signStatus || ContractStatusEnum.SignFailed === orderInfo.signStatus) && orderStatus !== OrderStatusEnum.Refunded) ||
        (ContractStatusEnum.RealNamePendingReview === orderInfo.signStatus && orderInfo.isRealName)" mt24px flex
        justify-end>
        <div pc-btn-sub font-500 w88px h28px rd-4px @click="toLink(orderInfo.orderNo)">
          <uv-loading-icon color="#fff" size="14" mr2px v-if="btnLoading"></uv-loading-icon>
          {{ ContractStatusEnum.SignFailed === orderInfo.signStatus ? '重新签约' : orderInfo.isRealName ? '去签约' : '去实名' }}
        </div>
      </div>
      <!-- 查看合同 -->
      <div v-else-if="orderInfo.viewUrl" mt24px flex justify-end>
        <div pc-btn-sub font-500 w88px h28px rd-4px @click="openLink(orderInfo.viewUrl)">
          查看合同
        </div>
      </div>
    </div>
    <pc-payCode type="order" ref="codeRef" @updateOrder="handleUpdateOrder"></pc-payCode>
  </pc-mine-layout>
</template>
