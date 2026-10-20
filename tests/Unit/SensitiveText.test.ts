import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    findSecrets,
    removeSecrets,
    stashableBody,
} from '../../resources/js/lib/sensitive-text.ts';

const githubToken = 'ghp_' + 'Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4zABCD';

await test('finds a pasted token and returns the exact selection after Unicode text', () => {
    const body = `My key 🔑: ${githubToken}`;
    const findings = findSecrets(body);
    assert.equal(findings.length, 1);
    assert.equal(body.slice(findings[0].start, findings[0].end), githubToken);
    assert.equal(stashableBody(body), '');
});

await test('removes multiple secrets without changing surrounding prose', () => {
    const body = `Token ${githubToken}; database postgres://demo:LocalOnly7z9@localhost/demo`;
    const cleaned = removeSecrets(body);
    assert.equal(cleaned, 'Token [REDACTED]; database [REDACTED]');
    assert.equal(findSecrets(cleaned).length, 0);
    assert.equal(stashableBody(cleaned), cleaned);
});

await test('still finds real secrets in posts that mention "true"', () => {
    const body = `true story, my token ${githubToken} at https://dev.to/iacobandrei`;
    assert.deepEqual(
        findSecrets(body).map((secret) => secret.text),
        [githubToken],
    );
    assert.equal(
        removeSecrets(body),
        'true story, my token [REDACTED] at https://dev.to/iacobandrei',
    );
});

await test('detects a complete private key block', () => {
    const body =
        '-----BEGIN PRIVATE KEY-----\nAbCdEfGhIjKlMnOp1234567890\n-----END PRIVATE KEY-----';
    assert.ok(findSecrets(body).length > 0);
    assert.equal(stashableBody(body), '');
});

await test('preserves ordinary code and obvious placeholder examples', () => {
    for (const body of [
        '',
        'const id = "a1b2c3d4"; // hello world',
        'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        'Restructuring a legacy app, true story: https://dev.to/iacobandrei/how-i-documented-a-broken-codebase-without-losing-my-mind-74m',
    ]) {
        assert.deepEqual(findSecrets(body), []);
        assert.equal(removeSecrets(body), body);
        assert.equal(stashableBody(body), body);
    }
});
