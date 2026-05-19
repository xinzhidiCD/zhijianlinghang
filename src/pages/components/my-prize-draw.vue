<script lang="ts" setup>
import {
  prozeAddUser,
  prozeGetRoomDraw,
  getBatchWinnerList,
  getUserWinnerList
} from '@/api/live'
defineProps<{
  type?: string
}>()
const popUpRef = ref()

const roomObj: any = ref({})
const liveId = ref('')
const isChecked = ref(false) // 是否已参与抽奖
function open(roomId: string) {
  liveId.value = roomId
  popUpType.value = 0 // 设置为参与抽奖
  prozeGetRoomDraw({ roomId }).then(res => {
    roomObj.value = res.data || {}
    popUpRef.value.open()
    getUserWinnerList({ drawBatchId: res.data?.drawBatchId }).then(obj => {
      isChecked.value = (obj.rows || []).some((x: { userId: string }) => x.userId === getUser()?.userId)
    })
  })

}
const popUpType = ref(0) // 0 参与 1: 抽奖倒计时, 2: 中奖, 3: 未中奖, 4: 幸运榜单

const { getUser } = useAuth()
function handleJoin() {
  if (isChecked.value) return
  prozeAddUser({
    drawId: roomObj.value?.drawId,
    userId: getUser()?.userId,
    roomId: liveId.value,
    drawBatchId: roomObj.value?.drawBatchId
  }).then(res => {
    if (res.code === 200) {
      uni.$showToast('参与抽奖成功，请勿离开教室，否则抽奖资格失效')
      popUpRef.value.close()
    }
  })

}

const winningList: any = ref([])
const meObj: any = ref({})
function showResult(drawBatchId: string) {
  getBatchWinnerList({ drawBatchId }).then(res => {
    if (res.code === 200) {
      const isJoin = (res.rows || []).some((x: { userId: string }) => x.userId === getUser()?.userId)
      if (isJoin) {
        winningList.value = (res.rows || []).filter((x: { isWinners: number }) => x.isWinners === 2)
        popUpType.value = winningList.value.find((x: { userId: string }) => x.userId === getUser()?.userId) ? 2 : 3
        meObj.value = winningList.value.find((x: { userId: string }) => x.userId === getUser()?.userId) || {}
        setTimeout(() => {
          popUpRef.value.open()
        }, 500)
      }
    }
  })
}

const showCoutDown = ref(3)
function initCountDown(num: number) {
  showCoutDown.value = num
  popUpType.value = 1
  popUpRef.value.open()
}

function close() {
  popUpRef.value.close()
}
defineExpose({ open, close, showResult, initCountDown })
</script>

