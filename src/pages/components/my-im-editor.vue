<script lang="ts" setup>
import { LiveStatusEnum } from '@/utils/enum'
import { sendMessage } from '@/api/message'
import { storeToRefs } from 'pinia'
import wx from "weixin-js-sdk";

const props = defineProps<{
  liveInfo?: any,
  type?: 'video' | 'live' // live三分屏 video纯视频/ppt3分屏
}>()

const liveStatus = computed(() => {
  return props.liveInfo?.liveState
})

const emit = defineEmits(['notice'])
const popUpRef = ref()
const playList = ref([
  { icon: '/static/images/h5/home/menu1.png', text: '分享' },
  { icon: '/static/images/h5/home/menu2.png', text: '公告' },
  { icon: '/static/images/h5/home/menu3.png', text: '礼物' },
  { icon: '/static/images/h5/home/menu4.png', text: '我的奖品' },
  { icon: '/static/images/h5/home/menu5.png', text: '我的优惠券' },
  { icon: '/static/images/h5/home/menu6.png', text: '我的积分' },
  { icon: '/static/images/h5/home/menu7.png', text: '个人中心' }
])
if (liveStatus.value === LiveStatusEnum.Playback) {
  playList.value = [...playList.value, { icon: '/static/images/h5/home/menu8.png', text: '回放列表' },]
}
const liveShare = ref()
const giftRef = ref()
const productListRef = ref()
const playbackRef = ref()

// 监听全局事件：从优惠券领取成功弹窗唤起购物车弹窗
function handleOpenCartPopup() {
  productListRef.value?.open()
}
onMounted(() => {
  uni.$on('open-cart-popup', handleOpenCartPopup)
})
onUnmounted(() => {
  uni.$off('open-cart-popup', handleOpenCartPopup)
})

// 新增状态
const isInputMode = ref(false)
const inputValue = ref('')
const inputFocus = ref(false)
const emojiPopupRef = ref()
const isEmojiOpen = ref(false) // 标记表情选择器是否打开
const inputTopPosition = ref('auto') // 输入框顶部位置

// 处理视口变化（用于H5环境监听键盘高度）
const handleViewportResize = () => {
  if (typeof window !== 'undefined' && window.visualViewport && isInputMode.value) {
    // 计算可视区域底部位置
    const viewportBottom = window.visualViewport.offsetTop + window.visualViewport.height
    // 输入框实际高度约 50px，让其紧贴可视区域底部（键盘上方）
    inputTopPosition.value = (viewportBottom - 50) + 'px'
  }
}

onMounted(() => {
  if(uni.getStorageSync("type")) {
    setTimeout(()=>{
      playList.value = playList.value.filter(v=> v.text != '分享')
    },1000)
  }

  // H5环境：使用 visualViewport API 监听键盘高度
  if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize)
    window.visualViewport.addEventListener('scroll', handleViewportResize)
  }
})

onUnmounted(() => {
  // 取消监听
  if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize)
    window.visualViewport.removeEventListener('scroll', handleViewportResize)
  }
})

function handleClick(item: any) {
  popUpRef.value.close()
  switch (item.text) {
    case '分享':
      return liveShare.value.open()
    case '公告':
      return emit('notice')
    case '礼物':
      return giftRef.value?.open()
    case '我的奖品':
      return uni.$goToPage('/pages/mine/award')
    case '我的优惠券':
      return uni.$goToPage('/pages/mine/coupon')
    case '回放列表':
      return playbackRef.value.open()
    case '我的积分':
      return uni.$goToPage('/pages/mine/points')
    case '个人中心':
      if (uni.getStorageSync('type')) {
        wx.miniProgram.switchTab({ url: '/pages/mine/index' });
      } else {
        uni.$goToPage('/pages/mine/index')
      }
      return
    default:
      return
  }
}

// 点击输入区域，切换到输入模式
const switchToInputMode = () => {
  if (settingInfo.value?.liveConfig?.isGlobalMuteEnabled) {
    return;
  }
  isInputMode.value = true
  inputFocus.value = true
  isEmojiOpen.value = false
  emojiPopupRef.value?.close()
}

