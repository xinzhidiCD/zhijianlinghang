<script setup lang='ts'>
import { getLiveInfo } from "@/api/live";
const liveInfo: any = ref({})
onMounted(() => {
  getLiveInfo().then((res: any) => {
    liveInfo.value = res.data || {}
  })
})
</script>

<template>
  <div wfull h100vh flex flex-col>
    <pc-header :liveInfo="liveInfo"></pc-header>
    <div flex-1 mx56px bg="#2D2D2D" relative flex-center>
      <img src="/static/images/pc/common/close.png" @click="$goToPage('/pagesPc/home/home')"
        class=" cursor-pointer w12px h12px absolute z-2 top-20px right-20px">
      <div flex-col-center w380px h190px pt-40px bg="white op-10" rd-8px>
        <img src="/static/images/pc/home/kick.png" w64px h64px>
        <div text="20px white" mt24px>您已被请出教室</div>
      </div>
    </div>
    <pc-footer></pc-footer>
  </div>
</template>