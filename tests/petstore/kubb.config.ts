import { adapterOas } from '@kubb/adapter-oas'
import { pluginPlaywright } from '../../src/index.ts'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: './tests/petstore/petStore.yaml',
  adapter: adapterOas(),
  output: { path: './tests/petstore/gen' },
  plugins: [pluginTs(), pluginPlaywright()],
})
