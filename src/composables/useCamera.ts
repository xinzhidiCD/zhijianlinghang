import { defineStore } from "pinia";

export const useCamera = defineStore("camera", () => {
  // 老师摄像头状态
  const cameraStatus = ref('open');
  // 只听声音
  const onlySound = ref(false);
  // 清晰度切换地址
  // 主流
  const mainUrl = ref('');
  // 辅流
  const backupUrl = ref('');
  // 音量
  const volume = ref(100);
  // 是否输入密码
  const isInputPassword = ref(false);

  const setVolume = (val: number) => {
    volume.value = val;
  }

  const setCameraStatus = (status: string) => {
    cameraStatus.value = status;
  };

  const setOnlySound = (status: boolean) => {
    onlySound.value = status;
  };

  const setResolutionUrl = (obj:any) => {
    // 避免设置相同的URL,防止触发不必要的响应式更新
    if (mainUrl.value === obj?.mainUrl && backupUrl.value === obj?.backupUrl) {
      return;
    }
    mainUrl.value = obj?.mainUrl;
    backupUrl.value = obj?.backupUrl;
  };

  const setInputPassword = (status: boolean) => {
    isInputPassword.value = status;
  };

  return {
    cameraStatus,
    setCameraStatus,
    onlySound,
    setOnlySound,
    mainUrl,
    backupUrl,
    volume,
    setVolume,
    setResolutionUrl,
    isInputPassword,
    setInputPassword
  };
});