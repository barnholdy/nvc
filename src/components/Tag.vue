<template>
  <span
    class="tag"
    :class="[color, { active: isActive, inactive: !isActive }]"
    @click="clicked">
    <slot></slot>
  </span>
</template>

<script>

export const COLORS = {
  green: 'green',
  red: 'red',
  yellow: 'yellow',
  orange: 'orange',
  blue: 'blue',
};

export default {
  name: 'Tag',
  props: {
    color: String,
    isActive: Boolean,
  },
  methods: {
    clicked() {
      this.$emit('click');
    },
  },
};
</script>

<style scoped lang="scss">
$green: #4ed58b;
$red: #fc5e53;
$yellow:#fffd52;
$orange:#fd9927;
$blue: #89e7df;

.tag {
  color: white;
  cursor: pointer;
  margin: .2rem;
  padding: 0.6rem;
  height: .5rem;
  display: inline-block;
  line-height: .6rem;
  font-size: 1rem;
  border: solid .05rem;
  user-select: none;
}
.green {
  border-color: $green;
}
.red {
  border-color: $red;
}
.yellow {
  border-color: $yellow;
}
.orange {
  border-color: $orange;
}
.blue {
  border-color: $blue;
}
.green.active {
  background-color: $green;
}
.red.active {
  background-color: $red;
}
.yellow.active {
  background-color: $yellow;
}
.orange.active {
  background-color: $orange;
}
.blue.active {
  background-color: $blue;
}
.green.inactive {
  color: $green;
}
.red.inactive {
  color: $red;
}
.yellow.inactive {
  color: $yellow;
}
.orange.inactive {
  color: $orange;
}
.blue.inactive {
  color: $blue;
}
</style>
