<template>
  <pc-mine-layout>
    <div hfull flex-col-center pt34px pb40px>
      <div wfull px38px>
        <div wfull flex>
          <div w56px font-500 text-right mr16px mt28px>头像</div>
          <div flex-1 pb15px border-b="1px solid #E5E6EB">
            <!-- <my-upload width="72px" height="72px" :maxCount="1" @getUploadImg="uploadSuccess"> -->
            <div w72px h72px relative>
              <uv-avatar :src="avatar" size="72px"></uv-avatar>
              <!-- <img src="/static/images/pc/mine/edit.png" w20px h20px absolute bottom-0 right-0> -->
            </div>
            <!-- </my-upload> -->
          </div>
        </div>
        <div wfull flex pt28px>
          <div w56px font-500 text-right mr16px>用户昵称</div>
          <div flex-1 flex justify-between border-b="1px solid #E5E6EB" pb20px>
            <my-form v-if="isNickEdit" :focus="true" v-model="nickName" flex-1></my-form>
            <div v-else h24px flex items-center flex-1>{{ nickName }}</div>
            <!-- <div text="#305EF6" font-500 cursor-pointer @click="isNickEdit = !isNickEdit">
              {{ isNickEdit ? '取消' : '修改' }}
            </div> -->
          </div>
        </div>
        <!-- <div wfull flex pt28px>
          <div w56px font-500 text-right mr16px>手机号</div>
          <div flex-1 flex justify-between border-b="1px solid #E5E6EB" pb20px>
            <div flex-1>{{ maskString(phone)  }}</div>
            <div text="#305EF6" font-500 cursor-pointer @click="popupRef.open()">{{ phone ? '修改' : '绑定' }}</div>
          </div>
        </div> -->
      </div>
      <!-- <div w452px h44px rd-4px text-16px font-500 pc-btn-sub mt60px @click="handleSub">
        <uv-loading-icon color="#fff" size="14" mr2px v-if="loading"></uv-loading-icon>
        确定
      </div> -->
      <div flex-1></div>
      <div w270px h270px rd-4px bg="#305EF6 op-6" flex-col-center pt-40px>
        <div text-16px mb20px>扫描下方二维码关注公众号</div>
        <img src="/static/images/gzh.jpg" w148px h148px>
      </div>
    </div>
    <!-- 修改手机号 -->
    <uv-popup ref="popupRef" round="4px" mode="center" @close="popupRef.close()">
      <div w480px>
        <div h48px border-b="1px solid #E5E6EB" flex-between pl20px pr18px>
          <div text-16px font-500>{{ phone ? '修改手机号' : '绑定手机号' }}</div>
          <img src="/static/images/pc/common/pop-close.png" w16px h16px cursor-pointer @click="popupRef.close()">
        </div>
        <div p26px border-b="1px solid #E5E6EB">
          <div v-if="phone" h42px pl12px flex items-center rd-4px bg="#F2F3F5" text="#AAAEB7">{{ phone }}</div>
          <div h42px my20px pl12px flex items-center rd-4px bg="#F2F3F5" text="#AAAEB7">
            <my-form type="number" placeholder="请输入新手机号" v-model="editPhone"></my-form>
          </div>
          <div flex-between h42px gap-24px>
            <div flex-1 h42px flex items-center rd-4px pl12px bg="#F2F3F5">
              <my-form type="number" placeholder="请输入验证码" v-model="editCode"></my-form>
            </div>
            <my-countDown :phone="editPhone" #default="{ msg }">
              <div border="1px solid #305EF6" w127px font-500 h42px flex-center cursor-pointer rd-4px text="#305EF6">
                {{ msg }}
              </div>
            </my-countDown>
          </div>
        </div>
        <div flex justify-end py16px gap-12px pr20px>
          <div pc-btn-gray rd-4px font-500 w60px h32px @click="popupRef.close()">取消</div>
          <div pc-btn-sub rd-4px font-500 w60px h32px @click="handleBindPhone">
            <uv-loading-icon color="#fff" size="14" mr2px v-if="btnLoading"></uv-loading-icon>
            确定
          </div>
        </div>
      </div>
    </uv-popup>
  </pc-mine-layout>
</template>

<script lang="ts" setup>
import { editUserInfo, bindPhone } from '@/api/user'

const nickName = ref('')
const avatar = ref('')
const phone = ref('')
const popupRef = ref()
const editPhone = ref('')
const editCode = ref('')
const isNickEdit = ref(false)

// 使用 store
const user = useUser() as any
const { fetchUserInfo, getUserInfoSync, setUserInfo } = user

onMounted(async () => {
  await fetchUserInfo() // 关键：确保已拉取到用户信息
  const info = getUserInfoSync()
  nickName.value = info?.nickName || ''
  phone.value = info?.phone || ''
  avatar.value = info?.avatar || ''
})

function uploadSuccess(url: string) {
  avatar.value = url || ''
}

const loading = ref(false)
const handleSub = async () => {
  isNickEdit.value = false
  if (!nickName.value) {
    uni.$showToast('请输入昵称')
    return
  }
  loading.value = true
  try {
    await editUserInfo({
      nickName: nickName.value,
      avatar: avatar.value
    })
    setUserInfo({ ...getUserInfoSync(), nickName: nickName.value, avatar: avatar.value })
    uni.showToast({ title: '修改成功' })
  } finally {
    loading.value = false
  }
}

const btnLoading = ref(false)
function handleBindPhone() {
  if (!uni.$uv.test.mobile(editPhone.value)) {
    uni.$showToast('请输入正确手机号')
    return
  }
  if (!editCode.value) {
    uni.$showToast('请输入验证码')
    return
  }
  btnLoading.value = true
  bindPhone({ phone: editPhone.value, code: editCode.value }).then(() => {
    uni.$showToast('绑定成功')
    phone.value = editPhone.value
    setUserInfo({ ...getUserInfoSync(), phone: phone.value })
    popupRef.value.close()
  }).finally(() => {
    btnLoading.value = false
  })
}

/**
 * 将字符串转换为相同长度的星号
 * @param str - 输入字符串
 * @returns 相同长度的星号字符串
 */
function maskString(str: string): string {
  return '*'.repeat(str.length);
}
</script>

<style lang="scss" scoped></style>