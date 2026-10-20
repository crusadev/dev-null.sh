import { scan } from '@sanity-labs/secret-scan';
import type { Secret } from '@sanity-labs/secret-scan';

// tru-2's `[0-9a-zA-Z.-_]{26}` is a `.`–`_` range covering `/` and `:`, so any 26-character URL run matches once
// the post contains "tru", as in "true" or "structure".
const brokenRules = new Set(['tru-2']);

export function findSecrets(body: string): Secret[] {
    return scan(body).filter((secret) => !brokenRules.has(secret.rule));
}

export function removeSecrets(body: string): string {
    return findSecrets(body).reduceRight(
        (result, secret) =>
            result.slice(0, secret.start) +
            '[REDACTED]' +
            result.slice(secret.end),
        body,
    );
}

export function stashableBody(body: string): string {
    return findSecrets(body).length > 0 ? '' : body;
}
