import { OrderStatusEnum,ContractStatusEnum } from "@/utils/enum";
export function showToast(msg: string) {
  uni.showToast({
    title: msg,
    icon: "none",
  });
}

export function goToPage(path: string) {
  uni.navigateTo({
    url: path,
  });
}

export function toPcPage(path: string) {
  uni.navigateTo({
    url: "/pagesPc/" + path,
  });
}

export function goBack() {
  uni.navigateBack({ delta: 1 });
}

// 订单状态
export function getOrderStatusText(status: OrderStatusEnum, signStatus: ContractStatusEnum): string {
  if (OrderStatusEnum.Refunded===status) {
    return "退款完成";
  }

  // 检查签约状态
  switch (signStatus) {
    case ContractStatusEnum.Signing:
    case ContractStatusEnum.RealNamePendingReview:
    case ContractStatusEnum.SigningPendingReview:
      return "签约中";
    case ContractStatusEnum.SignFailed:
      return "签约失败";
  }

  // 根据订单状态返回对应文本
  const statusTextMap:any = {
    [OrderStatusEnum.PendingPayment]: "待付款",
    [OrderStatusEnum.Completed]: "已完成",
    [OrderStatusEnum.Cancelled]: "已取消"
  };

  return statusTextMap[status] || "未知状态";
}

export function formatTime(sec: number | string) {
  sec = Number(sec) || 0;
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function parseHrefParams(href: string) {
  // 找到问号后的部分
  const queryStr = href.split("?")[1] || "";
  const params = new URLSearchParams(queryStr);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * 判断字符串是否为图片链接（包含常见图片后缀和 data:image base64）
 */
export function isImageLink(input: string): boolean {
  if (typeof input !== "string") return false;
  const str = input.trim();
  if (!str) return false;

  // data:image/<type>;base64,xxxx
  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(str)) return true;

  // 以常见图片后缀结尾，允许携带查询参数或哈希
  const imageExtPattern =
    /\.(?:png|jpe?g|gif|webp|bmp|svg|ico|tiff?|avif)(?:\?.*)?(?:#.*)?$/i;

  return imageExtPattern.test(str);
}

export function imagePreview(index=0, urls: string[]) {
 uni.previewImage({
    current: index, // 当前点击的图片索引
    urls: urls // 所有图片的数组
  });
}

/**
 * 用户名脱敏处理
 * @param name 原始用户名
 * @returns 脱敏后的用户名
 * @example
 * desensitizeName('A') => 'A**'
 * desensitizeName('张三') => '张**三'
 * desensitizeName('李四四') => '李**四'
 * desensitizeName('王五五五') => '王**五'
 */
export function desensitizeName(name: string, userType: number): string {
  if (userType !== 3 && userType !== 4) {
    return name; // 不脱敏
  }
  if (!name || typeof name !== 'string') return '';
  
  const len = name.length;
  
  // 1个字符,显示字符后加2个*
  if (len === 1) return name + '**';
  
  // 2个及以上字符,保留首尾,中间显示2个*
  const start = name[0];
  const end = name[len - 1];
  
  return start + '**' + end;
}