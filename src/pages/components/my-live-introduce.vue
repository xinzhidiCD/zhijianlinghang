<script lang="ts" setup>
const props = defineProps<{
  liveInfo: any
}>()
const modalRef = ref()
const getStatusText = () => {
  switch (Number(props.liveInfo?.liveState)) {
    case 0:
      return '直播未开始'
    case 1:
      return '直播进行中'
    case 3:
      return '直播回放中'
    case 2:
      return '直播已结束'
    default:
      return '直播未开始'
  }
}
</script>

<template>
  <view flex-1 bg-white>
    <view text-28rpx p24rpx>
      <view>
        <text text="#999">ID：</text>{{ liveInfo?.liveRoomNo }}
      </view>
      <view flex items-center mt10rpx>
        <text text="#999">状态：</text>
        {{ getStatusText() }}
      </view>
    </view>
    <view bg="#FAFAFA" h16rpx></view>
    <view p24rpx>
      <view text-30rpx font-500>{{ liveInfo?.liveName }}</view>
      <view text="#909193 26rpx" my16rpx>{{ liveInfo?.liveDescription }}</view>
      <view text="#909193" my16rpx>{{ liveInfo?.liveStartTime }} 开始</view>
      <view text-30rpx mt16rpx mb24rpx>直播时间：{{ liveInfo?.liveStartTime }}</view>
    </view>
    <view bg="#FAFAFA" h16rpx></view>
    <view v-if="liveInfo?.isReplayEnabled" text-28rpx h88rpx flex justify-between items-center px24rpx>回放有效期：
      {{ liveInfo?.replayValidityType == 0 ? '永久有效' : '限时有效' }}
      <image v-if="liveInfo?.replayValidityType == 1" src="/static/images/h5/common/tips.png" w40rpx h40rpx
        @click="modalRef.open()" />
    </view>
    <view bg="#FAFAFA" h16rpx></view>
    <view p24rpx>
      <view text-28rpx font-500>课程详情介绍</view>
      <view my16rpx text-28rpx leading-40rpx>
        <uv-parse :content="liveInfo?.liveDetails"></uv-parse>
      </view>
    </view>
  </view>
  <!-- 提示 -->
  <uv-modal ref="modalRef">
    <view class="text-center font-500 text-28rpx">
      <view mb24rpx>该直播回放有效时间段：</view>
      <view>
        <view v-for="c, k in liveInfo?.replayLimitedTime || []" :key="k">
          {{ c.join(' - ') }}
        </view>
      </view>
      <view text="#909193 left" font-400 mt24rpx leading-40rpx>有效期后您仍可进入直播间查看相关信息，但无法观看回放视频</view>
    </view>
  </uv-modal>
</template>