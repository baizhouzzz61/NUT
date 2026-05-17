import { defineStore } from 'pinia'
import { ref } from 'vue'
import { addTranscript, updateTranscript, deleteTranscript, getAllTranscripts } from '../db'

export const useTranscriptStore = defineStore('transcript', () => {
  const transcripts = ref([])
  const loading = ref(false)

  async function loadTranscripts() {
    loading.value = true
    transcripts.value = await getAllTranscripts()
    loading.value = false
  }

  async function saveTranscript(transcript, id) {
    if (id) {
      await updateTranscript(id, transcript)
    } else {
      await addTranscript(transcript)
    }
    await loadTranscripts()
  }

  async function removeTranscript(id) {
    await deleteTranscript(id)
    await loadTranscripts()
  }

  loadTranscripts()

  return { transcripts, loading, loadTranscripts, saveTranscript, removeTranscript }
})
