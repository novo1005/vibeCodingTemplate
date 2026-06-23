<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton/index.vue'
import BaseEmpty from '@/components/BaseEmpty/index.vue'
import BaseInput from '@/components/BaseInput/index.vue'
import DocumentWorkbenchItem from '../components/DocumentWorkbenchItem.vue'
import { useDocumentWorkbenchList } from '../composables/useDocumentWorkbenchList'
import type { DocumentWorkbench } from '../types'

const { items, loading, remaining, fetchAll, create, update, remove } = useDocumentWorkbenchList()
const title = ref('')

onMounted(fetchAll)

async function onCreate() {
  if (!title.value.trim()) return
  await create({ title: title.value.trim() })
  title.value = ''
}

function onToggle(item: DocumentWorkbench) {
  void update(item.id, { done: !item.done })
}

function onRemove(item: DocumentWorkbench) {
  void remove(item.id)
}
</script>

<template>
  <section class="document-workbench-list">
    <header>
      <h2>Document Workbench Scaffold</h2>
      <p>{{ remaining }} open scaffold items</p>
    </header>

    <form class="document-workbench-list__form" @submit.prevent="onCreate">
      <BaseInput v-model="title" placeholder="Add scaffold item" />
      <BaseButton type="submit">Add</BaseButton>
    </form>

    <p v-if="loading">Loading...</p>
    <BaseEmpty v-else-if="items.length === 0" description="No scaffold items yet." />
    <ul v-else>
      <DocumentWorkbenchItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        @toggle="onToggle"
        @remove="onRemove"
      />
    </ul>
  </section>
</template>

<style scoped lang="less">
.document-workbench-list {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px;

  &__form {
    display: flex;
    gap: 12px;
    margin: 24px 0;
  }
}
</style>
