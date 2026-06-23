<script setup lang="ts">
import BaseEmpty from '@/components/BaseEmpty/index.vue'
import type { QualityCheckItem } from '../types'

defineProps<{
  checks: QualityCheckItem[]
}>()

const labels = {
  passed: '通过',
  needs_revision: '建议修改',
  missing_info: '需补充',
} as const
</script>

<template>
  <section class="quality-check-panel">
    <h2>5. 规范检查</h2>
    <BaseEmpty v-if="checks.length === 0" description="生成预览后会显示规范检查" />
    <ul v-else>
      <li v-for="item in checks" :key="item.ruleId" :class="`quality-check-panel__item--${item.status}`">
        <strong>{{ item.label }}</strong>
        <span>{{ labels[item.status] }}</span>
        <p>{{ item.reason }}</p>
        <small v-if="item.suggestedRevision">{{ item.suggestedRevision }}</small>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="less">
.quality-check-panel {
  ul {
    display: grid;
    gap: @space-md;
    padding: 0;
    list-style: none;
  }

  li {
    padding: @space-md;
    border: 1px solid @color-border;
    border-radius: @radius-lg;
  }

  span {
    display: inline-block;
    margin-left: @space-sm;
    color: @color-text-secondary;
  }

  &__item--passed {
    border-color: fade(@color-success, 40%);
  }

  &__item--needs_revision {
    border-color: fade(@color-warning, 50%);
  }

  &__item--missing_info {
    border-color: fade(@color-danger, 50%);
  }
}
</style>
