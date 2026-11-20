import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  Code2,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  PRIORIDADES,
  Prioridad,
  displayDateToIso,
  formatIsoToDisplayDate,
  getTodayDisplayDate,
  getTodayIsoDate,
  type Actividad,
  type ComposeSectionId,
} from '../types/agenda';
import { AndroidDatePickerDialog } from './AndroidDatePickerDialog';

interface AndroidPhonePreviewProps {
  actividades: Actividad[];
  textoActividad: string;
  mostrarErrorTexto: boolean;
  fechaIso: string;
  prioridadSeleccionada: Prioridad;
  textoBusqueda: string;
  actividadEnEdicion: Actividad | null;
  snackbarMessage: string | null;
  canUndoDelete: boolean;
  onUndoDelete: () => void;
  onTextoChange: (valor: string) => void;
  onFechaChange: (isoDate: string) => void;
  onPrioridadChange: (prioridad: Prioridad) => void;
  onBusquedaChange: (consulta: string) => void;
  onAgregarActividad: () => boolean;
  onToggleActividad: (id: number) => void;
  onIniciarEdicion: (actividad: Actividad) => void;
  onGuardarEdicion: (id: number, nuevoTitulo: string, nuevaFecha: string) => void;
  onCancelarEdicion: () => void;
  onEliminarActividad: (id: number) => void;
  onReiniciarApp: () => void;
  onCargarEjemplos: () => void;
  onOpenMobileCode: () => void;
  highlightedSection: ComposeSectionId | null;
  inspectorMode: boolean;
  onSelectSection: (section: ComposeSectionId) => void;
}

const PRIORITY_CHIP_STYLES: Record<
  Prioridad,
  { active: string; inactive: string }
> = {
  [Prioridad.BAJA]: {
    active: 'border-transparent bg-[#D3EFE6] text-[#00503C] font-semibold',
    inactive: 'border-[#747775]/60 bg-transparent text-[#3F4947] hover:bg-[#006A60]/5',
  },
  [Prioridad.MEDIA]: {
    active: 'border-transparent bg-[#FCE8C3] text-[#7A3F00] font-semibold',
    inactive: 'border-[#747775]/60 bg-transparent text-[#3F4947] hover:bg-[#006A60]/5',
  },
  [Prioridad.ALTA]: {
    active: 'border-transparent bg-[#FCDAD7] text-[#8C1D18] font-semibold',
    inactive: 'border-[#747775]/60 bg-transparent text-[#3F4947] hover:bg-[#006A60]/5',
  },
};

const PRIORITY_TEXT_COLORS: Record<Prioridad, string> = {
  [Prioridad.BAJA]: 'text-[#047857]',
  [Prioridad.MEDIA]: 'text-[#B45309]',
  [Prioridad.ALTA]: 'text-[#BA1A1A]',
};

