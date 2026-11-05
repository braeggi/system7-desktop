const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export function parseFrontmatter(raw: string): { title?: string; body: string } {
  const match = raw.match(FRONTMATTER)
  if (!match) return { body: raw }

  const result: { title?: string; body: string } = { body: raw.slice(match[0].length) }
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^(\w+):\s*(.*)$/)
    if (pair && pair[1] === 'title') result.title = unquote(pair[2].trim())
  }
  return result
}

function unquote(value: string): string {
  const quoted = value.match(/^(["'])(.*)\1$/)
  return quoted ? quoted[2] : value
}
