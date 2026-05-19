<template>
  <view :class="['emoji-picker', themeClass]">
    <view class="emoji-tabs">
      <view v-for="(category, index) in emojiCategories" :key="index" class="tab-item"
        :class="{ active: activeTab === index }" @click="activeTab = index">
        {{ category.name }}
      </view>
    </view>

    <scroll-view class="emoji-grid" scroll-y>
      <view class="emoji-list">
        <view v-for="emoji in emojiCategories[activeTab].emojis" :key="emoji.code" class="emoji-item"
          @click="selectEmoji(emoji)">
          {{ emoji.char }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
const activeTab = ref(0)
const props = defineProps<{
  theme?: 'light' | 'dark'
}>()
const themeClass = computed(() => props.theme === 'dark' ? 'emoji-picker--dark' : 'emoji-picker--light')


const emit = defineEmits<{
  select: [emoji: { char: string; code: string; name: string }]
}>()

const emojiCategories = [
  {
    name: '笑脸',
    emojis: [
      { char: '😀', code: 'grinning', name: '咧嘴笑' },
      { char: '😁', code: 'grin', name: '露齿笑' },
      { char: '😂', code: 'joy', name: '喜极而泣' },
      { char: '🤣', code: 'rofl', name: '笑翻了' },
      { char: '😃', code: 'smiley', name: '笑脸' },
      { char: '😄', code: 'smile', name: '微笑' },
      { char: '😅', code: 'sweat_smile', name: '汗颜' },
      { char: '😆', code: 'laughing', name: '大笑' },
      { char: '😉', code: 'wink', name: '眨眼' },
      { char: '😊', code: 'blush', name: '脸红' },
      { char: '😋', code: 'yum', name: '美味' },
      { char: '😎', code: 'sunglasses', name: '墨镜' },
      { char: '😍', code: 'heart_eyes', name: '心形眼' },
      { char: '😘', code: 'kissing_heart', name: '飞吻' },
      { char: '🥰', code: 'smiling_face_with_hearts', name: '爱心脸' },
      { char: '😗', code: 'kissing', name: '亲吻' },
      { char: '😙', code: 'kissing_smiling_eyes', name: '眯眼亲吻' },
      { char: '😚', code: 'kissing_closed_eyes', name: '闭眼亲吻' },
      { char: '🙂', code: 'slightly_smiling_face', name: '微微笑' },
      { char: '🤗', code: 'hugs', name: '拥抱' }
    ]
  },
  {
    name: '手势',
    emojis: [
      { char: '👍', code: 'thumbsup', name: '赞' },
      { char: '👎', code: 'thumbsdown', name: '踩' },
      { char: '👌', code: 'ok_hand', name: 'OK' },
      { char: '✌️', code: 'v', name: '胜利' },
      { char: '🤞', code: 'crossed_fingers', name: '祈祷' },
      { char: '🤟', code: 'love_you_gesture', name: '爱你' },
      { char: '🤘', code: 'metal', name: '摇滚' },
      { char: '🤙', code: 'call_me_hand', name: '打电话' },
      { char: '👈', code: 'point_left', name: '左指' },
      { char: '👉', code: 'point_right', name: '右指' },
      { char: '👆', code: 'point_up_2', name: '上指' },
      { char: '👇', code: 'point_down', name: '下指' },
      { char: '☝️', code: 'point_up', name: '食指' },
      { char: '✋', code: 'hand', name: '举手' },
      { char: '🤚', code: 'raised_back_of_hand', name: '手背' },
      { char: '🖐️', code: 'raised_hand_with_fingers_splayed', name: '张开手' },
      { char: '🖖', code: 'vulcan_salute', name: '瓦肯礼' },
      { char: '👋', code: 'wave', name: '挥手' },
      { char: '🤏', code: 'pinching_hand', name: '捏' },
      { char: '👏', code: 'clap', name: '鼓掌' },
    ]
  },
  {
    name: '心情',
    emojis: [
      { char: '😐', code: 'neutral_face', name: '面无表情' },
      { char: '😑', code: 'expressionless', name: '无语' },
      { char: '😶', code: 'no_mouth', name: '闭嘴' },
      { char: '😏', code: 'smirk', name: '得意' },
      { char: '😒', code: 'unamused', name: '不爽' },
      { char: '🙄', code: 'roll_eyes', name: '翻白眼' },
      { char: '😬', code: 'grimacing', name: '咧嘴' },
      { char: '🤥', code: 'lying_face', name: '说谎' },
      { char: '😔', code: 'pensive', name: '沉思' },
      { char: '😪', code: 'sleepy', name: '困' },
      { char: '🤤', code: 'drooling_face', name: '流口水' },
      { char: '😴', code: 'sleeping', name: '睡觉' },
      { char: '😷', code: 'mask', name: '口罩' },
      { char: '🤒', code: 'face_with_thermometer', name: '发烧' },
      { char: '🤕', code: 'face_with_head_bandage', name: '受伤' },
      { char: '🤢', code: 'nauseated_face', name: '恶心' },
      { char: '🤮', code: 'vomiting_face', name: '呕吐' },
      { char: '🤧', code: 'sneezing_face', name: '打喷嚏' },
      { char: '🥵', code: 'hot_face', name: '热' },
      { char: '🥶', code: 'cold_face', name: '冷' }
    ]
  }
]

const selectEmoji = (emoji: { char: string; code: string; name: string }) => {
  emit('select', emoji)
}
</script>

<style scoped lang="scss">
.emoji-picker {
  height: 450rpx;
  overflow: hidden;

  &--light {
    background: #fff;
    color: #222;

    .emoji-tabs {
      display: flex;
      background: #f5f5f5;
      border-bottom: 1px solid #eee;

      .tab-item {
        flex: 1;
        padding: 10px;
        text-align: center;
        font-size: 14px;
        cursor: pointer;
        color: #666;

        &.active {
          background: #fff;
          color: #007aff;
          font-weight: 500;
        }
      }
    }

    .emoji-grid {
      height: calc(100% - 41px);

      .emoji-list {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 8px;
        padding: 10px;

        .emoji-item {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          border-radius: 4px;

          &:hover {
            background: #f0f0f0;
          }
        }
      }
    }
  }

  &--dark {
    background: #232323;
    color: #eee;

    .emoji-tabs {
      display: flex;
      background: #1a1a1a;
      border-bottom: 1px solid #444;

      .tab-item {
        flex: 1;
        padding: 10px;
        text-align: center;
        font-size: 14px;
        cursor: pointer;
        color: #bbb;

        &.active {
          background: #232323;
          color: #4fc3f7;
          font-weight: 500;
        }
      }
    }

    .emoji-grid {
      height: calc(100% - 41px);

      .emoji-list {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 8px;
        padding: 10px;

        .emoji-item {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          border-radius: 4px;

          &:hover {
            background: #333;
          }
        }
      }
    }
  }
}
</style>