// 失去焦点时退出输入模式
const onInputBlur = () => {
  inputFocus.value = false
  setTimeout(() => {
    if (!inputFocus.value && !isEmojiOpen.value) {
      exitInputMode()
    }
  }, 100)
}

// 获得焦点
const onInputFocus = () => {
  inputFocus.value = true
  // iOS中防止页面被顶起，强制滚动到顶部
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.scrollTo(0, 0)
      // 重新计算输入框位置
      handleViewportResize()
    }, 100)
  }
}

// 退出输入模式
const exitInputMode = () => {
  isInputMode.value = false
  isEmojiOpen.value = false
  emojiPopupRef.value?.close()
  inputValue.value = ''
  inputTopPosition.value = 'auto'
}

// 切换表情显示
const toggleEmoji = () => {
  if (emojiPopupRef.value) {
    isEmojiOpen.value = true
    emojiPopupRef.value.open()
    // 不要立即失去焦点，让用户可以继续输入
    // inputFocus.value = false
  }
}

// 选择表情
const onEmojiSelect = (emoji: any) => {
  console.log('选择的表情:', emoji.char, emoji.name)
  // 如果不是输入模式，直接发送表情
  if (!isInputMode.value) {
    sendMessage({ message: emoji.char }).then(() => {})
    isEmojiOpen.value = false
    emojiPopupRef.value?.close()
    return
  }
  // 输入模式下，插入表情到输入框
  inputValue.value += emoji.char
  isEmojiOpen.value = false
  emojiPopupRef.value?.close()
  inputFocus.value = true
}

// 默认模式下点击表情图标，直接打开表情弹框
const openEmojiInDefaultMode = () => {
  if (settingInfo.value?.liveConfig?.isGlobalMuteEnabled) {
    return
  }
  isEmojiOpen.value = true
  emojiPopupRef.value?.open()
}
function emojiChange(e: any) {
  isEmojiOpen.value = e.show
  if (e.show === false) {
    if (isInputMode) {
      inputFocus.value = true
    }
  }
}

// 发送消息
function handleBounceSend() {
  uni.$uv.throttle(handleSend, 500)
}
const handleSend = () => {
  if (!inputValue.value.trim()) return
  if (inputValue.value.trim() === '') {
    uni.showToast({
      title: '请输入消息内容',
      icon: 'none'
    });
    return;
  }
  sendMessage({ message: inputValue.value }).then((res) => {
    inputValue.value = '';
  })
  exitInputMode()
}

function addGiftMessage(obj: any) {
  giftRef.value?.showSpecial(obj)
}

function openProductList() {
  productListRef.value?.open()
}

defineExpose({
  addGiftMessage,
  openProductList,
})

const setting = useSetting()
const { settingInfo } = storeToRefs(setting)


</script>

