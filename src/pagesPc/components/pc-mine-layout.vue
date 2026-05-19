<script setup lang='ts'>
import { storeToRefs } from 'pinia'

function toPage(path: string) {
  uni.$toPcPage(path)
}
const menuList = [
  {
    name: '个人资料',
    default: '/static/images/pc/mine/m1.png',
    selected: '/static/images/pc/mine/m1s.png',
    path: 'index'
  },
  {
    name: '我的订单',
    default: '/static/images/pc/mine/m2.png',
    selected: '/static/images/pc/mine/m2s.png',
    path: 'order'
  },
  {
    name: '我的课程',
    default: '/static/images/pc/mine/m3.png',
    selected: '/static/images/pc/mine/m3s.png',
    path: 'course'
  },
  {
    name: '我的积分',
    default: '/static/images/pc/mine/m4.png',
    selected: '/static/images/pc/mine/m4s.png',
    path: 'points'
  },
  {
    name: '优惠券',
    default: '/static/images/pc/mine/m5.png',
    selected: '/static/images/pc/mine/m5s.png',
    path: 'coupon'
  },
  {
    name: '我的奖品',
    default: '/static/images/pc/mine/m6.png',
    selected: '/static/images/pc/mine/m6s.png',
    path: 'award'
  },
  {
    name: '意见反馈',
    default: '/static/images/pc/mine/m7.png',
    selected: '/static/images/pc/mine/m7s.png',
    path: 'feedback'
  }
]
const activePath = ref('')
onShow(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const route = currentPage?.route || ''
  const match = route.match(/^pagesPc\/mine\/([^/]+)/)
  activePath.value = match ? match[1] : ''
})
function handelMenu(path: string) {
  activePath.value = path
  uni.$goToPage(`/pagesPc/mine/${path}`)
}
function goLive() {
  uni.$toPcPage('home/liveRoom')
}

const user = useUser()
const { userInfo, hasUserInfo } = storeToRefs(user)
const { fetchUserInfo } = user

onMounted(() => {
  if (!hasUserInfo.value) {
    fetchUserInfo()
  }
})


// 动画状态变量
let isSpinning = false;
let lastTime = 0;
let angle = 0;
let angularVelocity = 0; // 初始角速度 (度/毫秒)
let acceleration = 0.0003; // 角加速度 (度/毫秒²)
let maxVelocity = 2.5; // 最大角速度限制

// 动画帧ID
let animationId: any = null;
const avatarRef = ref()

nextTick(() => {
  const spinner = avatarRef.value?.$el;
  // 鼠标悬停开始
  spinner.addEventListener('mouseenter', () => {
    if (!isSpinning) {
      isSpinning = true;
      angularVelocity = 0; // 从静止开始加速
      lastTime = performance.now();
      animate(performance.now());
    }
  });

  // 鼠标离开停止并还原
  spinner.addEventListener('mouseleave', () => {
    isSpinning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    // 还原到初始角度，利用CSS transition实现平滑过渡
    spinner.style.transform = 'rotate(0deg)';
    // 重置角度变量
    angle = 0;
  });

  // 使用requestAnimationFrame实现流畅动画
  function animate(currentTime: number) {
    if (!isSpinning) return;
    // 计算时间差（毫秒）
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    // 更新角速度（带加速度）
    angularVelocity = Math.min(angularVelocity + acceleration * deltaTime, maxVelocity);
    // 更新角度
    angle += angularVelocity * deltaTime;
    // 应用旋转
    spinner.style.transform = `rotate(${angle}deg)`;
    // 继续下一帧
    animationId = requestAnimationFrame(animate);
  }
})


</script>

<template>
  <div wfull flex flex-col h100vh bg="#F2F3F5">
    <div h60px bg-white>
      <div w1200px m="auto" h60px flex-between>
        <div cursor-pointer flex items-center @click="toPage('home/liveRoom')">
          <img src="/static/images/logo.png" w30px h30px mr8px>
          <div text-22px font-500>领航通直播</div>
        </div>
        <div cursor-pointer flex items-center @click="goLive">
          <img src="/static/images/pc/mine/back.png" w24px h24px mr8px>
          <div font-500>返回直播</div>
        </div>
      </div>
    </div>
    <div flex-1 flex-shrink-0 flex justify-center mt16px>
      <div w1200px flex hfull>
        <div w188px mr16px bg-white pt20px>
          <div px16px>
            <uv-avatar ref="avatarRef" :src="userInfo?.avatar" size="120px" class="ml18px"></uv-avatar>
            <div text-18px font-500 text-center border-b="1px solid #E5E6EB" py16px truncate>{{ userInfo?.nickName }}
            </div>
          </div>
          <div mt20px px8px flex flex-col gap-5px>
            <div v-for="item, index in menuList" :key="index" wfull h40px cursor-pointer flex items-center pl12px
              font-500 :class="[item.path === activePath && 'bg-[#F2F3F5] text-[#305EF6]']"
              @click="handelMenu(item.path)">
              <img :src="item.path === activePath ? item.selected : item.default" w16px h16px mr4px>
              <div>{{ item.name }}</div>
            </div>
          </div>
        </div>
        <div flex-1 bg-white class="h-[calc(100vh-76px)] overflow-auto">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>
