<template>
  <img src="/static/images/pc/login/login-bg.png" wfull h100vh block />
  <div wfull h100vh flex-center absolute top-0 left-0>
    <div w500px pb20px rd-8px bg-white flex-col-center min-h400px>
      <div pt40px text-28px font-bold>微信登录</div>
      <div text="#88909B 20px" mt20px mb36px>请使用微信登录观看直播</div>

      <!-- 微信登录二维码容器 -->
      <div id="login_container" max-h250px></div>
    </div>
  </div>
  <pc-toast ref="toastRef"></pc-toast>
</template>

<script lang="ts" setup>
import { userlogin } from '@/api/login'
const { setToken, setUser, getToken } = useAuth()
let stateStr = ''
onLoad((options: any) => {
  const systemInfo = uni.getSystemInfoSync();
  if (systemInfo.osName === 'ios' || systemInfo.osName === 'android' || systemInfo.osName === 'harmonyos') {
    // 移动端跳转到移动端登录页
    return;
  }
  stateStr = Object.keys(options).length ? JSON.stringify(options || {}) : (uni.getStorageSync('wxCallback') || '{}');
  if (options.param && getToken()) {
    // 判断存在token，直接登录
    handleUserLogin(options.param)
  } else {
    // 初始化微信SDK
    setTimeout(() => {
      initWxLogin();
    }, 100);
  }

})

async function handleUserLogin(param: string) {
  // 发起登录请求
  const res = await userlogin({
    clientId: import.meta.env.VITE_CLIENT_ID,
    grantType: 'auto',
    tenantId: import.meta.env.VITE_TENANT_ID,
    param,
    uuid: Date.now(),
  });

  console.log('微信登录成功param参数=====', param);
  uni.setStorageSync("wxCallback", JSON.stringify({ param }));

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
}

// 初始化微信SDK登录
const toastRef = ref()
function initWxLogin() {
  if (stateStr === '{}') {
    toastRef.value.showToast({ title: '请通过分享的邀请链接进入', type: 'warn' })
    return
  }
  console.log("initWxLogin执行了");

  // 检查WxLogin是否存在
  if (typeof WxLogin === 'undefined') {
    console.error("WxLogin未定义，请检查微信SDK是否正确加载");
    return;
  }

  // 使用专门的回调页面
  let baseUrl = import.meta.env.VITE_DOMAIN + "/pagesPc/login/callback";
  const url = encodeURIComponent(baseUrl);
  console.log("redirect_uri>>>", url);

  // 检查容器是否存在
  const container = document.getElementById("login_container");
  if (!container) {
    console.error("找不到login_container容器");
    return;
  }

  console.log("开始创建WxLogin实例");
  try {
    new WxLogin({
      self_redirect: false,
      id: "login_container",
      appid: import.meta.env.VITE_WX_OPEN_APPID,
      scope: "snsapi_login",
      redirect_uri: url,
      state: stateStr,
      style: "",
      href: "",
      stylelite: 1,
      onReady: function (isReady: boolean) {
        console.log("onReady回调触发, isReady:", isReady);
      },
    });
    console.log("WxLogin实例创建完成");
  } catch (error: any) {
    console.error("创建WxLogin实例失败:", error);
  }
}
</script>

<style lang="scss" scoped></style>