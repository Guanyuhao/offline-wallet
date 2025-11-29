<script setup lang="ts">
import { onMounted } from 'vue';
import { useMessage } from 'naive-ui';
import { setMessageApi } from '../composables/useMessage';

const message = useMessage();

onMounted(() => {
  setMessageApi(message);
});
</script>

<template>
  <div style="display: none">
    <!-- This component only sets up the message API -->
  </div>
</template>
