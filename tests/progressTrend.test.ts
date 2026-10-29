import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_OVERALL_ATTEMPTS, MIN_TOPIC_ATTEMPTS, overallTrend, topicTrends } from '@/engine/progressTrend';
import { attemptsFrom } from './helpers.ts';

test('a topic is compared only with enough answers', () => {
  const { trends, notEnough } = topicTrends([
    ...attemptsFrom('articles', '1'.repeat(MIN_TOPIC_ATTEMPTS)),
    ...attemptsFrom('modals', '1'.repeat(MIN_TOPIC_ATTEMPTS - 1)),
  ]);
  assert.deepEqual(trends.map((t) => t.topicId), ['articles']);
  assert.deepEqual(notEnough, [{ topicId: 'modals', total: MIN_TOPIC_ATTEMPTS - 1 }]);
});

test('before = first answers, after = latest answers, in separate groups of up to 10', () => {
  // 20 answers: first 10 have 4 correct (40%), last 10 have 9 correct (90%)
  const [trend] = topicTrends(attemptsFrom('articles', '0001001101' + '1111011111')).trends;
  assert.equal(trend.window, 10);
  assert.equal(trend.before, 40);
  assert.equal(trend.after, 90);
  assert.equal(trend.delta, 50);
  assert.equal(trend.total, 20);
});

test('a decline is a negative delta', () => {
  const [trend] = topicTrends(attemptsFrom('modals', '1111101111' + '0100000000')).trends;
  assert.equal(trend.before, 90);
  assert.equal(trend.after, 10);
  assert.equal(trend.delta, -80);
});

test('with few answers the two groups do not overlap', () => {
  const [six] = topicTrends(attemptsFrom('prepositions', '101101')).trends;
  assert.equal(six.window, 3);
  const [seven] = topicTrends(attemptsFrom('prepositions', '1010111')).trends;
  assert.equal(seven.window, 3); // 7 answers: 3 + 3, the middle one is skipped
  assert.equal(seven.before, 67); // 1,0,1
  assert.equal(seven.after, 100); // 1,1,1
});

test('the order in which answers are given in the list does not matter, time does', () => {
  const answers = attemptsFrom('articles', '0001001101' + '1111011111');
  const shuffled = [...answers].reverse();
  assert.deepEqual(topicTrends(shuffled).trends, topicTrends(answers).trends);
});

test('overall trend needs at least ten answers and uses up to 20 per group', () => {
  assert.equal(overallTrend(attemptsFrom('articles', '1'.repeat(MIN_OVERALL_ATTEMPTS - 1))), null);
  const a = attemptsFrom('articles', '0'.repeat(20), 1_000_000);
  const b = attemptsFrom('modals', '1'.repeat(20), 2_000_000);
  const trend = overallTrend([...a, ...b]);
  assert.ok(trend);
  assert.equal(trend.window, 20);
  assert.equal(trend.before, 0);
  assert.equal(trend.after, 100);
});

test('no answers give no trends', () => {
  assert.deepEqual(topicTrends([]), { trends: [], notEnough: [] });
  assert.equal(overallTrend([]), null);
});
