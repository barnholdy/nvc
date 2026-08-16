<template>
  <div v-if="beliefs.length">
    <p class="section-head">Empathie</p>

    <div class="card">
      <div class="now-line">
        <div class="now-body">
          <p class="now-title">Einfühlsam begegnen</p>
          <p class="now-sub" :class="{ 'sub-error': !!errorMsg }">{{ subline }}</p>
        </div>
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="#4ade80"
          size="20"
          width="2"
        ></v-progress-circular>
        <button
          v-else
          class="now-btn"
          :disabled="isDataUnchanged && !!text"
          @click="generate"
        >{{ text ? 'Neu' : 'Generieren' }}</button>
      </div>

      <!-- Collapsed to a few lines: the answer is long, and the screen it now
           lives on is a list of short things. -->
      <template v-if="text !== null">
        <div class="card-sep"></div>
        <div
          class="empathy-text md-content"
          :class="{ clipped: !expanded }"
          v-html="renderMd(text)"
        ></div>
        <div class="empathy-toggle" @click="expanded = !expanded">
          <span>{{ expanded ? 'Weniger anzeigen' : 'Mehr anzeigen' }}</span>
          <v-icon class="detail-chevron">{{ expanded ? 'expand_less' : 'expand_more' }}</v-icon>
        </div>
      </template>
    </div>

    <!-- Only when there is no key yet; otherwise the button above is enough. -->
    <div v-if="showApiKeyInput" class="card">
      <p class="card-title">Anthropic API Key</p>
      <v-text-field
        v-model="apiKeyInput"
        placeholder="sk-ant-..."
        type="password"
        single-line
        hide-details
        class="dark-input"
      ></v-text-field>
      <div class="key-actions">
        <button class="now-btn" :disabled="!apiKeyInput" @click="saveApiKey">Speichern</button>
        <button class="ghost-btn" @click="showApiKeyInput = false">Abbrechen</button>
      </div>
    </div>
  </div>
</template>

<script>
import { dedupeByName } from '@/utils/emotions';
import { experimentsOf } from '@/utils/experiment';
import { originArcOf, moodLabel } from '@/utils/originArc';
import { beliefCredibility } from '@/utils/credibility';
import { normalizeTruth } from '@/utils/affirmationTruth';
const STORAGE_KEY = 'nvc.globalEmpathy';

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16);
}

