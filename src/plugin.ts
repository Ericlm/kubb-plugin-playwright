import { addGenerator, defineExtension, Resolver, setMacros, setResolver } from '@kubb/kit'
import { pluginTsName } from '@kubb/plugin-ts'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'
import { playwrightGenerator } from './generators/playwrightGenerator.tsx'
import { resolverPlaywright } from './resolvers/resolverPlaywright.ts'
import type { PluginPlaywright, ResolverPlaywright } from './types.ts'

/**
 * Identifies the Playwright plugin in the Kubb driver.
 */
export const pluginPlaywrightName = 'plugin-playwright' satisfies PluginPlaywright['name']

/**
 * Generates native Playwright responses for HTTP operations with parameters, JSON bodies, and forms.
 * Adapts query arrays and values incompatible with Playwright's native parameter and form types.
 * Native options are spread over generated values, except the operation's HTTP method.
 * Supports JSON, URL-encoded forms, and multipart bodies. Other body media types and cookie parameters are skipped.
 * Playwright handles body serialization, Content-Type, and errors. Use options for custom serialization.
 * Requires `pluginTs()` for the response types.
 */
export const pluginPlaywright = defineExtension<PluginPlaywright>({
  kind: 'plugin',
  meta: { name: pluginPlaywrightName, version, compatibility },
  dependencies: { [pluginTsName]: {} },
  setup(options) {
    const {
      output = { path: 'playwright', barrel: { type: 'named' } },
      group,
      exclude = [],
      include,
      override = [],
      baseURL,
      resolver: userResolver,
      macros: userMacros,
    } = options

    setResolver(userResolver ? Resolver.merge<ResolverPlaywright>(resolverPlaywright, userResolver) : resolverPlaywright)
    if (userMacros?.length) setMacros(userMacros)
    addGenerator(playwrightGenerator)

    return {
      output,
      group: group ?? null,
      exclude,
      include,
      override,
      baseURL,
    }
  },
})

export default pluginPlaywright
