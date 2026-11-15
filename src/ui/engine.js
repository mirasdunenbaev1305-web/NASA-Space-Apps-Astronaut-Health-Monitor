// Loads the real engine (src/engine/evaluate.js, owned by AI 2) when it exists,
// otherwise falls back to the contract stubs. No UI code changes are needed when
// the engine lands — this is the single switch point described in CONTRACT.md.

export async function loadEngine() {
  try {
    const mod = await import('../engine/evaluate.js');
    if (typeof mod.evaluateIndicators !== 'function' || typeof mod.getGuidance !== 'function' || typeof mod.getOrganInfo !== 'function') {
      throw new Error('engine is missing contract functions');
    }
    return { engine: mod, source: 'engine' };
  } catch (err) {
    console.info('[Astronaut Vitals] Using stub engine:', err && err.message);
    const mod = await import('./stubs.js');
    return { engine: mod, source: 'stubs' };
  }
}
