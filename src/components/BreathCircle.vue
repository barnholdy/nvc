<template>
  <div class="breath-wrap">
    <div class="breath-circle" aria-hidden="true"></div>
  </div>
</template>

<script>
// Used by both breathing screens, so the rhythm and the reduced-motion
// behaviour cannot differ between them.
export default {
  name: 'breath-circle',
};
</script>

<style scoped lang="scss">
.breath-wrap {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
// A filled disc that dissolves towards its edge instead of a hard ring, so
// there is nothing to fix the eye on. Growing raises the opacity, which reads
// as the colour deepening on the in-breath.
.breath-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle closest-side,
    rgba(74, 222, 128, 0.62) 0%,
    rgba(74, 222, 128, 0.46) 42%,
    rgba(74, 222, 128, 0.16) 74%,
    rgba(74, 222, 128, 0) 100%
  );
  animation: breathe 8s ease-in-out infinite;
}
@keyframes breathe {
  0%   { transform: scale(0.72); opacity: 0.45; }
  50%  { transform: scale(1);    opacity: 1; }
  100% { transform: scale(0.72); opacity: 0.45; }
}
// Anyone who asked their system not to animate things should not get a pulsing
// circle in a screen about calming down.
@media (prefers-reduced-motion: reduce) {
  .breath-circle {
    animation: none;
    transform: scale(1);
    opacity: 1;
  }
}
</style>
