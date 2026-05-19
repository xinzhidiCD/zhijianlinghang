<template>
  <img src="/static/images/pc/login/login-bg.png" wfull h100vh block />
  <div wfull h100vh flex-center absolute top-0 left-0>
    <div w600px h391px rd-8px bg-white p24px>
      <div flex items-center cursor-pointer text="#88909B" @click="$goBack()">
        <img src="/static/images/pc/common/back.png" w16px h16px mr4px />
        返回
      </div>
      <div mt4px flex-col-center wfull>
        <img src="/static/images/pc/common/dun.png" w168px h168px>
        <div text-24px mt32px mb18px font-bold>暂无访问权限</div>
        <div text="16px #88909B">如有疑问请联系您的邀请人</div>
      </div>
    </div>
  </div>
</template>