<template>
  <div class="screen">
    <div class="screen__header">
      <div class="header__left-action">
        <slot name="left-action"></slot>
      </div>
      <div class="header__title">
        <slot name="title"></slot>
      </div>
      <div class="header__right-action">
        <slot name="right-action"></slot>
      </div>
    </div>
    <div class="screen__content">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Screen',
};
</script>

<style scoped lang="scss">
.screen {
  &__header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3rem;
    background-color: white;
    border-bottom: solid 0.05rem #2c3e50;
    display: flex;
    flex-flow: row;
  }
  &__content {
    margin-top: 4rem;
  }
}

.header {
  &__left-action {
    position: absolute;
    left: 0;
  }
  &__title {
    flex-grow: 1;
    line-height: 3.2rem;
    font-size: 1.1rem;
    font-weight: 600;
  }
  &__right-action {
    position: absolute;
    right: 0;
  }
}
</style>
