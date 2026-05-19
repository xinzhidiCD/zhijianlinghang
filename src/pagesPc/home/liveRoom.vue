<template>
  <div v-if="Object.keys(liveInfo).length" wfull h100vh flex flex-col bg-white>
    <pc-header :liveInfo="liveInfo"></pc-header>
    <div v-if="liveStatus === LiveStatusEnum.Playback && liveInfo?.isEnableReplayPassword && !camera.isInputPassword"
      bg="#2d2d2d" flex-1 mx60px>
    </div>
    <div v-else flex-1 overflow-hidden flex relative>
      <pc-livePlay ref="livePlayRef" v-model:liveType="liveType" :liveStatus="liveStatus" :liveInfo="liveInfo" :showCouponBtn="showCouponBtn" flex-1
        mx56px @showProductDetail="productDetail.open($event)"
        @seeked="onMainSeeked" @play="onMainPlay" @pause="onMainPause"></pc-livePlay>
      <pc-right ref="rightRef" v-if="liveStatus !== LiveStatusEnum.Ended" :liveInfo="liveInfo" :liveType="liveType"
        :liveStatus="liveStatus" w421px hfull
        @seeked="onSubSeeked" @play="onSubPlay" @pause="onSubPause"></pc-right>
    </div>
    <pc-footer ref="footerRef" type="live" :liveInfo="liveInfo" :liveStatus="liveStatus"
      @showProductDetail="productDetail.open($event)"></pc-footer>

    <!-- 回放密码 -->
    <pc-callback ref="callBackRef"></pc-callback>
    <!-- 商品详情 -->
    <pc-product-detail ref="productDetail" @pay="confirmRef.open($event)"></pc-product-detail>
    <!-- 订单确认 -->
    <pc-confirm ref="confirmRef"></pc-confirm>
    <!-- 获得积分 -->
    <my-get-points ref="pointsRef" type="pc"></my-get-points>
    <!-- 回放列表 -->
    <my-playback-list ref="playbackListRef" type="pc"></my-playback-list>
  </div>
  <uv-loading-page v-else :loading="true" loading-text="领航通直播" icon-size="80px" font-size="20px"
    image="/static/images/logo.png"></uv-loading-page>
</template>

<script lang="ts" setup>
import { LiveStatusEnum, MqttMessageStatusEnum } from '@/utils/enum'
import { getLiveUserAllowView } from '@/api/other'
import { getLiveInfo, getLiveCouponInfo } from "@/api/live";
import {
  connectMqtt,
  onMessage,
  disconnect,
} from '@/utils/mqtt';

const { getUser } = useAuth()
const liveInfo: any = ref({})
const liveStatus = ref()
const liveType = ref(0)
const showCouponBtn = ref(false)

function fetchCouponStatus(liveId: string) {
  getLiveCouponInfo({ liveId }).then((res: any) => {
    showCouponBtn.value = res.data === true
  })
}
const callBackRef = ref()
const productDetail = ref()
const confirmRef = ref()
const rightRef = ref()
const livePlayRef = ref()
const footerRef = ref()
const pointsRef = ref()
const { fetchSettingInfo, settingInfo, setSettingInfo } = useSetting()
const camera = useCamera()
const { generateRandomString } = useTool()

// === 回放视频同步相关 ===
let isSyncingSeek = false  // 防止进度循环同步
let isSyncingPause = false // 防止暂停循环同步

// 左侧主播放器进度被拖动时，同步右侧
function onMainSeeked(time: number) {
  if (isSyncingSeek) return
  isSyncingSeek = true
  if (rightRef.value && liveStatus.value === LiveStatusEnum.Playback) {
    setTimeout(() => {
      rightRef.value?.seekTo(time)
    }, 50)
  }
  setTimeout(() => { isSyncingSeek = false }, 300)
}

// 左侧主播放器开始播放时
function onMainPlay(time: number) {
  // 如果右侧正在播放，同步到右侧的进度
  if (rightRef.value?.getIsPlaying?.()) {
    const subTime = rightRef.value.getCurrentTime()
    if (subTime > 0 && Math.abs(subTime - time) > 1) {
      setTimeout(() => {
        livePlayRef.value?.seekTo(subTime)
      }, 50)
    }
  }
  // 同步右侧也播放
  if (liveStatus.value === LiveStatusEnum.Playback && rightRef.value) {
    setTimeout(() => {
      rightRef.value?.play()
    }, 50)
  }
}

// 左侧主播放器暂停时，同步右侧也暂停
function onMainPause(time: number) {
  if (isSyncingPause) return
  isSyncingPause = true
  if (liveStatus.value === LiveStatusEnum.Playback && rightRef.value) {
    rightRef.value.pause()
  }
  setTimeout(() => { isSyncingPause = false }, 300)
}

// 右侧播放器进度被拖动时，同步左侧
function onSubSeeked(time: number) {
  if (isSyncingSeek) return
  isSyncingSeek = true
  if (livePlayRef.value && liveStatus.value === LiveStatusEnum.Playback) {
    setTimeout(() => {
      livePlayRef.value?.seekTo(time)
    }, 50)
  }
  setTimeout(() => { isSyncingSeek = false }, 300)
}

