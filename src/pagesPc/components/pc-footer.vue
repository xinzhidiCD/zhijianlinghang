<script setup lang='ts'>
import { LiveStatusEnum } from '@/utils/enum'
import { storeToRefs } from 'pinia'
const props = defineProps<{
  type?: string,
  liveStatus?: number
  liveInfo?: any
}>()
const emit = defineEmits(['showProductDetail'])
const { logout } = useAuth()
const menuList = ref([
  { icon: '/static/images/pc/home/menu1.png', name: '购物车' },
  { icon: '/static/images/pc/home/menu2.png', name: '礼物' },
  { icon: '/static/images/pc/home/menu3.png', name: '优惠券' },
  { icon: '/static/images/pc/home/menu4.png', name: '个人中心' },
  { icon: '/static/images/pc/home/menu5.png', name: '分享' },
  { icon: '/static/images/pc/home/menu6.png', name: '我的积分' },
  { icon: '/static/images/pc/home/menu7.png', name: '我的抽奖' },
])
watch(() => props.liveStatus, (newVal) => {
  if (newVal === LiveStatusEnum.Playback) {
    if (!menuList.value.find(i => i.name === '回放列表')) {
      menuList.value = [...menuList.value, { icon: '/static/images/pc/home/menu8.png', name: '回放列表' }]
    }
  } else {
    menuList.value = menuList.value.filter(i => i.name !== '回放列表')
  }
}, { immediate: true })

const camera = useCamera() // 使用 Pinia store 来管理音量
const { getUser } = useAuth()
const volumeNum = ref(camera.volume)

// 监听 camera.volume 的变化，保持同步
watch(() => camera.volume, (newVal) => {
  volumeNum.value = newVal
}, { immediate: true })

// 音量变化处理函数
const handleVolumeChange = (val: number) => {
  camera.setVolume(val)
}
const giftRef = ref()
const productListRef = ref()
const playbackListRef = ref()

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
// 菜单操作
function handleMenu(obj: any) {
  switch (obj.name) {
    case '购物车':
      productListRef.value.open()
      break
    case '礼物':
      giftRef.value.open()
      break
    case '优惠券':
      uni.redirectTo({
        url: '/pagesPc/mine/coupon'
      })
      break
    case '个人中心':
      uni.redirectTo({
        url: '/pagesPc/mine/index'
      })
      break
    case '分享':
      uni.setClipboardData({
        data: `${location.origin}/pagesPc/login/login?liveId=${props.liveInfo?.id || ''}&visitorId=${getUser()?.userId || ''}`,
        success() {
          uni.showToast({ title: '链接已复制', icon: 'success' })
        }
      })

      break
    case '我的积分':
      uni.redirectTo({
        url: '/pagesPc/mine/points'
      })
      break
    case '我的抽奖':
      uni.redirectTo({
        url: '/pagesPc/mine/award'
      })
      break
    case '回放列表':
      playbackListRef.value.open()
      break
    default:
      break
  }
}
function toMine() {
  uni.redirectTo({
    url: '/pagesPc/mine/index'
  })
}

const user = useUser()
const { userInfo } = storeToRefs(user)
const { fetchUserInfo } = user
const setting = useSetting()
const { settingInfo } = storeToRefs(setting)

onMounted(() => {
  fetchUserInfo()
})

function addGiftMessage(msgObj: any) {
  giftRef.value?.showSpecial(msgObj.content)
}
defineExpose({
  addGiftMessage
})

</script>

<template>
  <div h72px border-t="1px solid #E5E6EB" pl26px pr28px flex-between relative min-w1300px>
    <div v-if="type === 'live' && props.liveStatus !== LiveStatusEnum.Ended" flex-between gap-20px absolute left-56px
      pl110px style="min-width:calc(100% - 530px)">
      <!-- 音量 -->
      <div v-if="liveStatus === LiveStatusEnum.Live" ml16px>
        <div flex items-center cursor-pointer>
          <img src="/static/images/pc/home/volume.png" w24px h24px>
          <uv-slider class="custom-slider" v-model="volumeNum" min="0" max="100" block-size="14" activeColor="#2d2d2d"
            show-value w130px @input="handleVolumeChange(volumeNum)"
            @change="handleVolumeChange(volumeNum)"></uv-slider>
        </div>
      </div>
      <div v-else w80px></div>
      <!-- 操作栏 -->
      <div flex items-center gap-24px ml="-55px">
        <template v-for="c, k in menuList" :key="k">
          <div v-if="(k === 1 && !settingInfo?.liveConfig?.isActiveteTippingEnabled)
            || (k === 0 && settingInfo?.liveConfig?.isYellowCarEnabled) || k > 1" cursor-pointer flex-col-center w56px
            @click="handleMenu(c)">
            <img :src="c.icon" w24px h24px mb4px>
            <div text-14px>{{ c.name }}</div>
          </div>
        </template>
      </div>
      <!-- 退出 -->
      <div v-if="liveStatus !== LiveStatusEnum.NotStarted" cursor-pointer bg="#DF4F48" w159px h53px flex-center rd-4px
        @click="logout()">
        <img src="/static/images/pc/home/exit.png" w24px h24px mr8px>
        <div text="20px white" font-500>退出直播</div>
      </div>
      <div v-else w159px></div>
    </div>

    <div flex items-center>
      <img src="/static/images/logo.png" w30px h30px mr8px>
      <div text-26px font-bold>领航通直播</div>
    </div>
    <div flex items-center cursor-pointer @click="toMine">
      <uv-avatar :src="userInfo?.avatar" size="32px"></uv-avatar>
      <div ml12px mr8px text-16px>{{ userInfo?.nickName }}</div>
      <img src="/static/images/pc/common/right.png" w16px h16px>
    </div>
  </div>
  <!-- 回放列表 -->
  <my-playback-list ref="playbackListRef" type="pc"></my-playback-list>
  <!-- 礼物 -->
  <my-gift :liveId="liveInfo?.id" ref="giftRef" type="pc"></my-gift>
  <!-- 直播间商品列表 -->
  <my-live-product-list ref="productListRef" type="pc" :roomId="liveInfo?.id"
    @select="emit('showProductDetail', $event)"></my-live-product-list>
</template>
<style lang="scss">
.custom-slider {
  uni-slider {
    margin: 0 12px;
  }
}
</style>
