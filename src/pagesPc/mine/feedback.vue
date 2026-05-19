<script setup lang='ts'>
import { addFeedback } from '@/api/user'
const tabs = ['服务问题', '直播问题', '课程问题', '其他']
const tabIndex = ref(0)
const content = ref('')
const loading = ref(false)
function handSub() {
  if (!content.value) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' })
    return
  }
  loading.value = true
  addFeedback({ feedbackType: tabIndex.value + 1, feedbackContent: content.value }).then(() => {
    uni.showToast({ title: '提交成功', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  }).finally(() => {
    loading.value = false
  })
}
</script>

<template>
  <pc-mine-layout>
    <div p16px>
      <div text-16px font-500 pb13px border-b="1px solid #E5E6EB">意见反馈</div>
      <div mt16px mb13px text-16px font-500>反馈类型</div>
      <div flex gap-19px>
        <div v-for="(tab, index) in tabs" :key="index" flex-center w88px h32px rd-2px cursor-pointer
          @click="tabIndex = index"
          :class="[index === tabIndex ? 'text-#305EF6 bg-#305EF6 bg-op-10' : 'text-#88909B bg-#F5F5F5']">
          {{ tab }}
        </div>
      </div>
      <div mt16px mb13px text-16px font-500>反馈内容</div>
      <my-form v-model="content" type="textarea"
        :textStyle="{ 'background': '#F5F5F5', 'padding': '8px', 'border-radius': '4px' }" height="300px"></my-form>

      <div pc-btn-sub font-500 text-20px w360px h55px rd-4px m="t20px l302px" @click="handSub">
        <uv-loading-icon color="#fff" size="18" mr8px v-if="loading"></uv-loading-icon>
        提交
      </div>
    </div>
  </pc-mine-layout>
</template>