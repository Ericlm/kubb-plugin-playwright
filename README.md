# kubb-plugin-playwright

A community [Kubb](https://kubb.dev) plugin that generates typed Playwright API request helpers from an OpenAPI specification. Each helper calls `request.fetch` and returns the native Playwright `APIResponse`, with a typed `response.json()`.

Requires Node.js 22.22 or newer, Kubb 5.15 or newer, and `@playwright/test` 1.63 or newer.

## Installation

With the Kubb CLI, once the plugin is listed in the [Kubb registry](https://kubb.dev/extensions):

```bash
npx kubb add ericlm/kubb-plugin-playwright
```

Or install it yourself, next to Kubb, the OpenAPI adapter, the TypeScript plugin, and Playwright:

```bash
pnpm add -D kubb @kubb/adapter-oas @kubb/plugin-ts kubb-plugin-playwright @playwright/test
# or
npm install --save-dev kubb @kubb/adapter-oas @kubb/plugin-ts kubb-plugin-playwright @playwright/test
```

## Configuration

Keep `pluginTs()` in the plugins array. The default output puts types in `src/gen/types` and request helpers in `src/gen/playwright`.

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

Then run `npx kubb generate`.

## Usage

The call below uses the [PetStore specification](https://github.com/Ericlm/kubb-plugin-playwright/blob/main/tests/petstore/petStore.yaml) from this repository. Point the context `baseURL` at a running API. A standalone request context does not launch a browser.

```typescript [petStore.ts]
import { request as playwright } from '@playwright/test'
import { pwGetPetById } from './src/gen/playwright'

const request = await playwright.newContext({ baseURL: 'http://127.0.0.1:3000' })

try {
  const response = await pwGetPetById({
    request,
    path: { petId: '123' },
    options: { timeout: 5_000 },
  })
  console.log(response.status(), await response.json())
} finally {
  await request.dispose()
}
```

## Documentation

- [Overview](https://kubb.dev/extensions/ericlm/kubb-plugin-playwright) and [options](https://kubb.dev/extensions/ericlm/kubb-plugin-playwright/options) on kubb.dev, built from the [`docs/`](https://github.com/Ericlm/kubb-plugin-playwright/tree/main/docs) folder
- [PetStore HTTP tests](https://github.com/Ericlm/kubb-plugin-playwright/tree/main/tests/petstore), which start a local server and call the generated helpers through a real request context

## Development

```bash
pnpm install
pnpm test       # generates the PetStore example, then runs vitest
pnpm typecheck
pnpm build
```

## License

[MIT](https://github.com/Ericlm/kubb-plugin-playwright/blob/main/LICENSE)
