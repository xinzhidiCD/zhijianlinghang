<script setup lang='ts'>
import { getLiveProductsList } from '@/api/live'
import { v4 as uuidv4 } from 'uuid'
const props = defineProps<{
  type?: string
}>()
const showProduct = ref(false)
const emit = defineEmits(['select'])
function toDetail() {
  if (props.type === 'pc') {
    emit('select', productInfo.value?.productId)
  } else {
    uni.$goToPage(`/pages/home/productDetail?productId=${productInfo.value?.productId}`)
  }
}

// 处理商品队列
const productQueue: any = ref([])
let closeProductUuid: any = null // 关闭的商品uuid
function processProductQueue() {
  if (showProduct.value || productQueue.value.length === 0 || isShowExplaining) {
    return
  }

  const nextProduct = productQueue.value.shift()
  if (closeProductUuid && closeProductUuid === nextProduct?.uuid) {
    // 关闭的商品不再显示
    showProduct.value = false
    nextTick(() => {
      processProductQueue()
    })
    return
  }
  productInfo.value = nextProduct
  showProduct.value = true

  if (productQueue.value.length === 0 && nextProduct.showType == 2) {
    // 最后一条并且是长期就不关
    return
  }
  setTimeout(() => {
    if (isShowExplaining) {
      // 讲解中不处理
      return
    }
    showProduct.value = false
    // 递归处理下一个商品
    nextTick(() => {
      processProductQueue()
    })
  }, 10000)
}

// 商品信息
const productInfo = ref<any>({})

// 是否显示讲解商品
let isShowExplaining = false
function open(content: any) {
  isShowExplaining = true
  showProduct.value = false
  setTimeout(() => {
    productInfo.value = JSON.parse(content)
    showProduct.value = true
  }, 100)
}
// 取消讲解
function cancel() {
  console.log('取消讲解')
  if (isShowExplaining) {
    isShowExplaining = false
    showProduct.value = false
  }
}
// 商品上架
function productOpen(content: any) {
  if (isShowExplaining) {
    // 讲解中不处理
    return
  }
  const obj = JSON.parse(content || '{}')
  if (obj.showType == 2) {
    // 长期
    productQueue.value.push(obj)
    processProductQueue()
  } else {
    // 间隔
    const uuid = uuidv4()
    for (let i = 0; i < obj.interval; i++) {
      setTimeout(() => {
        productQueue.value.push({ ...obj, uuid })
        processProductQueue()
      }, i * obj.intervalTime * 1000)
    }
  }
}

function closeProduct() {
  showProduct.value = false
  closeProductUuid = productInfo.value?.uuid
}

const { getUser } = useAuth()
onMounted(() => {
  getLiveProductsList({ roomId: getUser()?.liveId, explainStatus: 1 }).then(res => {
    if (res.rows.length > 0) {
      const obj = res.rows[0] || {}
      setTimeout(() => {
        open(JSON.stringify(obj))
      }, 500)

    }

  })
})

defineExpose({
  open,
  cancel,
  productOpen
})
</script>

<template>
  <transition name="slide-in-right">
    <view v-if="showProduct" class="bg-white rd-12rpx w480rpx h560rpx p4rpx absolute z-2 right-24rpx"
      :class="[type === 'pc' ? 'bottom-68px cursor-pointer' : 'bottom-140rpx']" @click="toDetail">
      <image @click.stop="closeProduct" src="/static/images/h5/common/close-white.png" cursor-pointer w48rpx h48rpx
        absolute top-20rpx right-20rpx z-1 />
      <image :src="productInfo.coverImage" class="wfull h352rpx rd-8rpx" />
      <view truncate text-40rpx my16rpx px20rpx>{{ productInfo.title }}</view>
      <view mx20rpx text-white bg="#DC3939" rd-8rpx flex items-center>
        <view pl16rpx>
          <text text-32rpx>¥</text>
          <text text-48rpx font-500>{{ productInfo.price / 100 }}</text>
        </view>
      </view>
    </view>
  </transition>
</template>