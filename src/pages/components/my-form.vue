<template>
  <view class="w-full">
    <template v-if="inputType.includes(type)">
      <uv-input v-model="value" :disabled="disabled" :disabledColor="disabledColor" :type="showType"
        :fontSize="fontSize" :color="color" :focus="focus" :inputAlign="inputAlign" :placeholder="placeholder"
        :border="border" :maxlength="maxlength" :placeholderStyle="placeholderStyle" customStyle="padddingLeft:0">
        <template #prefix>
          <slot name="prefix"></slot>
        </template>
        <template #suffix>
          <view v-if="type === 'password'" @click="showTypeChange" flex items-center cursor-pointer>
            <image v-if="showType === 'password'" src="/static/images/h5/common/eye.png" class="w-36rpx h-36rpx">
            </image>
            <image v-else src="/static/images/h5/common/eyes.png" class="w-36rpx h-36rpx"></image>
          </view>
          <slot name="suffix"></slot>
        </template>
      </uv-input>

    </template>
    <uv-textarea class="!p-0" v-if="type === 'textarea'" :disabled="disabled" :textStyle="textStyle" :count="count"
      :maxlength="maxlength" v-model="value" :placeholder="placeholder" :height="height" :border="border"
      :placeholderStyle="placeholderStyle"></uv-textarea>
  </view>
</template>

<script lang="ts" setup>
// props定义及默认值
const props = withDefaults(defineProps<{
  type?: string,
  border?: string,
  placeholderStyle?: string,
  placeholder?: string,
  fontSize?: string,
  height?: string | number,
  inputAlign?: string,
  color?: string,
  disabled?: boolean,
  disabledColor?: string,
  count?: boolean,
  maxlength?: number,
  textStyle?: object
  focus?: boolean
}>(), {
  value: '',
  type: 'text',
  border: 'none',
  placeholderStyle: 'color:#BFBFBF',
  placeholder: '请输入',
  fontSize: '28rpx',
  height: '120rpx',
  inputAlign: 'left',
  color: '#333',
  disabled: false,
  disabledColor: 'transpanent'
})
const inputType = ['text', 'password', 'number', 'idcard', 'digit']

const value = defineModel()
// 响应式变量
const showType = ref(props.type)

// 监听type变化
watch(() => props.type, (newVal) => {
  showType.value = newVal
}, { immediate: true })


function showTypeChange() {
  showType.value = showType.value === 'password' ? 'text' : 'password'
}
</script>

<style lang="scss">
.uv-textarea--disabled {
  background: transparent !important;
}
</style>