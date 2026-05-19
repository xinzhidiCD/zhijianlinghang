<template>
  <view v-if="Object.keys(orderInfo).length">
    <!-- <view h96rpx flex-between mb16rpx bg-white rd-8rpx px28rpx text-28rpx>
      手机号：
      <my-form flex-1 v-model="phone" type="number" :maxlength="11" placeholder="请填写手机号" inputAlign="right"></my-form>
    </view> -->
    <view mt16rpx bg-white rd-8rpx p16rpx>
      <view flex items-center>
        <image :src="orderInfo?.products?.coverImage" w236rpx h184rpx rd-6rpx mr16rpx />
        <view flex-col-between h184rpx flex-1>
          <view>
            <view font-500>{{ orderInfo?.products?.title }}</view>
            <view mt16rpx text="#909193 20rpx">限购：{{ orderInfo?.products?.quota === 0 ? '不限购' :
              orderInfo?.products?.quota + '件' }}</view>
          </view>
          <view flex-between>
            <view text="#DC3939 16rpx" font-bold>¥ <text text-36rpx>{{ orderInfo?.products?.price / 100 }}</text></view>
            <uv-number-box v-model="productNum"
              :max="orderInfo?.products?.quota === 0 ? 9999999999 : orderInfo?.products?.quota" @change="numchange">
              <template #minus>
                <image src="/static/images/h5/common/minus.png" w36rpx h36rpx cursor-pointer />
              </template>
              <template #input>
                <view text="#C0C4CC 28rpx" flex-center w60rpx h36rpx>{{ productNum }}</view>
              </template>
              <template #plus>
                <image src="/static/images/h5/common/add.png" w36rpx h36rpx cursor-pointer />
              </template>
            </uv-number-box>
          </view>
        </view>
      </view>
      <view mt24rpx pt28rpx pb14rpx flex-between items-end text-28rpx border-t="2rpx dashed #F6F6F6">
        <view>配送方式：<text text="#909193">在线发放</text></view>
        <view>共{{ productNum }}件：<text text="#DC3939 16rpx" font-bold>¥ <text text-36rpx>
              {{ orderInfo.taltalPrice }}</text></text></view>
      </view>
    </view>

    <view mt16rpx h96rpx flex-between bg-white rd-8rpx px28rpx text-28rpx>
      优惠券<view flex items-center cursor-pointer @click="popUpRef.open()">
        <view v-if="couponCheckIdArr.length" text="#FF5462">优惠¥{{ orderInfo?.discountPrice }}</view>
        <view v-else text="#909193">没有可用商品优惠券</view>
        <image src="/static/images/h5/common/arrow-right.png" w36rpx h36rpx />
      </view>
    </view>

    <view h96rpx flex-between my16rpx bg-white rd-8rpx px28rpx text-28rpx>
      备注
      <my-form flex-1 ml20rpx v-model="remark" type="text" placeholder="请输入订单备注" inputAlign="right"
        border="none"></my-form>
    </view>
  </view>

  <view bg-white rd-8rpx>
    <view v-for="c, k in payList" :key="k" @click="payVal = c.id" cursor-pointer h96rpx flex-between pl28rpx pr32rpx>
      <view flex items-center>
        <image :src="c.icon" w56rpx h56rpx mr16rpx />
        <view text-28rpx>{{ c.name }}</view>
      </view>
      <image v-if="payVal === c.id" src="/static/images/h5/common/checked.png" w32rpx h32rpx />
      <image v-else src="/static/images/h5/common/circle.png" w32rpx h32rpx />
    </view>
  </view>

  <view v-if="type === 'h5'" h100rpx px24rpx flex-between wfull fixed bottom-0 left-0 bg-white
    shadow="[0rpx_0rpx_8rpx_0rpx_rgba(0,0,0,0.08)]">
    <view text-28rpx>
      合计：<text text="#DC3939" font-din-bold font-bold>¥ <text text-48rpx> {{ orderInfo?.payPrice }}</text></text>
    </view>
    <view w300rpx h70rpx btn-error text-32rpx @click="handlePayment">立即支付</view>
  </view>
  <div v-else py16px flex-between>
    <div>实付：<span ml4px text="#DF4F48" font-din-bold font-bold>¥<span ml4px text-24px>{{ orderInfo?.payPrice
          }}</span></span>
    </div>
    <div pc-btn-error font-500 w94px h32px cursor-pointer rd-4px @click="handlePayment">
      <uv-loading-icon color="#fff" size="28rpx" mr4rpx v-if="loading"></uv-loading-icon>立即支付
    </div>
  </div>

  <!-- 选择优惠券 -->
  <uv-popup ref="popUpRef" :mode="type === 'pc' ? 'center' : 'bottom'" bgColor="none">
    <view bg-white pointer-events-auto
      :class="[type === 'pc' ? 'mr421px mt80px w375px border-rd-[12px_12px_8px_8px]' : 'wfull border-rd-[24rpx_24rpx_0_0]']">
      <view border-b="2rpx solid #F6F6F6" h104rpx flex-between pl28rpx pr34rpx>
        <view w32rpx></view>
        <view text-28rpx font-500>优惠券</view>
        <image src="/static/images/h5/common/close-gray.png" cursor-pointer w32rpx h32rpx @click="popUpRef.close()" />
      </view>
      <view relative p24rpx overflow-auto :class="[type === 'pc' ? ' h415px' : 'h60vh']">
        <my-couponList :payPrice="Number(orderInfo?.payPrice)" v-model:couponArr="couponCheckIdArr"
          :productId="orderInfo?.productId" :productNum="productNum" @change="couponChange"></my-couponList>
      </view>
    </view>
  </uv-popup>
