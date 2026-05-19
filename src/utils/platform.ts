let isRedirecting = false;

export function checkAndRedirect() {
  if (isRedirecting) return;
  const systemInfo = uni.getSystemInfoSync();
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const route = currentPage?.route || "";

  const { getToken } = useAuth();
  // 如果已经在登录页，直接返回，避免死循环
  const whiteList = [
    "pagesPc/login/login",
    "pages/login/login",
    "pagesPc/login/callback",
    "pages/login/callback",
    "pages/agree",
    'pages/home/cashier',
    'pages/home/invite'
  ];
  // console.log('当前系统',systemInfo.platform,systemInfo.osName )
  const loginUrl =
    systemInfo.osName === "windows" || systemInfo.osName==='macos' || systemInfo.osName==='linux'
      ? "/pagesPc/login/login"
      : "/pages/login/login";
  // if (location.pathname.includes("pagesPc/login/login") || location.pathname.includes("pages/login/login") ||
  //   (location.pathname==='/'&&location.search.includes('?param='))) {
  //   isRedirecting = true;
  //   if (location.pathname+location.search === loginUrl+location.search) {
  //     return true;
  //   }
  //   return uni.reLaunch({ url:loginUrl+location.search });
  // }
  if (!getToken()) {
    if (whiteList.includes(route) || route === "") {
      return true;
    } else {
      isRedirecting = true;
      return uni.reLaunch({ url:loginUrl });
    }
  }
}