export default {
  name: 'empathy-block',
  data() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { saved = null; }
    return {
      text: saved ? saved.text : null,
      savedHash: saved ? (saved.hash || null) : null,
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
      expanded: false,
    };
  },
  computed: {
    beliefs() { return this.$store.getters.beliefs; },
    currentHash() {
      const patterns = this.$store.getters.patterns;
      const beliefs = this.$store.getters.beliefs;
      return hashString(JSON.stringify({ patterns, beliefs }));
    },
    isDataUnchanged() {
      return this.savedHash !== null && this.currentHash === this.savedHash;
    },
    subline() {
      if (this.errorMsg) return this.errorMsg;
      if (this.isLoading) return 'Wird generiert…';
      if (!this.apiKey) return 'API Key in den Einstellungen hinterlegen';
      if (this.text && this.isDataUnchanged) return 'Keine neuen Daten seit der letzten Generierung';
      if (this.text) return 'Es gibt Neues seit der letzten Generierung';
      return 'Lass dir spiegeln, was dich gerade bewegt';
    },
  },
  methods: {
    buildPrompt() {
      const patterns = this.$store.getters.patterns;
      const journal = this.$store.getters.journal;
      const beliefs = this.$store.getters.beliefs;
      const system = 'Du bist ein einfühlsamer Gesprächsbegleiter. Eine Person teilt dir ihre persönlichen Muster und Überzeugungen mit – in strukturierter Form. Jedes Muster beschreibt eine Situation und die damit verbundenen Überzeugungen. Jede Überzeugung enthält die Überzeugung selbst, damit verbundene Gefühle, Reaktionen und Bedürfnisse – und, falls vorhanden, die Veränderungsarbeit daran: Ausnahmen, eine neue Reaktion, Affirmationen und Verhaltensexperimente mit vorab notierter Befürchtung und tatsächlichem Ausgang. Wo vorhanden steht dabei, für wie wahr die Person eine Überzeugung hält (0 bis 10) und was diese ihr früher gebracht hat.\n\nDeine Aufgabe ist es, empathisch zu antworten. Halte dich dabei an folgende Prinzipien:\n\n1. Erst spiegeln, dann würdigen – Fasse zusammen, was du gehört hast, ohne zu interpretieren oder zu bewerten. Zeige, dass du wirklich zugehört hast.\n2. Den Kern berühren – Benenne die wiederkehrenden Gefühle und Bedürfnisse direkt und warmherzig. Die Person soll sich gesehen fühlen, nicht analysiert.\n3. Muster erkennen – Wenn sich Themen über mehrere Einträge wiederholen, würdige das behutsam.\n4. Keine Ratschläge, keine Lösungen – Außer die Person fragt explizit danach.\n5. Offene Einladung zum Ende – Schließe mit einer offenen Frage oder einem Raumangebot, kein Druck.\n\nTon: warm, ruhig, präsent. Antworte auf Deutsch.';
      const lines = [system, ''];
      if (patterns.length > 0) {
        lines.push('MUSTER:');
        patterns.forEach((p, i) => {
          lines.push('');
          lines.push(`Muster ${i + 1}${p.trigger ? ` (${p.trigger})` : ''}:`);
          if (p.trigger) lines.push(`  Situation: ${p.trigger}`);
          const linked = (p.beliefs || []).map(id => beliefs.find(b => b.time === id)).filter(Boolean);
          if (linked.length) {
            // With the rating this situation recorded, where there is one.
            const truths = p.beliefTruths || {};
            lines.push(`  Glaubenssätze: ${linked.map((b) => {
              const v = truths[b.time];
              return typeof v === 'number' ? `${b.belief} (${v}/10 wahr)` : b.belief;
            }).join('; ')}`);
          }
        });
      }
      if (beliefs.length > 0) {
        lines.push('');
        lines.push('ÜBERZEUGUNGEN:');
        beliefs.forEach((b, i) => {
          lines.push('');
          lines.push(`Überzeugung ${i + 1}:`);
          lines.push(`  Glaube: ${b.belief}`);
          const feelings = b.feelings && b.feelings.length ? b.feelings.map(f => f.name).join(', ') : '';
          if (feelings) lines.push(`  Gefühl: ${feelings}`);
          if (b.withBelief) lines.push(`  Reaktion: ${b.withBelief}`);
          const needs = b.needs && b.needs.length ? dedupeByName(b.needs).map(n => n.name).join(', ') : '';
          if (needs) lines.push(`  Bedürfnis: ${needs}`);
          const truth = beliefCredibility(patterns, b, journal);
          if (truth !== null) lines.push(`  Für glaubwürdig gehalten: ${Math.round(truth * 10) / 10} von 10`);
          const r = b.reflection || {};
          if (r.origin) lines.push(`  Ursprungshypothese: ${r.origin}`);
          const arc = originArcOf(b);
          if (arc.gift) lines.push(`  Was die Überzeugung damals gebracht hat: ${arc.gift}`);
          if (arc.mood) lines.push(`  Nach dem Blick auf den Ursprung: ${moodLabel(arc.mood)}`);
          if (r.exceptions) lines.push(`  Ausnahmen: ${r.exceptions}`);
          if (r.withoutBelief) lines.push(`  Neue Reaktion: ${r.withoutBelief}`);
          const newFeelings = r.withoutBeliefFeelings && r.withoutBeliefFeelings.length
            ? r.withoutBeliefFeelings.map(f => f.name).join(', ') : '';
          if (newFeelings) lines.push(`  Neue Gefühle: ${newFeelings}`);
          if (typeof r.bodyIntensity === 'number') {
            lines.push(`  Körperempfindung dabei: ${r.bodyIntensity} von 10`);
          }
          (b.affirmations || []).forEach((a) => {
            if (!a || !a.text) return;
            const credible = typeof a.resonance === 'number'
              ? ` (Glaubwürdigkeit ${normalizeTruth(a.resonance)} von 10)` : '';
            lines.push(`  Affirmation: ${a.text}${credible}`);
          });
          experimentsOf(b).forEach((x) => {
            const parts = [];
            if (x.situation) parts.push(x.situation);
            // The words matter as much as the numbers: "Sie lachen" against
            // "Niemand lachte" is the whole point of the experiment.
            if (x.fear) {
              parts.push(`Befürchtung: ${x.fear}`
                + (typeof x.fearExpected === 'number' ? ` (erwartet ${x.fearExpected} von 10)` : ''));
            } else if (typeof x.fearExpected === 'number') {
              parts.push(`befürchtet ${x.fearExpected}/10`);
            }
            if (x.outcome) {
              parts.push(`Tatsächlich: ${x.outcome}`
                + (typeof x.fearActual === 'number' ? ` (real ${x.fearActual} von 10)` : ''));
            } else if (typeof x.fearActual === 'number') {
              parts.push(`real ${x.fearActual}/10`);
            }
            if (x.learning) parts.push(`Erkenntnis: ${x.learning}`);
            if (parts.length) lines.push(`  Verhaltensexperiment: ${parts.join(' | ')}`);
          });
        });
      }
      return lines.join('\n');
    },
    saveApiKey() {
      this.apiKey = this.apiKeyInput;
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.apiKeyInput = '';
      this.showApiKeyInput = false;
      this.generate();
    },
    renderMd(raw) {
      if (!raw) return '';
      const esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const inline = s => s
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
      const lines = esc.split('\n');
      let html = '', inUl = false;
      lines.forEach(line => {
        if (/^### /.test(line)) {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += `<h3>${inline(line.slice(4))}</h3>`;
        } else if (/^## /.test(line)) {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += `<h2>${inline(line.slice(3))}</h2>`;
        } else if (/^# /.test(line)) {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += `<h1>${inline(line.slice(2))}</h1>`;
        } else if (/^[*-] /.test(line)) {
          if (!inUl) { html += '<ul>'; inUl = true; }
          html += `<li>${inline(line.slice(2))}</li>`;
        } else if (line.trim() === '') {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += '<div class="md-gap"></div>';
        } else {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += `<p>${inline(line)}</p>`;
        }
      });
      if (inUl) html += '</ul>';
      return html;
    },
    generate() {
      if (!this.apiKey) { this.showApiKeyInput = true; return; }
      this.isLoading = true;
      this.errorMsg = '';
      const hash = this.currentHash;
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{ role: 'user', content: this.buildPrompt() }],
        }),
      }).then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((err) => { throw new Error((err.error && err.error.message) || `Fehler ${res.status}`); });
        }
        return res.json();
      }).then((data) => {
        this.text = data.content[0].text.trim();
        this.savedHash = hash;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: this.text, hash }));
      }).catch((e) => {
        this.errorMsg = e.message || 'Empathie konnte nicht geladen werden.';
      }).then(() => {
        this.isLoading = false;
      });
    },
  },
};
</script>

