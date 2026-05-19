<script setup lang="ts">
import { computed } from 'vue'

const total: any = defineModel('total')
const page: any = defineModel('page')
const size: any = defineModel('size')

const maxPage = computed(() => {
  const n = Math.ceil(total.value / size.value)
  return n > 0 ? n : 1
})

// 自动生成分页列表，最多显示5个页码，类似element
const pageList: any = computed(() => {
  const n = maxPage.value
  const current = page.value
  let start = Math.max(1, current - 2)
  let end = Math.min(n, current + 2)
  // 保证最多5个
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(n, start + 4)
    } else if (end === n) {
      start = Math.max(1, end - 4)
    }
  }
  const arr = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})
const emit = defineEmits<{
  change: []
}>()
function handLeft() {
  page.value = page.value === 1 ? 1 : page.value - 1
}
function handRight() {
  page.value = page.value === maxPage.value ? maxPage.value : page.value + 1
}
function pageLeft() {
  page.value = page.value - 5 < 1 ? 1 : page.value - 5
}
function pageRight() {
  page.value = page.value + 5 > maxPage.value ? maxPage.value : page.value + 5
}
function handleSizeChange() {
  page.value = 1 // 切换页大小时重置到第一页
  // 触发 change 事件，通知父组件更新数据
  emit('change')
}
// 监听 page 变化，触发 change 事件
watch(page, () => {
  emit('change')
}, { immediate: false })
</script>

<template>
  <div flex items-center gap-10px>
    <div>共{{ total }}条</div>
    <pc-select v-model:value="size" :options="[10, 20, 30, 40, 50]" @change="handleSizeChange" />
    <div pc-pagin-box @click="handLeft">
      <img src="/static/images/pc/common/pg-left.png" w14px h14px>
    </div>
    <template v-if="pageList[0] > 1">
      <div pc-pagin-box :class="[page === 1 && '!border-[#305EF6] text-[#305EF6]']" @click="page = 1">1</div>
      <div v-if="pageList[0] > 2" pc-pagin-box class="group" hover:text="#305EF6" @click="pageLeft">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" w1em h1em>
          <path op-100 group-hover="op-0" fill="currentColor"
            d="M176 416a112 112 0 1 1 0 224 112 112 0 0 1 0-224m336 0a112 112 0 1 1 0 224 112 112 0 0 1 0-224m336 0a112 112 0 1 1 0 224 112 112 0 0 1 0-224">
          </path>
          <path group-hover="op-100" op-0 fill="currentColor"
            d="M529.408 149.376a29.12 29.12 0 0 1 41.728 0 30.592 30.592 0 0 1 0 42.688L259.264 511.936l311.872 319.936a30.592 30.592 0 0 1-.512 43.264 29.12 29.12 0 0 1-41.216-.512L197.76 534.272a32 32 0 0 1 0-44.672l331.648-340.224zm256 0a29.12 29.12 0 0 1 41.728 0 30.592 30.592 0 0 1 0 42.688L515.264 511.936l311.872 319.936a30.592 30.592 0 0 1-.512 43.264 29.12 29.12 0 0 1-41.216-.512L453.76 534.272a32 32 0 0 1 0-44.672l331.648-340.224z">
          </path>
        </svg>
      </div>
    </template>
    <div v-for="c in pageList" :key="c" pc-pagin-box hover:text="#305EF6"
      :class="[page === c && '!border-[#305EF6] text-[#305EF6]']" @click="page = c">
      {{ c }}
    </div>
    <template v-if="pageList.at(-1) < maxPage">
      <div pc-pagin-box v-if="pageList.at(-1) < maxPage - 1" class="group" hover:text="#305EF6" @click="pageRight">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" w1em h1em>
          <path op-100 group-hover="op-0" fill="currentColor"
            d="M176 416a112 112 0 1 1 0 224 112 112 0 0 1 0-224m336 0a112 112 0 1 1 0 224 112 112 0 0 1 0-224m336 0a112 112 0 1 1 0 224 112 112 0 0 1 0-224">
          </path>
          <path group-hover="op-100" op-0 fill="currentColor"
            d="M452.864 149.312a29.12 29.12 0 0 1 41.728.064L826.24 489.664a32 32 0 0 1 0 44.672L494.592 874.624a29.12 29.12 0 0 1-41.728 0 30.592 30.592 0 0 1 0-42.752L764.736 512 452.864 192a30.592 30.592 0 0 1 0-42.688m-256 0a29.12 29.12 0 0 1 41.728.064L570.24 489.664a32 32 0 0 1 0 44.672L238.592 874.624a29.12 29.12 0 0 1-41.728 0 30.592 30.592 0 0 1 0-42.752L508.736 512 196.864 192a30.592 30.592 0 0 1 0-42.688z">
          </path>
        </svg>
      </div>
      <div pc-pagin-box :class="[page === maxPage && '!border-[#305EF6] text-[#305EF6]']" @click="page = maxPage">
        {{ maxPage }}
      </div>
    </template>
    <div pc-pagin-box @click="handRight">
      <img src="/static/images/pc/common/pg-right.png" w14px h14px>
    </div>
    <div flex items-center gap-8px>
      前往
      <div w30px h30px border="1px solid #E5E6EB" flex-center>
        <my-form v-model="page" type="number" inputAlign="center" placeholder=""></my-form>
      </div>
      页
    </div>
  </div>
</template>