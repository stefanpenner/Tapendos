import { test } from 'node:test';
import assert from 'node:assert';
import { encodeRumble } from './joycon.mjs';

test('encodeRumble returns 9-byte packet', () => {
    const packet = encodeRumble(600, 600, 0.5);
    assert.strictEqual(packet.length, 9);
    assert.ok(packet instanceof Uint8Array);
});

test('encodeRumble clamps frequencies to valid range', () => {
    const tooLow = encodeRumble(10, 10, 0.5);
    const tooHigh = encodeRumble(1000, 2000, 0.5);
    const normal = encodeRumble(600, 600, 0.5);
    
    // Should produce valid packets (not throw)
    assert.strictEqual(tooLow.length, 9);
    assert.strictEqual(tooHigh.length, 9);
    assert.strictEqual(normal.length, 9);
});

test('encodeRumble clamps amplitude to 0-1', () => {
    const negative = encodeRumble(600, 600, -0.5);
    const overOne = encodeRumble(600, 600, 1.5);
    const normal = encodeRumble(600, 600, 0.5);
    
    assert.strictEqual(negative.length, 9);
    assert.strictEqual(overOne.length, 9);
    assert.strictEqual(normal.length, 9);
});

test('encodeRumble with zero amplitude produces stop packet', () => {
    const packet = encodeRumble(600, 600, 0);
    assert.strictEqual(packet.length, 9);
    // Zero amplitude should result in p=0, which affects packet[2]
    assert.strictEqual(packet[0], 0);
});

test('encodeRumble duplicates bytes 1-4 to 5-8', () => {
    const packet = encodeRumble(600, 600, 0.5);
    for (let i = 0; i < 4; i++) {
        assert.strictEqual(packet[5 + i], packet[1 + i], `Byte ${5 + i} should equal byte ${1 + i}`);
    }
});

test('encodeRumble produces different packets for different parameters', () => {
    const packet1 = encodeRumble(300, 300, 0.3);
    const packet2 = encodeRumble(600, 600, 0.5);
    const packet3 = encodeRumble(400, 800, 0.8);
    
    // At least one byte should differ
    const allSame = packet1.every((byte, i) => byte === packet2[i]);
    assert.ok(!allSame, 'Different parameters should produce different packets');
});

