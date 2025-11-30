import { test, expect, afterAll } from 'bun:test';
import { publish, consume, close } from './index';

afterAll(async () => {
  await close();
});

test('publish and consume', async () => {
  const messages: any[] = [];

  await consume('test-queue', 'test-exchange', 'test.*', async (msg) => {
    messages.push(msg);
  });

  await new Promise(resolve => setTimeout(resolve, 100));

  await publish('test-exchange', 'test.message', {
    type: 'test',
    data: { id: 123 },
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  expect(messages.length).toBe(1);
  expect(messages[0].type).toBe('test');
  expect(messages[0].data.id).toBe(123);
});