<template>
  <uv-popup ref="popUpRef" mode="center" bgColor="none" class="pc-custom-popup">
    <view :class="[type === 'pc' && 'mr421px']" pointer-events-auto>
      <!-- 参与抽奖 -->
      <view v-if="popUpType === 0">
        <image src="/static/images/h5/home/join-top.png" w342rpx h224rpx m="l120rpx b-[-112rpx]" />
        <view w560rpx h660rpx rd-48rpx p20rpx style="background: linear-gradient( 180deg, #FFB696 0%, #F8EBD4 100%)">
          <view bg-white rd-32rpx hfull flex-col-center relative z-2>
            <view text="#8F411B 36rpx center" font-600 min-h70px w396rpx pt40rpx line-clamp-2>
              {{ roomObj.drawTitle }}
            </view>
            <image src="/static/images/h5/home/join.png" w208rpx h208rpx mt24rpx mb46rpx />
            <view text="32rpx white" flex-center font-600 w370rpx h88rpx rd-48rpx
              :class="[!isChecked && 'cursor-pointer']"
              :style="{ 'background': isChecked ? '#ccc' : 'linear-gradient( 317deg, #FF5462 0%, #FF961E 100%)' }"
              @click="handleJoin">
              {{ isChecked ? '已参与' : '我要参与' }}
            </view>
            <view text="#9E6D5D 24rpx" mt24rpx>请勿离开，否则抽奖资格失效</view>
          </view>
        </view>
      </view>
      <!-- 抽奖倒计时 -->
      <view v-if="popUpType === 1" w342rpx h346rpx relative>
        <image src="/static/images/h5/home/bell.png" w342rpx h346rpx />
        <view absolute wfull top-160rpx left-0 flex flex-col items-center>
          <view leading-34rpx font-600 mb15rpx>开奖倒计时</view>
          <view text-85rpx leading-80rpx font-bold font-din-bold class="gradient-text">{{ showCoutDown }}</view>
        </view>
      </view>
      <!-- 中奖/未中奖-->
      <view v-if="popUpType === 2 || popUpType === 3" class="relative w506rpx pt-70rpx">
        <image src="/static/images/h5/home/package.png" class="w200rpx h216rpx absolute right-20rpx top-0 z-1" />
        <view class="wfull h396rpx rd-18rpx pop-bg">
          <view p24rpx>
            <view text="32rpx white" font-bold>{{ popUpType === 2 ? '恭喜您获得' : '很遗憾未中奖' }} </view>
            <view rd-12rpx bg-white mt24rpx wfull h280rpx flex-col-center relative z-2>
              <template v-if="popUpType === 2">
                <image :src="meObj.prizeImg" mt24rpx mb34rpx w146rpx h146rpx />
                <view font-500 text-24rpx>恭喜您，抽中{{ meObj.prizeName }}</view>
              </template>
              <template v-else>
                <image src="/static/images/h5/home/error.png" my14rpx w122rpx h122rpx />
                <view font-500 mb18rpx text-24rpx>很遗憾您未中奖下次再来</view>
                <view text="#FF6E00" text-24rpx cursor-pointer bg="#FFE7AB" w336rpx h62rpx rd-full flex-center
                  @click="popUpType = 4">抽奖结果</view>
              </template>
            </view>
          </view>
        </view>
      </view>
      <!-- 幸运榜单 -->
      <view v-if="popUpType === 4" class="w506rpx rd-18rpx h594rpx pop-bg px24rpx">
        <view mx52rpx w354rpx h62rpx flex-center text="#FF6E00 32rpx" font-500 class="pop-title-bg">幸运榜单</view>
        <view mt36rpx rd-12rpx bg-white wfull h472rpx py28rpx flex flex-col text-24rpx>
          <view text="#FF6100" flex pl52rpx pr44rpx>
            <view flex-1 pl10rpx>昵称</view>
            <view flex-1 pr4rpx text-right>奖品名称</view>
          </view>
          <view flex-1 overflow-auto pl52rpx pr44rpx flex flex-col gap-16rpx mt16rpx>
            <view v-for="c, k in winningList" :key="k" flex leading-30rpx>
              <view flex-1 truncate>{{ c.nickName }}</view>
              <view flex-1 ml20rpx truncate text-right>{{ c.prizeName }}</view>
            </view>
          </view>
        </view>
      </view>
      <view v-if="popUpType > 1" flex justify-center mt16rpx>
        <image src="/static/images/h5/home/close-modal.png" cursor-pointer w60rpx h60rpx @click="popUpRef.close()">
        </image>
      </view>
    </view>
  </uv-popup>
</template>
<style lang="scss" scoped>
.gradient-text {
  background: linear-gradient(180deg, #FFB349 0%, #FF8300 100%), #FF5B00;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  /* 兼容性处理 */
  background-clip: text;
  color: transparent;
}

.pop-bg {
  background: linear-gradient(180deg, #FF8A00 0%, #FFC47B 100%)
}

.pop-title-bg {
  background: linear-gradient(180deg, #FFAF51 0%, #FFFCA3 100%);
  border-radius: 0rpx 0rpx 36rpx 36rpx;
}
</style>