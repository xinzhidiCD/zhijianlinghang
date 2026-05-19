// 直播类型
export const enum LiveTypeEnum {
  ThreeSplit = 1, // 3分屏
  PureVideo = 2, // 纯视频
  PptThreeSplit = 3, // PPT三分屏
}
// 直播状态
export const enum LiveStatusEnum {
  NotStarted = 0, // 未开始
  Live = 1, // 直播中
  Ended = 2, // 已结束
  Playback = 3, // 回放-手动判断的
}

// 订单状态
export const enum OrderStatusEnum {
  PendingPayment = 0, // 待付款
  Completed = 1, // 已完成
  Refunding = 2, // 退款中
  Cancelled = 3, // 已取消
  Refunded = 4, // 退款
}

// 签约状态 0.不需要签约 1.签约中 2.签约成功 3.签约失败 4.拒签 5.实名待审核 6.签约待审核
export const enum ContractStatusEnum {
  NoNeed = 0, // 不需要签约
  Signing = 1, // 签约中
  Signed = 2, // 签约成功
  SignFailed = 3, // 签约失败
  Refused = 4, // 拒签
  RealNamePendingReview = 5, // 实名待审核
  SigningPendingReview = 6 // 签约待审核
}

// mqtt消息解析状态
export const enum MqttMessageStatusEnum {
  EnterRoom = 1, // 进入房间
  LeaveRoom = 2, // 离开房间
  NormalMessage = 3, // 普通消息
  SystemMessage = 4, // 系统消息
  LotteryCountdown = 5, // 抽奖倒计时
  CouponCountdown = 6, // 优惠券倒计时
  ProductIntroduction = 7, // 商品讲解
  Announcement = 8, // 公告
  CouponReceiveResult = 9, // 优惠券领取结果
  LotteryResult = 10, // 抽奖结果
  HiddenMessage = 11, // 隐藏消息
  GiftGiving = 12, // 赠送礼物
  KickedOut = 13, // 踢出直播间
  GetPoints = 14, // 获得积分
  CancelProductIntroduction = 15, // 取消讲解
  GetLikes = 16, // 获取点赞
  ProductShelves = 17, // 商品上架
  ConfigUpdate = 18, // 配置更新
  Buying = 19, // 正在购买
  Popularity = 20, // 人气
  ProductDelisting = 21, // 商品下架
  TeacherCameraStatus = 22, // 老师摄像头状态
  LiveSwitch = 23, // 直播开关
  Reconnect = 24, // 重新推流
  Duration = 25, // 优惠券持续时间
  EnableMessage = 27 // 启用消息
}
