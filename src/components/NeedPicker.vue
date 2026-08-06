<template>
  <v-flex>
    <p v-if="limitHint" class="limit-hint" :class="{ 'over-limit': isOverLimit }">{{ limitHint }}</p>

    <!-- Suggestions land as selections in the tree below rather than as a
         separate strip, so there is only ever one place a need is chosen. -->
    <div class="suggest-row">
      <template v-if="showApiKeyInput">
        <p class="caption grey--text mb-1">Anthropic API Key eingeben, um Vorschläge zu generieren:</p>
        <v-text-field
          v-model="apiKeyInput"
          label="API Key"
          type="password"
          single-line
          hide-details
          class="mb-2"
        ></v-text-field>
        <v-btn small flat color="primary" :disabled="!apiKeyInput" @click="saveApiKey">Speichern & generieren</v-btn>
        <v-btn small flat color="grey" @click="showApiKeyInput = false">Abbrechen</v-btn>
      </template>
      <template v-else>
        <v-btn small flat color="primary" class="ml-0" :loading="isLoading" @click="generateSuggestions">
          <v-icon small left>lightbulb_outline</v-icon>
          Vorschläge
        </v-btn>
        <v-btn v-if="apiKey" small flat icon @click="showApiKeyInput = true" title="API Key ändern">
          <v-icon small color="grey lighten-1">settings</v-icon>
        </v-btn>
      </template>
    </div>

    <p v-if="suggestNote" class="suggest-hint">{{ suggestNote }}</p>

    <p v-if="errorMsg" class="caption error-text">{{ errorMsg }}</p>

    <div
      v-for="cat in categories"
      :key="cat.id"
      class="need-card mb-2"
      :style="{ borderColor: categoryColor(cat.id) }"
    >
      <div class="need-card-header" @click="toggleCategory(cat.id)">
        <span class="need-emoji">{{ categoryEmoji(cat.id) }}</span>
        <div class="need-row-body">
          <span class="need-row-label" :style="{ color: categoryColor(cat.id) }">{{ cat.label }}</span>
          <div v-if="selectedIn(cat).length" class="need-selections">
            <span
              v-for="item in selectedIn(cat)"
              :key="'s-' + item.name"
              class="need-sel-chip"
              :style="{ backgroundColor: categoryColor(cat.id), color: '#000' }"
              @click.stop="toggle(item.name)"
            >{{ item.name }}<span class="chip-x">×</span></span>
          </div>
        </div>
        <v-icon small :color="categoryColor(cat.id)">
          {{ isCategoryOpen(cat.id) ? 'expand_less' : 'expand_more' }}
        </v-icon>
      </div>

      <div v-if="isCategoryOpen(cat.id)" class="need-card-body">
        <div v-for="c in cat.cluster" :key="c.id">
          <div class="cluster-row" @click.stop="toggleCluster(c.id)">
            <!-- The bar reports what is chosen in this cluster, the way the
                 feeling clusters report theirs. -->
            <span
              v-if="countIn(c) > 0"
              class="cluster-fill"
              :style="{ width: pctIn(c) + '%', background: categoryColor(cat.id) }"
            ></span>
            <span class="cluster-label">{{ c.label }}</span>
            <span v-if="countIn(c) > 0" class="cluster-count">
              {{ countIn(c) }}/{{ c.beduerfnisse.length }}
            </span>
          </div>

          <div v-if="isClusterOpen(c.id)" class="selection-section">
            <div class="chips-wrap">
              <span
                v-for="name in c.beduerfnisse"
                :key="name"
                class="my-chip"
                :style="isSelected(name)
                  ? { backgroundColor: categoryColor(cat.id), color: '#000' }
                  : { backgroundColor: '#3a3a3c', color: categoryColor(cat.id) }"
                @click.stop="toggle(name)"
              >{{ name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-flex>
</template>

<script>
import {
  needCategories,
  needCategoryColor,
  needCategoryEmoji,
  categoryIdForNeed,
  sortNeeds,
  ALL_NEED_NAMES,
} from '@/utils/needs';

// The Bedürfnis tree, drawn like the Gefühl tree: a card per Grundkategorie,
// clusters inside it, the needs themselves as chips. Its own taxonomy and its
// own colours — nothing here depends on what was felt a step earlier.
export default {
  name: 'need-picker',
  props: {
    initialNeeds: { type: Array, default: function() { return []; } },
    // How many are recommended. Picking more is allowed — it is answered with
    // a warning and a blocked way forward, not by refusing the tap. 0 means no
    // recommendation.
    maxSelections: { type: Number, default: 0 },
    // Context for the AI suggestion prompt only — nothing here changes what
    // can be picked or how.
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
    origin: { type: String, default: '' },
    feelings: { type: Array, default: function() { return []; } },
  },
  data: function() {
    return {
      activeCategoryId: null,
      activeClusterId: null,
      selected: sortNeeds(this.initialNeeds.filter(function(n) { return n && n.name; })
        .map(function(n) { return { name: n.name, categoryId: categoryIdForNeed(n.name) }; })),
      categories: needCategories,
      suggestNote: '',
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  computed: {
    isOverLimit: function() {
      return !!this.maxSelections && this.selected.length > this.maxSelections;
    },
    // Says the recommendation out loud, and says it differently once it is
    // exceeded — the way forward is blocked at that point and needs a reason
    // on screen.
    limitHint: function() {
      if (!this.maxSelections) return '';
      if (this.isOverLimit) {
        return this.selected.length + ' von ' + this.maxSelections
          + ' gewählt — entferne welche, um weiterzugehen.';
      }
      if (this.maxSelections === 1) return 'Wähle ein Bedürfnis.';
      return 'Wähle bis zu ' + this.maxSelections + ' Bedürfnisse — '
        + this.selected.length + ' von ' + this.maxSelections + ' gewählt.';
    },
  },
  methods: {
    categoryColor: function(id) { return needCategoryColor(id); },
    categoryEmoji: function(id) { return needCategoryEmoji(id); },
    isCategoryOpen: function(id) { return this.activeCategoryId === id; },
    isClusterOpen: function(id) { return this.activeClusterId === id; },
    toggleCategory: function(id) {
      if (this.activeCategoryId === id) {
        this.activeCategoryId = null;
      } else {
        this.activeCategoryId = id;
      }
      this.activeClusterId = null;
    },
    toggleCluster: function(id) {
      this.activeClusterId = this.activeClusterId === id ? null : id;
    },
    isSelected: function(name) {
      return this.selected.some(function(n) { return n.name === name; });
    },
    selectedIn: function(cat) {
      return this.selected.filter(function(n) { return n.categoryId === cat.id; });
    },
    countIn: function(cluster) {
      var self = this;
      return (cluster.beduerfnisse || []).filter(function(n) { return self.isSelected(n); }).length;
    },
    pctIn: function(cluster) {
      var total = (cluster.beduerfnisse || []).length;
      if (!total) return 0;
      return Math.round((this.countIn(cluster) / total) * 100);
    },
    // Any number may be picked; going over the recommendation is answered by
    // the hint above and the blocked footer, never by dropping someone's
    // earlier choice.
    toggle: function(name) {
      var idx = this.selected.findIndex(function(n) { return n.name === name; });
      if (idx >= 0) this.selected.splice(idx, 1);
      else this.selected.push({ name: name, categoryId: categoryIdForNeed(name) });
      this.emitChange();
    },
    emitChange: function() {
      this.$emit('change', sortNeeds(this.selected).map(function(n) {
        return { name: n.name, categoryId: n.categoryId };
      }));
    },
    saveApiKey: function() {
      this.apiKey = this.apiKeyInput;
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.apiKeyInput = '';
      this.showApiKeyInput = false;
      this.generateSuggestions();
    },
    buildSuggestionsPrompt: function() {
      var lines = ['Du hilfst dabei, das Bedürfnis hinter einer Überzeugung zu erkennen.'];
      lines.push('Glaubenssatz: "' + this.belief + '"');
      if (this.reaction) lines.push('Reaktion darauf: "' + this.reaction + '"');
      if (this.origin) lines.push('Ursprung: "' + this.origin + '"');
      var feelingNames = (this.feelings || [])
        .map(function(f) { return f && f.name; })
        .filter(Boolean)
        .join(', ');
      if (feelingNames) lines.push('Gefühle dabei: ' + feelingNames);
      lines.push('Wähle genau 5 Bedürfnisse aus der folgenden Liste, die am ehesten erklären, '
        + 'was diese Überzeugung dem Menschen damals erfüllt haben könnte:');
      lines.push(ALL_NEED_NAMES.join(', '));
      lines.push('Antworte ausschließlich mit diesen 5 Begriffen, exakt wie in der Liste geschrieben, '
        + 'einer pro Zeile, ohne Nummerierung und ohne weiteren Text.');
      return lines.join('\n');
    },
    async generateSuggestions() {
      if (!this.apiKey) {
        this.showApiKeyInput = true;
        return;
      }
      this.isLoading = true;
      this.errorMsg = '';
      this.suggestNote = '';
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [{ role: 'user', content: this.buildSuggestionsPrompt() }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err.error && err.error.message) || `Fehler ${res.status}`);
        }
        const data = await res.json();
        const lines = data.content[0].text.split('\n').map(s => s.trim()).filter(Boolean);
        // Only real needs — a model can misspell or invent one that isn't in
        // the tree, and a suggestion that selects nothing is worse than none.
        const suggested = lines.filter(name => ALL_NEED_NAMES.indexOf(name) !== -1).slice(0, 5);
        if (!suggested.length) throw new Error('Keine passenden Vorschläge erhalten.');
        // Purely additive: what was already picked by hand stays, and stays
        // where it is. Only genuinely new names are added.
        const added = suggested.filter(name => !this.isSelected(name));
        added.forEach((name) => {
          this.selected.push({ name: name, categoryId: categoryIdForNeed(name) });
        });
        // No need to unfold anything: a category header already lists what is
        // selected inside it, so the new picks are visible where they landed.
        this.emitChange();
        this.suggestNote = added.length
          ? `${added.length} ${added.length === 1 ? 'Vorschlag' : 'Vorschläge'} in der Liste ausgewählt.`
          : 'Alle Vorschläge waren schon ausgewählt.';
      } catch (e) {
        this.errorMsg = e.message || 'Vorschläge konnten nicht geladen werden.';
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.limit-hint {
  font-size: 0.8rem;
  color: #636366;
  margin: 10px 0 12px;
  &.over-limit {
    color: #fd9927;
    font-weight: 600;
  }
}
.suggest-row { margin-bottom: 4px; }
.suggest-hint {
  font-size: 0.78rem;
  color: #8e8e93;
  margin: 2px 0 14px;
}
.error-text { color: #ff453a; }

.need-card {
  border: 1.5px solid;
  border-radius: 12px;
  background: #1c1c1e;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}
.need-card-header {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
}
.need-emoji {
  font-size: 1.35rem;
  margin-right: 12px;
  flex-shrink: 0;
}
.need-row-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.need-row-label {
  font-size: 0.95rem;
  font-weight: 600;
}
.need-selections {
  display: flex;
  flex-wrap: wrap;
  margin-top: 6px;
}
.need-sel-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin: 2px 4px 2px 0;
  cursor: pointer;
}
.chip-x {
  margin-left: 5px;
  font-size: 0.9rem;
  line-height: 1;
  opacity: 0.65;
}

.need-card-body {
  border-top: 1px solid #2c2c2e;
}
.cluster-row {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #2c2c2e;
  cursor: pointer;
  overflow: hidden;
}
.cluster-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  opacity: 0.18;
}
.cluster-label {
  position: relative;
  font-size: 0.875rem;
  color: #ebebf5;
  flex: 1;
}
.cluster-count {
  position: relative;
  font-size: 0.72rem;
  color: #8e8e93;
  flex-shrink: 0;
  margin-left: 8px;
}
.selection-section {
  padding: 10px 14px 12px;
  border-bottom: 1px solid #2c2c2e;
}
.chips-wrap {
  display: flex;
  flex-wrap: wrap;
}
.my-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  margin: 3px 4px 3px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
