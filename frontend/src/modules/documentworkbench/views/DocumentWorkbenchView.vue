<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDocumentWorkbenchStore } from '../store'

const store = useDocumentWorkbenchStore()
const { documentTypes, selectedDocumentType, status, errorMessage } = storeToRefs(store)

onMounted(() => {
  void store.loadConfig()
})
</script>

<template>
  <section class="document-workbench">
    <header>
      <p class="document-workbench__eyebrow">Document Workbench</p>
      <h1>结构化文档工作台</h1>
      <p>先选择文档类型，再导入飞书链接或 Markdown 初稿。</p>
    </header>

    <div class="document-workbench__types">
      <button
        v-for="item in documentTypes"
        :key="item.typeId"
        type="button"
        :class="{ active: selectedDocumentType === item.typeId }"
        @click="store.setDocumentType(item.typeId)"
      >
        <strong>{{ item.label }}</strong>
        <span>{{ item.description }}</span>
      </button>
    </div>

    <p v-if="errorMessage" class="document-workbench__error">{{ errorMessage }}</p>
    <p class="document-workbench__status">当前状态：{{ status }}</p>
  </section>
</template>

<style scoped lang="less">
.document-workbench {
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px;

  &__eyebrow {
    color: @color-primary;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__types {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 24px;

    button {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 132px;
      padding: 18px;
      text-align: left;
      background: @bg-color;
      border: 1px solid @border-color;
      border-radius: 14px;
      cursor: pointer;

      &.active {
        border-color: @color-primary;
        box-shadow: 0 0 0 3px fade(@color-primary, 12%);
      }
    }
  }

  &__error {
    color: @color-danger;
  }

  &__status {
    margin-top: 20px;
    color: @text-color-secondary;
  }
}
</style>
