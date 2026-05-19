<template>
  <pc-mine-layout>
    <div p16px relative>
      <div h40px bg="#F2F3F5" pr15px flex-between text-16px font-500>
        <div w360px pl16px>课程名称</div>
        <div w80px text-center>有效期</div>
        <div w80px text-center>状态</div>
        <div w100px>操作</div>
      </div>
      <div v-if="courseList.length">
        <div v-for="c, k in courseList" :key="k" h84px cursor-pointer flex-between pr15px border-b="1px solid #E6E8EC"
          @click="toDetail(c)">
          <div flex w360px>
            <img :src="c.coverImage" w106px h60px mr16px>
            <div pt2px flex-1>
              <div truncate font-500>{{ c.title }}</div>
              <div line-clamp-2 text="#88909B 10px" mt4px>{{ c.synopsi }}</div>
            </div>
          </div>
          <div w80px text="12px center">{{ c.validUntil === 0 ? '长期有效' : `${c.validUntil}天` }}</div>
          <div w80px text="12px center">
            <div v-if="c.completion === 0" text="#DF4F48 12px">未学习</div>
            <div v-else-if="c.completion === 100" text="#88909B 12px">已学完</div>
            <div v-else text="#ECBC47 12px">已学习{{ c.completion }}%</div>

          </div>
          <div v-if="!c.isCompleted" w100px pl12px>
            <div pc-btn-sub w80px h32px rd-4px font-500 :class="[(c.status || !c.signStatus) && '!bg-[#D9D9D9]']">
              {{ c.status ? '已关闭' : !c.signStatus ? '未签约' : '立即学习' }}
            </div>
          </div>
        </div>
      </div>
      <pc-empty v-else></pc-empty>
      <div v-if="total" flex justify-end mt20px>
        <pc-pagination v-model:total="total" v-model:size="size" v-model:page="page"
          @change="pageChange"></pc-pagination>
      </div>
    </div>
  </pc-mine-layout>
</template>

<script setup lang='ts'>
import { getCourseList } from '@/api/user'

const courseList: any = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
function pageChange() {
  getList()
}
function getList() {
  getCourseList({
    pageNum: page.value,
    pageSize: size.value
  }).then((res: any) => {
    courseList.value = res.rows || []
    total.value = res.total || 0
  }).catch(() => {
    courseList.value = []
  })
}
getList()

function toDetail(obj: any) {
  if (obj.status) return
  uni.$toPcPage(`mine/course/courseDetail?id=${obj.courseId}`)
}
</script>