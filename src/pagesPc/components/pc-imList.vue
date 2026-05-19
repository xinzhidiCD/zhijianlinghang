<script setup lang='ts'>
import { sendMessage, getMessageHistory } from '@/api/message'
import { MqttMessageStatusEnum } from '@/utils/enum'
import { storeToRefs } from 'pinia'
import { isImageLink, imagePreview, desensitizeName } from '@/utils/common'

const { getUser } = useAuth()
const imList: any = ref([])
const imListRef = ref<HTMLElement | null>(null)
function isRenderableChatMessage(msg: any) {
  return !!msg
    && typeof msg === 'object'
    && typeof msg.senderId !== 'undefined'
    && typeof msg.range !== 'undefined'
    && typeof msg.content !== 'undefined'
}

function parseMessageIdList(content: any) {
  if (Array.isArray(content)) {
    return content
  }

  if (typeof content !== 'string' || !content.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    return []
  }
}

function addMessage(msg: any) {
  if (msg.type === MqttMessageStatusEnum.HiddenMessage) {
    // 隐藏消息
    const IndexArr = parseMessageIdList(msg.content);
    if (!IndexArr.length) {
      console.warn('[PcChatList] hidden message payload is not id array', msg)
      return
    }
    imList.value = imList.value.map((item: any) => {
      if (IndexArr.includes(item.id)) {
        // 只把 range 改为 1，仅自己可见
        return { ...item, range: 1 }
      }
      return item
    });
    return
  }
  if (msg.type === MqttMessageStatusEnum.EnableMessage) {
    if (isRenderableChatMessage(msg)) {
      console.log('[PcChatList] append enable/audit message', {
        type: msg.type,
        id: msg.id,
        range: msg.range,
        senderId: msg.senderId,
        senderName: msg.senderName,
        content: msg.content
      })
      imList.value.push(msg)
      if (imList.value.length > 100) {
        imList.value.shift()
      }
      nextTick(() => {
        if (imListRef.value) {
          imListRef.value.scrollTop = imListRef.value.scrollHeight
        }
      })
      return
    }
    // 启用消息
    const IndexArr = parseMessageIdList(msg.content);
    if (!IndexArr.length) {
      console.warn('[PcChatList] enable message payload is not id array', msg)
      return
    }
    imList.value = imList.value.map((item: any) => {
      if (IndexArr.includes(item.id)) {
        // 只把 range 改为 0， 全部人可见
        return { ...item, range: 0 }
      }
      return item
    });
    return
  }
  console.log('[PcChatList] append message', {
    type: msg.type,
    id: msg.id,
    range: msg.range,
    senderId: msg.senderId,
    senderName: msg.senderName,
    content: msg.content
  })
  imList.value.push(msg)
  if (imList.value.length > 100) {
    imList.value.shift() // 保持列表长度不超过100
  }
  nextTick(() => {
    // 滚动到底部
    if (imListRef.value) {
      imListRef.value.scrollTop = imListRef.value.scrollHeight
    }
  })
}
defineExpose({
  addMessage
})

function getHistory() {
  getMessageHistory({ roomId: getUser()?.liveId, joinDate: Date.now(), pageSize: 50 }).then((res: any) => {
    imList.value.unshift(...res.data)
    setTimeout(() => {
      // 滚动到底部
      nextTick(() => {
        if (imListRef.value) {
          imListRef.value.scrollTop = imListRef.value.scrollHeight
        }
      })
    }, 500)
  })
}

onMounted(() => {
  getHistory()
})

// 发消息
const setting = useSetting()
const { settingInfo } = storeToRefs(setting)
const loading = ref(false)
const content = ref('')
const isShiftPressed = ref(false)

function handleSend() {
  if (settingInfo.value?.liveConfig?.isGlobalMuteEnabled) return
  if (loading.value) return;
  if (content.value.trim() === '') {
    uni.showToast({
      title: '请输入消息内容',
      icon: 'none'
    });
    return;
  }
  loading.value = true;
  sendMessage({ message: content.value }).then((res) => {
    content.value = '';
  }).finally(() => {
    loading.value = false;
  })
}

function handleKeydown(event: any) {
  if (event.key === 'Shift') {
    isShiftPressed.value = true
    return
  }

  if (event.key === 'Enter' || event.keyCode === 13) {
    if (isShiftPressed.value) {
      console.log('shift + enter - 换行')
      // Shift+Enter 允许换行，不做任何处理
      return
    } else {
      console.log('enter - 发送')
      // 单独按Enter键，发送消息
      event.preventDefault()
      handleSend()
    }
  }
}

function handleKeyup(event: any) {
  if (event.key === 'Shift') {
    isShiftPressed.value = false
  }
}

