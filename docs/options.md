# Options

Configure `pluginPlaywright` to set generated URLs, names, and output. All options are optional.

## Defaults

| Option     | Type                                | Required | Default                                             |
| ---------- | ----------------------------------- | -------- | --------------------------------------------------- |
| `output`   | `OutputOptions['output']`           | `false`  | `{ path: 'playwright', barrel: { type: 'named' } }` |
| `group`    | `OutputOptions['group']`            | `false`  | No grouping                                         |
| `baseURL`  | `string`                            | `false`  | No URL prefix                                       |
| `include`  | `Array<Include>`                    | `false`  | All supported operations                            |
| `exclude`  | `Array<Exclude>`                    | `false`  | `[]`                                                |
| `override` | `Options['override']`               | `false`  | `[]`                                                |
| `resolver` | `ResolverPatch<ResolverPlaywright>` | `false`  | `resolverPlaywright`                                |
| `macros`   | `Array<ast.Macro>`                  | `false`  | No macros                                           |

`Options` and `ResolverPlaywright` are exported by `@kubb/plugin-playwright`. The shared option types come from `kubb/kit`.

## baseURL

Prepends a URL to each generated operation path. Trailing slashes are removed before joining the path.

```typescript [kubb.config.ts]
import { pluginPlaywright } from '@kubb/plugin-playwright'

pluginPlaywright({ baseURL: 'https://api.example.com/v1' })
```

The generated URL for `/pets/{petId}` becomes `https://api.example.com/v1/pets/` followed by the encoded ID. This URL is part of the generated code.

When omitted, the helper uses the relative operation path and Playwright resolves it with the request context's `baseURL`. OpenAPI `servers` are ignored. Keep `baseURL` unset to choose the environment when creating the context.

## resolver

The default resolver prefixes helper names and filenames with `pw`, starting from the operation ID. For `getPetById`, the function, export, and filename are `pwGetPetById`, `pwGetPetById`, and `pwGetPetById.ts`.

Override both `name` and `file.baseName` to change the prefix for functions and files. This example reuses the default casing and produces `apiGetPetById` in `apiGetPetById.ts`:

```typescript [kubb.config.ts]
import { pluginPlaywright, resolverPlaywright } from '@kubb/plugin-playwright'

function resolveName(operationId: string) {
  return resolverPlaywright.name(operationId).replace(/^pw/, 'api')
}

pluginPlaywright({
  resolver: {
    name: resolveName,
    file: {
      baseName: ({ name, extname }) => `${resolveName(name)}${extname}`,
    },
  },
})
```

Overriding only `name` changes the function and export while retaining the default filename. Omitted resolver methods keep their defaults. Type names and imports continue to use `plugin-ts`'s independent resolver.

## Shared options

The [shared plugin options reference](https://kubb.dev/docs/5.x/reference/plugin-options) describes the common behavior:

- [output](https://kubb.dev/docs/5.x/reference/plugin-options#output) sets the destination, directory or single-file mode, and barrels. A custom `output` replaces the default object, so include `barrel: { type: 'named' }` to keep named exports.
- [group](https://kubb.dev/docs/5.x/reference/plugin-options#group) groups files by tag or path and accepts a custom group name. Grouping requires directory output.
- [include](https://kubb.dev/docs/5.x/reference/plugin-options#include) and [exclude](https://kubb.dev/docs/5.x/reference/plugin-options#exclude) select operations. Exclusion wins when both match an operation.
- [override](https://kubb.dev/docs/5.x/reference/plugin-options#override) applies the first matching rule. When overriding `output`, supply `output.mode` because Kubb replaces that object without inferring its mode again.
- [resolver](https://kubb.dev/docs/5.x/reference/plugin-options#resolver) customizes names and paths through a partial patch.
- [macros](https://kubb.dev/docs/5.x/reference/plugin-options#macros) transforms operation nodes in the supplied order before generation.

These plugin options control generation. Per-request native Playwright options belong in the generated helper's `options` argument, described in the [overview](https://kubb.dev/extensions/kubb-labs/plugin-playwright).
