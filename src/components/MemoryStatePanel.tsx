import {
  Prioridad,
  formatIsoToDisplayDate,
  getTodayDisplayDate,
  type Actividad,
} from '../types/agenda';

interface MemoryStatePanelProps {
  textoActividad: string;
  mostrarErrorTexto: boolean;
  fechaIso: string;
  prioridadSeleccionada: Prioridad;
  textoBusqueda: string;
  actividadEnEdicion: Actividad | null;
  siguienteId: number;
  actividades: Actividad[];
}

const PRIORITY_COLORS: Record<Prioridad, string> = {
  [Prioridad.BAJA]: 'text-[#047857]',
  [Prioridad.MEDIA]: 'text-[#B45309]',
  [Prioridad.ALTA]: 'text-[#BA1A1A]',
};

const PRIORITY_ENUM_NAME: Record<Prioridad, string> = {
  [Prioridad.BAJA]: 'Prioridad.BAJA',
  [Prioridad.MEDIA]: 'Prioridad.MEDIA',
  [Prioridad.ALTA]: 'Prioridad.ALTA',
};

export function MemoryStatePanel({
  textoActividad,
  mostrarErrorTexto,
  fechaIso,
  prioridadSeleccionada,
  textoBusqueda,
  actividadEnEdicion,
  siguienteId,
  actividades,
}: MemoryStatePanelProps) {
  const total = actividades.length;
  const completadas = actividades.filter((a) => a.completada).length;
  const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const consulta = textoBusqueda.trim().toLowerCase();
  const filtradasCount = consulta
    ? actividades.filter((a) => a.titulo.toLowerCase().includes(consulta)).length
    : total;

  const fechaDisplay = fechaIso
    ? `"${formatIsoToDisplayDate(fechaIso)}"`
    : `"" → usa hoy (${getTodayDisplayDate()})`;

  return (
    <div className="flex flex-col">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
        <h2 className="font-display text-base sm:text-lg font-semibold text-slate-900">
          Estado vivo en memoria
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Interactúa con el teléfono para ver cómo cambian en vivo las variables
          con <code className="font-mono text-[13px] text-slate-800">remember</code>.
        </p>
      </div>

      {/* Live Numeric Summary Strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/40">
        <div className="px-4 sm:px-5 py-3.5">
          <div className="text-xs text-slate-500">Completado</div>
          <div className="mt-0.5 font-display text-2xl font-bold text-[#006A60] tabular-nums">
            {porcentaje}%
          </div>
        </div>
        <div className="px-4 sm:px-5 py-3.5">
          <div className="text-xs text-slate-500">Total / Completadas</div>
          <div className="mt-0.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {completadas}/{total}
          </div>
        </div>
        <div className="px-4 sm:px-5 py-3.5">
          <div className="text-xs text-slate-500">Visibles por búsqueda</div>
          <div className="mt-0.5 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {filtradasCount}
          </div>
        </div>
      </div>

      {/* Reactive variables */}
      <div className="divide-y divide-slate-100 px-5 sm:px-6">
        <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <code className="font-mono text-[13px] font-medium text-[#006A60]">
              textoActividad
            </code>
            <p className="text-xs text-slate-500 mt-0.5">
              mutableStateOf(&quot;&quot;) · error: {mostrarErrorTexto ? 'true' : 'false'}
            </p>
          </div>
          <code
            className={`font-mono text-[12.5px] px-2.5 py-1 rounded-md break-all ${
              mostrarErrorTexto
                ? 'bg-[#FDE8E8] text-[#BA1A1A] font-medium'
                : 'bg-slate-100 text-slate-900'
            }`}
          >
            &quot;{textoActividad}&quot;
          </code>
        </div>

        <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <code className="font-mono text-[13px] font-medium text-[#006A60]">
              textoBusqueda
            </code>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtra actividades por nombre en tiempo real
            </p>
          </div>
          <code className="font-mono text-[12.5px] text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md break-all">
            &quot;{textoBusqueda}&quot;
          </code>
        </div>

        <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <code className="font-mono text-[13px] font-medium text-[#006A60]">
              actividadEnEdicion
            </code>
            <p className="text-xs text-slate-500 mt-0.5">
              Abre EditarActividadDialog cuando no es null
            </p>
          </div>
          <code className="font-mono text-[12.5px] text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
            {actividadEnEdicion
              ? `Actividad(id=${actividadEnEdicion.id})`
              : 'null'}
          </code>
        </div>

        <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <code className="font-mono text-[13px] font-medium text-[#006A60]">
              fechaSeleccionada · prioridad
            </code>
            <p className="text-xs text-slate-500 mt-0.5">
              Valores actuales del formulario de alta
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[12px]">
            <code className="text-slate-900 bg-slate-100 px-2 py-1 rounded-md tabular-nums">
              {fechaDisplay}
            </code>
            <code
              className={`font-medium bg-slate-100 px-2 py-1 rounded-md ${PRIORITY_COLORS[prioridadSeleccionada]}`}
            >
              {PRIORITY_ENUM_NAME[prioridadSeleccionada]}
            </code>
          </div>
        </div>

        <div className="py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <code className="font-mono text-[13px] font-medium text-[#006A60]">
                actividades
              </code>
              <span className="ml-2 text-xs text-slate-500">
                siguienteId = {siguienteId}
              </span>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              size = {actividades.length}
            </span>
          </div>

          {actividades.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
              Lista vacía: <code className="font-mono text-slate-700">[]</code>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="py-2 px-3 font-medium">id</th>
                    <th className="py-2 px-3 font-medium">titulo</th>
                    <th className="py-2 px-3 font-medium">fecha</th>
                    <th className="py-2 px-3 font-medium">prioridad</th>
                    <th className="py-2 px-3 font-medium">estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {actividades.map((item) => (
                    <tr key={item.id} className="bg-white">
                      <td className="py-2 px-3 text-slate-500 tabular-nums">
                        {item.id}
                      </td>
                      <td className="py-2 px-3 font-sans text-[13px] text-slate-900">
                        {item.titulo}
                      </td>
                      <td className="py-2 px-3 text-slate-600 tabular-nums whitespace-nowrap">
                        {item.fecha}
                      </td>
                      <td
                        className={`py-2 px-3 font-medium whitespace-nowrap ${PRIORITY_COLORS[item.prioridad]}`}
                      >
                        {item.prioridad}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={
                            item.completada
                              ? 'text-[#006A60] font-medium'
                              : 'text-slate-600'
                          }
                        >
                          {item.completada ? 'Completada' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
