<script setup lang='ts'>
const props = defineProps<{
  tabList: string[],
  tabIndex: number
}>()
const emit = defineEmits(['change'])

// 添加指示器动画相关变量
const indicatorPosition = ref(0)
const indicatorWidth = ref(0)

// 计算指示器位置和宽度
function updateIndicator() {
  nextTick(() => {
    const tabContainer = document.querySelector('.tab-container')
    const allTabs = tabContainer?.querySelectorAll('.tab-item')

    if (tabContainer && allTabs && allTabs[props.tabIndex]) {
      const containerRect = tabContainer.getBoundingClientRect()
      const activeRect = allTabs[props.tabIndex].getBoundingClientRect()

      // 计算相对于容器的位置
      indicatorPosition.value = activeRect.left - containerRect.left
      indicatorWidth.value = activeRect.width
    }
  })
}

function tabChange(index: number) {
  emit('change', index)
  // 延迟更新指示器位置，确保props已更新
  nextTick(() => {
    updateIndicator()
  })
}

// 监听tabIndex变化更新指示器
watch(() => props.tabIndex, () => {
  updateIndicator()
})

// 组件挂载后初始化指示器位置
onMounted(() => {
  setTimeout(() => {
    updateIndicator()
  }, 100)
})
</script>

<template>
  <div border-b="1px solid #E5E6EB" pb8px pl16px flex text-16px font-500 gap-80px relative class="tab-container">
    <div v-for="(c, k) in props.tabList" :key="k" cursor-pointer relative transition-all-300 class="tab-item"
      :class="[props.tabIndex === k && 'text-[#305EF6] active-tab']" @click="tabChange(k)">
      {{ c }}
    </div>
    <!-- 底部指示条 -->
    <div class="tab-indicator" :style="{
      transform: `translateX(${indicatorPosition}px)`,
      width: `${indicatorWidth}px`,
    }" h2px bg="#305EF6" absolute bottom-0 left-0 transition-all-300>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Tab指示器动画
.tab-indicator {
  transition: all 0.3s ease;
}

// Tab项hover效果
.tab-item:hover {
  color: #305EF6;
  transition: color 0.2s ease;
}

// Tab项过渡效果
.tab-item {
  transition: color 0.3s ease;
}
</style>