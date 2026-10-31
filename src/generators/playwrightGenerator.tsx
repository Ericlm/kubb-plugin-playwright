import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from 'kubb/jsx'
import { ast, defineGenerator } from 'kubb/kit'
import { Request } from '../components/Request.tsx'
import type { PluginPlaywright } from '../types.ts'
import { getParameters } from '../utils/parameters.ts'

/**
 * Emits typed HTTP helpers with OpenAPI parameters, JSON and form bodies, and native fetch options.
 */
export const playwrightGenerator = defineGenerator<PluginPlaywright>({
  name: 'playwright',
  renderer: jsxRenderer,
  operation(node, ctx) {
    if (!ast.isHttpOperationNode(node) || node.parameters.some((param) => param.in === 'cookie')) return null

    const content = node.requestBody?.content?.[0]
    const mediaType = content?.contentType.split(';')[0]?.trim().toLowerCase()
    const supportedBody =
      mediaType === 'application/json' ||
      mediaType?.endsWith('+json') ||
      mediaType === 'application/x-www-form-urlencoded' ||
      mediaType === 'multipart/form-data'
    if (node.requestBody && !supportedBody) return null

    const { config, resolver, driver, root } = ctx
    const { output, baseURL, group } = ctx.options
    const pluginTs = driver.getPlugin(pluginTsName)
    if (!pluginTs) return null

    const tsResolver = driver.getResolver(pluginTsName)
    const responseType = tsResolver.response.response(node)
    const [path] = getParameters(node, 'path')
    const [query] = getParameters(node, 'query')
    const [header] = getParameters(node, 'header')
    const pathType = path ? tsResolver.param.path(node, path) : undefined
    const queryType = query ? tsResolver.param.query(node, query) : undefined
    const headersType = header ? tsResolver.param.headers(node, header) : undefined
    const bodyType = content?.schema ? tsResolver.response.body(node) : undefined
    const importedTypeNames = [responseType, pathType, queryType, headersType, bodyType].filter((name) => name !== undefined)
    const entry = { name: node.operationId, extname: '.ts', tag: node.tags[0] ?? 'default', path: node.path } as const
    const file = resolver.file({ ...entry, root, output, group: group ?? undefined })
    const fileTs = ctx.memo(`${pluginTsName}:operationFile:${node.operationId}`, () =>
      tsResolver.file({ ...entry, root, output: pluginTs.options?.output ?? output, group: pluginTs.options?.group ?? undefined }),
    )

    return (
      <File
        baseName={file.baseName}
        path={file.path}
        meta={file.meta}
        banner={resolver.default.banner(ctx.meta, { output, config, file })}
        footer={resolver.default.footer(ctx.meta, { output, config, file })}
      >
        <File.Import name={['APIRequestContext', 'APIResponse']} path="@playwright/test" isTypeOnly />
        <File.Import name={importedTypeNames} root={file.path} path={fileTs.path} isTypeOnly />
        <Request
          name={resolver.name(node.operationId)}
          node={node}
          responseType={responseType}
          pathType={pathType}
          queryType={queryType}
          headersType={headersType}
          bodyType={bodyType}
          contentType={content?.contentType}
          baseURL={baseURL}
        />
      </File>
    )
  },
})
