import { get, post } from "@/utils/request";

// 查询直播配置和直播信息
export function getLiveConfigInfo() {
  return get(`/user/live/getLiveConfigInfo`);
}

// 查询最新的公告信息
export function getLastLiveNotice() {
  return get(`/user/live/getLastLiveNotice`);
}


// 获取微信JS-SDK配置
export function getWeChatJSSDKConfig(data:any) {
  return get(`/wechat/jssdk/config`, data);
}


// 用户协议
export function getUserAgreement() {
  return post(`/external/general/getUserAgreement`);
}

// 隐私政策
export function getPrivacyAgreement() {
  return post(`/external/general/getPrivacyAgreement`);
}