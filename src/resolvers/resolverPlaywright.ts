import { camelCase, createResolver } from '@kubb/kit'
import type { PluginPlaywright } from '../types.ts'

/**
 * Prefixes helper names and filenames with `pw` from the original operationId.
 * The prefix also keeps every name a valid, non-reserved identifier.
 */
export const resolverPlaywright = createResolver<PluginPlaywright>({
  pluginName: 'plugin-playwright',
  name(name) {
    return camelCase(name, { prefix: 'pw' })
  },
  file: {
    baseName({ name, extname }) {
      return `${camelCase(name, { prefix: 'pw' })}${extname}`
    },
  },
})
