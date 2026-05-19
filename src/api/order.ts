import { get, post } from "@/utils/request";

// 预下单
export function preOrder(data: any) {
  return post("/trade/user/order/pre", data);
}

// 加载预下单
export function loadPreOrder(data: any) {
  return post("/trade/user/order/load", data);
}

// 计算订单价格
export function computedOrder(data: any) {
  return post("/trade/user/order/computed", data);
}

// 创建订单
export function createOrder(data: any) {
  return post("/trade/user/order/create", data);
}

// 订单列表
export function getOrderList(data: any) {
  return get(`/trade/user/order/page`, data);
}

// 订单详情
export function getOrderInfo(orderNo: string) {
  return get(`/trade/user/order/info/${orderNo}`);
}

// 发起支付
export function payment(data: any) {
  return post("/payment", data);
}

// 查询支付结果
export function getPaymentResult(orderNo: string) {
  return get(`/trade/user/order/status/${orderNo}`);
}

// 用户订单优惠卷分页
export function getCouponOrderList(data: any) {
  return get(`/coupon/user/order/page`, data);
}


// 获取签约链接
export function getContractSignLink(data: any) {
  return get(`/trade/contract/sign`, data);
}

// 更新签约中间状态
export function updateSignStatus(data: any) {
  return post("/trade/contract/updateSignStatus", data);
}