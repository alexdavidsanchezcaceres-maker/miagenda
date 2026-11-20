import { ArrowUpRight } from 'lucide-react';
import { SCREEN_SECTIONS, type ComposeSectionId } from '../types/agenda';

interface ScreenOrganizationPanelProps {
  highlightedSection: ComposeSectionId | null;
  onHoverSection: (section: ComposeSectionId | null) => void;
  onJumpToCode: (section: ComposeSectionId) => void;
}

const INDENT_CLASSES: Record<0 | 1 | 2 | 3, string> = {
  0: 'pl-4',
  1: 'pl-8',
  2: 'pl-12',
  3: 'pl-16',
};

export function ScreenOrganizationPanel({
  highlightedSection,
  onHoverSection,
  onJumpToCode,
}: ScreenOrganizationPanelProps) {
  return (
    <div className="flex flex-col">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
        <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900">
          Organización de la pantalla móvil
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Todos los bloques viven en{' '}
          <code className="font-mono text-[13px] text-slate-800">
            MiAgendaScreen()
          </code>{' '}
          dentro de un{' '}
          <code className="font-mono text-[13px] text-slate-800">LazyColumn</code>{' '}
          vertical para desplazarse con fluidez incluso al abrir el teclado del
          teléfono.
        </p>
      </div>

      <ol className="divide-y divide-slate-100">
        {SCREEN_SECTIONS.map((section) => {
          const isActive = highlightedSection === section.id;

          return (
            <li
              key={section.id}
              onMouseEnter={() => onHoverSection(section.id)}
              onMouseLeave={() => onHoverSection(null)}
              className={`group relative pr-4 sm:pr-5 py-3.5 transition-colors duration-150 ${
                INDENT_CLASSES[section.indentLevel]
              } ${isActive ? 'bg-[#E6F4F1]/65' : 'hover:bg-slate-50/80'}`}
            >
              {section.indentLevel > 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 bottom-0 w-px bg-slate-200/80"
                  style={{ left: `${section.indentLevel * 16 + 4}px` }}
                />
              )}

              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onHoverSection(isActive ? null : section.id)}
                  className="flex-1 text-left focus-visible:outline-none focus-visible:underline"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-mono text-xs font-medium text-slate-400 tabular-nums">
                      {section.order}.
                    </span>
                    <code
                      className={`font-mono text-[13px] font-medium transition-colors ${
                        isActive ? 'text-[#005048]' : 'text-[#006A60]'
                      }`}
                    >
                      {section.composable}
                    </code>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {section.roleTitle}
                    </span>
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">
                    {section.description}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onJumpToCode(section.id)}
                  className="inline-flex items-center gap-1 min-h-[36px] rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-white hover:text-[#006A60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
                >
                  <span>Ver código</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-200 bg-slate-50/50">
        <div className="p-4 sm:p-5">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Progreso en vivo
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            <code className="font-mono text-[11px] text-slate-800">
              ResumenProgresoCard
            </code>{' '}
            calcula el porcentaje sobre todas las tareas registradas con círculo y
            barra de avance.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Búsqueda instantánea
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Filtra por nombre en tiempo real sin modificar ni perder la lista real
            guardada en memoria.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Edición sencilla
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            <code className="font-mono text-[11px] text-slate-800">
              EditarActividadDialog
            </code>{' '}
            permite cambiar nombre y fecha validando texto vacío, con botones
            Guardar y Cancelar.
          </p>
        </div>
      </div>
    </div>
  );
}
