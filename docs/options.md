# Options

Pass these options to `pluginPlaywright()`. All of them are optional, and shared options link to [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options).

## Options overview

| Option                                                                    | Purpose                                                                | Default                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| [`output`](https://kubb.dev/docs/5.x/reference/plugin-options#output)     | Where files are written: `path`, `mode`, `barrel`, `banner`, `footer`. | `{ path: 'playwright', barrel: { type: 'named' } }` |
| [`group`](https://kubb.dev/docs/5.x/reference/plugin-options#group)       | Split output by tag or path: `type`, `name`.                           | None                                                |
| [`baseURL`](#baseurl)                                                     | URL prefix written into every generated request.                       | None                                                |
| [`include`](https://kubb.dev/docs/5.x/reference/plugin-options#include)   | Keep only operations that match.                                       | All supported operations                            |
| [`exclude`](https://kubb.dev/docs/5.x/reference/plugin-options#exclude)   | Skip operations that match. Exclusion wins over `include`.             | `[]`                                                |
| [`override`](https://kubb.dev/docs/5.x/reference/plugin-options#override) | Apply different options per pattern.                                   | `[]`                                                |
| [`resolver`](#resolver)                                                   | Customize generated names and file paths.                              | `resolverPlaywright`                                |
| [`macros`](https://kubb.dev/docs/5.x/reference/plugin-options#macros)     | Rewrite operation nodes before printing, in order.                     | `[]`                                                |

A custom `output` replaces the default object, so add `barrel: { type: 'named' }` to keep named exports. When an `override` sets `output`, also set `output.mode`, because Kubb does not infer it again.

`Options`, `PluginPlaywright`, and `ResolverPlaywright` are exported by `kubb-plugin-playwright`. The shared option types come from `@kubb/kit`.

## Option details

### baseURL

Prepends a URL to each operation path. Trailing slashes are removed before joining.

|          |          |
| -------- | -------- |
| Type     | `string` |
| Required | `false`  |

```typescript [kubb.config.ts]
import { pluginPlaywright } from 'kubb-plugin-playwright'

pluginPlaywright({ baseURL: 'https://api.example.com/v1' })
```

The URL for `/pets/{petId}` becomes `https://api.example.com/v1/pets/` followed by the encoded ID. The URL is part of the generated code.

When omitted, helpers use the relative operation path, and Playwright resolves it against the request context `baseURL`. OpenAPI `servers` are ignored. Leave `baseURL` unset to pick the environment when you create the context.

### resolver

The default resolver prefixes helper names and file names with `pw`, starting from the operation ID. For `getPetById`, the function and its export are `pwGetPetById`, in `pwGetPetById.ts`.

|          |                                     |
| -------- | ----------------------------------- |
| Type     | `ResolverPatch<ResolverPlaywright>` |
| Required | `false`                             |

Override `name` and `file.baseName` together to change the prefix of both functions and files. This example reuses the default casing and produces `apiGetPetById` in `apiGetPetById.ts`:

```typescript [kubb.config.ts]
import { pluginPlaywright, resolverPlaywright } from 'kubb-plugin-playwright'

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

Overriding only `name` renames the function and its export but keeps the default file name. Methods you leave out keep their defaults. Type names and their imports still come from the `@kubb/plugin-ts` resolver.

Per-request Playwright options do not belong here. Pass them in the helper's `options` argument, described in [Native options and responses](https://kubb.dev/extensions/ericlm/kubb-plugin-playwright/guides/native-options-and-responses).
