<template>
  <img src="/static/images/pc/login/login-bg.png" wfull h100vh block />
  <div wfull h100vh flex-center absolute top-0 left-0>
    <div w500px h480px pb20px rd-8px bg-white flex-center flex-col>
      <div class="loader">
        <div class="inner one"></div>
        <div class="inner two"></div>
        <div class="inner three"></div>
      </div>
      <div text-24px mt50px>微信登录中...</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { userlogin } from '@/api/login'
const { setToken, setUser } = useAuth()

onMounted(() => {
  handleWxCallback();
});

async function handleWxCallback() {
  try {
    // 获取URL参数
    const hash = window.location.href;
    const queryStr = hash.split('?')[1] || '';
    const params = new URLSearchParams(queryStr);

    const code = params.get('code');
    const state: any = params.get('state');

    console.log('微信回调参数:', { code, state });
    uni.setStorageSync("wxCallback", state);

    if (!code) {
      console.error('未获取到微信授权码');
      // uni.reLaunch({ url: '/pagesPc/login/login' });
      return;
    }

    const stateRaw = params.get('state');
    let originalParams: any = {};
    if (stateRaw) {
      // 去掉首尾大括号
      const content = stateRaw.replace(/^{|}$/g, '');
      // 按逗号分割
      const pairs = content.split(',');
      pairs.forEach(pair => {
        const [key, value] = pair.split(':');
        if (key && value) {
          originalParams[key.trim()] = value.trim();
        }
      });
    }

    // 发起登录请求
    const res = await userlogin({
      clientId: import.meta.env.VITE_CLIENT_ID,
      grantType: 'wx',
      loginType: 'web',
      tenantId: import.meta.env.VITE_TENANT_ID,
      code: code,
      param: originalParams.param || '',
      liveId: originalParams.liveId || '',
      visitorId: originalParams.visitorId || '',
      uuid: Date.now(),
    });

    console.log('callback微信登录成功:', res);

    setToken(res.data.access_token);
    const { aliConfigId, wxConfigId, unionId, userId, liveId, liveRoomNo } = res.data || {}
    setUser({
      aliConfigId,
      wxConfigId,
      unionId,
      userId,
      liveId,
      liveRoomNo
    });

    // 登录成功后跳转到首页
    uni.reLaunch({
      url: '/pagesPc/home/home'
    });

  } catch (error) {
    console.error('微信登录失败:', error);
  }
}
</script>

<style lang="scss" scoped>
.loader {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  perspective: 800px;
}

.inner {
  position: absolute;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.inner.one {
  left: 0%;
  top: 0%;
  animation: rotate-one 1s linear infinite;
  border-bottom: 3px solid #666;
}

.inner.two {
  right: 0%;
  top: 0%;
  animation: rotate-two 1s linear infinite;
  border-right: 3px solid #666;
}

.inner.three {
  right: 0%;
  bottom: 0%;
  animation: rotate-three 1s linear infinite;
  border-top: 3px solid #666;
}

@keyframes rotate-one {
  0% {
    transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
  }

  100% {
    transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
  }
}

@keyframes rotate-two {
  0% {
    transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg);
  }

  100% {
    transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg);
  }
}

@keyframes rotate-three {
  0% {
    transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg);
  }

  100% {
    transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg);
  }
}
</style>
