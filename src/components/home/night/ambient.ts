/**
 * Ambiente sonoro nocturno generado en el navegador (Web Audio API):
 * un acorde suave y un poco de «aire». Sin archivos de audio.
 * Empieza en silencio y solo suena si la persona lo activa.
 */
export type Ambient = { setOn(on: boolean): void; muffle(on: boolean): void; dispose(): void };

export function createAmbient(): Ambient | null {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  const nodes: AudioScheduledSourceNode[] = [];

  const build = () => {
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0;
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;
    filter.Q.value = 0.6;
    filter.connect(master);
    master.connect(ctx.destination);

    // Acorde suave (La menor añadida), ligeramente desafinado para que «respire».
    for (const [f, g] of [
      [110, 0.07],
      [164.81, 0.05],
      [220.5, 0.035],
      [329.2, 0.018],
    ] as const) {
      for (const det of [-4, 4]) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f;
        osc.detune.value = det;
        const gain = ctx.createGain();
        gain.gain.value = g;
        osc.connect(gain).connect(filter);
        osc.start();
        nodes.push(osc);
      }
    }
    // Movimiento lento del filtro
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    nodes.push(lfo);

    // «Aire»: ruido suave filtrado
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 700;
    band.Q.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(band).connect(noiseGain).connect(filter);
    noise.start();
    nodes.push(noise);
  };

  return {
    setOn(on) {
      if (on && !ctx) build();
      if (!ctx || !master) return;
      if (on && ctx.state === "suspended") void ctx.resume();
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(on ? 0.55 : 0, t + (on ? 1.6 : 0.8));
    },
    muffle(on) {
      if (!ctx || !filter) return;
      const t = ctx.currentTime;
      filter.frequency.cancelScheduledValues(t);
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      filter.frequency.exponentialRampToValueAtTime(on ? 320 : 1400, t + 1.2);
    },
    dispose() {
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* ya detenido */
        }
      });
      void ctx?.close();
    },
  };
}
