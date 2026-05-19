import { getCurrentInstance } from "vue";
export function useGlobal() {
  return getCurrentInstance()?.proxy as any;
}
