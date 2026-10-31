import { format as prettierFormat, type Options } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [pluginTypescript],
}

/**
 * Formats generated sources before inline snapshots, so snapshots stay stable across whitespace changes.
 */
export async function format(source?: string): Promise<string> {
  if (!source) return ''
  try {
    return await prettierFormat(source, formatOptions)
  } catch {
    return source
  }
}
