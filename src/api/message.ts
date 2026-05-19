import { get, post } from "@/utils/request";

// 发送消息
export function sendMessage(data: any) {
  return post("/chat/message/send", data);
}

// 查询聊天记录
export function getMessageHistory(data: any) {
  return post("/chat/message/history", data);
}