function formatAndroidClock(): string {
  const now = new Date();
  return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function AndroidPhonePreview({
  actividades,
  textoActividad,
  mostrarErrorTexto,
  fechaIso,
  prioridadSeleccionada,
  textoBusqueda,
  actividadEnEdicion,
  snackbarMessage,
  canUndoDelete,
  onUndoDelete,
  onTextoChange,
  onFechaChange,
  onPrioridadChange,
  onBusquedaChange,
  onAgregarActividad,
  onToggleActividad,
  onIniciarEdicion,
  onGuardarEdicion,
  onCancelarEdicion,
  onEliminarActividad,
  onReiniciarApp,
  onCargarEjemplos,
  onOpenMobileCode,
  highlightedSection,
  inspectorMode,
  onSelectSection,
}: AndroidPhonePreviewProps) {
  const [inputFocused, setInputFocused] = useState(false);
  const [showCreateDatePicker, setShowCreateDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [clockText, setClockText] = useState(() => formatAndroidClock());
  const inputRef = useRef<HTMLInputElement>(null);

  const [editTitulo, setEditTitulo] = useState('');
  const [editFechaIso, setEditFechaIso] = useState('');
  const [editError, setEditError] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockText(formatAndroidClock());
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (actividadEnEdicion) {
      setEditTitulo(actividadEnEdicion.titulo);
      setEditFechaIso(displayDateToIso(actividadEnEdicion.fecha));
      setEditError(false);
      setShowEditDatePicker(false);
      window.setTimeout(() => editInputRef.current?.focus(), 40);
    }
  }, [actividadEnEdicion]);

  useEffect(() => {
    if (!actividadEnEdicion || showEditDatePicker) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelarEdicion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actividadEnEdicion, showEditDatePicker, onCancelarEdicion]);

  const isHighlighted = (section: ComposeSectionId) =>
    highlightedSection === section;

  const isClickableLayer = inspectorMode;

  const hoyIso = getTodayIsoDate();
  const hoyDisplay = getTodayDisplayDate();
  const usaFechaHoy = !fechaIso || fechaIso === hoyIso;
  const fechaVisible = fechaIso ? formatIsoToDisplayDate(fechaIso) : hoyDisplay;

  const totalTareas = actividades.length;
  const completadasCount = actividades.filter((a) => a.completada).length;
  const pendientesCount = totalTareas - completadasCount;
  const porcentajeCompletado =
    totalTareas > 0 ? Math.round((completadasCount / totalTareas) * 100) : 0;

  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (porcentajeCompletado / 100) * ringCircumference;

  const consultaLimpia = textoBusqueda.trim();
  const actividadesFiltradas = consultaLimpia
    ? actividades.filter((a) =>
        a.titulo.toLowerCase().includes(consultaLimpia.toLowerCase())
      )
    : actividades;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onAgregarActividad();
    if (!ok) {
      inputRef.current?.focus();
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividadEnEdicion) return;
    const tituloLimpio = editTitulo.trim();
    if (!tituloLimpio) {
      setEditError(true);
      editInputRef.current?.focus();
      return;
    }
    const nuevaFecha = editFechaIso
      ? formatIsoToDisplayDate(editFechaIso)
      : getTodayDisplayDate();
    onGuardarEdicion(actividadEnEdicion.id, tituloLimpio, nuevaFecha);
  };

  return (
    <div
      className={`relative flex flex-1 min-h-0 flex-col bg-[#F4FBF9] transition-shadow duration-150 ${
        isHighlighted('scaffold') ? 'ring-2 ring-inset ring-[#006A60]' : ''
      }`}
    >
      {/* Inspector label for Scaffold */}
      {(inspectorMode || isHighlighted('scaffold')) && (
        <button
          type="button"
          onClick={() => onSelectSection('scaffold')}
          className="absolute right-2.5 top-8 z-30 rounded bg-[#00201D] px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-[#9CF2E4] shadow-xs"
        >
          Scaffold
        </button>
      )}

      {/* ANDROID SYSTEM STATUS BAR (Inside framed phone at >= 460px; hidden on real mobile screens) */}
      <div
        aria-hidden="true"
        className="hidden min-[460px]:flex items-center justify-between bg-[#CCE8E3] px-5 pt-2 pb-0.5 text-[10.5px] font-medium text-[#00201D] select-none shrink-0"
      >
        <span className="tabular-nums">{clockText}</span>
        <span className="h-3 w-3 rounded-full bg-[#14171A]" />
        <div className="flex items-center gap-1.5">
          <span className="text-[9.5px] font-semibold tracking-tight">5G</span>
          <svg
            width="11"
            height="9"
            viewBox="0 0 12 10"
            fill="currentColor"
            className="opacity-85"
          >
            <rect x="0" y="6.5" width="2" height="3.5" rx="0.5" />
            <rect x="3.2" y="4.5" width="2" height="5.5" rx="0.5" />
            <rect x="6.4" y="2.3" width="2" height="7.7" rx="0.5" />
            <rect x="9.6" y="0" width="2" height="10" rx="0.5" />
          </svg>
          <svg
            width="15"
            height="9"
            viewBox="0 0 16 10"
            fill="none"
            className="opacity-85"
          >
            <rect
              x="0.7"
              y="1"
              width="12.6"
              height="8"
              rx="1.8"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <rect x="2.2" y="2.5" width="9.6" height="5" rx="0.6" fill="currentColor" />
            <path d="M14.7 3.3V6.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ANDROID MATERIAL 3 TOP APP BAR */}
      <header
        onClick={() => isClickableLayer && onSelectSection('topBar')}
        className={`sticky top-0 z-20 flex h-[48px] shrink-0 items-center justify-between bg-[#CCE8E3] px-3.5 pt-safe text-[#00201D] transition-all duration-150 ${
          isHighlighted('topBar')
            ? 'ring-2 ring-inset ring-[#006A60]'
            : inspectorMode
              ? 'ring-1 ring-inset ring-[#006A60]/45 cursor-pointer'
              : ''
        }`}
      >
        <h1 className="font-display text-[18px] font-semibold tracking-tight text-[#00201D] whitespace-nowrap shrink-0">
          Mi Agenda
        </h1>

        <div className="flex items-center gap-0.5">
          {(inspectorMode || isHighlighted('topBar')) && (
            <span className="mr-1 rounded bg-[#006A60] px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-white">
              TopAppBar
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMobileCode();
            }}
            aria-label="Ver código Kotlin"
            title="Ver código Kotlin"
            className="min-[460px]:hidden flex h-[44px] w-[44px] items-center justify-center rounded-full text-[#003732] transition-colors hover:bg-[#006A60]/12 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
          >
            <Code2 className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReiniciarApp();
            }}
            aria-label="Reiniciar actividades en memoria"
            title="Reiniciar memoria"
            className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#003732] transition-colors hover:bg-[#006A60]/12 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
          >
            <RotateCcw className="h-[16px] w-[16px]" />
          </button>
        </div>
      </header>

      {/* ANDROID MATERIAL 3 SCROLLABLE BODY */}
      <div className="relative flex flex-1 min-h-0 flex-col gap-2.5 px-3 pt-3 pb-5 overflow-y-auto">
        {/* Material You Tonal Form Surface */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-2 rounded-2xl bg-[#EBF3F0]/85 p-3 shrink-0"
        >
          {/* Material 3 OutlinedTextField + Validation */}
          <div
            onClick={() => isClickableLayer && onSelectSection('input')}
            className={`relative rounded-lg transition-all duration-150 ${
              isHighlighted('input') || isHighlighted('state')
                ? 'ring-2 ring-[#006A60] ring-offset-2 ring-offset-[#EBF3F0]'
                : inspectorMode
                  ? 'ring-1 ring-dashed ring-[#006A60]/60 p-0.5'
                  : ''
            }`}
          >
            {(inspectorMode || isHighlighted('input') || isHighlighted('state')) && (
              <span className="pointer-events-none absolute -top-2.5 right-2 z-10 rounded bg-[#006A60] px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
                {isHighlighted('state') ? 'textoActividad' : 'OutlinedTextField'}
              </span>
            )}
            <label
              htmlFor="mi-agenda-input"
              className={`pointer-events-none absolute left-2.5 -top-2 px-1 text-[11px] transition-colors duration-150 rounded bg-[#F4FBF9] ${
                mostrarErrorTexto
                  ? 'text-[#BA1A1A] font-medium'
                  : inputFocused
                    ? 'text-[#006A60] font-medium'
                    : 'text-[#444746]'
              }`}
            >
              Escribe una actividad
            </label>
            <input
              ref={inputRef}
              id="mi-agenda-input"
              type="text"
              value={textoActividad}
              onChange={(e) => onTextoChange(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ej. Estudiar Jetpack Compose"
              autoComplete="off"
              aria-invalid={mostrarErrorTexto}
              aria-describedby={mostrarErrorTexto ? 'mi-agenda-error' : undefined}
              className={`w-full min-h-[42px] rounded-[8px] border bg-[#F4FBF9] px-3 pt-2 pb-1.5 text-[13.5px] text-[#171D1C] placeholder:text-[#6E7775] focus:outline-none transition-colors duration-150 ${
                mostrarErrorTexto
                  ? 'border-[#BA1A1A] ring-1 ring-[#BA1A1A]'
                  : 'border-[#747775] focus:border-[#006A60] focus:ring-1 focus:ring-[#006A60]'
              }`}
            />
            {mostrarErrorTexto && (
              <p
                id="mi-agenda-error"
                role="alert"
                className="mt-1 px-1 text-[11px] font-medium text-[#BA1A1A]"
              >
                Debes escribir una actividad.
              </p>
            )}
          </div>

          {/* Material 3 Date Picker Trigger */}
          <div
            onClick={() => isClickableLayer && onSelectSection('date')}
            className={`relative rounded-full transition-all duration-150 ${
              isHighlighted('date') || isHighlighted('state')
                ? 'ring-2 ring-[#006A60] ring-offset-2 ring-offset-[#EBF3F0]'
                : inspectorMode
                  ? 'ring-1 ring-dashed ring-[#006A60]/60 p-0.5'
                  : ''
            }`}
          >
            {(inspectorMode || isHighlighted('date')) && (
              <span className="pointer-events-none absolute -top-2.5 right-2 z-10 rounded bg-[#006A60] px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
                DatePickerDialog
              </span>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowCreateDatePicker(true)}
                className="flex flex-1 min-h-[38px] items-center justify-between gap-2 rounded-full border border-[#747775]/80 bg-[#F4FBF9] px-3 py-1.5 text-left text-[12.5px] text-[#171D1C] transition-colors hover:bg-[#E2EFEA] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[#006A60]" />
                  <span className="truncate tabular-nums">
                    <span className="text-[#444746]">Fecha: </span>
                    <span className="font-medium text-[#171D1C]">
                      {fechaVisible}
                    </span>
                    {usaFechaHoy && (
                      <span className="text-[#006A60]"> (Hoy)</span>
                    )}
                  </span>
                </span>
                <span className="text-[11.5px] font-medium text-[#006A60] whitespace-nowrap shrink-0">
                  Cambiar
                </span>
              </button>

              {!usaFechaHoy && (
                <button
                  type="button"
                  onClick={() => onFechaChange('')}
                  className="min-h-[38px] rounded-full border border-[#747775]/70 bg-[#F4FBF9] px-3 text-[11.5px] font-medium text-[#006A60] whitespace-nowrap shrink-0 transition-colors hover:bg-[#CCE8E3]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
                >
                  Hoy
                </button>
              )}
            </div>
          </div>

          {/* Material 3 FilterChips for Priority */}
          <div
            onClick={() => isClickableLayer && onSelectSection('priority')}
            className={`relative rounded-xl transition-all duration-150 ${
              isHighlighted('priority') || isHighlighted('state')
                ? 'ring-2 ring-[#006A60] ring-offset-2 ring-offset-[#EBF3F0] p-1'
                : inspectorMode
                  ? 'ring-1 ring-dashed ring-[#006A60]/60 p-1'
                  : ''
            }`}
          >
            {(inspectorMode || isHighlighted('priority')) && (
              <span className="pointer-events-none absolute -top-2.5 right-2 z-10 rounded bg-[#006A60] px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
                FilterChip
              </span>
            )}
            <span
              id="prioridad-label"
              className="mb-1 block text-[11px] font-medium text-[#3F4947]"
            >
              Prioridad
            </span>
            <div
              role="radiogroup"
              aria-labelledby="prioridad-label"
              className="grid grid-cols-3 gap-1.5"
            >
              {PRIORIDADES.map((nivel) => {
                const selected = prioridadSeleccionada === nivel;
                const styles = PRIORITY_CHIP_STYLES[nivel];
                return (
                  <button
                    key={nivel}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onPrioridadChange(nivel)}
                    className={`flex min-h-[36px] items-center justify-center gap-1 rounded-[8px] border px-2 py-1 text-[12px] whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] ${
                      selected ? styles.active : styles.inactive
                    }`}
                  >
                    {selected && (
                      <Check className="h-3 w-3 stroke-[2.5] shrink-0" />
                    )}
                    <span>{nivel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Material 3 Primary Filled Button */}
          <div
            onClick={() => isClickableLayer && onSelectSection('button')}
            className={`relative rounded-full transition-all duration-150 ${
              isHighlighted('button')
                ? 'ring-2 ring-[#006A60] ring-offset-2 ring-offset-[#EBF3F0]'
                : inspectorMode
                  ? 'ring-1 ring-dashed ring-[#006A60]/60 p-0.5'
                  : ''
            }`}
          >
            {(inspectorMode || isHighlighted('button')) && (
              <span className="pointer-events-none absolute -top-2.5 right-2.5 z-10 rounded bg-[#006A60] px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
                Button
              </span>
            )}
            <button
              type="submit"
              className="w-full min-h-[40px] rounded-full bg-[#006A60] px-4 py-2 text-[13px] font-medium text-white transition-all duration-150 hover:bg-[#00554D] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] focus-visible:ring-offset-2"
            >
              Agregar actividad
            </button>
          </div>
        </form>

        {/* COMPACT MATERIAL 3 SUMMARY PROGRESS CARD ABOVE TASK LIST */}
        <section
          aria-label="Resumen de progreso de tareas"
          onClick={() => isClickableLayer && onSelectSection('summary')}
          className={`relative shrink-0 rounded-2xl bg-[#E3F1EE] px-3 py-2.5 transition-all duration-150 ${
            isHighlighted('summary')
              ? 'ring-2 ring-[#006A60] ring-offset-2 ring-offset-[#F4FBF9]'
              : inspectorMode
                ? 'ring-1 ring-dashed ring-[#006A60]/60 cursor-pointer'
                : ''
          }`}
        >
          {(inspectorMode || isHighlighted('summary')) && (
            <span className="pointer-events-none absolute -top-2.5 right-2 z-10 rounded bg-[#006A60] px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
              ResumenProgresoCard
            </span>
          )}

          <div className="flex items-center gap-3">
            {/* Compact CircularProgressIndicator */}
            <div
              className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center"
              role="progressbar"
              aria-valuenow={porcentajeCompletado}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${porcentajeCompletado}% de tareas completadas`}
            >
              <svg
                className="h-full w-full -rotate-90"
                viewBox="0 0 44 44"
                aria-hidden="true"
              >
                <circle
                  cx="22"
                  cy="22"
                  r={ringRadius}
                  fill="none"
                  stroke="#C4DDD7"
                  strokeWidth="4.5"
                />
                <circle
                  cx="22"
                  cy="22"
                  r={ringRadius}
                  fill="none"
                  stroke="#006A60"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="transition-[stroke-dashoffset] duration-200 ease-out"
                />
              </svg>
              <span className="absolute font-display text-[10.5px] font-bold text-[#00201D] tabular-nums">
                {porcentajeCompletado}%
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-[13px] font-semibold text-[#00201D]">
                  Progreso de tareas
                </h2>
                <span className="text-[11px] text-[#3F4947] tabular-nums whitespace-nowrap">
                  {pendientesCount}{' '}
                  {pendientesCount === 1 ? 'pendiente' : 'pendientes'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#3F4947] tabular-nums">
                {completadasCount} de {totalTareas}{' '}
                {totalTareas === 1 ? 'completada' : 'completadas'}
              </p>
              <div
                aria-hidden="true"
                className="mt-1.5 h-[5px] w-full overflow-hidden rounded-full bg-[#C4DDD7]"
              >
                <div
                  className="h-full rounded-full bg-[#006A60] transition-transform duration-200 ease-out origin-left"
                  style={{
                    transform: `scaleX(${porcentajeCompletado / 100})`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ANDROID MATERIAL 3 PILL SEARCH BAR */}
        <div
          onClick={() => isClickableLayer && onSelectSection('search')}
          className={`relative shrink-0 rounded-full transition-all duration-150 ${
            isHighlighted('search') || isHighlighted('state')
              ? 'ring-2 ring-[#006A60] ring-offset-2 ring-offset-[#F4FBF9]'
              : inspectorMode
                ? 'ring-1 ring-dashed ring-[#006A60]/60 p-0.5'
                : ''
          }`}
        >
          {(inspectorMode || isHighlighted('search')) && (
            <span className="pointer-events-none absolute -top-2.5 right-2.5 z-10 rounded bg-[#006A60] px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
              SearchBar
            </span>
          )}
          <div className="relative flex items-center">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#3F4947]"
            />
            <input
              type="search"
              value={textoBusqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              placeholder="Buscar actividad..."
              aria-label="Buscar actividades por nombre"
              className="w-full min-h-[40px] rounded-full bg-[#E6EFECE6] border border-transparent pl-9 pr-9 py-1.5 text-[13px] text-[#171D1C] placeholder:text-[#5A6563] focus:border-[#006A60] focus:bg-white focus:outline-none transition-colors"
            />
            {textoBusqueda.length > 0 && (
              <button
                type="button"
                onClick={() => onBusquedaChange('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-0.5 flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#3F4947] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {consultaLimpia.length > 0 && actividades.length > 0 && (
            <p className="mt-1 px-2 text-[11px] text-[#525E5B] tabular-nums">
              Mostrando {actividadesFiltradas.length} de {actividades.length}{' '}
              {actividades.length === 1 ? 'actividad' : 'actividades'}
            </p>
          )}
        </div>

        {/* TASK LIST (LazyColumn) */}
        <div
          onClick={() => isClickableLayer && onSelectSection('list')}
          className={`relative flex-1 rounded-xl transition-all duration-150 ${
            isHighlighted('list') || isHighlighted('state')
              ? 'ring-2 ring-[#006A60] ring-offset-2 ring-offset-[#F4FBF9] p-1'
              : inspectorMode
                ? 'ring-1 ring-dashed ring-[#006A60]/50 p-1'
                : ''
          }`}
        >
          {(inspectorMode || isHighlighted('list') || isHighlighted('state')) && (
            <div className="mb-1 flex justify-end pointer-events-none">
              <span className="rounded bg-[#006A60] px-1.5 py-0.5 font-mono text-[9px] font-medium text-white">
                {isHighlighted('state') ? 'actividadesFiltradas' : 'LazyColumn'}
              </span>
            </div>
          )}

          {actividades.length === 0 ? (
            <div className="flex min-h-[110px] flex-col items-center justify-center px-4 py-5 text-center">
              <p className="text-[13px] font-medium text-[#3F4947]">
                Aún no hay actividades
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#5C6664]">
                Escribe una arriba y pulsa{' '}
                <span className="font-medium text-[#006A60]">
                  Agregar actividad
                </span>
                .
              </p>
              <button
                type="button"
                onClick={onCargarEjemplos}
                className="mt-2 min-h-[36px] rounded-full px-3.5 py-1.5 text-[11.5px] font-medium text-[#006A60] hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
              >
                Cargar ejemplos
              </button>
            </div>
          ) : actividadesFiltradas.length === 0 ? (
            <div className="flex min-h-[100px] flex-col items-center justify-center px-4 py-5 text-center">
              <p className="text-[13px] font-medium text-[#3F4947]">
                Sin resultados para &ldquo;{consultaLimpia}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => onBusquedaChange('')}
                className="mt-1.5 min-h-[36px] rounded-full px-3.5 py-1.5 text-[11.5px] font-medium text-[#006A60] hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <ul className="space-y-1.5 pb-1" aria-label="Lista de actividades">
              <AnimatePresence initial={false}>
                {actividadesFiltradas.map((actividad, idx) => {
                  const showItemBadge =
                    (inspectorMode || isHighlighted('item')) && idx === 0;
                  return (
                    <motion.li
                      key={actividad.id}
                      layout
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 14 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      onClick={(e) => {
                        if (isClickableLayer) {
                          e.stopPropagation();
                          onSelectSection('item');
                        }
                      }}
                      className={`relative rounded-xl border transition-colors duration-150 ${
                        actividad.completada
                          ? 'border-[#CFDAD7] bg-[#E5EFEC]/70'
                          : 'border-[#CFD8D6] bg-white'
                      } ${
                        (isHighlighted('item') || isHighlighted('edit')) &&
                        idx === 0
                          ? 'ring-2 ring-[#006A60] ring-offset-1'
                          : ''
                      }`}
                    >
                      {showItemBadge && (
                        <span className="pointer-events-none absolute -top-2.5 right-2 z-10 rounded bg-[#00201D] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#9CF2E4]">
                          ActividadItem
                        </span>
                      )}

                      <div className="flex items-center px-1 py-1">
                        {/* Material 3 Checkbox */}
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={actividad.completada}
                          aria-label={
                            actividad.completada
                              ? `Marcar "${actividad.titulo}" como pendiente`
                              : `Marcar "${actividad.titulo}" como completada`
                          }
                          onClick={() => onToggleActividad(actividad.id)}
                          className="flex h-[42px] w-[42px] min-[460px]:h-[36px] min-[460px]:w-[36px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
                        >
                          <span
                            className={`flex h-[17px] w-[17px] items-center justify-center rounded-[3px] border-2 transition-colors duration-150 ${
                              actividad.completada
                                ? 'border-[#006A60] bg-[#006A60] text-white'
                                : 'border-[#444746] bg-transparent'
                            }`}
                          >
                            {actividad.completada && (
                              <Check className="h-3 w-3 stroke-[3]" />
                            )}
                          </span>
                        </button>

                        {/* Activity Title + Date + Priority Indicator */}
                        <button
                          type="button"
                          onClick={() => onToggleActividad(actividad.id)}
                          className="flex-1 min-w-0 py-1 px-1 text-left focus-visible:outline-none focus-visible:underline"
                        >
                          <span
                            className={`block text-[13.5px] font-medium leading-snug break-words transition-colors duration-150 ${
                              actividad.completada
                                ? 'line-through text-[#5A6563]'
                                : 'text-[#171D1C]'
                            }`}
                          >
                            {actividad.titulo}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] tabular-nums">
                            <span className="text-[#525E5B]">
                              {actividad.fecha}
                            </span>
                            <span aria-hidden="true" className="text-[#94A19E]">
                              ·
                            </span>
                            <span
                              className={`font-semibold ${
                                actividad.completada
                                  ? 'text-[#5A6563]'
                                  : PRIORITY_TEXT_COLORS[actividad.prioridad]
                              }`}
                            >
                              Prioridad {actividad.prioridad}
                            </span>
                          </span>
                        </button>

                        {/* Edit IconButton */}
                        <button
                          type="button"
                          aria-label={`Editar "${actividad.titulo}"`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onIniciarEdicion(actividad);
                          }}
                          className={`flex h-[42px] w-[42px] min-[460px]:h-[34px] min-[460px]:w-[34px] shrink-0 items-center justify-center rounded-full text-[#006A60] transition-colors duration-150 hover:bg-[#006A60]/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] ${
                            isHighlighted('edit') && idx === 0
                              ? 'bg-[#006A60]/15 ring-1 ring-[#006A60]'
                              : ''
                          }`}
                        >
                          <Pencil className="h-[15px] w-[15px]" />
                        </button>

                        {/* Delete IconButton */}
                        <button
                          type="button"
                          aria-label={`Eliminar "${actividad.titulo}"`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEliminarActividad(actividad.id);
                          }}
                          className="flex h-[42px] w-[42px] min-[460px]:h-[34px] min-[460px]:w-[34px] shrink-0 items-center justify-center rounded-full text-[#BA1A1A] transition-colors duration-150 hover:bg-[#BA1A1A]/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BA1A1A]"
                        >
                          <Trash2 className="h-[16px] w-[16px]" />
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      {/* ANDROID MATERIAL 3 SNACKBAR */}
      <AnimatePresence>
        {snackbarMessage && (
          <motion.div
            key="android-snackbar"
            role="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto absolute bottom-6 left-3 right-3 z-30 flex items-center justify-between gap-2 rounded-[8px] bg-[#2B3230] px-3.5 py-2.5 text-[11.5px] text-[#EFF5F3] shadow-lg"
          >
            <span>{snackbarMessage}</span>
            {canUndoDelete && (
              <button
                type="button"
                onClick={onUndoDelete}
                className="font-medium text-[#7AD9CA] hover:text-[#9CF2E4] whitespace-nowrap shrink-0 px-1 py-0.5 focus-visible:outline-none focus-visible:underline"
              >
                Deshacer
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANDROID GESTURE NAVIGATION BAR (Framed phone only) */}
      <div
        aria-hidden="true"
        className="hidden min-[460px]:flex h-5 shrink-0 items-center justify-center bg-[#F4FBF9]"
      >
        <span className="h-1 w-24 rounded-full bg-[#171D1C]/25" />
      </div>

      {/* ANDROID MATERIAL 3 DATE PICKER DIALOG (CREATE FORM) */}
      <AnimatePresence>
        {showCreateDatePicker && (
          <AndroidDatePickerDialog
            initialIsoDate={fechaIso || hoyIso}
            onConfirm={(selectedIso) => {
              onFechaChange(selectedIso === hoyIso ? '' : selectedIso);
              setShowCreateDatePicker(false);
            }}
            onCancel={() => setShowCreateDatePicker(false)}
          />
        )}
      </AnimatePresence>

      {/* ANDROID MATERIAL 3 ALERT DIALOG (EDIT NAME & DATE) */}
      <AnimatePresence>
        {actividadEnEdicion && (
          <motion.div
            key="edit-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={onCancelarEdicion}
            className="fixed min-[460px]:absolute inset-0 z-40 flex items-center justify-center bg-black/45 p-3.5"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="editar-actividad-titulo"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[306px] rounded-[24px] bg-[#EBF3F0] p-5 text-[#171D1C] shadow-2xl"
            >
              <h2
                id="editar-actividad-titulo"
                className="font-display text-[18px] font-semibold text-[#171D1C]"
              >
                Editar actividad
              </h2>

              <form onSubmit={handleEditSubmit} noValidate className="mt-3.5 flex flex-col gap-3">
                <div className="relative">
                  <label
                    htmlFor="editar-nombre-input"
                    className={`pointer-events-none absolute left-2.5 -top-2 px-1 text-[11px] rounded bg-[#EBF3F0] ${
                      editError
                        ? 'text-[#BA1A1A] font-medium'
                        : 'text-[#3F4947] font-medium'
                    }`}
                  >
                    Nombre de la actividad
                  </label>
                  <input
                    ref={editInputRef}
                    id="editar-nombre-input"
                    type="text"
                    value={editTitulo}
                    onChange={(e) => {
                      setEditTitulo(e.target.value);
                      if (editError && e.target.value.trim().length > 0) {
                        setEditError(false);
                      }
                    }}
                    aria-invalid={editError}
                    aria-describedby={editError ? 'editar-nombre-error' : undefined}
                    className={`w-full min-h-[42px] rounded-[8px] border bg-[#F4FBF9] px-3 py-2 text-[13.5px] text-[#171D1C] focus:outline-none transition-colors ${
                      editError
                        ? 'border-[#BA1A1A] ring-1 ring-[#BA1A1A]'
                        : 'border-[#747775] focus:border-[#006A60] focus:ring-1 focus:ring-[#006A60]'
                    }`}
                  />
                  {editError && (
                    <p
                      id="editar-nombre-error"
                      role="alert"
                      className="mt-1 px-1 text-[11px] font-medium text-[#BA1A1A]"
                    >
                      Debes escribir una actividad.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditDatePicker(true)}
                  className="flex w-full min-h-[40px] items-center justify-between gap-2 rounded-full border border-[#747775]/80 bg-[#F4FBF9] px-3.5 py-1.5 text-left text-[12.5px] text-[#171D1C] transition-colors hover:bg-[#E2EFEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-[#006A60]" />
                    <span className="truncate tabular-nums">
                      <span className="text-[#444746]">Fecha: </span>
                      <span className="font-medium text-[#171D1C]">
                        {editFechaIso
                          ? formatIsoToDisplayDate(editFechaIso)
                          : hoyDisplay}
                      </span>
                    </span>
                  </span>
                  <span className="text-[11.5px] font-medium text-[#006A60] whitespace-nowrap shrink-0">
                    Cambiar
                  </span>
                </button>

                <div className="mt-1.5 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={onCancelarEdicion}
                    className="min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-medium text-[#006A60] transition-colors hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="min-h-[36px] rounded-full bg-[#006A60] px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#00554D] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] focus-visible:ring-offset-2"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANDROID MATERIAL 3 DATE PICKER DIALOG (EDIT DIALOG) */}
      <AnimatePresence>
        {showEditDatePicker && (
          <AndroidDatePickerDialog
            initialIsoDate={editFechaIso || hoyIso}
            onConfirm={(selectedIso) => {
              setEditFechaIso(selectedIso);
              setShowEditDatePicker(false);
            }}
            onCancel={() => setShowEditDatePicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
