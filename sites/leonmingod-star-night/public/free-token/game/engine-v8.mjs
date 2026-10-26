// v8 ward contact, sword telegraphs and feedback use the same live server entropy.
import { RULES as BASE, createGame as baseCreate, step as baseStep, phaseOf } from './physics-v8.mjs';
export { phaseOf };
export const RULES = Object.freeze({ ...BASE, version: 8, segmentFrames: 180 });
export function createGame(seed) { return { ...baseCreate(seed), entropy: { 0: seed >>> 0 || 1 } }; }
export function installEntropy(state, chunks) {
  for (const chunk of chunks || []) {
    if (!Number.isInteger(chunk.frame) || chunk.frame < 0 || chunk.frame >= RULES.frames || chunk.frame % RULES.segmentFrames || !Number.isInteger(chunk.seed) || chunk.seed < 1 || chunk.seed > 0xffffffff) throw new Error('Invalid live encounter');
    if (state.entropy[chunk.frame] && state.entropy[chunk.frame] !== chunk.seed) throw new Error('Encounter already committed');
    state.entropy[chunk.frame] = chunk.seed;
  }
}
export function step(state, target = state.target) {
  if (state.done) return state;
  if (state.frame % RULES.segmentFrames === 0) {
    const seed = state.entropy[state.frame];
    if (!seed) throw new Error('阵法连接中断，请重新开局。');
    state.random = seed;
  }
  return baseStep(state, target);
}
