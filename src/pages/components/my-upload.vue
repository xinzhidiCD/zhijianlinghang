<script setup lang='ts'>
import { getOssConfig } from '@/api/other'
const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  uploadText: {
    type: String,
    default: ''
  },
  uploadIcon: {
    type: String,
    default: 'plus'
  },
  maxCount: {
    type: Number,
    default: 5
  },
  index: {
    type: Number,
    default: 0
  },
  width: {
    type: String,
    default: '80px'
  },
  height: {
    type: String,
    default: '80px'
  },
})

const emit = defineEmits(['getUploadImg'])
const fileList1 = ref<any[]>([])

watch(
  () => props.files,
  (v) => {
    fileList1.value = v.map((item: any) => ({
      status: "success",
      upload: true,
      url: item
    }))
    // console.log(fileList1.value, '回显的');
  },
  { immediate: true }
)

// 删除图片
function deletePic(event: any) {
  fileList1.value.splice(event.index, 1)
}

// 新增图片
async function afterRead(event: any) {
  let lists: any = [].concat(event.file)
  let fileListLen = fileList1.value.length
  lists.forEach((item: any) => {
    fileList1.value.push({
      ...item,
      status: 'uploading',
      message: '上传中'
    })
  })
  for (let i = 0; i < lists.length; i++) {
    const result: any = await uploadFilePromise(lists[i].url, lists[i].name)
    let item = fileList1.value[fileListLen]
    fileList1.value.splice(fileListLen, 1, Object.assign(item, {
      status: 'success',
      message: '',
      ...result
    }))
    let imgData = fileList1.value.map(item => item.url)
    if (props.maxCount == 1) {
      emit('getUploadImg', imgData[0])
    } else {
      emit('getUploadImg', imgData)
    }
    fileListLen++
  }
}

function uploadFilePromise(url: string, originalName?: string) {
  return new Promise((resolve, reject) => {
    getOssConfig().then(res => {
      const { accessid, policy, signature, host, allowedAcl } = res.data

      // 优先从原始文件名获取扩展名，否则默认为.jpg
      let ext = '.jpg'
      if (originalName && originalName.includes('.')) {
        ext = originalName.substring(originalName.lastIndexOf('.'))
      } else if (url && !url.startsWith('blob:') && url.includes('.')) {
        ext = url.substring(url.lastIndexOf('.'))
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`

      // 使用 uni.uploadFile 上传文件到OSS
      uni.uploadFile({
        url: host,
        filePath: url, // blob URL路径
        name: 'file', // 文件字段名
        formData: {
          key: fileName,
          policy,
          OSSAccessKeyId: accessid,
          signature,
          success_action_status: '200'
        },
        header: {
          'x-oss-object-acl': allowedAcl
        },
        success: (res) => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            resolve({
              url: `${host}/${fileName}`,
              ossId: fileName
            })
          } else {
            reject(new Error('上传失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  })
}
</script>

<template>
  <view>
    <uv-upload :width="width" :height="height" :fileList="maxCount === 1 ? [] : fileList1" :uploadIcon="props.uploadIcon"
      :uploadText="props.uploadText" @afterRead="afterRead" @delete="deletePic" multiple :maxCount="props.maxCount">
      <slot></slot>
    </uv-upload>
  </view>
</template>

<style lang="scss"></style>