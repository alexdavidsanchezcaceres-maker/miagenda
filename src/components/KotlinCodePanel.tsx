import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { SCREEN_SECTIONS, type ComposeSectionId } from '../types/agenda';
import { findCodeLineRange, tokenizeCodeLine } from '../utils/kotlinHighlight';

interface KotlinCodePanelProps {
  mainActivityCode: string;
  androidManifestCode: string;
  buildGradleCode: string;
  focusedSection: ComposeSectionId | null;
  onClearFocusedSection: () => void;
}

type CodeFileTab = 'MainActivity.kt' | 'AndroidManifest.xml' | 'build.gradle.kts';

const TOKEN_COLORS: Record<string, string> = {
  comment: 'text-slate-400 italic',
  annotation: 'text-amber-300',
  string: 'text-emerald-300',
  keyword: 'text-sky-300 font-medium',
  type: 'text-teal-200',
  number: 'text-orange-300',
  plain: 'text-slate-100',
};

export function KotlinCodePanel({
  mainActivityCode,
  androidManifestCode,
  buildGradleCode,
  focusedSection,
  onClearFocusedSection,
}: KotlinCodePanelProps) {
  const [activeFile, setActiveFile] = useState<CodeFileTab>('MainActivity.kt');
  const [copied, setCopied] = useState(false);
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (focusedSection) {
      setActiveFile('MainActivity.kt');
    }
  }, [focusedSection]);

  const currentCode =
    activeFile === 'MainActivity.kt'
      ? mainActivityCode
      : activeFile === 'AndroidManifest.xml'
        ? androidManifestCode
        : buildGradleCode;

  const isXml = activeFile === 'AndroidManifest.xml';

  const lines = useMemo(() => currentCode.trimEnd().split('\n'), [currentCode]);

  const focusedMeta = useMemo(
    () => SCREEN_SECTIONS.find((s) => s.id === focusedSection) ?? null,
    [focusedSection]
  );

  const highlightRange = useMemo(() => {
    if (activeFile !== 'MainActivity.kt' || !focusedMeta) return null;
    return findCodeLineRange(
      mainActivityCode,
      focusedMeta.startMarker,
      focusedMeta.endMarker
    );
  }, [activeFile, focusedMeta, mainActivityCode]);

  useEffect(() => {
    if (!highlightRange) return;
    const targetLine = lineRefs.current[highlightRange[0]];
    if (targetLine) {
      targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightRange]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = currentCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* File Switcher + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-5 py-3 border-b border-slate-100 shrink-0">
        <div
          role="tablist"
          aria-label="Archivos del proyecto Android"
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 overflow-x-auto max-w-full"
        >
          {(
            [
              'MainActivity.kt',
              'AndroidManifest.xml',
              'build.gradle.kts',
            ] as CodeFileTab[]
          ).map((file) => (
            <button
              key={file}
              type="button"
              role="tab"
              aria-selected={activeFile === file}
              onClick={() => setActiveFile(file)}
              className={`rounded-md px-2.5 py-1.5 font-mono text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] ${
                activeFile === file
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {file}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#006A60]" />
                <span className="text-[#006A60]">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar</span>
          </button>
        </div>
      </div>

      {/* Contextual highlight banner */}
      {focusedMeta && highlightRange && activeFile === 'MainActivity.kt' && (
        <div className="flex items-center justify-between gap-3 bg-[#E6F4F1] px-5 py-2 text-xs text-[#003732] border-b border-[#CCE8E3] shrink-0">
          <span>
            Resaltando{' '}
            <code className="font-mono font-medium">{focusedMeta.composable}</code>{' '}
            · líneas {highlightRange[0]}–{highlightRange[1]}
          </span>
          <button
            type="button"
            onClick={onClearFocusedSection}
            className="inline-flex items-center gap-1 font-medium text-[#005048] hover:text-[#00201D] whitespace-nowrap shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span>Quitar resalte</span>
          </button>
        </div>
      )}

      {/* Code Viewport */}
      <div className="flex-1 bg-[#111827] text-slate-100 overflow-auto">
        <pre className="py-4 font-mono text-[12.5px] leading-[1.65] tracking-[0.01em]">
          <code>
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isHighlightedLine =
                highlightRange !== null &&
                lineNumber >= highlightRange[0] &&
                lineNumber <= highlightRange[1];
              const tokens = tokenizeCodeLine(line, isXml);

              return (
                <div
                  key={lineNumber}
                  ref={(el) => {
                    lineRefs.current[lineNumber] = el;
                  }}
                  className={`flex px-4 transition-colors duration-150 ${
                    isHighlightedLine ? 'bg-[#006A60]/35' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-9 shrink-0 select-none pr-4 text-right tabular-nums text-[11.5px] ${
                      isHighlightedLine ? 'text-[#9CF2E4] font-medium' : 'text-slate-500'
                    }`}
                  >
                    {lineNumber}
                  </span>
                  <span className="whitespace-pre">
                    {tokens.length === 0
                      ? ' '
                      : tokens.map((token, tokenIdx) => (
                          <span
                            key={tokenIdx}
                            className={TOKEN_COLORS[token.type]}
                          >
                            {token.value}
                          </span>
                        ))}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Concise Android Phone Project Note */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3 text-xs leading-relaxed text-slate-600 shrink-0">
        Proyecto Android listo para teléfonos en{' '}
        <code className="font-mono text-[11px] text-slate-800">android/</code>:
        bloqueo vertical (<code className="font-mono text-[11px] text-slate-800">portrait</code>)
        y soporte exclusivo para pantallas de teléfono en{' '}
        <code className="font-mono text-[11px] text-slate-800">AndroidManifest.xml</code>.
      </div>
    </div>
  );
}
