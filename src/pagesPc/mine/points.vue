<script setup lang='ts'>
import { getRecordsList, getCollectInfo, pointChannel } from '@/api/user'
const list: any = ref([])

const { getUser } = useAuth()
const totalPoints = ref(0)
onMounted(() => {
  getCollectInfo(getUser()?.userId).then(res => {
    totalPoints.value = res.data?.totalPoints || 0
  })
  pointChannel().then(res => {
    list.value = [
      { name: '邀请用户', icon: '/static/images/pc/mine/puser.png', num: res?.data?.invitePoint },
      { name: '观看直播', icon: '/static/images/pc/mine/pplay.png', num: res?.data?.viewPoint }
    ]
  })
  getList()
})
const total = ref(0)
const page = ref(1)
const size = ref(10)
const recordsList: any = ref([])
function getList() {
  getRecordsList({
    pageNum: page.value,
    pageSize: size.value
  }).then((res: any) => {
    recordsList.value = res.rows || []
    total.value = res.total
  })
}
</script>

<template>
  <pc-mine-layout>
    <div px16px py20px>
      <div flex>
        <img src="/static/images/pc/mine/points.png" w36px h36px mt2px>
        <div text-40px font-bold leading-43px ml15px mr12px font-din-bold>{{ totalPoints }}</div>
        <div text="#515968" mt19px>可用积分</div>
      </div>
      <div mt11px mb13px text-16px font-500>赚积分</div>

      <div v-for="c, k in list" :key="k" bg="#F2F3F5" rd-2px wfull h68px flex-between px16px mb16px>
        <img :src="c.icon" w36px h36px>
        <div flex-1 mx16px text-16px font-500>{{ c.name }}</div>
        <div pc-btn-sub px8px min-w88px h28px rd-4px font-500>+{{ c.num }}积分</div>
      </div>

      <div text-16px font-500>积分明细</div>
      <div v-if="recordsList.length">
        <div v-for="c, k in recordsList" :key="k" h74px border-b="1px solid #E5E6EB" flex-between>
          <div mr20px>
            <div font-500>{{ c.operationDetail }}</div>
            <div text="#88909B" mt5px>{{ c.updateTime }}</div>
          </div>
          <div pr14px font-500 :class="[c.changePoints > 0 && 'text-#DF4F48']">{{
            c.changePoints > 0 ? `+${c.changePoints}` : c.changePoints }}</div>
        </div>
      </div>
      <pc-empty v-else></pc-empty>
      <div v-if="total > 0" flex justify-end mt20px>
        <pc-pagination v-model:total="total" v-model:size="size" v-model:page="page" @change="getList"></pc-pagination>
      </div>
    </div>
  </pc-mine-layout>
</template>