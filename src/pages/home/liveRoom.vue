<script setup lang='ts'>
import { getLiveInfo, getLiveCouponInfo } from "@/api/live";
import { getMessageHistory } from '@/api/message'
import { getLiveUserAllowView } from '@/api/other'
import { LiveTypeEnum, MqttMessageStatusEnum, LiveStatusEnum } from '@/utils/enum'
import TripleScreen from './components/TripleScreen.vue'
import PureVideo from './components/PureVideo.vue'
import {
  connectMqtt,
  onMessage,
  disconnect,
} from '@/utils/mqtt';
const { getUser } = useAuth()
const liveType = ref()
const liveInfo: any = ref({})
const showCouponBtn = ref(false)

function fetchCouponStatus(liveId: string) {
  getLiveCouponInfo({ liveId }).then((res: any) => {
    showCouponBtn.value = res.data === true
  })
}
const tripleScreenRef = ref()
const pureVideoRef = ref()

const { fetchSettingInfo } = useSetting()
const { setCameraStatus, setInputPassword } = useCamera()
const { generateRandomString } = useTool()

// 标记MQTT是否已初始化
let mqttInitialized = false

onMounted(async () => {

  // 禁止页面拖动（小程序webview中的H5），但允许可滚动区域内部滚动
  let startY = 0
  document.body.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY
  }, { passive: true })

  document.body.addEventListener('touchmove', (e) => {
    let target = e.target as HTMLElement
    // 向上查找可滚动容器
    let scrollableEl: HTMLElement | null = null
    while (target && target !== document.body) {
      const style = window.getComputedStyle(target)
      const overflowY = style.overflowY
      if (overflowY === 'auto' || overflowY === 'scroll' ||
          target.tagName === 'SCROLL-VIEW' ||
          target.classList.contains('uni-scroll-view')) {
        scrollableEl = target
        break
      }
      target = target.parentElement as HTMLElement
    }

    // 不在可滚动区域内，直接阻止
    if (!scrollableEl) {
      e.preventDefault()
      return
    }

    // 在可滚动区域内，检查是否到达边界
    const currentY = e.touches[0].pageY
    const deltaY = currentY - startY
    const { scrollTop, scrollHeight, clientHeight } = scrollableEl

    // 到达顶部还想往下拉，或到达底部还想往上拉，阻止
    if ((scrollTop <= 0 && deltaY > 0) || 
        (scrollTop + clientHeight >= scrollHeight && deltaY < 0)) {
      e.preventDefault()
    }
  }, { passive: false })

  const check = await getLiveUserAllowView()
  if (!check?.data)
    return uni.redirectTo({
      url: '/pages/401'
    });
  getLiveDetail()

  // 只初始化一次MQTT连接
  if (!mqttInitialized) {
    disconnect();
    try {
      const { unionId, userId, liveId, liveRoomNo } = getUser()
      const clientId = `${liveId},${userId},3,${generateRandomString()}`
      const mqttTopic = `chat/${liveId}`
      console.log('[LiveRoom MQTT] init start', {
        clientId,
        liveId,
        userId,
        topic: mqttTopic
      })
      const mqttClient = await connectMqtt({
        clientId,
        liveId,
        userId,
        topic: mqttTopic
      });
      console.log('[LiveRoom MQTT] connect resolved', {
        connected: mqttClient?.connected === true,
        topic: mqttTopic
      })

      mqttInitialized = true

      onMessage((topic: string, message: any) => {
        const rawMessage = message?.toString?.() || String(message || '')
        if (rawMessage === 'heartbeat') {
          return; // 忽略心跳消息
        }
        // message 通常是 Buffer 或 Uint8Array
        let msgObj: any
        try {
          msgObj = JSON.parse(rawMessage);
        } catch (error: any) {
          console.error('[LiveRoom MQTT] parse message failed', {
            topic,
            rawMessage,
            error: error?.message || error
          })
          return
        }
        console.log('[LiveRoom MQTT] parsed message', {
          topic,
          type: msgObj?.type,
          id: msgObj?.id,
          range: msgObj?.range,
          senderId: msgObj?.senderId,
          senderName: msgObj?.senderName,
          content: msgObj?.content
        })
        if (msgObj.type === MqttMessageStatusEnum.KickedOut) {
          if (getUser()?.userId == JSON.parse(msgObj.content || '{}')?.userId) {
            // 处理踢出直播间消息
            uni.redirectTo({
              url: '/pages/home/error'
            });
          }
          return
        }
        if (msgObj.type === MqttMessageStatusEnum.TeacherCameraStatus) {
          // 处理老师摄像头状态消息
          setCameraStatus(msgObj.content == '1' ? 'open' : 'close')
          return
        }
        if (msgObj.type === MqttMessageStatusEnum.ConfigUpdate) {
          // 配置更新
          fetchSettingInfo()
          return
        }

        if (msgObj.type === MqttMessageStatusEnum.LiveSwitch) {
          // 直播开关
          if (msgObj.content === '0') {
            liveInfo.value.liveState = LiveStatusEnum.Ended
          } else {
            getLiveDetail()
          }
          return
        }

        if (msgObj.type === MqttMessageStatusEnum.Reconnect) {
          setTimeout(() => {
            // 重新拉流
            getLiveDetail()
          }, 1000);
          return
        }

        if (liveType.value === LiveTypeEnum.ThreeSplit) {
          tripleScreenRef.value?.addMessage(msgObj);
        } else {
          pureVideoRef.value?.addMessage(msgObj);
        }
      });

    } catch (e) {
      console.error('MQTT init error:', e);
    }
  }
  fetchSettingInfo()
});
// 查直播详情
const playbackListRef = ref()
function getLiveDetail() {
  getLiveInfo().then((res: any) => {
    // const { isEnableReplayPassword } = res.data
    // if (!isEnableReplayPassword) {
    //   setInputPassword(true)
    // }
    liveInfo.value = { ...res.data || {}, liveState: res.data?.isReplay ? LiveStatusEnum.Playback : Number(res.data?.liveState) }
    liveType.value = Number(res.data?.viewingTemplate)
    // 获取直播ID后立即查询优惠券状态
    if (res.data?.id) fetchCouponStatus(res.data.id)
    const liveName = liveInfo.value.liveName
    if (liveName) {
      uni.setNavigationBarTitle({title:liveName})
    }
    if (res.data?.isReplay && !liveInfo.value?.isEnableReplayPassword) {
      // 回放并且无密码
      playbackListRef.value.open(true)
    }
    // liveType.value = 1
    getMessageHistory({ roomId: res.data?.id, joinDate: Date.now(), pageSize: 50 }).then((res: any) => {
      if (liveType.value === LiveTypeEnum.ThreeSplit) {
        tripleScreenRef.value?.setHistory(res.data);
      } else {
        pureVideoRef.value?.setHistory(res.data);
      }
    })
  })
}

onBeforeUnmount(() => {
  console.log('Disconnecting MQTT...');
  mqttInitialized = false; // 重置状态
  disconnect();
});

</script>

<template>
  <view v-if="liveType">
    <TripleScreen ref="tripleScreenRef" :liveInfo="liveInfo" :showCouponBtn="showCouponBtn" @refreshCoupon="fetchCouponStatus(liveInfo.id)" v-if="liveType === LiveTypeEnum.ThreeSplit" />
    <PureVideo ref="pureVideoRef" :liveInfo="liveInfo" :showCouponBtn="showCouponBtn" @refreshCoupon="fetchCouponStatus(liveInfo.id)" v-else />
  </view>
  <!-- 回放列表 -->
  <my-playback-list ref="playbackListRef"></my-playback-list>

</template>

