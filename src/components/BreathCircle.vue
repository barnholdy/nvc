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
  padding: 16px 0;
}
// A filled disc that dissolves towards its edge instead of a hard ring, so
// there is nothing to fix the eye on. At full size the core is solid green; the
// out-breath fades it back. Nearly the full width of the phone, but never
// taller than the space left under the text — 40vh keeps it off the footer on
// short screens. The width is the maximum: the animation starts at half of it.
.breath-circle {
  width: min(90vw, 38vh);
  height: min(90vw, 38vh);
  border-radius: 50%;
  background: radial-gradient(
    circle closest-side,
    rgba(74, 222, 128, 1) 0%,
    rgba(74, 222, 128, 0.92) 58%,
    rgba(74, 222, 128, 0.55) 82%,
    rgba(74, 222, 128, 0) 100%
  );
  animation: breathe 8s ease-in-out infinite;
}
// Half to full: the disc doubles in diameter over the in-breath.
@keyframes breathe {
  0%   { transform: scale(0.5); opacity: 0.45; }
  50%  { transform: scale(1);   opacity: 1; }
  100% { transform: scale(0.5); opacity: 0.45; }
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