function msgStyle(userType: number) {
  switch (userType) {
    case 1:
      return 'teachingAssistant'
    case 5:
      return 'streamerMsg'
    default:
      return ''
  }
}

const imLoading = ref(false)
const isNoMoreHistory = ref(false)
function handleHistory() {
  if (imLoading.value || isNoMoreHistory.value) return
  imLoading.value = true
  getMessageHistory({ roomId: getUser()?.liveId, joinDate: imList.value[0].senderAt, pageSize: 50 }).then((res: any) => {
    isNoMoreHistory.value = res.data.length === 0
    imList.value.unshift(...res.data)
  }).finally(() => {
    imLoading.value = false
  })
}
const { formatTime } = useTool()
</script>

<template>
  <div ref="imListRef" mt16px bg="#F2F3F5" p12px flex-1 overflow-auto border="1px solid #E3E5EC">
    <div v-if="imLoading" flex-center text="#AAAEB7 12px">
      <uv-loading-icon color="#AAAEB7" size="28rpx" mr8px></uv-loading-icon>正在加载...
    </div>
    <div v-else text="#AAAEB7 12px center" :class="[!isNoMoreHistory && 'cursor-pointer']" @click="handleHistory">{{
      isNoMoreHistory ? '暂无更多历史消息' : '点击查看更多消息' }} </div>
    <div mt16px flex flex-col gap-16rpx>
      <div v-for="(item, idx) in imList" :key="idx" wfull>
        <!-- 0全部人可见1仅自己可见2仅他人可见 -->
        <template v-if="item.range === 0 ||
          (item.range === 1 && item.senderId === getUser()?.userId) ||
          (item.range === 2 && item.senderId !== getUser()?.userId)">
          <div v-if="item.senderId == getUser()?.userId" flex justify-end>
            <div flex flex-col items-end>
              <div text-12px>
                <!-- <span text="#999 10px" mr5px>{{ formatTime(item.senderAt) }}</span> -->
                {{ desensitizeName(item.senderName, item.userType) }}
              </div>
              <image v-if="isImageLink(item.content)" :src="item.content" w-60px h60px mt7px rd-4px cursor-pointer
                @click="imagePreview(0, [item.content])" />
              <div v-else class="list-box">{{ item.content }}</div>
            </div>
            <uv-avatar :src="item.avatar" size="40px" ml8rpx></uv-avatar>
          </div>
          <div v-else flex>
            <uv-avatar :src="item.avatar" size="40px" mr8rpx></uv-avatar>
            <div>
              <div v-if="item.userType === 5 || item.userType === 1" flex items-center text-12px>
                <div text-white rd-4px w36px h19px flex-center mr8px
                  style="background: linear-gradient( 270deg, #4B70FB 0%, #43A0FF 100%)">
                  {{ item.userType === 5 ? '主讲' : '助教' }}
                </div>
                {{ desensitizeName(item.senderName, item.userType) }}
                <!-- <span text="#999 10px" ml5px>{{ formatTime(item.senderAt) }}</span> -->
              </div>
              <div v-else text-12px> {{ desensitizeName(item.senderName, item.userType) }}
                <!-- <span text="#999 10px" ml5px>{{ formatTime(item.senderAt) }}</span> -->
              </div>

              <image v-if="isImageLink(item.content)" :src="item.content" w-60px h60px mt7px rd-4px cursor-pointer
                @click="imagePreview(0, [item.content])" />

              <div v-else :class="[msgStyle(item.userType)]" class="list-box">{{ item.content }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
  <div border="1px solid #E3E5EC" rd-4px h110px my12px p12px>
    <uv-textarea class="!p-0" :disabled="settingInfo?.liveConfig?.isGlobalMuteEnabled"
      :textStyle="{ 'fontSize': '14px' }" count :maxlength="80" v-model="content"
      :placeholder="settingInfo?.liveConfig?.isGlobalMuteEnabled ? '管理员已开启全体禁言' : '请输入'" height="80px" border="none"
      placeholderStyle="color:#BFBFBF" @keydown="handleKeydown" @keyup="handleKeyup"></uv-textarea>
  </div>
  <div flex justify-end>
    <div pc-btn-sub w74px h32px rd-4px @click="handleSend"
      :class="[settingInfo?.liveConfig?.isGlobalMuteEnabled && '!bg-[#ccc]']">
      <uv-loading-icon color="#fff" size="14" mr2px v-if="loading"></uv-loading-icon>
      发送
    </div>
  </div>
</template>
<style lang="scss" scoped>
.list-box {
  background: #305EF6;
  border-radius: 4px;
  padding: 6px 8px;
  max-width: 280px;
  font-size: 12px;
  margin-top: 7px;
  color: white;
  width: fit-content;
  word-break: break-word;
}

.streamerMsg {
  background: #ff0000;
}

.teachingAssistant {
  background: #ffa601;
}
</style>
