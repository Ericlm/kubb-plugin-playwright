# Playwright

The Playwright plugin generates a typed request helper for each operation in your OpenAPI spec. Each helper calls `request.fetch` on a Playwright `APIRequestContext` and returns the native `APIResponse`, with `response.json()` typed from the spec.

The default resolver turns `getPetById` into `pwGetPetById`, written to `pwGetPetById.ts`. The `pw` prefix lets these helpers share a barrel with client helpers such as Fetch or Axios. Type names come from `@kubb/plugin-ts` unchanged.

## Setup

- Add `@kubb/plugin-ts` to the plugins array for the request and response types.
- Install `@playwright/test` 1.63 or newer in the project that runs the tests. Earlier versions have no generic `APIResponse`.

```typescript [kubb.config.ts]
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'
import { pluginPlaywright } from 'kubb-plugin-playwright'

export default defineConfig({
  input: './petStore.yaml',
  adapter: adapterOas(),
  output: { path: './src/gen' },
  plugins: [pluginTs(), pluginPlaywright()],
})
```

The defaults write named exports to `src/gen/playwright` and types to `src/gen/types`.

## Example

Pass the Playwright Test `request` fixture, or a context from `request.newContext()`, as `request`. Each helper takes one object with only the groups the operation declares: `path`, `query`, `body`, and `headers`, plus native fetch `options`.

```typescript [petStore.spec.ts]
import { expect, test } from '@playwright/test'
import { pwGetPetById } from './src/gen/playwright'

test.use({ baseURL: 'http://127.0.0.1:3000' })

test('returns a pet', async ({ request }) => {
  const response = await pwGetPetById({
    request,
    path: { petId: '123' },
    query: { tags: ['friendly', 'small'] },
    options: { timeout: 5_000 },
  })

  expect(response.ok()).toBeTruthy()
  const pet = await response.json()
  expect(pet.id).toBe('123')
})
```

A group is required when it holds a required parameter, and `body` is required when `requestBody.required` is `true`. Path values are URI encoded, and query arrays become repeated keys such as `tags=friendly&tags=small`.

## Options worth knowing

- `baseURL` is written into every generated URL. Without it, helpers use relative paths and Playwright resolves them against the context `baseURL`. OpenAPI `servers` are ignored.
- `resolver` renames helpers and files, for example to replace the `pw` prefix.

See [Options](https://kubb.dev/extensions/ericlm/kubb-plugin-playwright/options) for every option and its default.

## Limits

- The response type is the success response type from `@kubb/plugin-ts`. Error bodies, such as a 404 payload, are not part of the `json()` type, and the received data is not validated.
- Request bodies support JSON (including `+json` media types), `application/x-www-form-urlencoded`, and `multipart/form-data`. Operations whose first body content type is something else are skipped.
- Operations with cookie parameters are skipped.
- OpenAPI `style`, `explode`, and `allowReserved` are not applied. Pass prepared values through the native `options.params`, `options.form`, or `options.multipart` for other formats.

The generated code makes network requests only when your tests call a helper. The plugin itself writes only inside its output path.
