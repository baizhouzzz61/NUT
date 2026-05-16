import { defineStore } from 'pinia'
import { ref } from 'vue'
import { addTopic, getAllTopics } from '../db'

export const useTopicStore = defineStore('topic', () => {
  const topics = ref([])
  const loading = ref(false)

  async function loadTopics() {
    loading.value = true
    topics.value = await getAllTopics()
    loading.value = false
  }

  async function saveTopic(topic) {
    await addTopic(topic)
    await loadTopics()
  }

  loadTopics()

  return { topics, loading, loadTopics, saveTopic }
})