// 右侧播放器开始播放时
function onSubPlay(time: number) {
  // 如果左侧正在播放，同步到左侧的进度
  if (livePlayRef.value?.getIsPlaying?.()) {
    const mainTime = livePlayRef.value.getCurrentTime()
    if (mainTime > 0 && Math.abs(mainTime - time) > 1) {
      setTimeout(() => {
        rightRef.value?.seekTo(mainTime)
      }, 50)
    }
  }
  // 同步左侧也播放
  if (liveStatus.value === LiveStatusEnum.Playback && livePlayRef.value) {
    setTimeout(() => {
      livePlayRef.value?.play()
    }, 50)
  }
}

// 右侧播放器暂停时，同步左侧也暂停
function onSubPause(time: number) {
  if (isSyncingPause) return
  isSyncingPause = true
  if (liveStatus.value === LiveStatusEnum.Playback && livePlayRef.value) {
    livePlayRef.value.pause()
  }
  setTimeout(() => { isSyncingPause = false }, 300)
}

// 标记MQTT是否已初始化
let mqttInitialized = false

onMounted(async () => {
  const check = await getLiveUserAllowView()
  if (!check?.data)
    return uni.redirectTo({
      url: '/pagesPc/401'
    });
  getLiveDetail()

  // 只初始化一次MQTT连接
  if (!mqttInitialized) {
    disconnect();
    try {
      const { unionId, userId, liveId, liveRoomNo } = getUser()
      const clientId = `${liveId},${userId},3,${generateRandomString()}`;
      const mqttTopic = `chat/${liveId}`;
      console.log('[PcLiveRoom MQTT] init start', {
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
      console.log('[PcLiveRoom MQTT] connect resolved', {
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
          console.error('[PcLiveRoom MQTT] parse message failed', {
            topic,
            rawMessage,
            error: error?.message || error
          })
          return
        }
        console.log('[PcLiveRoom MQTT] parsed message', {
          topic,
          type: msgObj?.type,
          id: msgObj?.id,
          range: msgObj?.range,
          senderId: msgObj?.senderId,
          senderName: msgObj?.senderName,
          content: msgObj?.content
        })
        // 处理普通消息
        if ((msgObj.type === MqttMessageStatusEnum.NormalMessage && msgObj.range !== 3)
          || msgObj.type === MqttMessageStatusEnum.HiddenMessage || msgObj.type === MqttMessageStatusEnum.EnableMessage) {
          rightRef.value?.addMessage(msgObj);
        } else if (msgObj.type === MqttMessageStatusEnum.GiftGiving) {
          // 处理赠送礼物消息
          footerRef.value?.addGiftMessage(msgObj);
        } else if (msgObj.type === MqttMessageStatusEnum.KickedOut) {
          if (getUser()?.userId == JSON.parse(msgObj.content || '{}')?.userId) {
            // 处理踢出直播间消息
            uni.redirectTo({
              url: '/pagesPc/home/error'
            });
          }
        } else if (msgObj.type === MqttMessageStatusEnum.GetPoints) {
          // 处理获得积分消息
          pointsRef.value?.open(msgObj.content);
        } else if (msgObj.type === MqttMessageStatusEnum.ConfigUpdate) {
          // 配置更新
          fetchSettingInfo()
        } else if (msgObj.type === MqttMessageStatusEnum.TeacherCameraStatus) {
          // 处理老师摄像头状态消息
          camera.setCameraStatus(msgObj.content == '1' ? 'open' : 'close')
        } else if (msgObj.type === MqttMessageStatusEnum.Reconnect) {
          setTimeout(() => {
            // 重新拉流
            getLiveDetail()
          }, 1000);
        } else if (msgObj.type === MqttMessageStatusEnum.LiveSwitch) {
          // 直播开关
          if (msgObj.content === '0') {
            liveStatus.value = LiveStatusEnum.Ended
            setSettingInfo({ ...settingInfo.value, isChatRoom: false })
          } else {
            getLiveDetail()
          }
        } else {
          livePlayRef.value?.addMessage(msgObj);
          if (msgObj.type === MqttMessageStatusEnum.CouponCountdown) {
            // type=6 优惠券倒计时，重新查询优惠券状态
            if (liveInfo.value?.id) fetchCouponStatus(liveInfo.value.id)
          }
          if (msgObj.type === MqttMessageStatusEnum.Announcement) {
            rightRef.value?.setNotice(msgObj.content)
          }
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
    liveInfo.value = { ...res.data || {}, liveState: res.data?.isReplay ? LiveStatusEnum.Playback : Number(res.data?.liveState) }
    // 获取直播ID后立即查询优惠券状态
    if (res.data?.id) fetchCouponStatus(res.data.id)
    const liveName = liveInfo.value.liveName
    if (liveName) {
      uni.setNavigationBarTitle({ title: liveName })
    }
    liveType.value = Number(res.data?.viewingTemplate)
    liveStatus.value = res.data?.isReplay ? LiveStatusEnum.Playback : Number(res.data?.liveState)
    if (res.data?.isReplay) {
      // 回放
      nextTick(() => {
        if (liveInfo.value?.isEnableReplayPassword)
          callBackRef.value.open()
        else playbackListRef.value.open(true)
      })
    }
  })
}
onBeforeUnmount(() => {
  mqttInitialized = false; // 重置状态
  disconnect();
});

</script>

<style lang="scss" scoped></style>
