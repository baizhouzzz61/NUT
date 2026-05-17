import { defineStore } from 'pinia'
import { ref } from 'vue'
import { addTopic, getAllTopics } from '../db'

export const useTopicStore = defineStore('topic', () => {
  const topics = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadTopics() {
    loading.value = true
    error.value = null
    try {
      topics.value = await getAllTopics()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function saveTopic(topic) {
    error.value = null
    await addTopic(topic)
    await loadTopics()
  }

  loadTopics()

  return { topics, loading, error, loadTopics, saveTopic }
})
