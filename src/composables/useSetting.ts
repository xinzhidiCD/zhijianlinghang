import { defineStore } from "pinia";
import { getLiveConfigInfo as getInfo } from '@/api/setting'

type SettingInfo = Record<string, any>;

export const useSetting = defineStore("setting", () => {
  // 本地已有的用户信息（同步可读）
  const settingInfo = ref<SettingInfo>(uni.getStorageSync("settingInfo") || {});

  // 设置用户信息（同时写本地）
  const setSettingInfo = (info: SettingInfo) => {
    settingInfo.value = info || {};
    uni.setStorageSync("settingInfo", settingInfo.value);
  };

  // 同步读取当前内存中的用户信息（不触发请求）
  const getSettingInfoSync = (): SettingInfo => settingInfo.value || {};

  // 异步拉取用户信息（需要时再 await）
  const fetchSettingInfo = async (): Promise<SettingInfo> => {
   try {
      const res = await getInfo();
      setSettingInfo(res?.data || {});
    } catch (e) {
      // 拉取失败时仍返回当前内存中的值
      console.warn('fetchSettingInfo error:', e);
    }
    return settingInfo.value || {};
  };

  return {
    // 状态
    settingInfo,
    // 动作
    setSettingInfo,
    getSettingInfoSync, // 同步读
    fetchSettingInfo,   // 异步拉取
  };
});