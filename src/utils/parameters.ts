import type { ast } from '@kubb/kit'

/**
 * Returns the operation's parameters declared in `location`. A malformed spec can declare the same
 * name twice in one location, which would print a duplicate object member, so the first one wins.
 */
export function getParameters(node: ast.OperationNode, location: ast.ParameterNode['in']): Array<ast.ParameterNode> {
  const seen = new Set<string>()

  return node.parameters.filter((param) => {
    if (param.in !== location || seen.has(param.name)) return false
    seen.add(param.name)
    return true
  })
}
