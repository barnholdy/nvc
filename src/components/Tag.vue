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
  green: 'my-green',
  red: 'my-red',
  yellow: 'my-yellow',
  orange: 'my-orange',
  blue: 'my-blue',
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
$yellow: #D4D233;
$orange:#fd9927;
$blue: #67CFC6;

.tag {
  cursor: pointer;
  display: inline-block;
  margin: .2rem;
  padding: 0 .6rem 0 .6rem;
  height: 2rem;
  line-height: 2rem;
  font-size: 1rem;
  color: white;
  border: solid .05rem;
  user-select: none;
}
.my-green {
  border-color: $green;
}
.my-red {
  border-color: $red;
}
.my-yellow {
  border-color: $yellow;
}
.my-orange {
  border-color: $orange;
}
.my-blue {
  border-color: $blue;
}
.my-green.active {
  background-color: $green;
}
.my-red.active {
  background-color: $red;
}
.my-yellow.active {
  background-color: $yellow;
}
.my-orange.active {
  background-color: $orange;
}
.my-blue.active {
  background-color: $blue;
}
.my-green.inactive {
  color: $green;
}
.my-red.inactive {
  color: $red;
}
.my-yellow.inactive {
  color: $yellow;
}
.my-orange.inactive {
  color: $orange;
}
.my-blue.inactive {
  color: $blue;
}
</style>