<template>
  <!-- 表情选择器遮罩 -->
  <uv-popup ref="emojiPopupRef" mode="bottom" round="24rpx" bgColor="tranparent" @change="emojiChange">
    <my-emoji @select="onEmojiSelect" :theme="type === 'video' ? 'dark' : 'light'"></my-emoji>
  </uv-popup>

  <!-- 输入模式 - 使用fixed定位，动态top跟随可视区域 -->
  <view v-if="isInputMode" class="input-mode-container" px24rpx flex items-end gap-16rpx
        :style="{ top: inputTopPosition, bottom: 'auto' }">
    <!-- 输入框 -->
    <view flex-1 overflow-auto relative rd-16rpx min-h-76rpx flex-between p16rpx
          :class="[type === 'video' ? 'bg-black bg-op-30 text-white' : 'bg-white']">
      <textarea v-model="inputValue" placeholder="说点什么..." placeholder-style="color: #BFBFBF; font-size: 28rpx;"
                class="flex-1 text-28rpx" :focus="inputFocus" :maxlength="80" :auto-height="true" :show-confirm-bar="false"
                :cursor-spacing="0" :adjust-position="false" @focus="onInputFocus" @blur="onInputBlur" />
      <image :src="type === 'video' ? '/static/images/h5/home/emoji_white.png' : '/static/images/h5/home/emoji.png'"
             class="w-48rpx h-48rpx ml16rpx" @click.stop="toggleEmoji" />
    </view>

    <!-- 发送按钮 -->
    <view class="send-btn w80rpx h76rpx rd-8rpx flex-center text-28rpx mb0rpx"
          :class="inputValue.trim() ? 'bg-#007AFF text-white' : type === 'video' ? 'bg-black bg-op-30 text-white' : 'bg-#fff text-#333'"
          @click="handleBounceSend">
      发送
    </view>
  </view>
  <!-- 输入模式时的占位元素 -->
  <view v-if="isInputMode" class="input-placeholder"></view>

  <!-- 默认模式 -->
  <view v-else class="default-mode-container" :class="{ 'live-mode': type === 'live' }" px24rpx flex items-center h76rpx gap-16rpx>
    <view flex-1 rd-16rpx h76rpx flex-between px16rpx :class="[type === 'live' ? 'bg-white' : 'bg-black bg-op-30']">
      <text text="#BFBFBF 28rpx" flex-1 @click="switchToInputMode">{{ settingInfo?.liveConfig?.isGlobalMuteEnabled ? '管理员已开启全体禁言' : '说点什么...' }} </text>
      <image :src="type === 'video' ? '/static/images/h5/home/emoji_white.png' : '/static/images/h5/home/emoji.png'"
             class="w-48rpx h-48rpx" @click.stop="openEmojiInDefaultMode" />
    </view>

    <image :src="type === 'video' ? '/static/images/h5/home/more-white.png' : '/static/images/h5/home/more.png'" w76rpx
           h76rpx @click="popUpRef.open()" />
    <image v-if="settingInfo?.liveConfig?.isYellowCarEnabled"
           :src="type === 'video' ? '/static/images/h5/home/cart-white.png' : '/static/images/h5/home/cart.png'" w76rpx
           h76rpx @click="productListRef.open()" />
    <pc-thumb w76rpx h76rpx rd-full relative :class="[type === 'live' ? 'bg-white' : 'bg-black bg-op-30']"></pc-thumb>
  </view>

  <!-- 其他组件保持不变 -->
  <uv-popup ref="popUpRef" mode="bottom" round="24rpx">
    <view wfull h428rpx>
      <view border-b="2rpx solid #F6F6F6" h104rpx flex-between pl28rpx pr34rpx>
        <view text-28rpx font-500>更多</view>
        <image src="/static/images/h5/common/close-gray.png" w32rpx h32rpx @click="popUpRef.close()" />
      </view>
      <view px30rpx pt30rpx grid grid-cols-4 gap-row-28rpx>
        <template v-for="(item, index) in playList" :key="index">
          <view flex-col-center @click="handleClick(item)">
            <image :src="item.icon" w68rpx h68rpx />
            <view text="#909193 28rpx" mt8rpx>{{ item.text }}</view>
          </view>
        </template>
      </view>
    </view>
  </uv-popup>

  <!-- 分享 -->
  <my-share ref="liveShare"></my-share>
  <!-- 礼物 -->
  <my-gift :liveId="liveInfo.id" ref="giftRef" :type="type"></my-gift>
  <!-- 直播间商品列表 -->
  <my-live-product-list ref="productListRef" :roomId="props.liveInfo?.id"></my-live-product-list>
  <!-- 回放列表 -->
  <my-playback-list ref="playbackRef"></my-playback-list>
</template>

<style scoped lang="scss">
.send-btn {
  transition: background-color 0.2s;
  cursor: pointer;
  flex-shrink: 0;
}

.input-mode-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.3));
  padding-top: 12rpx;
  // 底部安全距离适配
  padding-bottom: calc(12rpx + constant(safe-area-inset-bottom)); // 兼容iOS < 11.2
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom)); // iOS >= 11.2
}

.input-placeholder {
  height: 100rpx;
}

.default-mode-container {
  margin-top: 6rpx;
  margin-bottom: 50rpx;
  // 底部安全距离适配
  padding-bottom: constant(safe-area-inset-bottom); // 兼容iOS < 11.2
  padding-bottom: env(safe-area-inset-bottom); // iOS >= 11.2

  &.live-mode {
    background: #F7F7F7;
    margin-top: 0;
    padding-top: 12rpx;
    margin-bottom: 0;
    padding-bottom: calc(50rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(50rpx + env(safe-area-inset-bottom));
  }
}

</style>