<style scoped lang="scss">
.section-head {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8e8e93;
  margin: 18px 20px 8px;
}

.now-line {
  display: flex;
  align-items: center;
  gap: 14px;
}
.now-body { flex: 1; min-width: 0; }
.now-title {
  font-size: 1.05rem;
  font-weight: 400;
  color: #fff;
  line-height: 1.35;
  margin: 0;
}
.now-sub {
  font-size: 0.88rem;
  color: #8e8e93;
  margin: 4px 0 0;
  line-height: 1.4;
}
.sub-error { color: #ff453a; }
.now-btn {
  flex-shrink: 0;
  background: none;
  border: 1px solid #4ade80;
  border-radius: 999px;
  color: #4ade80;
  font-family: inherit;
  font-size: 0.95rem;
  padding: 9px 20px;
  cursor: pointer;
  &:disabled { border-color: #3a3a3c; color: #636366; cursor: default; }
}
.ghost-btn {
  background: none;
  border: none;
  color: #8e8e93;
  font-family: inherit;
  font-size: 0.95rem;
  padding: 9px 12px;
  cursor: pointer;
}
.key-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.empathy-text {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.7;
  margin: 0;
}
/* Four lines is enough to tell whether it is worth opening. */
.clipped {
  max-height: 6.8em;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(#000 60%, transparent);
  mask-image: linear-gradient(#000 60%, transparent);
}
.md-content {
  h1, h2, h3 { color: #fff; font-weight: 700; margin: 0 0 6px; line-height: 1.3; }
  h1 { font-size: 1.1rem; }
  h2 { font-size: 1rem; }
  h3 { font-size: 0.95rem; color: #4ade80; }
  p { margin: 0 0 8px; }
  p:last-child { margin-bottom: 0; }
  ul { margin: 0 0 8px; padding-left: 18px; }
  li { margin-bottom: 4px; }
  strong { color: #fff; font-weight: 700; }
  em { color: #c9c9d3; font-style: italic; }
  .md-gap { height: 10px; }
}
.empathy-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #8e8e93;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
