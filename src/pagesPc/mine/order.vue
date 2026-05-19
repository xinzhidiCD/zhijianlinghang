<template>
  <pc-mine-layout>
    <div p16px>
      <div text-16px font-500 pb13px border-b="1px solid #E5E6EB">我的订单</div>
      <div flex-between gap-22px mt16px>
        <div flex-1 h40px bg="#F2F3F5" px40px flex-between text-16px font-500 relative class="tab-container">
          <div v-for="c, k in statusList" :key="k" cursor-pointer relative transition-all-300
            :class="[(tabVal.status === c.status && tabVal.type === c.type) && 'text-#305EF6 active-tab']"
            @click="tabChange(c)">
            {{ c.name }}
          </div>
          <!-- 底部指示条 -->
          <div class="tab-indicator" :style="{
            transform: `translateX(${indicatorPosition}px)`,
            width: `${indicatorWidth}px`,
            left: '40px'
          }" h2px bg="#305EF6" absolute bottom-0 transition-all-300>
          </div>
        </div>
        <div w188px bg="#F2F3F5" h40px flex items-center text="#AAAEB7" px16px>
          <img src="/static/images/pc/common/search.png" w16px h16px mr4px>
          <my-form flex placeholder="商品名称" v-model="keyword" type="text"></my-form>
        </div>
      </div>
      <transition name="fade" mode="out-in">
        <div v-if="orderList.length" key="list">
          <div v-for="item, index in orderList" :key="index" border-b="1px solid #E5E6EB" cursor-pointer py8px flex
            @click="toDetail(item)">
            <img :src="item.productImg" w162px h77px mr16px>
            <div flex-1 flex justify-between>
              <div pt2px text="#87909B">
                <div font-500 text="#333">{{ item.productName }}</div>
                <div>x{{ item.productNum }}</div>
                <div>¥ {{ item.productPrice }}</div>
                <div>{{ item.orderNo }}</div>
              </div>
              <!-- 状态 -->
              <div v-if="item.orderStatus === OrderStatusEnum.PendingPayment" pt6px font-500>
                <div text="#DF4F48 right">待付款</div>
                <div mt13px flex items-end>
                  <div text="#DF4F48" mr19px>待付款：¥{{ item.payPrice }}</div>
                  <div pc-btn-error rd-4px w88px h28px>去付款</div>
                </div>
              </div>
              <div v-else-if="item.orderStatus === OrderStatusEnum.Refunded" pt6px font-500>
                <div text="#88909B right">退款完成</div>
                <div flex items-end>
                  <div mt19px mr19px>退款金额：¥{{ item.refundPrice }}</div>
                  <div v-if="item.viewUrl" pc-btn-sub rd-4px w88px h28px @click.stop="openLink(item.viewUrl)">
                    查看合同
                  </div>
                </div>
              </div>
              <div
                v-else-if="item.isSign && item.signStatus === ContractStatusEnum.Signing || ContractStatusEnum.RealNamePendingReview === item.signStatus || ContractStatusEnum.SigningPendingReview === item.signStatus"
                pt6px font-500>
                <div text="#305EF6 right">签约中</div>
                <div mt13px flex items-end>
                  <div>已付款：¥{{ item.payPrice }}</div>
                  <div
                    v-if="(item.signStatus === ContractStatusEnum.Signing || item.isRealName)
                      && ContractStatusEnum.RealNamePendingReview !== item.signStatus && ContractStatusEnum.SigningPendingReview !== item.signStatus"
                    pc-btn-sub rd-4px w88px h28px ml19px @click.stop="toLink(item.orderNo, index)">
                    <uv-loading-icon color="#fff" size="14" mr2px v-if="btnLoadingIndex === index"></uv-loading-icon>
                    {{ item.isRealName ? '去签约' : '去实名' }}
                  </div>
                </div>
              </div>
              <div
                v-else-if="item.signStatus === ContractStatusEnum.SignFailed || item.signStatus === ContractStatusEnum.Refused"
                pt6px font-500>
                <div text="#DF4F48 right">签约失败</div>
                <div mt13px flex items-end>退款金额：¥{{ item.payPrice }}
                  <div pc-btn-sub rd-4px w88px h28px ml19px @click.stop="toLink(item.orderNo, index)">
                    <uv-loading-icon color="#fff" size="14" mr2px v-if="btnLoadingIndex === index"></uv-loading-icon>
                    重新签约
                  </div>
                </div>
              </div>
              <div v-else-if="item.orderStatus === OrderStatusEnum.Completed" pt6px font-500>
                <div text="#57B142 right">已完成</div>
                <div flex items-end>
                  <div mt13px>应付款：¥{{ item.payPrice }}</div>
                  <div v-if="item.viewUrl" pc-btn-sub rd-4px w88px h28px @click.stop="openLink(item.viewUrl)">
                    查看合同
                  </div>
                </div>
              </div>
              <div v-else-if="item.orderStatus === OrderStatusEnum.Cancelled" pt6px font-500>
                <div text="#88909B right">已取消</div>
                <div mt19px>应付款：¥{{ item.payPrice }}</div>
              </div>
            </div>
          </div>
        </div>
        <pc-empty v-else key="empty"></pc-empty>
      </transition>
      <div v-if="total > 0" flex justify-end mt20px>
        <pc-pagination v-model:total="total" v-model:size="size" v-model:page="page" @change="getList"></pc-pagination>
      </div>
    </div>
  </pc-mine-layout>
