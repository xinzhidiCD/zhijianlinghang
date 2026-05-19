<script lang="ts" setup>
import { getLastLiveNotice } from '@/api/setting'
import { MqttMessageStatusEnum } from '@/utils/enum'
import { formatTime } from '@/utils/common'
import { storeToRefs } from 'pinia'
import { isImageLink, imagePreview, desensitizeName } from '@/utils/common'
import { getMessageHistory } from '@/api/message'
const props = defineProps<{
  liveStatus: number,
  liveInfo: any
  showCouponBtn?: boolean
}>()
const emit = defineEmits(['refreshCoupon'])
const { getUser } = useAuth()

const liveProductRef = ref()
const noticeOpen = ref(false)
const prizeDrawRef = ref()
const couponRef = ref()


const imList: any = ref([])
const imListRef = ref<HTMLElement | null>(null)
const couponObj: any = ref({})
const prizeCountDown = ref()
const noticeContent = ref('')
const imEditorRef = ref()
const getPointsRef = ref()
const buyList: any = ref([]) // 正在购买商品队列
const isLoadingHistory = ref(false)
const hasMoreHistory = ref(true)
const scrollTop = ref(0)
const isInitialized = ref(false) // 标记是否已初始化，防止一进入就加载
let lastScrollTop = 0 // 记录上次滚动位置
let scrollEndTimer: any = null // 滚动结束定时器
function isRenderableChatMessage(msgObj: any) {
  return !!msgObj
    && typeof msgObj === 'object'
    && typeof msgObj.senderId !== 'undefined'
    && typeof msgObj.range !== 'undefined'
    && typeof msgObj.content !== 'undefined'
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

function addMessage(msgObj: any) {
  if ((msgObj.type === MqttMessageStatusEnum.NormalMessage
    || (msgObj.type === MqttMessageStatusEnum.EnableMessage && isRenderableChatMessage(msgObj)))
    && msgObj.range !== 3) {
    // 普通信息
    console.log('[ChatPanel] append message', {
      type: msgObj.type,
      id: msgObj.id,
      range: msgObj.range,
      senderId: msgObj.senderId,
      senderName: msgObj.senderName,
      content: msgObj.content
    })
    imList.value.push(msgObj)
    nextTick(() => scrollToBottom())
  } else if (msgObj.type === MqttMessageStatusEnum.CouponCountdown) {
    // 优惠券倒计时消息
    emit('refreshCoupon')
    const obj = msgObj.content ? JSON.parse(msgObj.content) : {}
    couponObj.value = { ...obj, type: 1 }
  } else if (msgObj.type === MqttMessageStatusEnum.Duration) {
    // 优惠券持续时间
    const obj = msgObj.content ? JSON.parse(msgObj.content) : {}
    couponObj.value = { ...obj, type: 2 }
  } else if (msgObj.type === MqttMessageStatusEnum.LotteryCountdown) {
    // 抽奖倒计时消息
    prizeCountDown.value = msgObj.content
    if (msgObj.content < 4) {
      if (msgObj.content < 1) {
        return prizeDrawRef.value.close()
      }
      prizeDrawRef.value.initCountDown(msgObj.content)
    }
  } else if (msgObj.type === MqttMessageStatusEnum.ProductIntroduction) {
    // 商品讲解消息
    liveProductRef.value.open(msgObj.content)
  } else if (msgObj.type === MqttMessageStatusEnum.CancelProductIntroduction) {
    // 取消商品讲解
    liveProductRef.value.cancel()
  } else if (msgObj.type === MqttMessageStatusEnum.ProductShelves) {
    // 商品上架
    liveProductRef.value.productOpen(msgObj.content)
  } else if (msgObj.type === MqttMessageStatusEnum.Buying) {
    // 正在购买商品消息
    buyList.value.push(JSON.parse(msgObj.content))
    // 处理队列
    processBuyingQueue()
  } else if (msgObj.type === MqttMessageStatusEnum.Announcement) {
    // 公告
    noticeContent.value = msgObj.content
    noticeOpen.value = true
  } else if (msgObj.type === MqttMessageStatusEnum.CouponReceiveResult) {
    // 优惠券领取结果
    couponListRef.value?.showResult(JSON.parse(msgObj.content))
  } else if (msgObj.type === MqttMessageStatusEnum.LotteryResult) {
    // 抽奖结果
    prizeDrawRef.value.showResult(msgObj.content)
  } else if (msgObj.type === MqttMessageStatusEnum.HiddenMessage) {
    // 隐藏消息处理
    const IndexArr = parseMessageIdList(msgObj.content);
    if (!IndexArr.length) {
      console.warn('[ChatPanel] hidden message payload is not id array', msgObj)
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
  } else if (msgObj.type === MqttMessageStatusEnum.EnableMessage) {
    // 启用消息处理
    const IndexArr = parseMessageIdList(msgObj.content);
    if (!IndexArr.length) {
      console.warn('[ChatPanel] enable message payload is not id array', msgObj)
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
  } else if (msgObj.type === MqttMessageStatusEnum.GiftGiving) {
    // 处理赠送礼物消息
    imEditorRef.value?.addGiftMessage(msgObj.content);
  } else if (msgObj.type === MqttMessageStatusEnum.GetPoints) {
    // 处理获得积分消息
    getPointsRef.value.open(msgObj.content);
  }
}
function setHistory(history: any) {
  imList.value = [...(history || [])]
  nextTick(() => scrollToBottom())
}

// 处理滚动事件，滚动到顶部时加载历史消息
function handleScroll(e: any) {
  // 如果还未初始化完成，不处理滚动事件
  if (!isInitialized.value) {
    console.log('未初始化，跳过滚动处理')
    return
  }

  if (isLoadingHistory.value || !hasMoreHistory.value) {
    console.log('加载中或无更多历史', { isLoadingHistory: isLoadingHistory.value, hasMoreHistory: hasMoreHistory.value })
    return
  }

  // 获取滚动容器和滚动位置
  let scrollTopValue = 0
  let container = imListRef.value

  // 尝试获取真实的DOM元素
  if (container && (container as any).$el) {
    container = (container as any).$el
  }

  // 直接从容器获取scrollTop
  if (container) {
    scrollTopValue = container.scrollTop || 0
  }

  console.log('滚动事件', { scrollTopValue, lastScrollTop, scrollHeight: container?.scrollHeight, clientHeight: container?.clientHeight })

  // 判断是否向上滚动到顶部
  const isNearTop = scrollTopValue <= 100
  const isMovingUp = scrollTopValue < lastScrollTop

  lastScrollTop = scrollTopValue

  // 只有向上滚动且在顶部附近才处理
  if (!isNearTop || !isMovingUp) {
    console.log('不满足条件', { isNearTop, isMovingUp })
    return
  }

  console.log('准备加载历史消息')

  // 清除之前的定时器
  if (scrollEndTimer) {
    clearTimeout(scrollEndTimer)
  }

  // 滚动结束后触发加载（防抖）
  scrollEndTimer = setTimeout(() => {
    console.log('触发加载历史消息')
    if (!isLoadingHistory.value && hasMoreHistory.value) {
      loadMessageHistory()
    }
  }, 300) // 300ms 防抖
}

// 加载历史消息
async function loadMessageHistory() {
  if (isLoadingHistory.value || !hasMoreHistory.value || imList.value.length === 0) return

  try {
    isLoadingHistory.value = true

    // 获取当前最早消息的 senderAt 作为 joinDate
    const joinDate = imList.value[0].senderAt

    // 保存当前滚动位置和高度
    let container = imListRef.value
    if (container && (container as any).$el) {
      container = (container as any).$el
    }
    const oldScrollHeight = container?.scrollHeight || 0
    const oldScrollTop = container?.scrollTop || 0

    console.log('加载前', { oldScrollHeight, oldScrollTop })

    // 调用API获取历史消息
    const res = await getMessageHistory({
      roomId: getUser()?.liveId,
      joinDate: joinDate,
      pageSize: 50
    })

    if (res.data && res.data.length > 0) {
      // 将历史消息添加到列表开头
      imList.value.unshift(...res.data)

      // 恢复滚动位置 - 需要等待DOM更新后调整
      nextTick(() => {
        // 使用 requestAnimationFrame 确保在浏览器渲染后执行
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight
            const heightDiff = newScrollHeight - oldScrollHeight
            const newScrollTop = oldScrollTop + heightDiff

            console.log('加载后', { newScrollHeight, heightDiff, newScrollTop })

            // 直接设置，不使用平滑滚动
            container.scrollTop = newScrollTop

            // 更新 lastScrollTop 避免触发滚动事件
            lastScrollTop = newScrollTop
          }
        })
      })
    } else {
      hasMoreHistory.value = false
    }
  } catch (error) {
    console.error('加载历史消息失败:', error)
  } finally {
    isLoadingHistory.value = false
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

function scrollToBottom() {
  nextTick(() => {
    setTimeout(() => {
      let container = imListRef.value
      if (container && (container as any).$el) {
        container = (container as any).$el
      }
      const last = container?.lastElementChild
      if (last) {
        (last as HTMLElement).scrollIntoView({ behavior: 'auto', block: 'end' })
      }
      // 滚动到底部后标记为已初始化
      setTimeout(() => {
        isInitialized.value = true
      }, 200)
    }, 100)
  })
}

const isShowingBuy = ref(false) // 是否正在显示购买商品
const buyInfo: any = ref({}) // 具体信息
function processBuyingQueue() {
  if (isShowingBuy.value || buyList.value.length === 0) {
    return
  }
  isShowingBuy.value = true
  const nextBuy = buyList.value.shift()
  buyInfo.value = nextBuy
  setTimeout(() => {
    isShowingBuy.value = false
    // 递归处理下一个购买商品
    nextTick(() => {
      processBuyingQueue()
    })
  }, 10000) // 10秒显示时间
}

defineExpose({
  addMessage,
  setHistory
})
const setting = useSetting()
const { settingInfo } = storeToRefs(setting)
onMounted(() => {
  getLastLiveNotice().then(res => {
    noticeContent.value = res?.data
  })
})

const couponListRef = ref()

function handleCoupon() {
  const liveId = props.liveInfo?.id || getUser()?.liveId
  couponListRef.value.open(liveId)
}
const modalRef = ref()
const tool = useTool()
</script>

<template>
  <view flex-1 overflow-y-auto overflow-x-hidden relative py16rpx pb60rpx flex flex-col>
    <!-- 右侧悬浮（可拖拽） -->
    <my-float-panel
      :prizeCountDown="prizeCountDown"
      :couponObj="couponObj"
      :noticeOpen="noticeOpen"
      :showCouponBtn="showCouponBtn"
      @openPrize="prizeDrawRef.open(liveInfo.id)"
      @handleCoupon="handleCoupon"
    />
    <!-- 公告 -->
    <transition name="slide-in-right">
      <view v-if="!noticeOpen" @click="noticeOpen = true"
        class="bg-black-box !bg-#3C9CFF !bg-op-50 w116rpx h48rpx absolute z-1 right-0 top-16rpx"
        border-rd="[48rpx_0_0_48rpx]">
        <image src="/static/images/h5/home/notice.png" class="w32rpx h30rpx mr4rpx ">
        </image> 公告
      </view>
    </transition>
    <transition name="slide-in-up">
      <view v-if="noticeOpen" class="bg-white mx24rpx pl24rpx pr16rpx flex items-center h72rpx rd-12rpx">
        <image src="/static/images/h5/home/notice.png" w32rpx h30rpx />
        <view text="#0B68F6 28rpx" font-500 ml10rpx mr4rpx>公告：</view>
        <view flex-1 text="#999999 28rpx" truncate @click="modalRef.open()">{{ noticeContent || '暂无公告' }}</view>
        <image src="/static/images/h5/common/close.png" w32rpx h32rpx ml10rpx @click="noticeOpen = false" />
      </view>
    </transition>

    <!-- 正在购买弹出 -->
     <!--  -->
    <transition name="slide-in-left">
      <view v-if="isShowingBuy && settingInfo?.liveConfig?.isYellowCarEnabled"
        class="bg-#81AFF7 z-3 flex items-center pl20rpx pr20rpx text-white w480rpx h68rpx absolute left-0 top-[40%]"
        border-rd="[0_68rpx_68rpx_0]">
        <img :src="buyInfo?.coverImage" w70rpx h50rpx rd-2rpx>
        <view class="flex-1 m-l-[20rpx] max-w[230rpx]">
          <view text-24rpx truncate>
            {{ buyInfo?.maskedNickName }} &nbsp;
            {{ settingInfo?.liveConfig?.promptText || '正在购买' }}
          </view>
          <view mt-4rpx text-16rpx>{{ buyInfo?.productTitle }}</view>
        </view>
        <view @click="imEditorRef.openProductList()" class="shrink-0 m-l-[20rpx] truncate bg-#DF4F48 text-white p-x-16rpx p-y-8rpx rd-full"
         text-24rpx font-500>
          {{ settingInfo?.liveConfig?.shortcutKeyName || '马上抢' }}
        </view>
      </view>
    </transition>
    <!-- 列表 -->
    <view ref="imListRef" class="flex flex-col gap-24rpx flex-1 mt24rpx px24rpx overflow-auto" @scroll="handleScroll">
      <!-- 0全部人可见1仅自己可见2仅他人可见 -->
      <template v-for="(item, idx) in imList" :key="idx">
        <template v-if="item.range === 0 ||
          (item.range === 1 && item.senderId === getUser()?.userId) ||
          (item.range === 2 && item.senderId !== getUser()?.userId)">
          <view v-if="item.senderId == getUser()?.userId" flex justify-end>
            <view flex flex-col items-end>
              <view text="#676767">
                <!-- <text mr10rpx text-20rpx>{{ tool.formatTime(item.senderAt) }}</text> -->
                {{ desensitizeName(item.senderName, item.userType) }}
              </view>
              <image v-if="isImageLink(item.content)" :src="item.content" w-100rpx h100rpx rd-8rpx mt16rpx
                cursor-pointer @click="imagePreview(0, [item.content])" />
              <view v-else class="list-box is-me">{{ item.content }}</view>
            </view>
            <uv-avatar :src="item.avatar" size="72rpx" ml14rpx></uv-avatar>
          </view>
          <view v-else flex>
            <uv-avatar :src="item.avatar" size="72rpx" mr14rpx></uv-avatar>
            <view>
              <view flex items-center text="#676767">
                <view v-if="item.userType === 5 || item.userType === 1" text="28rpx white" bg="#0B68F6"
                  class="flex-center font-500 w80rpx h44rpx rd-8rpx mr14rpx">
                  {{ item.userType === 5 ? '老师' : '助教' }}
                </view>
                {{ desensitizeName(item.senderName, item.userType) }}
                <!-- <text ml10rpx text-20rpx>{{ tool.formatTime(item.senderAt) }}</text> -->
              </view>
              <image v-if="isImageLink(item.content)" :src="item.content" w-100rpx h100rpx rd-8rpx mt16rpx
                cursor-pointer @click="imagePreview(0, [item.content])" />
              <view v-else :class="[msgStyle(item.userType)]" class="list-box">{{ item.content }}</view>
            </view>
          </view>
        </template>
      </template>
    </view>
  </view>
  <!-- 聊天输入操作栏 -->
  <my-im-editor ref="imEditorRef" type="live" :liveInfo="liveInfo" @notice="noticeOpen = !noticeOpen"></my-im-editor>
  <!-- 商品弹出 -->
  <my-live-product ref="liveProductRef"></my-live-product>
  <!-- 抽奖 -->
  <my-prize-draw ref="prizeDrawRef"></my-prize-draw>
  <!-- 优惠券列表抽屉 -->
      <my-coupon-list ref="couponListRef" :isPc="false"></my-coupon-list>
  <!-- 积分获得 -->
  <my-get-points ref="getPointsRef"></my-get-points>
  <!-- 公告 -->
  <uv-modal ref="modalRef">
    <view>
      <view text-center text-28rpx font-500 mb24rpx>公告</view>
      <view text="#909193 28rpx" style="word-break: break-word">
        {{ noticeContent || '暂无公告' }}</view>
    </view>
  </uv-modal>
</template>
<style lang="scss" scoped>
.list-box {
  background: #FFFFFF;
  border-radius: 0rpx 12rpx 12rpx 12rpx;
  padding: 12rpx 18rpx 12rpx 14rpx;
  max-width: 526rpx;
  font-size: 28rpx;
  line-height: 39rpx;
  text-align: left;
  margin-top: 16rpx;
  word-break: break-all;
  width: fit-content;
  color: #333333;

  &.is-me {
    border-radius: 12rpx 0rpx 12rpx 12rpx;
  }
}

.streamerMsg {
  background: #FFF0F0;
  color: #DC3939;
}

.teachingAssistant {
  background: #FFF0F0;
  color: #DC3939;
}
</style>
