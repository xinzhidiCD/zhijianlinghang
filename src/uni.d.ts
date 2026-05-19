import type { goToPage, toPcPage, showToast, goBack } from "@/utils/common";
declare global {
  interface Uni {
    [key: string]: any;
  }
  const uni: Uni;
  namespace uni {
    const $goToPage: typeof goToPage;
    const $toPcPage: typeof toPcPage;
    const $showToast: typeof showToast;
    const $goBack: typeof goBack;
  }
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $goToPage: typeof goToPage;
    $toPcPage: typeof toPcPage;
    $showToast: typeof showToast;
    $goBack: typeof goBack;
  }
}
export {};