</template>

<script lang="ts" setup>
import { loadPreOrder, computedOrder, createOrder, preOrder } from '@/api/order'
import { payment } from '@/api/order'
import wx from "weixin-js-sdk";

const props = defineProps<{
  type?: string,
  preOrderNo?: string
}>()
const emit = defineEmits(['success'])
const phone = ref('')
const productNum = ref(1)
const remark = ref('')
const payList = ref([
  { id: 1, name: '微信支付', icon: '/static/images/h5/home/wxpay.png' },
  { id: 2, name: '支付宝支付', icon: '/static/images/h5/home/zfbpay.png' }
])

const payVal = ref(1) // 1微信 2支付宝
const orderInfo = ref<any>({})
const preOrderNoConfirm = ref('')
onLoad((options) => {
  const orderNo = props.preOrderNo || options?.preOrderNo
  preOrderNoConfirm.value = orderNo
  initLoadOrder()
  if(uni.getStorageSync('type')) {
    payList.value = [{ id: 1, name: '微信支付', icon: '/static/images/h5/home/wxpay.png' }]
  }
})

function initLoadOrder() {
  loadPreOrder({ preOrderNo: preOrderNoConfirm.value }).then((res) => {
    orderInfo.value = res.data || {}
    couponCheckIdArr.value = res.data?.couponUserIds || []
  })
}

const win = window as any
const couponCheckIdArr = ref([])
function numchange(e: any) {
  setTimeout(() => {
    initComputedOrder(e.value)
  })
}
function couponChange() {
  setTimeout(() => {
    initComputedOrder(productNum.value)
  })
}
function initComputedOrder(num: number) {
  const data = {
    preOrderNo: preOrderNoConfirm.value,
    couponUserIds: couponCheckIdArr.value,
    productNum: num
  }
  computedOrder(data).then((res) => {
    orderInfo.value = { ...orderInfo.value, ...res.data }
  })
}

const popUpRef = ref()
const loading = ref(false)

function handlePayment() {
  // 支付时不需要输入手机号
  // 去掉字段，注释代码
  // if (!uni.$uv.test.mobile(phone.value)) {
  //   uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
  //   return
  // }
  const quota = orderInfo.value?.products?.quota
  if (quota !== 0 && productNum.value > quota) {
    uni.$showToast(`每人限购${quota}件`)
    return
  }
  loading.value = true
  const visitorId = uni.getStorageSync('visitorId');
  createOrder({
    preOrderNo: preOrderNoConfirm.value,
    couponUserIds: couponCheckIdArr.value,
    productNum: productNum.value,
    phone: phone.value,
    remark: remark.value,
    payType: payVal.value,
    inviterId: visitorId
  }).then((res) => {
    if (res.code === 200) {
      initPay(res.data?.orderNo)
      setTimeout(() => {
        preOrder({ productId: orderInfo.value?.productId, liveId: orderInfo.value?.liveId }).then((res: any) => {
          preOrderNoConfirm.value = res.data.preOrderNo
          initLoadOrder()
        })
      }, 1000);
    }
  }).finally(() => {
    loading.value = false
  })
}

const { getUser } = useAuth()
function initPay(orderNo: string) {
  if (props.type === 'pc') {
    emit('success', { orderNo, payType: payVal.value })
  } else {
    if (payVal.value === 2) {
      // 支付宝支付
      uni.navigateTo({
        url: `/pages/home/cashier?orderNo=${orderNo}&payType=${payVal.value}&aliConfigId=${getUser()?.aliConfigId}`
      })
      return
    } else {
      if(uni.getStorageSync("type")) {
        wx.miniProgram.reLaunch({url: `/pages/mine/order/orderDetails?orderNo=${orderNo}&type=h5`})
      } else {
        initPayment(orderNo, payVal.value)
      }
    }
  }
}

function initPayment(orderNo: string, payType: number) {
  payment({ orderNo, deviceType: 1, payType }).then((obj: any) => {
    // 微信jsapi支付
    const objData = obj?.data?.data || {}
    const param = typeof objData === 'string' ? JSON.parse(objData) : objData
    console.log('param====', param)
    console.log('WeixinJSBridge====', win.WeixinJSBridge)
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
</script>

<style lang="scss" scoped></style>
