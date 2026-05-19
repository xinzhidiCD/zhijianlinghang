import { get, post } from "@/utils/request";

// 获取用户详细信息
export function getUserInfo() {
  return get(`/user/info`);
}

// 修改访客(前端客户)
export function editUserInfo(data: any) {
  return post(`/user/edit`, data);
}

// 优惠卷列表
export function getCouponList(data: any) {
  return get(`/coupon/user/page/${data.status}`, data);
}

// 抽奖记录列表
export function getPrizeList(data: any) {
  return get(`/chat/user/page`, data);
}

// 我的课程列表
export function getCourseList(data: any) {
  return get(`/chat/progress/page`, data);
}

// 我的课程详情
export function getCourseDetail(data: any) {
  return get(`/chat/progress/info`, data);
}

// 短信验证码
export function getSmsCode(data: any) {
  return get(`/resource/sms/code`, data);
}

// 绑定/换绑手机号
export function bindPhone(data: any) {
  return post(`/user/bindPhone`, data);
}

// 获取用户积分汇总详细信息
export function getCollectInfo(userId: string) {
  return get(`/chat/collect/${userId}`);
}

// 查询用户积分变动记录列表
export function getRecordsList(data: any) {
  return post(`/chat/records/pageQuery`, data);
}

// 用户积分获取统计
export function pointChannel() {
  return post(`/chat/records/pointChannel`);
}


// 课程学习完成
export function learningCompleted(data: any) {
  return get(`/chat/progress/learningCompleted`,data);
}


// 新增用户反馈
export function addFeedback(data: any) {
  return post(`/chat/feedback/add`,data);
}
