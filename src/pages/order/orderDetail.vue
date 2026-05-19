<template>
  <view v-if="Object.keys(orderInfo).length" bg-main-full flex flex-col gap-16rpx text-24rpx>
    <!-- 状态 -->
    <view bg-white min-h110rpx py16rpx pl30rpx flex items-center>
      <template v-if="orderStatus === OrderStatusEnum.PendingPayment">
        <image src="/static/images/h5/mine/wait.png" w48rpx h48rpx mr16rpx></image>
        <view>
          <view text-28rpx font-500>待付款</view>
          <view mt4rpx flex text="#F53F3F">交易将在<uv-count-down
              :time="orderInfo.expire * 60 * 1000 - (Date.now() - new Date(orderInfo.createTime).getTime())"
              format="HH小时mm分钟"></uv-count-down>后关闭，请及时支付</view>
        </view>
      </template>
      <template v-else-if="orderStatus === OrderStatusEnum.Refunded">
        <image src="/static/images/h5/mine/refund.png" w48rpx h48rpx mr16rpx></image>
        <view>
          <view text-28rpx font-500>退款成功</view>
          <view mt4rpx text="#909193">已成功退款</view>
        </view>
      </template>
      <template
        v-else-if="ContractStatusEnum.Signing === orderInfo.signStatus || ContractStatusEnum.RealNamePendingReview === orderInfo.signStatus || ContractStatusEnum.SigningPendingReview === orderInfo.signStatus">
        <image src="/static/images/h5/mine/wait.png" w48rpx h48rpx mr16rpx></image>
        <div>
          <view text-28rpx font-500>签约中</view>
          <div mt5px text="#999">
            {{ ContractStatusEnum.RealNamePendingReview === orderInfo.signStatus ? '实名信息审核中，请耐心等待' :
              (ContractStatusEnum.SigningPendingReview === orderInfo.signStatus ? '签约信息审核中，请耐心等待' : '')
            }}
          </div>
        </div>
      </template>
      <template
        v-else-if="ContractStatusEnum.SignFailed === orderInfo.signStatus || orderInfo.signStatus === ContractStatusEnum.Refused">
        <image src="/static/images/h5/mine/error.png" w48rpx h48rpx mr16rpx></image>
        <view text-28rpx font-500>签约失败</view>
      </template>
      <template v-else-if="OrderStatusEnum.Completed === orderStatus">
        <image src="/static/images/h5/mine/complate.png" w48rpx h48rpx mr16rpx></image>
        <view>
          <view text-28rpx font-500>已完成</view>
          <view mt4rpx text="#909193">订单已完成交易</view>
        </view>
      </template>
      <template v-else-if="orderStatus === OrderStatusEnum.Cancelled">
        <image src="/static/images/h5/mine/cancel.png" w48rpx h48rpx mr16rpx></image>
        <view>
          <view text-28rpx font-500>已取消</view>
          <view mt4rpx text="#909193">订单已取消</view>
        </view>
      </template>
    </view>

    <view bg-white p28rpx pb24rpx>
      <view flex items-center>
        <image :src="orderInfo.productImg" w220rpx h160rpx mr16rpx></image>
        <view flex-1 h160rpx flex-col-between>
          <view font-500 truncate>{{ orderInfo.productName }}</view>
          <view flex-between>
            <view font-500>
              ¥<text text-36rpx>{{ orderInfo.productPrice }}</text>
            </view>
            <view text="#909193">x{{ orderInfo.productNum }}</view>
          </view>
        </view>
      </view>
      <view v-if="orderStatus !== OrderStatusEnum.Refunded" border-t="2rpx dashed #EEEEEE" mt32rpx pt22rpx>
        <view flex-between>
          <view font-500>配送方式</view>
          <view text="#909193">在线发放</view>
        </view>
        <view flex-between mt24rpx>
          <view font-500>备注</view>
          <view text="#909193" truncate ml30rpx>{{ orderInfo.remark }}</view>
        </view>
      </view>
    </view>

    <view v-if="orderStatus !== OrderStatusEnum.Refunded" bg-white p28rpx flex flex-col gap-24rpx>
      <view flex-between>
        <view font-500>优惠券</view>
        <view text="#F53F3F">减 ¥{{ orderInfo.discountPrice }}</view>
      </view>
      <view flex-between>
        <view font-500>合计</view>
        <view text="#F53F3F">¥{{ orderInfo.totalPrice }}</view>
      </view>
    </view>

    <view v-if="orderStatus === OrderStatusEnum.Refunded" bg-white p28rpx flex-between>
      <view font-500>订单金额</view>
      <view text="#F53F3F">¥{{ orderInfo.totalPrice }}</view>
    </view>

    <view class="bg-white p28rpx flex flex-col gap-24rpx">
      <view v-for="c, k in showList.filter((x: any) => x.show.includes(orderStatus) || x.show.includes('all')
        || x.signShow.includes(orderInfo.signStatus))" :key="k" flex-between>
        <view font-500>{{ c.name }}</view>
        <view :class="[c.textClass || 'text-#909193']">{{ c.value }}</view>
      </view>
    </view>

    <!-- 待付款 -->
    <view v-if="orderStatus === OrderStatusEnum.PendingPayment" bg-white>
      <view v-for="c, k in payList" :key="k" @click="payVal = c.id" h96rpx flex-between pl52rpx pr56rpx>
        <view flex items-center>
          <image :src="c.icon" w56rpx h56rpx mr16rpx />
          <view text-28rpx>{{ c.name }}</view>
        </view>
        <image v-if="payVal === c.id" src="/static/images/h5/common/checked.png" w32rpx h32rpx />
        <image v-else src="/static/images/h5/common/circle.png" w32rpx h32rpx />
      </view>
    </view>
    <view v-if="orderStatus === OrderStatusEnum.PendingPayment" @click="toSuccess"
      class="btn-error w670rpx h80rpx mx-auto mt110rpx text-30rpx">立即付款</view>
    <!-- 签约中 -->
    <view v-else-if="((ContractStatusEnum.Signing === orderInfo.signStatus || ContractStatusEnum.SignFailed === orderInfo.signStatus) && orderStatus !== OrderStatusEnum.Refunded) ||
      (ContractStatusEnum.RealNamePendingReview === orderInfo.signStatus && orderInfo.isRealName)"
      class="btn-sub w670rpx h80rpx mt110rpx mx30rpx !text-30rpx" @click="toLink(orderInfo.orderNo)">
      {{ ContractStatusEnum.SignFailed === orderInfo.signStatus ? '重新签约' : orderInfo.isRealName ? '去签约' : '去实名' }}
    </view>
    <!-- 查看合同 -->
    <view v-else-if="orderInfo.viewUrl" class="btn-sub w670rpx h80rpx mt110rpx mx30rpx !text-30rpx"
      @click="openLink(orderInfo.viewUrl)">
      查看合同
    </view>
  </view>


