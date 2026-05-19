<script setup lang='ts'>
import { getCouponList } from '@/api/user'
import dayjs from "dayjs";

const tabList = ['可用优惠券', '不可用优惠券']
const tabIndex = ref(0)
const couponList: any = ref([])

function initCoupon() {
  couponList.value = []
  getCouponList({ pageNum: 1, pageSize: 100, status: tabIndex.value }).then(res => {
    if (res.code === 200) {
      let coupons = res.rows || []
      const currentTimestamp = dayjs().valueOf()
      coupons = coupons.map((el: any) => {
        if (el.isFixedTime === 0) {
          const timestamp = dayjs(el.expirationTime).valueOf()
          el.countDownTime = timestamp - currentTimestamp
        }
        return el
      })
      couponList.value = coupons
    }
  })
}

function couponFinish(index: number) {
  couponList.value[index].isFixedTime = 1
  initCoupon()
}

onMounted(() => {
  initCoupon()
})
function tabChange(e: number) {
  tabIndex.value = e
  initCoupon()
}
</script>

<template>
  <pc-mine-layout>
    <div p16px>
      <pc-tabs :tabList="tabList" :tabIndex="tabIndex" @change="tabChange"></pc-tabs>
      <div v-if="couponList.length" mt16px grid grid-cols-2 gap-16px>
        <div v-for="c, k in couponList" :key="k" bg="#FF505C op-8" h100px py11px flex items-center
          :class="[tabIndex === 1 && 'grayscale-100 relative']">
          <div absolute right-0 bottom-0 v-if="tabIndex === 1">
            <img v-if="c.status === 2" src="/static/images/pc/mine/expire.png" w71px h56px>
            <img v-else src="/static/images/pc/mine/used.png" w71px h56px>
          </div>

          <div w187px border-r="1px solid #E5E6EB" flex-center flex-col>
            <div text="#DF4F48 16px" font-bold font-din-bold>
              <div v-if="c.couponType === 1">
                ¥<span text-36px leading-39px>{{ c.money }}</span>
              </div>
              <div v-else><span text-36px leading-39px>{{ c.discount }}</span>折</div>
            </div>
            <div text="#88909B" mt4px>
              满{{ c.minPrice }}元可用
            </div>
          </div>
          <div flex-1 pl40px>
            <div truncate text-18px font-500>{{ c.couponName }}</div>
            <div mt7px text="#AAAEB7 16px">
              <!-- <span v-if="c.isFixedTime === 0">领取后{{ c.day }}天有效</span> -->
              <span v-if="c.isFixedTime === 0 && c.status === 0">
                <uv-count-down @finish="couponFinish(k)" :time="c.countDownTime"
                  format="DD天HH:mm:ss后过期"></uv-count-down>
              </span>
              <span v-else-if="c.isFixedTime === 0">领取后{{ c.day }}天有效</span>
              <span v-else>{{ c.useStartTime }} - {{ c.useEndTime }}</span>
            </div>
          </div>
        </div>
      </div>
      <pc-empty v-else />
    </div>
  </pc-mine-layout>
</template>