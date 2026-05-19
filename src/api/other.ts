import { get, post } from "@/utils/request";

// 用户是否被提出/拉黑
export function getLiveUserAllowView() {
  return get(`/live/user/allowView`);
}

// oss配置
export function getOssConfig() {
  return get(`/resource/oss/scrip`);
}


// 解析短链接获取小程序邀请信息
export function resolveShortUrl(shortUrl: string) {
  return get(`/short/resolve/${shortUrl}`);
}