</template>

<script lang="ts" setup>
import { OrderStatusEnum, ContractStatusEnum } from '@/utils/enum'
import { getOrderList, getContractSignLink } from '@/api/order'
const keyword = ref('')
const statusList = [
  {
    name: '全部',
    status: -1,
    type: undefined // 添加type属性保持一致性
  },
  {
    name: '待付款',
    type: 'status',
    status: OrderStatusEnum.PendingPayment
  },
  {
    name: '签约中',
    type: 'signStatus',
    status: ContractStatusEnum.Signing
  },
  {
    name: '已完成',
    type: 'status',
    status: OrderStatusEnum.Completed
  },
  {
    name: '签约失败',
    type: 'signStatus',
    status: ContractStatusEnum.SignFailed
  },
  {
    name: '已取消',
    type: 'status',
    status: OrderStatusEnum.Cancelled
  },
  {
    name: '退款',
    type: 'status',
    status: OrderStatusEnum.Refunded
  }
]
const tabVal: any = ref({ status: -1, type: undefined })
const total = ref(0)
const page = ref(1)
const size = ref(10)
const orderList: any = ref([])

// 添加指示器动画相关变量
const indicatorPosition = ref(0)
const indicatorWidth = ref(0)

function openLink(url: string) {
  window.open(url, '_blank')
}

// 计算指示器位置和宽度
function updateIndicator() {
  nextTick(() => {
    const tabContainer = document.querySelector('.tab-container')
    const allTabs = tabContainer?.querySelectorAll('div:not(.tab-indicator)')

    if (tabContainer && allTabs) {
      // 找到当前激活的tab索引
      const activeIndex = statusList.findIndex(item => {
        // 对于"全部"选项，比较status和type都为-1和undefined
        if (item.status === -1) {
          return tabVal.value.status === -1 && (tabVal.value.type === undefined || tabVal.value.type === item.type)
        }
        // 对于其他选项，比较status和type
        return item.status === tabVal.value.status && item.type === tabVal.value.type
      })

      if (activeIndex >= 0 && allTabs[activeIndex]) {
        const containerRect = tabContainer.getBoundingClientRect()
        const activeRect = allTabs[activeIndex].getBoundingClientRect()

        // 计算相对于容器内容区域的位置（排除padding）
        const containerPaddingLeft = 40 // px40px = 40px padding
        const leftOffset = activeRect.left - containerRect.left - containerPaddingLeft

        indicatorPosition.value = leftOffset
        indicatorWidth.value = activeRect.width
      }
    }
  })
}

function tabChange(obj: any) {
  tabVal.value = obj
  updateIndicator()
  initList()
}
function initList() {
  orderList.value = []
  total.value = 0
  page.value = 1
  getList()
}
// 签约
const btnLoadingIndex = ref(-1)
function toLink(orderNo: string, index: number) {
  const linkUrl = `${import.meta.env.VITE_DOMAIN}/pagesPc/mine/order/orderDetail?orderNo=${orderNo}`
  btnLoadingIndex.value = index
  getContractSignLink({ orderNo, verifyUrl: linkUrl + '&signStatus=5', signUrl: linkUrl + '&signStatus=6' }).then((res: any) => {
    window.location.href = res.data?.url
  }).finally(() => {
    btnLoadingIndex.value = -1
  })
}

function keywordChange() {
  uni.$uv.debounce(initList, 500)
}
watch(() => keyword.value, () => {
  keywordChange()
})
function getList() {
  const data: any = {
    pageNum: page.value,
    pageSize: size.value,
    keyWord: keyword.value,
  }
  if (tabVal.value.type)
    data[tabVal.value.type] = tabVal.value.status >= 0 ? tabVal.value.status : ''

  getOrderList(data).then((res: any) => {
    orderList.value = (res?.rows || []).map((x: any) => ({
      ...x,
      orderStatus: Number(x.orderStatus)
    }))
    total.value = res.total
  })
}
initList()

// 组件挂载后初始化指示器位置
onMounted(() => {
  // 增加延迟确保DOM完全渲染
  setTimeout(() => {
    updateIndicator()
  }, 100)
})

function toDetail(item: any) {
  uni.$toPcPage(`mine/order/orderDetail?orderNo=${item.orderNo}`)
}
</script>

<style lang="scss" scoped>
// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// Tab指示器动画
.tab-indicator {
  transition: all 0.3s ease;
}

// Tab项hover效果
.tab-container>div:hover {
  color: #305EF6;
  transition: color 0.2s ease;
}
</style>