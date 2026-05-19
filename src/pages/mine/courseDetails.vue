<template>
  <view flex flex-col text-24rpx>
    <my-video v-if="playActive?.fileUrl || info?.coverVideo" ref="myVideoRef" :isPc="true"
      :src="playActive?.fileUrl || info?.coverVideo" :poster="playActive?.coverImage || info?.coverImage" wfull h422rpx
      @ended="videoEnd"></my-video>
    <image v-else :src="playActive?.coverImage || info?.coverImage" mode="scaleToFill" wfull h422rpx></image>
    <view p24rpx pb82rpx>
      <view font-500 text-30rpx leading-42rpx>{{ info?.title }}</view>
      <view text="26rpx #909193" my16rpx>{{ info?.synopsi }}</view>
      <view text="26rpx #909193">{{ info?.validUntil === 0 ? '长期有效' : `${info?.validUntil}天有效` }}</view>
    </view>
    <view bg="#FAFAFA" h16rpx></view>
    <view py28rpx px24rpx>
      <view h67rpx flex justify-center gap-100rpx>
        <view v-for="c, k in tabList" :key="k" text-30rpx font-500
          :class="[tabIndex === k ? 'text-#333 relative' : 'text-#606266']" @click="tabIndex = k">
          {{ c }}<view v-if="tabIndex === k" class="absolute bottom-0 left-38rpx bg-#0B68F6 w56rpx h4rpx rd-2rpx">
          </view>
        </view>
      </view>
      <view v-if="tabIndex === 0">
        <view my28rpx text-28rpx leading-40rpx>
          <uv-parse :content="info?.description"></uv-parse>
        </view>
      </view>
      <view v-else>
        <view text-28rpx font-500 my24rpx>目录列表({{ info?.myChapters?.length || 0 }})</view>
        <view v-for="(chapter, i) in info?.myChapters" :key="i">
          <view class="h96rpx flex-between px28rpx rd-8rpx bg-#F9F9F9">
            <view text-28rpx>{{ i + 1 }}.{{ chapter.title }}</view>
          </view>
          <view>
            <view v-for="(sub, j) in chapter.knobbleList" :key="j"
              class="h96rpx pl52rpx pr28rpx text-28rpx flex-between">
              {{ i + 1 }}.{{ j + 1 }}{{ sub.title }}
              <image v-if="playActive?.knobbleId === sub.knobbleId" src="/static/images/h5/mine/pause.png" w60rpx
                h60rpx></image>
              <image v-else src="/static/images/h5/mine/play.png" w60rpx h60rpx @click="handlePlay(sub)"></image>
            </view>
          </view>
        </view>
      </view>
    </view>
    <my-float top-40vh></my-float>
  </view>
</template>

<script lang="ts" setup>
import { getCourseDetail, learningCompleted } from '@/api/user'
const tabList = ['课程详情', '课程目录']
const tabIndex = ref(0)

const info: any = ref({})
onLoad((options: any) => {
  // 获取课程详情
  getCourseDetail({ courseId: options.id }).then((res: any) => {
    info.value = res.data || {}
    if (info.value?.coverVideo)
      nextTick(() => {
        myVideoRef.value.initVideo()
      })
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

<style lang="scss" scoped></style>