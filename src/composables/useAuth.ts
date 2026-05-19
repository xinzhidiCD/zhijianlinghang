import { ref } from "vue";
import { defineStore } from "pinia";

export const useAuth = defineStore("auth", () => {
  // 初始化时从本地存储读取
  const token = ref(uni.getStorageSync("token") || "");
  const user = ref(uni.getStorageSync("loginUser") || {});

  // 设置token
  const setToken = (key: string) => {
    token.value = key;
    uni.setStorageSync("token", key);
  };

  // 获取token
  const getToken = () => {
    return token.value || uni.getStorageSync("token") || "";
  };

  // 设置登录用户信息
  const setUser = (userInfo: any) => {
    user.value = userInfo;
    uni.setStorageSync("loginUser", userInfo);
  };

  // 获取登录用户信息
  const getUser = () => {
    return user.value || uni.getStorageSync("loginUser") || {};
  };

  // 退出登录
  const logout = async () => {
    token.value = "";
    user.value = {};
    const wxCallback: any = uni.getStorageSync("wxCallback");
    uni.clearStorageSync();
    sessionStorage.clear();
    uni.setStorageSync("wxCallback", wxCallback);
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage?.route || "";
    uni.reLaunch({
      url: route.startsWith("pages/")
        ? "/pages/login/login"
        : "/pagesPc/login/login",
    });
  };

  return {
    setToken,
    getToken,
    setUser,
    getUser,
    logout,
  };
});
