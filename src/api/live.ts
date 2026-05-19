import { get, post } from "@/utils/request";

// 获取直播详细信息
export function getLiveInfo() {
  return get(`/user/live/info`);
}

// 预约直播
export function appointmentLive() {
  return get(`/user/live/appointment`);
}

// 查询直播间内商品（小黄车）列表
export function getLiveProducts(data: any) {
  return post(`/chat/liveProducts/pageQuery`, data);
}

//  商品完整详情
export function getLiveProductDetail(productId: string, roomId: string) {
  return get(`/chat/products/getFullInfo/${productId}?roomId=${roomId}`);
}

// 领取优惠券
export function receiveCoupon(data: any) {
  return post("/coupon/user/receive", data);
}

// 优惠卷详情
export function getCouponInfo(id: string) {
  return post(`/trade/back/coupon/info/${id}`);
}

// 新增抽奖参与用户（用户参与抽奖）
export function prozeAddUser(data: any) {
  return post("/chat/user/add", data);
}

// 获取房间当前正在进行的抽奖信息
export function prozeGetRoomDraw(data: any) {
  return post("/chat/batch/getRoomDraw", data);
}

// 参与抽奖用户名单（包含是否中奖）
export function getBatchWinnerList(data: any) {
  return post("/chat/batch/winnerList", data);
}

// 查询礼物基础信息列表
export function getGiftsList(data: any) {
  return post("/chat/gifts/pageQuery", data);
}

// 赠送礼物
export function bestowGifts(data: any) {
  return post("/chat/gifts/bestow", data);
}

// 查询直播间内用户列表
export function getLiveUserList(data: any) {
  return post("/live/user/pageQuery", data);
}

// 点赞
export function likeMessage(data: any) {
  return post("/chat/message/like", data);
}

// 进入房间获取点赞数
export function getRoomLike(data: any) {
  return post("/chat/message/getRoomLike", data);
}

// 查询直播间老师信息
export function getLiveTeatherInfo() {
  return get(`/user/live/getLiveTeatherInfo`);
}


// 查询直播间内商品（小黄车）列表(获取id和排序用于回显)
export function getLiveProductsList(data:any) {
  return post(`/chat/liveProducts/listQuery`, data);
}


// 查询直播回放内容
export function getLiveReplayList(data:any) {
  return post(`/user/live/getLiveReplayList`, data);
}


// 校验回放密码
export function checkLiveReplayPassword(data:any) {
  return get(`/user/live/checkReplayPassword`, data);
}


// 直播回放地址匹配
export function matchingUrl(data:any) {
  return get(`/live/replay/matchingUrl`, data);
}

// 判断是否领取过优惠券
export function getUserPower(data:any) {
  return post(`/coupon/user/power`, data);
}


// 参与抽奖用户名单（包含是否中奖，未开奖时使用）
export function getUserWinnerList(data:any) {
  return post(`/chat/batch/userWinnerList`, data);
}


// 获取直播间人气
export function getLiveUserCount(data: any) {
  return post("/live/user/liveUserCount", data);
}

// 查询直播间优惠券是否正在发放
export function getLiveCouponInfo(data: any) {
  return get("/coupon/live/info", data);
}

// 直播间优惠券列表
export function getLiveCouponList(liveId: any, data: any) {
  return post(`/coupon/back/live/page`, {liveId,...data});
}
