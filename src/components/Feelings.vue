<template>
  <div class="feelings">
    <tag
      v-for="(feeling, index) in feelings"
      :key="index"
      :color="getColorForFeeling(feeling)"
      :isActive="!!feeling.isSelected || !isInteractive"
      @click="toggleSelection(index)">
      {{ feeling.name }}
    </tag>
  </div>
</template>

<script>
import Tag, { COLORS } from '@/components/Tag.vue';

export default {
  name: 'feelings',
  components: {
    Tag,
  },
  props: {
    feelings: Array,
    isInteractive: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    toggleSelection(index) {
      if (this.isInteractive) {
        const feeling = this.feelings[index];
        feeling.isSelected = !feeling.isSelected;
        this.$set(this.feelings, index, feeling);
      }
    },
    getColorForFeeling(feeling) {
      switch (feeling.type) {
        case 'positive':
          return COLORS.green;
        case 'neutral':
          return COLORS.blue;
        case 'negative':
          return COLORS.red;
        default:
          return COLORS.yellow;
      }
    },
  },
};
</script>

<style scoped lang="scss">
</style>
