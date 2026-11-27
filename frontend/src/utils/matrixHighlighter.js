/**
 * Cyberpunk Matrix Live Syntax Highlighter
 * High-performance regex tokenizer for C, C++, Java, Python, and JavaScript.
 */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const TOKEN_REGEX = /(\/\*[\s\S]*?\*\/|\/\/.*$|#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|for|while|do|class|import|export|from|as|default|async|await|switch|case|break|continue|try|catch|finally|throw|new|this|typeof|instanceof|void|yield|public|private|protected|static|final|abstract|extends|implements|interface|package|throws|int|float|double|char|boolean|byte|short|long|def|elif|lambda|pass|with|except|raise|include|define|typedef|struct|enum|auto|namespace|using|cout|cin|endl)\b)|(\b(?:console|log|warn|error|info|debug|print|println|printf|System|out|Math|JSON|Promise|Array|Object|String|Number|Boolean|Date|RegExp|Map|Set|document|window|process|require)\b)|(\b(?:true|false|null|undefined|NaN|None|True|False)\b)|(\b\d+(?:\.\d+)?\b)|([{}()[\];,:.+\-*/%&|^!<>?=~])/gm

export function highlightMatrixCode(code) {
  if (!code) return ''

  // Break by lines to handle trailing newlines gracefully
  const escaped = escapeHtml(code)

  return escaped.replace(
    TOKEN_REGEX,
    (match, comment, str, keyword, builtin, bool, number, op) => {
      if (comment) {
        return `<span style="color: #4e7863; font-style: italic;">${comment}</span>`
      }
      if (str) {
        return `<span style="color: #ffb454;">${str}</span>`
      }
      if (keyword) {
        return `<span style="color: #00ff88; font-weight: 600; text-shadow: 0 0 8px rgba(0,255,136,0.25);">${keyword}</span>`
      }
      if (builtin) {
        return `<span style="color: #00f0b5; font-weight: 500;">${builtin}</span>`
      }
      if (bool) {
        return `<span style="color: #ff3366; font-weight: 500;">${bool}</span>`
      }
      if (number) {
        return `<span style="color: #ff9f43;">${number}</span>`
      }
      if (op) {
        return `<span style="color: #7fe8bc;">${op}</span>`
      }
      return match
    }
  )
}
