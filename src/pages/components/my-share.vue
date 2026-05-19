<script lang="ts" setup>
import { weChatShare } from '@/utils/wechatShare'

const popUpRef = ref()
const popTipRef = ref()
const shareList = ref([
  { icon: '/static/images/h5/common/share1.png', text: '微信' },
  { icon: '/static/images/h5/common/share2.png', text: '朋友圈' },
  { icon: '/static/images/h5/common/share3.png', text: '复制链接' },
])
const { getUser } = useAuth()

function open() {
  popTipRef.value && popTipRef.value.close()
  popUpRef.value.open()
}

function handleClick(item: any) {

  if (item.text === '微信') {
    // 显示分享指引，引导用户通过微信菜单分享
    popTipRef.value.open()
  } else if (item.text === '朋友圈') {
    popTipRef.value.open()
  } else if (item.text === '复制链接') {
    // 复制链接还是可以使用当前页面的具体信息
    const user = getUser()
    const shareUrl = weChatShare.getShareUrl(user.liveId, user?.userId)
    uni.setClipboardData({
      data: shareUrl,
      success() {
        uni.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
    popUpRef.value.close()
  }
}

defineExpose({ open })
</script>

<template>
  <uv-popup ref="popUpRef" mode="bottom" round="24rpx">
    <view wfull pb32rpx>
      <view border-b="2rpx solid #F6F6F6" h104rpx flex-between pl28rpx pr34rpx>
        <view text-28rpx font-500>分享</view>
        <image src="/static/images/h5/common/close-gray.png" w32rpx h32rpx @click="popUpRef.close()" />
      </view>
      <view px30rpx pt30rpx grid grid-cols-5 gap-row-28rpx>
        <view v-for="(item, index) in shareList" :key="index" flex-col-center @click="handleClick(item)">
          <image :src="item.icon" w68rpx h68rpx />
          <view text="#909193 28rpx" mt8rpx>{{ item.text }}</view>
        </view>
      </view>
    </view>
  </uv-popup>
  <uv-popup ref="popTipRef" mode="top" bgColor="none">
    <view flex flex-col items-end>
      <image src="/static/images/h5/common/ysj.png" class="w136rpx h146rpx mr46rpx" />
      <view class="mr12rpx flex-center share-btn text-white text-28rpx font-500">点击右上角“…”按钮分享好友</view>
    </view>
  </uv-popup>
</template>
<style scoped>
.share-btn {
  background: linear-gradient(140deg, #0493F3 0%, #0B68F6 100%);
  border-radius: 64rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  width: 456rpx;
  height: 82rpx;
}
</style>