</template>

<script lang="ts" setup>
import { OrderStatusEnum, ContractStatusEnum } from '@/utils/enum'
import { getOrderInfo, getContractSignLink, payment, updateSignStatus } from '@/api/order'

const orderStatus = ref()
const orderInfo = ref<any>({})
const orderNos = ref<any>('')
function openLink(url: string) {
  window.open(url, '_blank')
}

// 手机号脱敏处理：保留前3位和后4位，中间替换为*
function maskPhone(phone: string) {
  if (!phone || phone.length < 8) return phone
  const start = phone.slice(0, 3)
  const end = phone.slice(-4)
  const middle = '*'.repeat(phone.length - 7)
  return start + middle + end
}
onLoad((options: any) => {
  orderStatus.value = Number(options.status)
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
        { name: '退款金额', value: '¥' + res.data?.refundPrice, show: [OrderStatusEnum.Refunded], textClass: 'text-[#F53F3F]', signShow: [] },
        { name: '退款说明', value: res.data?.refundReason, show: [OrderStatusEnum.Refunded], signShow: [] },
        // { name: '手机号', value: maskPhone(res.data?.userPhone), show: ['all'], signShow: [] },
      ]
    }
  })
}

// 显示信息
const showList: any = ref([])

const payList = ref([
  { id: 1, name: '微信支付', icon: '/static/images/h5/home/wxpay.png' },
  { id: 2, name: '支付宝支付', icon: '/static/images/h5/home/zfbpay.png' }
])
const payVal = ref(1)

const { getUser } = useAuth()
function toSuccess() {
  if (payVal.value === 2) {
    // 支付宝支付
    uni.navigateTo({
      url: `/pages/home/cashier?orderNo=${orderInfo.value.orderNo}&payType=${payVal.value}&aliConfigId=${getUser()?.aliConfigId}`
    })
    return
  } else {
    initPayment(orderInfo.value.orderNo, payVal.value)
  }
}
const win = window as any
function initPayment(orderNo: string, payType: number) {
  payment({ orderNo, deviceType: 1, payType }).then((obj: any) => {
    const newOrderNo = obj?.data?.orderNo || obj?.orderNo || obj?.data?.data?.orderNo
    if(newOrderNo) {
      orderNos.value = newOrderNo
    }
    getInfo()
    // 微信jsapi支付
    // const param = obj?.data?.data || {}
    const objData = obj?.data?.data || {}
    const param = typeof objData === 'string' ? JSON.parse(objData) : objData
    win.WeixinJSBridge.invoke('getBrandWCPayRequest', {
      "appId": param.appId,     //公众号ID，由商户传入
      "timeStamp": param.timeStamp,     //时间戳，自1970年以来的秒数
      "nonceStr": param.nonceStr,      //随机串
      "package": param.packageStr || param.package,
      "signType": param.signType,     //微信签名方式：
      "paySign": param.paySign //微信签名
    },
      function (res: any) {

        if (res.err_msg == "get_brand_wcpay_request:ok") {
          uni.redirectTo({
            url: `/pages/order/paySuccess`
          })
        }
      });
  })
}

// 签约
function toLink(orderNo: string) {
  const linkUrl = location.href
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
</script>

<style lang="scss" scoped></style>
