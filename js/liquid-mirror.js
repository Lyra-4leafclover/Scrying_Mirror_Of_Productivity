/* ==========================================================================
   MASSIVE DRAMATIC WATER SHOCKWAVE SCRYING POOL ENGINE
   ========================================================================== */

class LiquidMirrorEngine {
  constructor() {
    this.$mirror = $('.ripple-bg');
    if (!this.$mirror.length) {
      console.error("Ripple background container not found!");
      return;
    }

    this.initRipples();
  }

  initRipples() {
    try {
      this.$mirror.ripples({
        resolution: 512,
        perturbance: 0.085, // 3x Stronger Refraction Distortion!
        dropRadius: 90,      // Massive Water Wave Radius!
        interactive: false   // Command-Only Shockwave Drops!
      });
      console.log("Massive Scrying Pool Engine loaded (Huge Shockwave Drops)");
    } catch (e) {
      console.error("jquery.ripples initialization error:", e);
    }
  }

  triggerDistortion() {
    this.triggerCommandShockwave();
  }

  triggerCommandShockwave() {
    try {
      const w = this.$mirror.width();
      const h = this.$mirror.height();
      const cx = w / 2;
      const cy = h / 2;

      // HUGE Central Water Shockwave Impact (140px Radius, 0.15 Strength)
      this.$mirror.ripples('drop', cx, cy, 140, 0.15);

      // Secondary expanding concentric liquid rings
      setTimeout(() => {
        this.$mirror.ripples('drop', cx - 60, cy + 40, 110, 0.12);
        this.$mirror.ripples('drop', cx + 60, cy - 40, 110, 0.12);
      }, 100);

      setTimeout(() => {
        this.$mirror.ripples('drop', cx, cy, 160, 0.09);
      }, 220);

      if (window.audioSynth) {
        window.audioSynth.playWaterDrop(0.7);
      }
    } catch (e) {
      console.warn("Shockwave drop error:", e);
    }
  }
}

$(document).ready(() => {
  window.liquidMirror = new LiquidMirrorEngine();
});
