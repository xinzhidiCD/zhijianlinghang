import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { getUserInfo as getInfo } from '@/api/user'

type UserInfo = Record<string, any>;

export const useUser = defineStore("user", () => {
  // 本地已有的用户信息（同步可读）
  const userInfo = ref<UserInfo>(uni.getStorageSync("userInfo") || {});
  const hasUserInfo = computed(() => !!userInfo.value && Object.keys(userInfo.value).length > 0);

  // 设置用户信息（同时写本地）
  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info || {};
    uni.setStorageSync("userInfo", userInfo.value);
  };

  // 同步读取当前内存中的用户信息（不触发请求）
  const getUserInfoSync = (): UserInfo => userInfo.value || {};

  // 异步拉取用户信息（需要时再 await）
  const fetchUserInfo = async (): Promise<UserInfo> => {
   try {
      const res = await getInfo();
      setUserInfo(res?.data || {});
    } catch (e) {
      // 拉取失败时仍返回当前内存中的值
      console.warn('fetchUserInfo error:', e);
    }
    return userInfo.value || {};
  };

  return {
    // 状态
    userInfo,
    hasUserInfo,
    // 动作
    setUserInfo,
    getUserInfoSync, // 同步读
    fetchUserInfo,   // 异步拉取
  };
});