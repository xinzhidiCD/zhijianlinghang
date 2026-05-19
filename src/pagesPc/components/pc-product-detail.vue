<script setup lang='ts'>
import { getLiveProductDetail } from "@/api/live";
import { preOrder } from '@/api/order'
import { storeToRefs } from 'pinia'

const emit = defineEmits(['pay'])
const popUpRef = ref()
const tabList = ref<string[]>([])
const tabIndex = ref(0)
const productInfo = ref<any>({})
const { getUser } = useAuth()
function open(productId: string) {
  getLiveProductDetail(productId, getUser()?.liveId).then((res: any) => {
    productInfo.value = res.data
    tabIndex.value = 0
    if (res.data?.products?.productType === 1) {
      tabList.value = ['商品详情', '商品目录']
    } else {
      tabList.value = ['商品详情']
    }
  })
  popUpRef.value.open()

}
defineExpose({ open })

const { openLink } = useTool()
function toPay() {
  if (productInfo.value?.products?.productType !== 1) {
    openLink(productInfo.value?.products?.externalLink)
    return
  }
  preOrder({ productId: productInfo.value?.products?.productId, liveId: getUser()?.liveId }).then((res: any) => {
    popUpRef.value.close()
    emit('pay', res.data.preOrderNo)
  })

}

const setting = useSetting()
const { settingInfo } = storeToRefs(setting)

</script>

<template>
  <uv-popup ref="popUpRef" mode="center" bgColor="none">
    <div v-if="Object.keys(productInfo).length" w604px bg-white rd-4px h74vh flex flex-col>
      <div border-b="1px solid #E5E6EB" h56px flex-between px20px>
        <div text-16px font-500>商品详情</div>
        <div w20px h20px cursor-pointer flex-center @click="popUpRef.close()">
          <img src="/static/images/pc/common/pop-close.png" w12px h12px>
        </div>
      </div>
      <div pt16px px20px flex-1 flex-shrink-0 overflow-x-hidden overflow-y-auto>
        <view w564px h269px rd-4px>
          <uv-swiper :list="productInfo.productGalleries.map((x: { imageUrl: string }) => x.imageUrl)"
            height="269px"></uv-swiper>
        </view>
        <div mt16px text-18px font-500 leading-28px>{{ productInfo?.products?.title }}</div>
        <div mt8px text="#515968">{{ productInfo?.products?.sellingPoints }}</div>
        <div mt20px flex-between border-b="1px solid #E5E6EB" pb16px>
          <div flex items-center>
            <div>
              <span text="#DF4F48" font-bold>¥<span ml4px text-20px leading-20px>{{ productInfo?.products?.price / 100
              }}</span></span>
              <span text="#88909B" ml8px>¥{{ productInfo?.products?.originalPrice / 100 }}</span>
            </div>
            <div text="#305EF6" ml12px flex-center bg="#305EF6 op-12" w68px h22px rd-4px>
              {{ productInfo?.products?.validUntil === 0 ? '长期有效' : `${productInfo?.products?.validUntil}天有效` }}
            </div>
          </div>
          <div text="#88909B 12px">限购：{{ productInfo?.products?.quota === 0 ? '不限制' : `${productInfo?.products?.quota}`
          }}
            <span ml16px>销量：{{ settingInfo?.liveConfig?.isItemSoldNumEnabled ? (productInfo?.products?.salesVolume +
              productInfo?.liveProducts?.virtualSales) : '***'
              }}</span>
          </div>
        </div>
        <template v-if="tabList.length === 1">
          <div mt12px font-500>
            商品详情
          </div>
          <div leading-24px mt16px>
            <uv-parse :content="productInfo?.products?.description"></uv-parse>
          </div>
        </template>
        <template v-else>
          <div flex justify-between pt12px border-b="1px solid #E5E6EB" px113px>
            <div v-for="c, k in tabList" :key="k" cursor-pointer @click="tabIndex = k"
              :class="[tabIndex === k ? 'text-[#305EF6] font-500' : 'text-[#515968]']">
              {{ c }}<div v-if="tabIndex === k" bg="#305EF6" w56px h2px mt8px></div>
            </div>
          </div>
          <div v-if="tabIndex === 0" leading-24px mt16px>
            <uv-parse :content="productInfo?.products?.description"></uv-parse>
          </div>
          <div v-else mt16px>
            <div v-for="c, k in productInfo?.productCourseRelations" :key="k" mt12px>
              <div font-500>{{ c.title }}（{{ c.coursesChapters.length }}）</div>
              <div v-for="(chapter, i) in c.coursesChapters" :key="i" ml20px mt8px>
                {{ i + 1 }}. {{ chapter.title }}
                <template v-for="(sub, j) in chapter.coursesKnobbles" :key="j">
                  <div ml20px mt8px cursor-pointer>{{ i + 1 }}.{{ j }}、{{ sub.title }}</div>
                </template>
              </div>
            </div>
          </div>
        </template>
      </div>
      <div h72px wfull flex items-center px20px>
        <div h32px wfull flex justify-between items-end>
          <div>
            实付：<span text="#DF4F48" font-bold ml4px>¥<span text-24px ml4px>
                {{ productInfo?.products?.price / 100 }}</span></span>
          </div>
          <div class="pc-btn-error rd-4px font-500 w94px h32px" @click="toPay">立即支付</div>
        </div>
      </div>
    </div>
  </uv-popup>
</template>