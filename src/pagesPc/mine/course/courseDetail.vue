<template>
  <pc-mine-layout>
    <div flex flex-col bg="#F2F3F5" relative>
      <div px16px pt16px bg-white sticky top-0 left-0 z-999>
        <div pb13px border-b="1px solid #E5E6EB">
          <div flex items-center cursor-pointer w-fit @click="$goBack()">
            <img src="/static/images/pc/common/pg-left.png" w16px h16px mr4px>
            <div text-16px font-500>课程学习</div>
          </div>
        </div>
      </div>
      <div p16px bg-white>
        <my-video v-if="playActive?.fileUrl || info?.coverVideo" ref="myVideoRef" wfull h454px 
          :src="playActive?.fileUrl || info?.coverVideo" :poster="playActive?.coverImage || info?.coverImage"
          @ended="videoEnd"></my-video>
        <img v-else :src="playActive?.coverImage || info?.coverImage" wfull h454px></img>
        <div text-24px font-500 leading-34px mt16px>{{ info?.title }}</div>
        <div text="#515968 16px" mt5px mb7px>{{ info?.synopsi }}</div>
        <div flex-between text="#87909B">
          <div>{{ info?.validUntil === 0 ? '长期有效' : `${info?.validUntil}天有效` }}</div>
        </div>
      </div>
      <div h16px flex-shrink-0></div>
      <div flex-shrink-0 bg-white p16px>
        <pc-tabs :tabList="tabList" :tabIndex="tabIndex" @change="tabIndex = $event"></pc-tabs>
        <div v-if="tabIndex === 0">
          <div my16px text="#515968" font-500>
            <uv-parse :content="info?.description"></uv-parse>
          </div>
        </div>
        <div v-else>
          <div font-500 mt16px mb13px>目录列表（{{ info?.myChapters?.length || 0 }}）</div>
          <div v-for="(chapter, i) in info?.myChapters" :key="i" mb9px rd-4px border="1px solid #E5E6EA" wfull>
            <div pl32px font-500 h40px flex items-center border-b="1px solid #E5E6EA">{{ chapter.title }}</div>
            <div bg="#F5F5F5" px32px>
              <div v-for="(section, j) in chapter.knobbleList" :key="j" h60px flex-between :class="[
                j === chapter.knobbleList.length - 1 ? 'border-b-0' : 'border-b-1 border-b-solid border-b-#E5E6EA'
              ]">
                {{ section.title }}
                <img v-if="playActive?.knobbleId === section.knobbleId" src="/static/images/pc/mine/pause.png" w24px
                  h24px cursor-pointer></img>
                <img v-else src="/static/images/pc/mine/play.png" w24px h24px cursor-pointer
                  @click="handlePlay(section)"></img>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </pc-mine-layout>
</template>

<script setup lang='ts'>
import { getCourseDetail, learningCompleted } from '@/api/user'
const tabList = ['课程详情', '课程目录']
const tabIndex = ref(0)

const info: any = ref({})
onLoad((options: any) => {
  // 获取课程详情
  getCourseDetail({ courseId: options.id }).then((res: any) => {
    info.value = res.data || {}
    if (info.value?.coverVideo) {
      nextTick(() => {
        myVideoRef.value.initVideo()
      })
    }
  })
})

const playActive: any = ref({})
const myVideoRef = ref()
function handlePlay(section: any) {
  playActive.value = section
  if (!section.fileUrl) {
    uni.showToast({ title: '暂无视频', icon: 'error' })
    return
  }

  nextTick(() => {
    myVideoRef.value && myVideoRef.value.initVideo()
  })
}

const { getUser } = useAuth()
function videoEnd() {
  if (!playActive.value?.knobbleId) return
  const data = {
    unionId: getUser()?.unionId,
    contentId: playActive.value?.contentId,
    knobbleId: playActive.value?.knobbleId,
    chapterId: playActive.value?.chapterId,
    courseId: info.value?.courseId
  }
  learningCompleted(data)
}
</script>