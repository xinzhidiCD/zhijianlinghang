<script setup lang='ts'>
defineProps<{
  title: string,
  icon: string
}>()
</script>

<template>
  <div pc-player-full bg="#2D2D2D">
    <div w380px h190px bg="white op-10" rd-8px flex-col-center pt40px>
      <img :src="icon" w64px h64px mb24px>
      <div text="20px white">{{ title }}</div>
    </div>
  </div>
</template>