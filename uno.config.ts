// uno.config.ts
import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(), // 支持属性式写法 e.g. <div text="red-500"></div>
    presetIcons(), // 使用图标支持
  ],
  rules: [["font-din-bold", { "font-family": "DDINBold" }]],
  shortcuts: {
    "flex-center": "flex justify-center items-center",
    "flex-col-center": "flex flex-col items-center",
    "flex-between": "flex justify-between items-center",
    "flex-col-between": "flex flex-col justify-between",
    "btn-sub":
      "h80rpx w-full rd-full flex-center color-white text-28rpx bg-[#0B68F6]",
    "btn-sub-box":
      "w-full rd-full flex-center color-#0B68F6 text-28rpx border-1 border-solid border-[#0B68F6] font-500 cursor-pointer",
    "btn-sub-secondary":
      "h80rpx w-full rd-full flex-center color-#0B68F6 text-28rpx border-1 border-solid border-[#0B68F6] bg-white",
    "btn-error": "rd-full flex-center text-white font-500 bg-[#DC3939]",
    "bg-black-box": "bg-black bg-op-50 rd-full flex-center text-white",
    "box-time-num":
      "text-#FFB423 text-56rpx font-bold mx16rpx leading-60rpx font-din-bold",
    "bg-main-full": "bg-#FAFAFA wfull min-h100vh",
    "pc-time-num":
      "text-#ECBC47 text-40px font-bold leading-43px mx11px font-din-bold",
    "pc-player-full":
      "wfull hfull absolute top-0 left-0 flex-center pointer-events-none",
    "pc-bg-white-box": "bg-white bg-op-10 rd-4px flex-center text-white",
    "pc-btn-sub": "bg-#305EF6 text-white flex-center cursor-pointer",
    "pc-btn-error": "bg-#DF4F48 flex-center cursor-pointer text-white",
    "pc-btn-gray": "bg-#F2F3F5 flex-center cursor-pointer text-#515968",
    "pc-pagin-box":
      "border-1 border-solid border-#E5E6EB flex-center w30px h30px cursor-pointer",
    "pc-order-top-box": "pl16px flex items-center h81px my16px rd-2px",
  },
});
