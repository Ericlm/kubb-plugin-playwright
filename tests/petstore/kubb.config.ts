import { adapterOas } from '@kubb/adapter-oas'
import { pluginPlaywright } from '../../src/index.ts'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: './petStore.yaml',
  adapter: adapterOas(),
  output: { path: './gen' },
  plugins: [pluginTs(), pluginPlaywright()],
})
