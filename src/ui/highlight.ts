const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'of', 'in',
  'true', 'false', 'new', 'typeof', 'break', 'continue', 'null', 'undefined',
])

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function highlightLine(line: string) {
  let html = ''
  let index = 0
  while (index < line.length) {
    if (line.startsWith('//', index)) {
      html += `<span class="tok-c">${escapeHtml(line.slice(index))}</span>`
      break
    }
    const quote = line[index]
    if (quote === '"' || quote === "'" || quote === '`') {
      let end = index + 1
      while (end < line.length) {
        if (line[end] === '\\') {
          end += 2
          continue
        }
        if (line[end] === quote) {
          end += 1
          break
        }
        end += 1
      }
      html += `<span class="tok-s">${escapeHtml(line.slice(index, end))}</span>`
      index = end
      continue
    }
    if (/[0-9]/.test(line[index]) && (index === 0 || /[^A-Za-z0-9_$]/.test(line[index - 1]))) {
      let end = index
      while (end < line.length && /[0-9.]/.test(line[end])) end += 1
      html += `<span class="tok-n">${escapeHtml(line.slice(index, end))}</span>`
      index = end
      continue
    }
    if (/[A-Za-z_$]/.test(line[index])) {
      let end = index
      while (end < line.length && /[A-Za-z0-9_$]/.test(line[end])) end += 1
      const word = line.slice(index, end)
      html += `<span class="${KEYWORDS.has(word) ? 'tok-k' : 'tok-i'}">${escapeHtml(word)}</span>`
      index = end
      continue
    }
    html += escapeHtml(line[index])
    index += 1
  }
  return html || ' '
}

export function showValue(value: unknown) {
  if (value && typeof value === 'object' && '__zt' in value) return 'undefined'
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
