import assert from 'node:assert/strict';
import fs from 'node:fs';

const service = fs.readFileSync(new URL('../src/services/eventService.js', import.meta.url), 'utf8');
const eventView = fs.readFileSync(new URL('../src/views/EventView.jsx', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

const reactionFunctionStart = service.indexOf('export const addEmojiReaction');
const reactionFunctionEnd = service.indexOf('export const subscribeToReactionLogs', reactionFunctionStart);
assert.ok(reactionFunctionStart >= 0 && reactionFunctionEnd > reactionFunctionStart, 'addEmojiReaction must exist');
const reactionFunction = service.slice(reactionFunctionStart, reactionFunctionEnd);

const counterTransactionPosition = reactionFunction.indexOf('await runTransaction');
const logWritePosition = reactionFunction.indexOf('await setDoc(reactionRef, reactionLog)');
assert.ok(counterTransactionPosition >= 0, 'reaction counter must use a Firestore transaction');
assert.ok(logWritePosition > counterTransactionPosition, 'reaction log must be written after the counter transaction');
assert.ok(!reactionFunction.includes('transaction.set(reactionRef'), 'reaction log must not share the counter transaction');
assert.ok(reactionFunction.includes('logSaved: false'), 'log failure must be reported without rolling back the counter');

assert.ok(eventView.includes('handleEmojiReaction'), 'emoji modal must use the shared reaction handler');
assert.ok(eventView.includes('reactionLogsUnavailable'), 'reaction log listener errors must be visible in the UI');
assert.ok(eventView.includes('Reazione conteggiata, ma non aggiunta alla cronologia'), 'log-write failure must be visible');

assert.ok(rules.includes('match /reactionLogs/{reactionId}'), 'Firestore Rules must include the reactionLogs subcollection');
assert.ok(rules.includes("allow update: if isOwnerUpdate() || isReactionOnlyUpdate();"), 'event rules must allow reaction-counter-only updates');
assert.ok(rules.includes('allow get, list: if request.auth != null && parentEventExists();'), 'reaction log read must be allowed to signed-in viewers');
assert.ok(rules.includes('allow create: if request.auth != null'), 'reaction log create must be allowed to signed-in viewers');

console.log('Reaction flow checks passed (source-level; Firestore deployment not tested).');
