# @kubb/plugin-playwright

Generate typed Playwright API request helpers from OpenAPI operations. Each helper calls `request.fetch` directly and returns `Promise<APIResponse<OperationResponse>>`, including a typed `response.json()`.

The default resolver turns `getPetById` into `pwGetPetById`, writes `pwGetPetById.ts`, and exports that name. The `pw` prefix lets these helpers share a barrel with Fetch or Axios functions. Types keep the names supplied by `plugin-ts`.

## Setup

Use Node.js 22 or newer, Kubb 5.1 or newer, and `@playwright/test` in the `^1.63.0` range. Keep `pluginTs()` in the plugins array to generate the request and response types.

```typescript [kubb.config.ts]
import { adapterOas } from '@kubb/adapter-oas'
import { pluginPlaywright } from '@kubb/plugin-playwright'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: './petStore.yaml',
  adapter: adapterOas(),
  output: { path: './src/gen' },
  plugins: [pluginTs(), pluginPlaywright()],
})
```

The defaults write named exports to `src/gen/playwright` and types to `src/gen/types`. The examples below use the [PetStore specification](https://github.com/kubb-labs/plugins/blob/main/examples/playwright/petStore.yaml).

## Call a generated helper

Pass a Playwright `APIRequestContext` in `request`. Use the Playwright Test `request` fixture. For standalone requests, call `newContext()` on the `request` export from `@playwright/test`.

```typescript [petStore.test.ts]
import { expect, test } from '@playwright/test'
import { pwGetPetById } from './src/gen/playwright'
import type { GetPetByIdResponse } from './src/gen/types'

test.use({ baseURL: 'http://127.0.0.1:3000' })

test('returns a pet', async ({ request }) => {
  const response = await pwGetPetById({
    request,
    path: { petId: '123' },
    query: { tags: ['friendly', 'small'] },
    headers: { 'X-Attempt': 2 },
    options: { timeout: 5_000 },
  })

  expect(response.ok()).toBeTruthy()
  const pet: GetPetByIdResponse = await response.json()
  expect(pet).toMatchObject({ id: '123' })
})
```

Point `baseURL` at a running API. Without the plugin's `baseURL` option, helpers use relative operation paths and Playwright resolves them against the context. OpenAPI `servers` do not set the URL.

Each helper takes one object. It includes only the OpenAPI groups declared by that operation:

| Property  | Type                                        | Required                                     |
| --------- | ------------------------------------------- | -------------------------------------------- |
| `request` | `APIRequestContext` from `@playwright/test` | Always                                       |
| `path`    | Operation path type from `plugin-ts`        | When the group contains a required parameter |
| `query`   | Operation query type from `plugin-ts`       | When the group contains a required parameter |
| `body`    | Operation body type from `plugin-ts`        | When `requestBody.required` is `true`        |
| `headers` | Operation headers type from `plugin-ts`     | When the group contains a required parameter |
| `options` | Native fetch options except `method`        | Optional                                     |

Property names inside the groups match the specification exactly. Path values are URI encoded. Query arrays become repeated keys, such as `tags=friendly&tags=small`. Headers with numeric or boolean values become strings.

Compatible query, header, and form values pass directly to Playwright. When conversion is needed, the generated preparation omits `null` and `undefined` values.

## Send a body

The first declared request content type determines which native option the helper uses:

| Content type                                         | Fetch option |
| ---------------------------------------------------- | ------------ |
| `application/json` or a media type ending in `+json` | `data`       |
| `application/x-www-form-urlencoded`                  | `form`       |
| `multipart/form-data`                                | `multipart`  |

Pass the typed body to each operation. Form arrays become repeated fields, and multipart `Blob` values become file fields through `FormData`.

```typescript [bodies.test.ts]
import { expect, test } from '@playwright/test'
import { pwAddPet, pwUpdatePetDetails, pwUploadPetPhoto } from './src/gen/playwright'

test.use({ baseURL: 'http://127.0.0.1:3000' })

test('sends JSON, form fields and a file', async ({ request }) => {
  const response = await pwAddPet({ request, body: { name: 'Rex' } })
  const pet = await response.json()
  expect(pet.name).toBe('Rex')

  await pwUpdatePetDetails({
    request,
    path: { petId: '123' },
    body: { name: 'Rex', tags: ['friendly', 'small'] },
  })

  await pwUploadPetPhoto({
    request,
    path: { petId: '123' },
    body: { file: new Blob(['file contents']), description: 'Rex', tags: ['profile'] },
  })
})
```

Playwright handles body serialization and Content-Type. JSON helpers pass `body` as `data`, so objects use Playwright's JSON serialization and primitive values follow its native behavior. A declared `+json` media type selects `data` but does not add that Content-Type. Set `options.headers` when the API needs a specific media type.

## Pass native options

The generated `options` property has type `Omit<NonNullable<Parameters<APIRequestContext['fetch']>[1]>, 'method'>`. It accepts native [fetch options](https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-fetch) such as `timeout`, `failOnStatusCode`, `params`, `headers`, `data`, `form`, and `multipart`.

Helpers spread `options` after generated values. `options.params` replaces the generated query, and `options.headers` replaces the generated headers. Explicit `undefined` overwrites a generated value too. Values such as `timeout: 0` and `failOnStatusCode: false` pass through unchanged.

To replace a body, set the same native body option. To switch modes, also clear the generated mode, for example `options: { data: undefined, form: { name: 'Rex' } }` for a JSON helper. Otherwise Playwright receives both body modes and rejects the request. Required OpenAPI groups remain required even when native options replace their values.

The operation fixes the HTTP method after spreading `options`. TypeScript rejects `options.method`, and passing it from JavaScript cannot change the generated method.

## Read the native response

Helpers return the original Playwright `APIResponse` without reading the body. Use `status()`, `headers()`, `ok()`, `json()`, or `text()` as needed. The generic response type describes the declared OpenAPI responses and does not validate the received data.

HTTP error statuses return responses by default. Set `options.failOnStatusCode: true` to use Playwright's rejection behavior. A `204` response stays empty, and calling `json()` on it follows Playwright's native parsing behavior. Helpers propagate request errors unchanged.

## Supported operations and serialization limits

The plugin supports GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, and TRACE. It generates operations without a request body and those whose first body content type is supported. It skips operations with cookie parameters or an unsupported first body content type.

The plugin does not apply OpenAPI `style`, `explode`, or `allowReserved`. Path parameters always use encoded string values. For advanced query formats or nested form objects, pass prepared values through native `options.params`, `options.form`, or `options.multipart`. Use `options.data` for a pre-serialized body and set its Content-Type when needed.

See [plugin options](https://kubb.dev/extensions/kubb-labs/plugin-playwright/options) for URL and naming configuration. The [PetStore HTTP tests](https://github.com/kubb-labs/plugins/tree/main/examples/playwright) use a local server and a real request context without launching a browser.
