<script setup lang='ts'>
import { getPrizeList } from '@/api/user'

const tabList = ['抽奖记录', '我的奖品']
const tabIndex = ref(0)
const total = ref(0)
const size = ref(10)
const page = ref(1)
const tableList: any = ref([])
function getList() {
  const data: any = {
    pageNum: page.value,
    pageSize: size.value,
  }
  if (tabIndex.value === 1) {
    data['isWinners'] = 2
  }
  getPrizeList(data).then((res) => {
    total.value = res.total
    tableList.value = res.rows || []
  })
}
function tanChange(index: number) {
  tabIndex.value = index
  page.value = 1
  getList()
}
onMounted(() => {
  getList()
})
</script>

<template>
  <pc-mine-layout>
    <div p16px>
      <pc-tabs :tabList="tabList" :tabIndex="tabIndex" @change="tanChange"></pc-tabs>
      <div h40px bg="#F2F3F5" mt16px text="center 16px" font-500 flex items-center>
        <div flex-1>抽奖时间</div>
        <div flex-1>抽奖结果</div>
      </div>

      <div v-if="tableList.length">
        <div v-for="c, k in tableList" :key="k" border-b="1px solid #E5E6EB" h51px flex items-center text="center 16px"
          font-500>
          <div flex-1>{{ c.winTime }}</div>
          <div flex-1>{{ c.isWinners === 2 ? c.prizeName : '未中奖' }}</div>
        </div>
      </div>
      <pc-empty v-else></pc-empty>
    </div>
    <div v-if="total > 0" flex justify-end mt20px>
      <pc-pagination v-model:total="total" v-model:size="size" v-model:page="page" @change="getList"></pc-pagination>
    </div>
  </pc-mine-layout>
</template>