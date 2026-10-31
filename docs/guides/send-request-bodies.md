# Send request bodies

Send JSON, URL-encoded forms, and multipart files through the generated helpers, and know how each body reaches Playwright.

## Pick the body mode

The first content type declared in the request body decides which native fetch option the helper fills:

| Content type                                         | Fetch option |
| ---------------------------------------------------- | ------------ |
| `application/json` or a media type ending in `+json` | `data`       |
| `application/x-www-form-urlencoded`                  | `form`       |
| `multipart/form-data`                                | `multipart`  |

Operations whose first content type is not in this table are skipped.

## Send each kind of body

Pass the typed body as `body`. Form arrays become repeated fields, and multipart `Blob` values become file fields through `FormData`.

```typescript [bodies.spec.ts]
import { expect, test } from '@playwright/test'
import { pwAddPet, pwUpdatePetDetails, pwUploadPetPhoto } from './src/gen/playwright'

test.use({ baseURL: 'http://127.0.0.1:3000' })

test('sends JSON, form fields and a file', async ({ request }) => {
  const response = await pwAddPet({ request, body: { name: 'Rex' } })
  const pet = await response.json()
  expect(pet.name).toBe('Rex')

  await pwUpdatePetDetails({
    request,
    path: { petId: '123' },
    body: { name: 'Rex', tags: ['friendly', 'small'] },
  })

  await pwUploadPetPhoto({
    request,
    path: { petId: '123' },
    body: { file: new Blob(['file contents']), description: 'Rex', tags: ['profile'] },
  })
})
```

## Serialization

Playwright serializes the body and sets the Content-Type. JSON helpers pass `body` as `data`, so objects use Playwright's JSON serialization and primitive values follow its native behavior.

A `+json` media type selects `data` but does not set that Content-Type. Set `options.headers` when the API needs the exact media type.

Values that Playwright accepts natively pass through unchanged. When the helper has to convert form or query values, it leaves out `null` and `undefined`.

## Replace or switch the body

To send a different body, set the same native option in `options`, for example `options: { data: rawJson }`. To switch modes, also clear the generated one, for example `options: { data: undefined, form: { name: 'Rex' } }` on a JSON helper. Otherwise Playwright receives two body modes and rejects the request.
