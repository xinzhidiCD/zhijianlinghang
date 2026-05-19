<script lang="ts" setup>
import { ref } from 'vue';
import wx from "weixin-js-sdk";

const position = ref({
  x: 0,
  y: 400
});

const isDragging = ref(false);
const hasMoved = ref(false);
const startPos = ref({ x: 0, y: 0 });
const startOffset = ref({ x: 0, y: 0 });
const btnSize = 48; // 96rpx ≈ 48px
const inited = ref(false);

const type = uni.getStorageSync('type');

// 初始化位置
onMounted(() => {
  if (inited.value) return;
  inited.value = true;
  const windowInfo = uni.getWindowInfo();
  position.value = {
    x: windowInfo.windowWidth - btnSize - 8,
    y: 400
  };
});

function toMine() {
  if (hasMoved.value) return;
  if (type) {
    wx.miniProgram.switchTab({ url: '/pages/mine/index' });
  } else {
    uni.redirectTo({
      url: '/pages/mine/index'
    });
  }
}

// 获取边界限制后的位置
function clampPosition(x: number, y: number) {
  const windowInfo = uni.getWindowInfo();
  const screenWidth = windowInfo.windowWidth;
  const screenHeight = windowInfo.windowHeight;
  return {
    x: Math.max(8, Math.min(screenWidth - btnSize - 8, x)),
    y: Math.max(8, Math.min(screenHeight - btnSize - 8, y))
  };
}

// Touch事件
function onTouchStart(e: TouchEvent) {
  hasMoved.value = false;
  const touch = e.touches[0];
  startPos.value = { x: touch.clientX, y: touch.clientY };
  startOffset.value = { ...position.value };
}

function onTouchMove(e: TouchEvent) {
  const touch = e.touches[0];
  const deltaX = touch.clientX - startPos.value.x;
  const deltaY = touch.clientY - startPos.value.y;

  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    hasMoved.value = true;
  }

  const newX = startOffset.value.x + deltaX;
  const newY = startOffset.value.y + deltaY;
  position.value = clampPosition(newX, newY);
}

function onTouchEnd() {
  setTimeout(() => {
    hasMoved.value = false;
  }, 100);
}

// Mouse事件（PC端支持）
function onMouseDown(e: MouseEvent) {
  e.preventDefault();
  hasMoved.value = false;
  isDragging.value = true;
  startPos.value = { x: e.clientX, y: e.clientY };
  startOffset.value = { ...position.value };
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  const deltaX = e.clientX - startPos.value.x;
  const deltaY = e.clientY - startPos.value.y;

  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    hasMoved.value = true;
  }

  const newX = startOffset.value.x + deltaX;
  const newY = startOffset.value.y + deltaY;
  position.value = clampPosition(newX, newY);
}

function onMouseUp() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  setTimeout(() => {
    hasMoved.value = false;
  }, 100);
}
</script>

<template>
  <image src="/static/images/h5/common/pp-center.png" w96rpx h96rpx fixed z-999
    :style="{ left: position.x + 'px', top: position.y + 'px', cursor: isDragging ? 'grabbing' : 'grab' }" 
    @click="toMine" 
    @touchstart="onTouchStart"
    @touchmove.prevent="onTouchMove" 
    @touchend="onTouchEnd"
    @mousedown="onMouseDown" />
</template>
