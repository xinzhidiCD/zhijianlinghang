<script setup lang="ts">
import { resolveShortUrl } from '@/api/other'

const inviteInfo = ref<any>({})
const loading = ref(true)

// 小程序名称
const appName = computed(() => {
  return inviteInfo.value.activeWxapp === 1 ? '领航通' : '领航通'
})

// Logo图片
const logoImg = computed(() => {
  return inviteInfo.value.activeWxapp === 2 ? '/static/images/h5/wx/zhsg.png' : '/static/images/logo.png'
})

onLoad((options: any) => {
  if (options?.code) {
    getInviteInfo(options.code)
  }
})

async function getInviteInfo(shortUrl: string) {
  try {
    loading.value = true
    const res = await resolveShortUrl(shortUrl)
    if (res.data) {
      inviteInfo.value = res.data
      window.location.href = res.data.inviteCode
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 长按保存图片
function saveQrCode() {
  if (!inviteInfo.value.inviteQrCode) return
  uni.previewImage({
    urls: [inviteInfo.value.inviteQrCode],
    current: inviteInfo.value.inviteQrCode
  })
}

// 跳转小程序
function goToMiniProgram() {
  if (!inviteInfo.value.inviteCode) return
  window.location.href = inviteInfo.value.inviteCode
}
</script>

<template>
  <view class="invite-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-wrap">
      <uv-loading-icon size="40" color="#0B68F6"></uv-loading-icon>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 内容区域 -->
    <view v-else class="content">
      <!-- 头部标题 -->
      <view class="header">
        <view class="logo-wrap">
          <image :src="logoImg" class="logo" mode="aspectFit" />
        </view>
        <view class="app-name">{{ appName }}</view>
        <view class="sub-title">精彩直播 · 等你来看</view>
      </view>

      <!-- 二维码卡片 -->
      <view class="qrcode-card">
        <view class="card-title">扫码进入直播间</view>
        <view class="qrcode-wrap" @longpress="saveQrCode">
          <image
            v-if="inviteInfo.inviteQrCode"
            :src="inviteInfo.inviteQrCode"
            class="qrcode-img"
            mode="aspectFit"
            show-menu-by-longpress
          />
          <view v-else class="qrcode-placeholder">
            <text>暂无二维码</text>
          </view>
        </view>
        <view class="qrcode-tip">长按识别二维码</view>
      </view>

      <!-- 跳转按钮 -->
      <view class="btn-wrap">
        <view class="invite-btn" @click="goToMiniProgram">
          <text class="btn-text">立即进入小程序</text>
          <view class="btn-arrow">→</view>
        </view>
      </view>

      <!-- 底部提示 -->
      <view class="footer">
        <view class="footer-line"></view>
        <text class="footer-text">专业投资 · 智慧理财</text>
        <view class="footer-line"></view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.invite-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0B68F6 0%, #4A9FFF 50%, #E8F3FF 100%);
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;

  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
  }

  .circle-1 {
    width: 300rpx;
    height: 300rpx;
    top: -100rpx;
    right: -50rpx;
  }

  .circle-2 {
    width: 200rpx;
    height: 200rpx;
    top: 200rpx;
    left: -80rpx;
  }

  .circle-3 {
    width: 400rpx;
    height: 400rpx;
    bottom: 100rpx;
    right: -150rpx;
    background: rgba(255, 255, 255, 0.05);
  }
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;

  .loading-text {
    margin-top: 20rpx;
    color: #fff;
    font-size: 28rpx;
  }
}

.content {
  position: relative;
  z-index: 1;
  padding: 80rpx 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;

  .logo-wrap {
    width: 140rpx;
    height: 140rpx;
    margin: 0 auto 30rpx;
    background: #fff;
    border-radius: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.15);

    .logo {
      width: 100rpx;
      height: 100rpx;
    }
  }

  .app-name {
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 16rpx;
    text-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.2);
  }

  .sub-title {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 4rpx;
  }
}

.qrcode-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 50rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);

  .card-title {
    text-align: center;
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 40rpx;
  }

  .qrcode-wrap {
    width: 400rpx;
    height: 400rpx;
    margin: 0 auto;
    background: #f8f8f8;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .qrcode-img {
      width: 100%;
      height: 100%;
    }

    .qrcode-placeholder {
      color: #999;
      font-size: 28rpx;
    }
  }

  .qrcode-tip {
    text-align: center;
    margin-top: 30rpx;
    font-size: 26rpx;
    color: #999;
  }
}

.btn-wrap {
  padding: 0 20rpx;

  .invite-btn {
    background: linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%);
    border-radius: 50rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10rpx 30rpx rgba(255, 107, 74, 0.4);

    .btn-text {
      font-size: 34rpx;
      font-weight: 600;
      color: #fff;
      letter-spacing: 2rpx;
    }

    .btn-arrow {
      margin-left: 16rpx;
      font-size: 36rpx;
      color: #fff;
    }

    &:active {
      transform: scale(0.98);
      opacity: 0.9;
    }
  }
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 80rpx;

  .footer-line {
    width: 60rpx;
    height: 2rpx;
    background: rgba(255, 255, 255, 0.5);
  }

  .footer-text {
    margin: 0 24rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 2rpx;
  }
}
</style>
