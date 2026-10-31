# Native options and responses

Pass Playwright fetch options through a generated helper and read the native response it returns.

## Pass native options

Every helper accepts an optional `options` object typed as `Omit<NonNullable<Parameters<APIRequestContext['fetch']>[1]>, 'method'>`. It takes the native [fetch options](https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-fetch) such as `timeout`, `failOnStatusCode`, `params`, `headers`, `data`, `form`, and `multipart`.

```typescript [options.spec.ts]
import { test } from '@playwright/test'
import { pwGetPetById } from './src/gen/playwright'

test('waits longer for a slow endpoint', async ({ request }) => {
  await pwGetPetById({
    request,
    path: { petId: '123' },
    options: { timeout: 10_000, headers: { authorization: 'Bearer token' } },
  })
})
```

Helpers spread `options` after the generated values:

- `options.params` replaces the generated query, and `options.headers` replaces the generated headers.
- An explicit `undefined` also replaces a generated value.
- Values such as `timeout: 0` and `failOnStatusCode: false` pass through unchanged.
- Required OpenAPI groups stay required even when `options` replaces their values.

The operation sets the HTTP method after the spread. TypeScript rejects `options.method`, and passing it from JavaScript does not change the method.

## Read the response

Helpers return the Playwright `APIResponse` without reading the body. Call `status()`, `headers()`, `ok()`, `json()`, or `text()` as needed.

```typescript [response.spec.ts]
import { expect, test } from '@playwright/test'
import { pwGetPetById } from './src/gen/playwright'

test('handles a missing pet', async ({ request }) => {
  const response = await pwGetPetById({ request, path: { petId: 'missing' } })
  expect(response.status()).toBe(404)
  expect(await response.text()).toContain('not found')
})
```

HTTP error statuses resolve by default. Set `options.failOnStatusCode: true` to make Playwright reject them instead. A `204` response stays empty, and `json()` on it follows Playwright's own parsing. Network errors propagate unchanged.

The `json()` type is the success response type from `@kubb/plugin-ts`. It does not describe error bodies and does not validate the data received.
