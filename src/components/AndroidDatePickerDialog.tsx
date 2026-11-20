import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { getTodayIsoDate } from '../types/agenda';

interface AndroidDatePickerDialogProps {
  initialIsoDate: string;
  onConfirm: (isoDate: string) => void;
  onCancel: () => void;
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const MESES_CORTOS = [
  'ene.',
  'feb.',
  'mar.',
  'abr.',
  'may.',
  'jun.',
  'jul.',
  'ago.',
  'sep.',
  'oct.',
  'nov.',
  'dic.',
];

const DIAS_SEMANA_CORTOS = ['dom.', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.'];
const CABECERA_DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function parseIsoParts(iso: string): { year: number; month: number; day: number } {
  const parts = iso.split('-').map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function toIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function AndroidDatePickerDialog({
  initialIsoDate,
  onConfirm,
  onCancel,
}: AndroidDatePickerDialogProps) {
  const todayIso = getTodayIsoDate();
  const initial = parseIsoParts(initialIsoDate || todayIso);

  const [selectedIso, setSelectedIso] = useState(initialIsoDate || todayIso);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  const selectedHeaderLabel = useMemo(() => {
    const { year, month, day } = parseIsoParts(selectedIso);
    const dateObj = new Date(year, month, day);
    const weekday = DIAS_SEMANA_CORTOS[dateObj.getDay()];
    return `${weekday}, ${day} ${MESES_CORTOS[month]}`;
  }, [selectedIso]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const leadingBlanks = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<number | null> = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const t = parseIsoParts(todayIso);
    setViewYear(t.year);
    setViewMonth(t.month);
    setSelectedIso(todayIso);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      onClick={onCancel}
      className="fixed min-[460px]:absolute inset-0 z-50 flex items-center justify-center bg-black/45 p-3"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar fecha"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[306px] overflow-hidden rounded-[24px] bg-[#EBF3F0] text-[#171D1C] shadow-2xl"
      >
        {/* Material 3 DatePicker Header */}
        <div className="px-4 pt-3.5 pb-2.5 border-b border-[#D2DFDC]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#3F4947]">
              Seleccionar fecha
            </span>
            <button
              type="button"
              onClick={goToToday}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium text-[#006A60] hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
            >
              Hoy
            </button>
          </div>
          <div className="mt-1 font-display text-[19px] font-semibold text-[#171D1C] capitalize">
            {selectedHeaderLabel}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
          <span className="pl-2 text-xs font-medium text-[#3F4947] tabular-nums">
            {MESES[viewMonth]} {viewYear}
          </span>
          <div className="flex items-center">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Mes anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#3F4947] hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Mes siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#3F4947] hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekday Headers + Day Grid */}
        <div className="px-2.5 pb-2">
          <div className="grid grid-cols-7 text-center">
            {CABECERA_DIAS.map((dia, i) => (
              <span
                key={i}
                className="flex h-7 items-center justify-center text-[11px] font-medium text-[#525E5B]"
              >
                {dia}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5 text-center">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <span key={`blank-${idx}`} className="h-8" />;
              }
              const cellIso = toIso(viewYear, viewMonth, day);
              const isSelected = cellIso === selectedIso;
              const isToday = cellIso === todayIso;
              return (
                <button
                  key={cellIso}
                  type="button"
                  onClick={() => setSelectedIso(cellIso)}
                  aria-label={`${day} de ${MESES[viewMonth]} de ${viewYear}`}
                  aria-pressed={isSelected}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[11.5px] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] ${
                    isSelected
                      ? 'bg-[#006A60] font-semibold text-white'
                      : isToday
                        ? 'border border-[#006A60] font-semibold text-[#006A60] hover:bg-[#006A60]/10'
                        : 'text-[#171D1C] hover:bg-[#006A60]/10'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Material 3 Dialog Actions */}
        <div className="flex items-center justify-end gap-1.5 px-3.5 py-2.5 border-t border-[#D2DFDC]">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-medium text-[#006A60] hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedIso)}
            className="min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-medium text-[#006A60] hover:bg-[#006A60]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
          >
            Aceptar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
