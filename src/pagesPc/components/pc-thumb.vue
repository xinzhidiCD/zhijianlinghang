<script setup lang='ts'>
import { likeMessage } from '@/api/live'
const likes = ref<{ id: number; offset: number, combo: number }[]>([])
const likeCount = ref(0) // 点赞统计次数
let likeId = 0
let sendTimer: any = null // 延迟发送定时器

function sendLike() {
  // 统计点赞次数
  likeCount.value++
  // 随机左右扩散，-40~+40px
  const offset = Math.random() * 80 - 40
  likes.value.push({ id: likeId++, offset, combo: likeCount.value })

  // 清除之前的定时器
  if (sendTimer) {
    clearTimeout(sendTimer)
  }

  // 设置新的定时器，1秒后发送给后端
  sendTimer = setTimeout(() => {
    sendLikeToServer(likeCount.value)
    likeCount.value = 0 // 发送后重置计数器
  }, 1000)

  setTimeout(() => {
    likes.value.shift()
  }, 1200)
}

// 发送点赞数据到后端
function sendLikeToServer(count: number) {
  console.log(`发送点赞次数到后端: ${count}`)
  likeMessage({ count })
}
</script>

<template>
  <!-- 点赞 -->
  <div rd-full cursor-pointer flex-center @click="sendLike">
    <img src="/static/images/pc/home/heart_fill.png" w30px h30px>
    <transition-group name="like-float" tag="div">
      <div v-for="item in likes" :key="item.id" class="like-float" :style="`--offset: ${item.offset}px;`">
        <img class="w-[30px] h-[30px]" src="/static/images/pc/home/heart_fill.png" />
        <div class="likeNum">{{ '×' + item.combo }}</div>
      </div>
    </transition-group>
  </div>
</template>
<style lang="scss" scoped>
.like-float {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 30px;
  height: 30px;
  pointer-events: none;
  animation: like-float-up 1.2s cubic-bezier(.36, .66, .57, 1) forwards;
  /* 传递自定义属性给动画 */
  --offset: 0px;

  .likeNum {
    position: absolute;
    left: 0px;
    top: -20px;
    width: 30px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    color: #DF4F48;
    mix-blend-mode: difference;
  }
}

@keyframes like-float-up {
  0% {
    opacity: 0;
    transform: translateX(-50%) scale(1) translateY(0);
  }

  70% {
    opacity: 1;
    /* 扩散到目标偏移 */
    transform: translateX(calc(-50% + var(--offset))) scale(1.3) translateY(-80px);
  }

  100% {
    opacity: 0;
    transform: translateX(calc(-50% + var(--offset))) scale(1) translateY(-100px);
  }
}
</style>
