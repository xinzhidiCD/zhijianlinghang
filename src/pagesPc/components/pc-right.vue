<script setup lang='ts'>
import { LiveStatusEnum, LiveTypeEnum } from '@/utils/enum'
import { getLastLiveNotice } from '@/api/setting'
import { storeToRefs } from 'pinia'
const props = defineProps<{
  liveType: number,
  liveStatus?: number,
  liveInfo: any
}>()
const setting = useSetting()
const { settingInfo } = storeToRefs(setting)
const subList = computed(() => {
  const tabs = []
  if (props.liveType === LiveTypeEnum.ThreeSplit) {
    if (settingInfo.value?.liveConfig?.isInteractionEnabled) {
      tabs.push('聊天')
    }
    if (settingInfo.value?.liveConfig?.isIntroductionEnabled) {
      tabs.push('介绍')
    }
  } else {
    tabs.push('聊天', '介绍')
  }
  return tabs
})
const current = ref(0)
function change(index: number) {
  current.value = index;
}
const imListRef = ref()
const subPlayerRef = ref() // 右侧播放器

const emit = defineEmits(['timeUpdate', 'seeked', 'play', 'pause'])

function addMessage(msg: any) {
  imListRef.value.addMessage(msg)
}

// === 回放视频同步相关 ===
// 获取当前播放时间
function getCurrentTime(): number {
  return subPlayerRef.value?.getCurrentTime?.() || 0
}

// 设置播放时间
function seekTo(time: number) {
  subPlayerRef.value?.seekTo?.(time)
}

// 获取是否正在播放
function getIsPlaying(): boolean {
  return subPlayerRef.value?.getIsPlaying?.() || false
}

// 事件向上传递
function onPlayerTimeUpdate(time: number) {
  emit('timeUpdate', time)
}
function onPlayerSeeked(time: number) {
  emit('seeked', time)
}
function onPlayerPlay(time: number) {
  emit('play', time)
}
function onPlayerPause(time: number) {
  emit('pause', time)
}

// 外部调用的播放方法
function play() {
  subPlayerRef.value?.play?.()
}

// 外部调用的暂停方法
function pause() {
  subPlayerRef.value?.pause?.()
}

const popupRef = ref()

// 新增：公告展开/收起
const showNotice = ref(true)
function toggleNotice() {
  showNotice.value = !showNotice.value
}
defineExpose({
  addMessage,
  setNotice,
  getCurrentTime,
  seekTo,
  getIsPlaying,
  play,
  pause
})

function setNotice(content: string) {
  notice.value = content
}

const notice = ref('')
onMounted(() => {
  getLastLiveNotice().then(res => {
    notice.value = res?.data
  })
})

function getMd(date: string) {
  return uni.$uv.timeFormat(date, 'mm月dd日hh:MM')
}
const isExpand = ref(true)
</script>

<template>
  <div border-l="1px solid #E5E6EB" p16px pt22px flex flex-col>
    <!-- 右上角辅流视频窗口已隐藏：主播端已合成单流推流，用户端只需观看主画面 -->
    <!-- <div
      v-if="(LiveTypeEnum.ThreeSplit === liveType && settingInfo?.liveConfig?.isCoursewareEnabled) || liveType === LiveTypeEnum.PptThreeSplit"
      mb16px relative>
      ...
    </div> -->
    <template v-if="subList.length">
      <uv-subsection mb16px :list="subList" fontSize="16px" bgColor="#F2F3F5" activeColor="#fff" :current="current"
        @change="change" custom-style="height: 44px;border-radius: 4px;padding:0;cursor:pointer"
        custom-item-style="background:#305EF6;"></uv-subsection>
      <template v-if="subList[current] === '聊天'">
        <div flex-between>
          <div flex items-center>
            <img src="/static/images/pc/home/pin.png" w16px h16px mr8px>
            <div font-500>公告：</div>
          </div>
          <img src="/static/images/pc/home/arrows_up.png" :class="[showNotice ? 'rotate-0' : 'rotate-180deg']"
            @click="toggleNotice" w16px h16px cursor-pointer>
        </div>
        <transition name="slide-in-up">
          <div v-if="showNotice" leading-22px mt10px line-clamp-2 break-words>
            {{ notice || '暂无公告' }}
          </div>
        </transition>
        <!-- im -->
        <pc-imList ref="imListRef"></pc-imList>
      </template>
      <template v-else>
        <div border="1px solid #E3E5EC" rd-4px p16px>
          <div text-16px border-b="1px solid #E3E5EC" pb16px mb16px>
            {{ liveInfo?.liveName }}<span ml16px>直播时间：
              <span text="#305EF6">{{ getMd(liveInfo?.liveStartTime) }}</span>
            </span>
          </div>
          <div text="#88909B">{{ liveInfo?.liveDescription }}</div>
          <div text="#88909B" my8px>{{ liveInfo?.liveStartTime }} 开始</div>
          <div v-if="liveInfo?.isReplayEnabled" flex items-center>回放有效期：
            {{ liveInfo?.replayValidityType == 0 ? '永久有效' : '限时有效' }}
            <img v-if="liveInfo?.replayValidityType == 1" src="/static/images/pc/home/tips.png" w16px h16px ml8px
              cursor-pointer @click="popupRef.open()">
          </div>
        </div>
        <div text-16px font-500 mt16px mb12px>详情</div>
        <div leading-24px>
          <uv-parse :content="liveInfo?.liveDetails"></uv-parse>
        </div>
      </template>
    </template>
    <!-- 有效期说明 -->
    <pc-popup-warn popClass="w435px" ref="popupRef" title="回放有效期" icon="/static/images/pc/home/warn-tips.png">
      <div py40px px45px>
        <div font-500 leading-24px>该直播回放有效时间段：
          <div v-for="c, k in liveInfo?.replayLimitedTime || []" :key="k">
            {{ c.join(' - ') }}
          </div>
        </div>
        <div text="#88909B 12px" mt4px>有效期后您仍可进入直播间查看相关信息，但无法观看回放视频</div>
      </div>
    </pc-popup-warn>
  </div>

</template>