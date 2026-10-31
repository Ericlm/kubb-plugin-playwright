# @kubb/plugin-playwright

Generate typed Playwright API request helpers from an OpenAPI specification. Each helper calls `request.fetch` and returns the native Playwright response, with a typed `response.json()`.

Requires Node.js 22 or newer, Kubb `^5.1.0`, and Playwright `^1.63.0`. Playwright 1.63 is the minimum supported version.

## Installation

Install the plugin, its TypeScript dependency, and Playwright alongside Kubb and the OpenAPI adapter:

```bash
bun add -d kubb @kubb/adapter-oas @kubb/plugin-ts @kubb/plugin-playwright '@playwright/test@^1.63.0'
# or
pnpm add -D kubb @kubb/adapter-oas @kubb/plugin-ts @kubb/plugin-playwright '@playwright/test@^1.63.0'
# or
npm install --save-dev kubb @kubb/adapter-oas @kubb/plugin-ts @kubb/plugin-playwright '@playwright/test@^1.63.0'
# or
yarn add -D kubb @kubb/adapter-oas @kubb/plugin-ts @kubb/plugin-playwright '@playwright/test@^1.63.0'
```

## Configuration

Keep `pluginTs()` in the configuration. The default output contains types in `src/gen/types` and request helpers in `src/gen/playwright`.

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

Run `pnpm exec kubb generate` to generate the files.

## Usage

The following call uses the [PetStore example specification](https://github.com/kubb-labs/plugins/blob/main/examples/playwright/petStore.yaml). Point the context's `baseURL` at a running API. A standalone request context does not launch a browser.

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

- [Overview and request examples](https://kubb.dev/extensions/kubb-labs/plugin-playwright)
- [Plugin options](https://kubb.dev/extensions/kubb-labs/plugin-playwright/options)
- [PetStore example and HTTP tests](https://github.com/kubb-labs/plugins/tree/main/examples/playwright), which start their own local server without a browser

## License

[MIT](https://github.com/kubb-labs/plugins/blob/main/LICENSE)
