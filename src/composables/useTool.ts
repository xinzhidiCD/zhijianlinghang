import dayjs from "dayjs";

export function useTool() {
  // 手机*显示
  function formatPhoneNumber(phone: string) {
    if (!phone) return "";
    return phone.replace(
      /^(\d{3})(\d*)(\d{4})$/,
      `$1${Array(Math.max(phone.length - 7, 0))
        .fill("*")
        .join("")}$3`
    );
  }

  /** 脱敏身份证号 */
  function desensitizationIdNum(idNum: string) {
    if (!idNum) return "";
    return idNum.replace(
      /^(\d{4})(\d{10})([\dx]{4})$/i,
      `$1${Array(10).fill("*").join("")}$3`
    );
  }

  /** 验证邮箱 */
  function validEmail(email: string) {
    const regex = /^[\w.-]+@[a-z0-9.-]+\.[a-z]{2,6}$/i;
    return regex.test(email);
  }

  /** 补零 */
  function padZero(num: number) {
    return num > 0 ? num.toString().padStart(2, "0") : "0";
  }

  /** 简单的手机号校验 */
  function isMobile(phone: string) {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  /** 格式化时间 */
  function formatTime(date: Date, format: string = "YYYY-MM-DD HH:mm:ss") {
    return dayjs(date).format(format);
  }
  
  /** 6位随机数 */
  function generateRandomString() {
    // 定义包含大小写字母和数字的字符集
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 6;
    
    for (let i = 0; i < length; i++) {
      // 生成0到字符集长度之间的随机索引
      const randomIndex = Math.floor(Math.random() * charset.length);
      // 根据随机索引从字符集中选取字符并添加到结果中
      result += charset.charAt(randomIndex);
    }
    
    return result;
  }

  /** 补充链接前缀 */
  function openLink(url: string) {
    if (!url) return "";
    if (!url.startsWith('//')) {
      url = '//' + url;
    }
    window.open(url);
  }

  return {
    formatPhoneNumber,
    desensitizationIdNum,
    validEmail,
    padZero,
    isMobile,
    formatTime,
    generateRandomString,
    openLink
  };
}
