<script lang="ts" setup>
import { getLastLiveNotice } from '@/api/setting'
import { LiveStatusEnum, LiveTypeEnum } from '@/utils/enum'
import { MqttMessageStatusEnum } from '@/utils/enum'
import { formatTime } from '@/utils/common'
import { storeToRefs } from 'pinia'
import { isImageLink, imagePreview, desensitizeName } from '@/utils/common'
import { getMessageHistory } from '@/api/message'
const props = defineProps<{
  liveInfo: any;
  showCouponBtn?: boolean;
}>()
const emit = defineEmits(['refreshCoupon'])

const liveStatus = computed(() => {
  return props.liveInfo?.liveState || LiveStatusEnum.NotStarted
})
const liveType = computed(() => {
  return props.liveInfo?.viewingTemplate
})

const modalRef = ref()
const { getUser } = useAuth()
const liveProductRef = ref()
const prizeDrawRef = ref()
const couponRef = ref()

const imList: any = ref([])
const imListRef = ref()
const couponObj: any = ref({})
const prizeCountDown = ref()
const noticeContent = ref('')
const imEditorRef = ref()
const getPointsRef = ref()
const bulletChatRef = ref()
const isLoadingHistory = ref(false)
const hasMoreHistory = ref(true)
const isInitialized = ref(false) // 标记是否已初始化
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
    console.log('[ChatList] append message', {
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
    // 优惠券倒计时消息，type=6 通知父组件刷新优惠券状态
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
    nextTick(() => {
      liveProductRef.value.productOpen(msgObj.content)
    })
  } else if (msgObj.type === MqttMessageStatusEnum.Buying) {
    const obj = JSON.parse(msgObj.content || '{}');
    // 正在购买商品
    bulletChatRef.value.addBarrage(obj.maskedNickName, settingInfo.value?.liveConfig?.promptText || '正在购买')
  } else if (msgObj.type === MqttMessageStatusEnum.Announcement) {
    // 公告
    noticeContent.value = msgObj.content
    modalRef.value.open()
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
      console.warn('[ChatList] hidden message payload is not id array', msgObj)
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
      console.warn('[ChatList] enable message payload is not id array', msgObj)
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
  imList.value.unshift(...history)
  nextTick(() => scrollToBottom())
}

// 处理滚动事件，滚动到顶部时加载历史消息
function handleScroll(e: any) {
  if (!isInitialized.value) return

  if (isLoadingHistory.value || !hasMoreHistory.value) return

  const scrollTopValue = e.detail.scrollTop

  // 判断是否向上滚动到顶部
  const isNearTop = scrollTopValue <= 100
  const isMovingUp = scrollTopValue < lastScrollTop

  lastScrollTop = scrollTopValue

  // 只有向上滚动且在顶部附近才处理
  if (!isNearTop || !isMovingUp) {
    return
  }

  // 清除之前的定时器
  if (scrollEndTimer) {
    clearTimeout(scrollEndTimer)
  }

  // 滚动结束后触发加载（防抖）
  scrollEndTimer = setTimeout(() => {
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

    // 保存当前滚动位置
    const oldScrollTop = lastScrollTop

    // 获取scroll-view的内部容器来计算高度
    let scrollViewContainer = imListRef.value
    if (scrollViewContainer && (scrollViewContainer as any).$el) {
      scrollViewContainer = (scrollViewContainer as any).$el
    }
    // 获取scroll-view内部的实际内容容器
    const contentContainer = scrollViewContainer?.querySelector('.uni-scroll-view') || scrollViewContainer
    const oldScrollHeight = contentContainer?.scrollHeight || 0

    // 调用API获取历史消息
    const res = await getMessageHistory({
      roomId: getUser()?.liveId,
      joinDate: joinDate,
      pageSize: 50
    })

    if (res.data && res.data.length > 0) {
      // 将历史消息添加到列表开头
      imList.value.unshift(...res.data)

      // 等待DOM更新后恢复滚动位置
      nextTick(() => {
        // 使用 requestAnimationFrame 确保渲染完成
        requestAnimationFrame(() => {
          const newScrollHeight = contentContainer?.scrollHeight || 0
          const heightDiff = newScrollHeight - oldScrollHeight
          const newScrollTop = oldScrollTop + heightDiff

          console.log('加载历史消息', { oldScrollHeight, newScrollHeight, heightDiff, oldScrollTop, newScrollTop })

          // 设置新的滚动位置
          scrollTop.value = newScrollTop

          // 更新 lastScrollTop 避免触发滚动事件
          lastScrollTop = newScrollTop
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

const scrollTop = ref(0)
const scrollIntoView = ref('')

function scrollToBottom() {
  nextTick(() => {
    setTimeout(() => {
      // 使用一个足够大的值来滚动到底部
      scrollTop.value = 999999
      // 标记初始化完成
      setTimeout(() => {
        isInitialized.value = true
      }, 200)
    }, 50);
  });

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


</script>

<template>
  <view flex flex-col flex-1>
    <view flex justify-between pl24rpx pointer-events-auto>
      <!-- 优惠券/抽奖 -->
      <view flex gap-24rpx>
        <view v-if="prizeCountDown > 0" flex-col-center @click="prizeDrawRef.open(liveInfo.id)">
          <view w78rpx h78rpx flex-center>
            <image src="/static/images/h5/home/gift.png" w54rpx h54rpx />
          </view>
          <view class="bg-black-box w70rpx h26rpx text-20rpx">
            {{ formatTime(prizeCountDown) }}
          </view>
        </view>
        <view
          v-if="showCouponBtn"
          flex-col-center relative @click="handleCoupon">
          <image src="/static/images/h5/home/money.png" w78rpx h78rpx />
          <view class="bg-black-box mt4rpx w70rpx h26rpx text-20rpx text-white text-center">优惠券</view>
        </view>
      </view>
      <view @click="modalRef.open()" class="bg-black-box w116rpx h48rpx" border-rd="[48rpx_0_0_48rpx]">
        <image src="/static/images/h5/home/notice.png" class="w32rpx h30rpx mr4rpx ">
        </image> 公告
      </view>
    </view>
    <!-- im列表及购买消息 -->
    <view flex-1 flex flex-col justify-end>
      <!-- 类弹幕滚动效果 -->
      <my-bullet-chat ref="bulletChatRef"
        :class="[LiveTypeEnum.PureVideo === liveType ? 'top-38vh' : 'bottom-40vh']"></my-bullet-chat>
      <!-- 消息列表 -->
      <scroll-view ref="imListRef"
        :class="[(LiveTypeEnum.PureVideo !== liveType || liveStatus === LiveStatusEnum.NotStarted) ? 'max-h20.5vh pb40rpx' : 'max-h38vh pb-220rpx']"
        class="px24rpx pointer-events-auto" scroll-y :scroll-top="scrollTop" @scroll="handleScroll">
        <!-- 0全部人可见1仅自己可见2仅他人可见 -->
        <view flex flex-col gap-16rpx mr50rpx>
          <template v-for="c, k in imList" :key="k">
            <template v-if="c.range === 0 ||
              (c.range === 1 && c.senderId === getUser()?.userId) ||
              (c.range === 2 && c.senderId !== getUser()?.userId)">
              <view class="text-24rpx w-fit px24rpx py10rpx !rd-29rpx !items-start"
                    :class="[LiveTypeEnum.PureVideo === liveType ? 'bg-black-box !bg-op-30 text-white' : 'bg-white text-#333']">
                <view flex items-start>
                  <text :class="[LiveTypeEnum.PureVideo === liveType ? 'text-op-50 text-white' : 'text-#999']">{{ desensitizeName(c.senderName, c.userType) }}：</text>
                  <image v-if="isImageLink(c.content)" :src="c.content" w60rpx h60rpx rd-8rpx cursor-pointer
                    @click.stop="imagePreview(0, [c.content])" />
                  <view v-else flex-1 break-all>{{ c.content }}</view>
                </view>
              </view>
            </template>
          </template>
        </view>
      </scroll-view>
    </view>
    <!-- 聊天输入操作栏 -->
    <view pointer-events-auto>
      <my-im-editor :type="LiveTypeEnum.PureVideo === liveType ? 'video' : 'live'" ref="imEditorRef" :liveInfo="liveInfo" @notice="modalRef.open()"></my-im-editor>
    </view>
  </view>
  <view pointer-events-auto>
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
  </view>
</template>
