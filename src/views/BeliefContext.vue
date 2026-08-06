<template>
  <div>
    <div v-if="situation" class="context-block">
      <p class="context-label">Situation</p>
      <p class="context-text">{{ situation }}</p>
    </div>
    <!-- Every block of free text carried in from an earlier step is folded by
         default: the question this screen actually asks belongs above the
         fold, not below whatever was written before it. -->
    <div v-if="exceptions" class="context-block">
      <div class="context-toggle" @click="isExceptionsOpen = !isExceptionsOpen">
        <span class="context-label toggle-label">
          {{ isExceptionsOpen ? 'Ausnahmen ausblenden' : 'Ausnahmen anzeigen' }}
        </span>
        <v-icon small class="context-chevron">
          {{ isExceptionsOpen ? 'expand_more' : 'chevron_right' }}
        </v-icon>
      </div>
      <p v-if="isExceptionsOpen" class="context-text mt-1">{{ exceptions }}</p>
    </div>
    <div v-if="perspective" class="context-block">
      <div class="context-toggle" @click="isPerspectiveOpen = !isPerspectiveOpen">
        <span class="context-label toggle-label">
          {{ isPerspectiveOpen ? 'Neue Reaktion ausblenden' : 'Neue Reaktion anzeigen' }}
        </span>
        <v-icon small class="context-chevron">
          {{ isPerspectiveOpen ? 'expand_more' : 'chevron_right' }}
        </v-icon>
      </div>
      <p v-if="isPerspectiveOpen" class="context-text mt-1">{{ perspective }}</p>
    </div>
    <div v-if="reaction" class="context-block">
      <div class="context-toggle" @click="isReactionOpen = !isReactionOpen">
        <span class="context-label toggle-label">
          {{ isReactionOpen ? 'Reaktion ausblenden' : 'Reaktion anzeigen' }}
        </span>
        <v-icon small class="context-chevron">
          {{ isReactionOpen ? 'expand_more' : 'chevron_right' }}
        </v-icon>
      </div>
      <p v-if="isReactionOpen" class="context-text mt-1">{{ reaction }}</p>
    </div>
    <div v-if="feelings.length" class="context-block">
      <p class="context-label">Gefühle</p>
      <feeling-chips :items="feelings" type="feelings"></feeling-chips>
    </div>
    <div v-if="needs.length" class="context-block">
      <p class="context-label">Bedürfnisse</p>
      <feeling-chips :items="needs" type="needs"></feeling-chips>
    </div>
    <div v-if="origin" class="context-block">
      <div class="context-toggle" @click="isOriginOpen = !isOriginOpen">
        <span class="context-label toggle-label">
          {{ isOriginOpen ? 'Ursprung ausblenden' : 'Ursprung anzeigen' }}
        </span>
        <v-icon small class="context-chevron">
          {{ isOriginOpen ? 'expand_more' : 'chevron_right' }}
        </v-icon>
      </div>
      <p v-if="isOriginOpen" class="context-text mt-1">{{ origin }}</p>
    </div>
  </div>
</template>

<script>
import FeelingChips from '@/components/FeelingChips.vue';

// What the user already wrote, carried forward through the later steps of the
// wizard. One component so the blocks cannot drift apart from screen to screen.
export default {
  name: 'belief-context',
  components: { FeelingChips },
  props: {
    situation: { type: String, default: '' },
    exceptions: { type: String, default: '' },
    perspective: { type: String, default: '' },
    reaction: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    needs: { type: Array, default: () => [] },
    origin: { type: String, default: '' },
  },
  data() {
    return {
      isExceptionsOpen: false,
      isPerspectiveOpen: false,
      isReactionOpen: false,
      isOriginOpen: false,
    };
  },
};
</script>

<style scoped lang="scss">
.context-block { margin-top: 14px; }
.context-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  margin: 0 0 6px;
}
.context-text {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.5;
  margin: 0;
}
.context-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
// The label carries the tap, so its bottom margin would space the collapsed
// block out for nothing.
.toggle-label { margin: 0; }
.context-chevron { color: #636366 !important; margin-left: 2px; }
.mt-1 { margin-top: 6px !important; }
</style>
