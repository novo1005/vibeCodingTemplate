<script setup lang="ts">
import type { FrameworkId, FrameworkScore } from '../types'

defineProps<{
  scores: FrameworkScore[]
  selected: FrameworkId | ''
}>()

const emit = defineEmits<{
  (e: 'select', value: FrameworkId): void
}>()
</script>

<template>
  <section class="framework-selector">
    <h2>3. 选择结构框架</h2>
    <div v-if="scores.length" class="framework-selector__list">
      <button
        v-for="score in scores"
        :key="score.frameworkId"
        type="button"
        :class="['framework-selector__item', { active: selected === score.frameworkId }]"
        @click="emit('select', score.frameworkId)"
      >
        <strong>{{ score.frameworkId }}</strong>
        <span>{{ score.score }} 分</span>
        <small>{{ score.reason }}</small>
      </button>
    </div>
    <p v-else>导入初稿后会显示系统推荐。</p>
  </section>
</template>

<style scoped lang="less">
.framework-selector {
  &__list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: @space-md;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: @space-xs;
    padding: @space-md;
    text-align: left;
    background: @color-bg;
    border: 1px solid @color-border;
    border-radius: @radius-lg;
    cursor: pointer;

    &.active {
      border-color: @color-primary;
    }
  }
}
</style>
