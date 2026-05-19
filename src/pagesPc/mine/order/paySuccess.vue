<script setup lang='ts'>
import { storeToRefs } from 'pinia'
function toPath(path: string) {
  uni.$toPcPage(path)
}
function toOrder() {
  uni.$toPcPage('mine/order')
}
const setting = useSetting()
const { settingInfo } = storeToRefs(setting) 
</script>

<template>
  <pc-mine-layout>
    <div p16px>
      <div pb13px border-b="1px solid #E5E6EB">
        <div flex items-center cursor-pointer w-fit @click="toOrder">
          <img src="/static/images/pc/common/pg-left.png" w16px h16px mr4px>
          <div text-16px font-500>订单详情</div>
        </div>
      </div>
      <div flex-col-center pt50px>
        <img src="/static/images/pc/order/paySuccess.png" w161px h105px>
        <div text-28px font-600 mt28px mb23px>支付成功</div>
        <template v-if="settingInfo?.liveConfig?.qrCode">
          <div text="#305EF6 18px" font-500 w292px h54px flex-center bg="#305EF6 op-15">添加老师</div>
          <div bg="#305EF6 op-5" flex-col-center w292px h271px pt20px>
            <img :src="settingInfo?.liveConfig?.qrCode" w192px h192px>
            <div text="#88909B 16px" mt20px>该二维码已通过安全检测</div>
          </div>
        </template>
        <div flex justify-center mt40px gap-79px>
          <div pc-btn-sub w181px h55px rd-4px font-500 text-20px @click="toPath('mine/order')">查看订单</div>
          <div btn-sub-box w181px h55px rd-4px text-20px @click="toPath('mine/course')">查看课程</div>
        </div>
      </div>
    </div>
  </pc-mine-layout>
</template>