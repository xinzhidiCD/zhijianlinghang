<script setup lang='ts'>
import { ref, computed, nextTick } from 'vue'

defineProps<{
  options: number[]
}>()

const selected = defineModel<number>('value')
const isOpen = ref(false)
const dropdownPosition = ref<'bottom' | 'top'>('bottom')
const selectRef = ref<HTMLElement>()

// 定义事件
const emit = defineEmits<{
  change: [value: number]
}>()

const selectedLabel = computed(() => {
  return selected.value ? `${selected.value}条/页` : '请选择'
})

const selectOption = (option: number) => {
  const oldValue = selected.value
  selected.value = option
  isOpen.value = false

  // 只有当值真正改变时才触发 change 事件
  if (oldValue !== option) {
    emit('change', option)
  }
}

const toggleDropdown = async () => {
  if (!isOpen.value) {
    // 打开下拉框前先计算位置
    await nextTick()
    calculateDropdownPosition()
  }
  isOpen.value = !isOpen.value
}

// 计算下拉框位置
const calculateDropdownPosition = () => {
  if (!selectRef.value) return

  const rect = selectRef.value.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const dropdownHeight = 200 // 假设下拉框最大高度

  // 如果下方空间不足，则向上展开
  if (rect.bottom + dropdownHeight > windowHeight && rect.top > dropdownHeight) {
    dropdownPosition.value = 'top'
  } else {
    dropdownPosition.value = 'bottom'
  }
}

// 点击外部关闭下拉框
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.pc-select')) {
    isOpen.value = false
  }
}

// 监听全局点击事件
document.addEventListener('click', handleClickOutside)
</script>

<template>
  <div ref="selectRef" class="pc-select" relative inline-block>
    <div class="select-trigger" flex items-center justify-between w104px h30px px8px border="1px solid #E5E6EB" rd-4px
      bg-white cursor-pointer text-14px text="#333" transition-all duration-200 hover:border="#1677ff"
      :class="{ 'border-#1677ff shadow-[0_0_0_2px_rgba(22,119,255,0.1)]': isOpen }" @click="toggleDropdown">
      <span class="select-label" flex-1 text-left truncate>{{ selectedLabel }}</span>
      <svg class="select-arrow" w12px h12px ml4px text="#999" transition-transform duration-200
        :class="{ 'rotate-180': isOpen }" viewBox="0 0 12 12">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
    </div>

    <transition enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 transform translate-y--10px" enter-to-class="opacity-100 transform translate-y-0"
      leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 transform translate-y-0"
      leave-to-class="opacity-0 transform translate-y--10px">
      <div v-if="isOpen" class="select-dropdown" absolute left-0 right-0 z-1000 border="1px solid #E5E6EB" rd-4px
        bg-white shadow="0 2px 8px rgba(0,0,0,0.1)" :class="{
          'top-full mt4px': dropdownPosition === 'bottom',
          'bottom-full mb4px': dropdownPosition === 'top'
        }">
        <div class="select-options" max-h200px overflow-y-auto>
          <div v-for="option in options" :key="option" class="select-option" px12px py8px text-14px text="#333"
            cursor-pointer transition-background-color duration-200 hover:bg="#f5f5f5"
            :class="{ 'bg-#e6f4ff text-#1677ff font-500': option === selected }" @click="selectOption(option)">
            {{ option }}条/页
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>