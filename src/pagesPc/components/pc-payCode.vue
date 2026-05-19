<script setup lang='ts'>
import { payment, getPaymentResult } from '@/api/order'
defineProps<{
  type: string
}>()

const emit = defineEmits<{
  updateOrder: [orderNo: string]
}>()

const codeRef = ref()

const payType = ref(1) // 1微信 2支付宝
const qrcodeUrl = ref('')
function open(obj: { orderNo: string, payType: number }) {
  codeRef.value.open()
  payment({ orderNo: obj.orderNo, deviceType: 2, payType: obj.payType }).then((res: any) => {
    qrcodeUrl.value = obj.payType == 2 ? (res.data?.tl ? res?.data?.data : JSON.parse(res?.data?.data)?.alipay_trade_precreate_response?.qr_code) : res?.data?.data
    payType.value = obj.payType

    // 如果接口返回了新的 orderNo，通知父组件更新
    const newOrderNo = res?.data?.orderNo || res?.orderNo
    if(newOrderNo) {
      emit('updateOrder', newOrderNo)
      initResult(newOrderNo)
    } else {
      initResult(obj.orderNo)
    }
  })
}

let interval: any = null;

function clearPaymentInterval() {
  if (interval) {
    console.log('清除支付结果查询定时器');
    clearInterval(interval)
    interval = null
  }
}

function initResult(orderNo: string) {
  // 开始新的查询前先清除之前的定时器
  clearPaymentInterval()

  interval = setInterval(() => {
    getPaymentResult(orderNo).then((res: any) => {
      if (res?.data) {
        clearPaymentInterval()
        uni.$toPcPage('mine/order/paySuccess')
        codeRef.value.close()
      }
    })
  }, 5000) // 每5秒查询一次
}

function close() {
  clearPaymentInterval()
  codeRef.value.close()
}

// 组件销毁时清除定时器（备选方案）
onUnmounted(() => {
  clearPaymentInterval()
})

// 组件卸载前清除定时器（备选方案）
onBeforeUnmount(() => {
  clearPaymentInterval()
})

defineExpose({ open, close })
</script>

<template>
  <uv-popup ref="codeRef" mode="center" bgColor="none">
    <div flex-col-center>
      <div w200px h238px bg-white rd-8px p10px :class="[type === 'confirm' && ' mr421px']">
        <uv-qrcode v-if="qrcodeUrl" ref="qrcode" size="180px" :value="qrcodeUrl" :options="{ margin: 10 }"></uv-qrcode>
        <div text-center mt12px>请使用{{ payType == 2 ? '支付宝' : '微信' }}扫码支付</div>
      </div>
      <img src="/static/images/pc/common/close-box.png" mt8px w30px h30px cursor-pointer
        :class="[type === 'confirm' && ' mr421px']" @click="close()">
    </div>
  </uv-popup>
</template>
