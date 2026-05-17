<script setup>
import { ref, h } from 'vue'
import { useRouter } from 'vue-router'
import { useTopicStore } from '../stores/topic'
import { SOURCE_AI } from '../shared/schema'
import ExampleSentence from '../components/ExampleSentence.vue'
import {
  NButton, NDataTable, NModal, NTabs, NTabPane, NText, NH1, NSpace,
} from 'naive-ui'

const router = useRouter()
const store = useTopicStore()

const showPreview = ref(false)
const previewTopic = ref(null)
const previewTab = ref('all')

function preview(topic) {
  previewTopic.value = topic
  previewTab.value = 'all'
  showPreview.value = true
}

const columns = [
  { title: 'Title', key: 'title', ellipsis: { tooltip: true } },
  { title: 'Examples', key: 'examples', width: 80,
    render(row) { return row.examples?.length || 0 }
  },
  { title: 'Sources', key: 'sources', width: 100,
    render(row) {
      return `${row.usedTranscriptIds?.length || 0} transcripts`
    }
  },
  { title: 'Created', key: 'createdAt', width: 180,
    render(row) { return new Date(row.createdAt).toLocaleString() }
  },
  {
    title: 'Actions', key: 'actions', width: 100,
    render(row) {
      return h(NButton, { size: 'small', onClick: () => preview(row) }, { default: () => 'View' })
    }
  },
]
</script>

<template>
  <div style="max-width: 900px; margin: 40px auto; padding: 0 20px">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <NH1>Topic History</NH1>
      <NSpace>
        <NButton @click="router.push('/')" secondary>Library</NButton>
        <NButton @click="router.push('/generate')" tertiary>Generate</NButton>
      </NSpace>
    </div>

    <NDataTable :columns="columns" :data="store.topics" :bordered="false" />
    <NText v-if="!store.topics.length" depth="3" style="display: block; text-align: center; margin-top: 60px">
      No topics yet. Go to Generator to create one.
    </NText>

    <NModal v-model:show="showPreview" title="Topic Detail" style="width: 750px">
      <div v-if="previewTopic" style="padding: 8px; max-height: 70vh; overflow-y: auto">
        <h2 style="margin-bottom: 16px">{{ previewTopic.title }}</h2>

        <NTabs v-model:value="previewTab">
          <NTabPane name="all" tab="All Examples">
            <ExampleSentence
              v-for="(ex, i) in previewTopic.examples" :key="i"
              :index="i + 1" :text="ex.text" :source="ex.source" :transcript-title="ex.transcriptTitle"
              style="margin-bottom: 8px"
            />
          </NTabPane>
          <NTabPane name="source" tab="From Transcripts">
            <template v-for="(ex, i) in previewTopic.examples" :key="i">
              <ExampleSentence
                v-if="ex.source !== SOURCE_AI"
                :index="i + 1" :text="ex.text" :source="ex.source" :transcript-title="ex.transcriptTitle"
                style="margin-bottom: 8px"
              />
            </template>
            <NText v-if="!previewTopic.examples.some(e => e.source !== SOURCE_AI)" depth="3">
              No examples from transcripts.
            </NText>
          </NTabPane>
        </NTabs>
      </div>
    </NModal>
  </div>
</template>
