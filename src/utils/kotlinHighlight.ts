export interface CodeToken {
  type: 'comment' | 'annotation' | 'string' | 'keyword' | 'type' | 'number' | 'plain';
  value: string;
}

const KOTLIN_KEYWORDS = new Set([
  'package',
  'import',
  'class',
  'data',
  'enum',
  'fun',
  'val',
  'var',
  'private',
  'override',
  'if',
  'else',
  'when',
  'by',
  'true',
  'false',
  'null',
  'return',
  'plugins',
  'android',
  'defaultConfig',
  'buildFeatures',
  'compileOptions',
  'kotlinOptions',
  'dependencies',
  'implementation',
  'debugImplementation',
  'id',
  'version',
  'platform',
]);

const KOTLIN_TOKEN_PATTERN =
  /(\/\/.*$|"(?:\\.|[^"\\])*"|@[A-Za-z_][A-Za-z0-9_]*|\b\d+(?:\.\d+)?[fFL]?\b|\b0x[0-9A-Fa-f]+\b|\b[A-Z][A-Za-z0-9_]*\b|\b[a-z_][A-Za-z0-9_]*\b)/;

const XML_TOKEN_PATTERN =
  /(<!--[\s\S]*?-->|"(?:\\.|[^"\\])*"|<\/?[A-Za-z0-9_:-]+|\/?>|\b[A-Za-z0-9_:-]+(?==))/;

export function tokenizeCodeLine(line: string, isXml = false): CodeToken[] {
  const tokens: CodeToken[] = [];
  let remaining = line;
  const pattern = isXml ? XML_TOKEN_PATTERN : KOTLIN_TOKEN_PATTERN;

  while (remaining.length > 0) {
    const match = pattern.exec(remaining);
    if (!match || match.index === undefined) {
      tokens.push({ type: 'plain', value: remaining });
      break;
    }

    if (match.index > 0) {
      tokens.push({ type: 'plain', value: remaining.slice(0, match.index) });
    }

    const value = match[0];
    let type: CodeToken['type'] = 'plain';

    if (isXml) {
      if (value.startsWith('<!--')) {
        type = 'comment';
      } else if (value.startsWith('"')) {
        type = 'string';
      } else if (value.startsWith('<') || value === '>' || value === '/>') {
        type = 'keyword';
      } else {
        type = 'type';
      }
    } else if (value.startsWith('//')) {
      type = 'comment';
    } else if (value.startsWith('"')) {
      type = 'string';
    } else if (value.startsWith('@')) {
      type = 'annotation';
    } else if (/^(?:\d|0x)/.test(value)) {
      type = 'number';
    } else if (KOTLIN_KEYWORDS.has(value)) {
      type = 'keyword';
    } else if (/^[A-Z]/.test(value)) {
      type = 'type';
    }

    tokens.push({ type, value });
    remaining = remaining.slice(match.index + value.length);
  }

  return tokens;
}

export function findCodeLineRange(
  source: string,
  startMarker: string,
  endMarker: string
): [number, number] | null {
  const lines = source.split('\n');
  const startIndex = lines.findIndex((line) => line.includes(startMarker));
  if (startIndex === -1) return null;

  let endIndex = startIndex;
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].includes(endMarker)) {
      endIndex = i;
      break;
    }
  }

  if (
    endIndex + 1 < lines.length &&
    (lines[endIndex + 1].trim().startsWith(')') ||
      lines[endIndex + 1].trim().startsWith('}'))
  ) {
    endIndex += 1;
  }

  return [startIndex + 1, endIndex + 1];
}
