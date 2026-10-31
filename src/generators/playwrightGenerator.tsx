import { pluginTsName } from '@kubb/plugin-ts'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import { ast, defineGenerator, type NormalizedPlugin } from '@kubb/kit'
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
    const pluginTs = ctx.requirePlugin(pluginTsName)
    const tsResolver = driver.getResolver(pluginTsName)
    // Each plugin runs its own macros, and plugin-ts keys its type names on the method and path.
    // Resolve those names from the operation as plugin-ts sees it, not as this plugin's macros left it.
    const source = driver.inputNode?.operations.find((operation) => operation.operationId === node.operationId)
    // The driver hands out normalized plugins, whose public type carries the macros `Plugin` omits.
    const tsNode = source ? ast.applyMacros(source, (pluginTs as NormalizedPlugin).macros ?? []) : node

    const responseType = tsResolver.response.response(tsNode)
    const [path] = getParameters(node, 'path')
    const [query] = getParameters(node, 'query')
    const [header] = getParameters(node, 'header')
    const pathType = path ? tsResolver.param.path(tsNode, path) : undefined
    const queryType = query ? tsResolver.param.query(tsNode, query) : undefined
    const headersType = header ? tsResolver.param.headers(tsNode, header) : undefined
    const bodyType = content?.schema ? tsResolver.response.body(tsNode) : undefined
    const importedTypeNames = [responseType, pathType, queryType, headersType, bodyType].filter((name) => name !== undefined)
    const file = resolver.file({
      name: node.operationId,
      extname: '.ts',
      tag: node.tags[0] ?? 'default',
      path: node.path,
      root,
      output,
      group: group ?? undefined,
    })
    const fileTs = ctx.memo(`${pluginTsName}:operationFile:${tsNode.operationId}`, () =>
      tsResolver.file({
        name: tsNode.operationId,
        extname: '.ts',
        tag: tsNode.tags[0] ?? 'default',
        path: tsNode.path,
        root,
        output: pluginTs.options?.output ?? output,
        group: pluginTs.options?.group ?? undefined,
      }),
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
