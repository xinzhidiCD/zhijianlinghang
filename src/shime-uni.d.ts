export {};

declare module "vue" {
  type Hooks = App.AppInstance & Page.PageInstance;
  interface ComponentCustomOptions extends Hooks {}
}

// 微信登录SDK类型声明
declare global {
  interface WxLoginOptions {
    self_redirect?: boolean;
    id: string;
    appid: string;
    scope: string;
    redirect_uri: string;
    state?: string;
    style?: string;
    href?: string;
    stylelite?: number;
    onReady?: (isReady: boolean) => void;
  }

  class WxLogin {
    constructor(options: WxLoginOptions);
  }
}
