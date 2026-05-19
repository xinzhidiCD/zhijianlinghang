const BASE_URL = import.meta.env.VITE_BASE_URL;

type RequestOptions = {
  url: string;
  method?:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "OPTIONS"
    | "HEAD"
    | "TRACE"
    | "CONNECT";
  data?: Record<string, any>;
  header?: Record<string, any>;
};

// 请求拦截器
function requestInterceptor(options: RequestOptions): RequestOptions {
  // 例如：自动加 token
  const token = uni.getStorageSync("token");
  if (token) {
    options.header = {
      ...options.header,
      clientId: import.meta.env.VITE_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      'content-language': 'zh_CN'
    };
  }
  return options;
}

// 显示错误提示的工具函数
let lastErrorTime = 0;
const { logout } = useAuth();
function showError(message: string) {
  // 防抖：1秒内不重复显示相同错误
  const now = Date.now();
  if (now - lastErrorTime < 1000) return;
  lastErrorTime = now;

  // #ifdef H5
  // PC端使用 toast，设置更宽的样式
  uni.showToast({
    title: message,
    icon: "none",
    duration: 2500,
    mask: false,
    style: {
      width: "60%",
      maxWidth: "500px",
      minWidth: "300px",
      whiteSpace: "normal",
      wordBreak: "break-all",
    },
  });
  // #endif

  // #ifndef H5
  uni.showToast({ title: message, icon: "error" });
  // #endif
}

// 响应拦截器
function responseInterceptor(res: any) {
  // 检查是否返回HTML（通常是错误页面）
  if (typeof res.data === "string" && res.data.includes("<!DOCTYPE html")) {
    showError("服务器错误");
    return Promise.reject({ message: "服务器返回错误页面", data: res.data });
  }

  // 检查HTTP状态码
  if (res.statusCode !== 200) {
    const errorMsg =
      res.data?.msg || res.data?.message || `HTTP错误(${res.statusCode})`;
    showError(`服务器错误: ${errorMsg}`);
    return Promise.reject(res.data || res);
  }

  // 检查业务状态码（如果API有统一的响应格式）
  if (res.data && typeof res.data === "object") {
    if (res.data.code === 401) {
      logout();
      return;
    }
    if (res.data.code && res.data.code !== 200) {
      showError(res.data.msg || "业务错误");
      return Promise.reject(res.data);
    }
  }
  return res.data;
}

export function request(options: RequestOptions): Promise<any> {
  options = requestInterceptor({
    method: "GET",
    data: {},
    header: {},
    ...options,
  });

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method,
      data: options.data,
      header: options.header,
      success: (res) => {
        try {
          const result = responseInterceptor(res);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        // 网络错误或请求失败
        console.error("请求失败:", err);
        showError(`网络错误`);
        reject(err);
      },
    });
  });
}

export function get(
  url: string,
  data: Record<string, any> = {},
  header: Record<string, any> = {}
) {
  return request({ url, method: "GET", data, header });
}

export function post(
  url: string,
  data: Record<string, any> = {},
  header: Record<string, any> = {}
) {
  return request({ url, method: "POST", data, header });
}
