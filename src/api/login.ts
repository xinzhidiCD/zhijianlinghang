import { get, post } from "@/utils/request";

// login
export function userlogin(data: any) {
  return post("/user/login", data);
}

// skipBindPhone
export function skipBindPhone() {
  return get("/user/live/skipBindPhone");
}