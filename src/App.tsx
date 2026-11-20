import { useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import mainActivityCode from '../android/app/src/main/java/com/ejemplo/miagenda/MainActivity.kt?raw';
import androidManifestCode from '../android/app/src/main/AndroidManifest.xml?raw';
import buildGradleCode from '../android/app/build.gradle.kts?raw';
import { AndroidPhonePreview } from './components/AndroidPhonePreview';
import { KotlinCodePanel } from './components/KotlinCodePanel';
import { MemoryStatePanel } from './components/MemoryStatePanel';
import { ScreenOrganizationPanel } from './components/ScreenOrganizationPanel';
import {
  Prioridad,
  createInitialActividades,
  formatIsoToDisplayDate,
  getTodayDisplayDate,
  type Actividad,
  type ComposeSectionId,
  type WorkbenchTab,
} from './types/agenda';

export default function App() {
  // Estado en memoria equivalente a remember { mutableStateOf / mutableStateListOf }
  const [textoActividad, setTextoActividad] = useState('');
  const [mostrarErrorTexto, setMostrarErrorTexto] = useState(false);
  const [fechaIso, setFechaIso] = useState('');
  const [prioridadSeleccionada, setPrioridadSeleccionada] = useState<Prioridad>(
    Prioridad.MEDIA
  );
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [actividadEnEdicion, setActividadEnEdicion] =
    useState<Actividad | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>(() =>
    createInitialActividades()
  );
  const [siguienteId, setSiguienteId] = useState(4);

  // Material 3 Snackbar + Undo state
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{
    actividad: Actividad;
    index: number;
  } | null>(null);
  const snackbarTimerRef = useRef<number | null>(null);

  // Optional Kotlin / Android Project drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('codigo');
  const [highlightedSection, setHighlightedSection] =
    useState<ComposeSectionId | null>(null);
  const [codeFocusedSection, setCodeFocusedSection] =
    useState<ComposeSectionId | null>(null);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [headerCopied, setHeaderCopied] = useState(false);

  const showSnackbar = (
    message: string,
    deletedBackup: { actividad: Actividad; index: number } | null = null
  ) => {
    if (snackbarTimerRef.current !== null) {
      window.clearTimeout(snackbarTimerRef.current);
    }
    setSnackbarMessage(message);
    setLastDeleted(deletedBackup);
    snackbarTimerRef.current = window.setTimeout(() => {
      setSnackbarMessage(null);
      setLastDeleted(null);
    }, 3200);
  };

  const handleTextoChange = (valor: string) => {
    setTextoActividad(valor);
    if (mostrarErrorTexto && valor.trim().length > 0) {
      setMostrarErrorTexto(false);
    }
  };

  const handleAgregarActividad = (): boolean => {
    const textoLimpio = textoActividad.trim();
    if (!textoLimpio) {
      setMostrarErrorTexto(true);
      return false;
    }

    const fechaFinal = fechaIso
      ? formatIsoToDisplayDate(fechaIso)
      : getTodayDisplayDate();

    setActividades((prev) => [
      ...prev,
      {
        id: siguienteId,
        titulo: textoLimpio,
        fecha: fechaFinal,
        prioridad: prioridadSeleccionada,
        completada: false,
      },
    ]);
    setSiguienteId((prev) => prev + 1);
    setTextoActividad('');
    setMostrarErrorTexto(false);
    setFechaIso('');
    setPrioridadSeleccionada(Prioridad.MEDIA);
    showSnackbar('Actividad agregada');
    return true;
  };

  const handleToggleActividad = (id: number) => {
    setActividades((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completada: !item.completada } : item
      )
    );
  };

  const handleGuardarEdicion = (
    id: number,
    nuevoTitulo: string,
    nuevaFecha: string
  ) => {
    setActividades((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, titulo: nuevoTitulo, fecha: nuevaFecha }
          : item
      )
    );
    setActividadEnEdicion(null);
    showSnackbar('Actividad actualizada');
  };

  const handleEliminarActividad = (id: number) => {
    const index = actividades.findIndex((item) => item.id === id);
    const target = index !== -1 ? actividades[index] : null;
    setActividades((prev) => prev.filter((item) => item.id !== id));
    if (actividadEnEdicion?.id === id) {
      setActividadEnEdicion(null);
    }
    if (target) {
      showSnackbar('Actividad eliminada', { actividad: target, index });
    }
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    const { actividad, index } = lastDeleted;
    setActividades((prev) => {
      if (prev.some((item) => item.id === actividad.id)) return prev;
      const copy = [...prev];
      copy.splice(Math.min(index, copy.length), 0, actividad);
      return copy;
    });
    setSnackbarMessage(null);
    setLastDeleted(null);
  };

  const handleReiniciarApp = () => {
    setActividades([]);
    setTextoActividad('');
    setMostrarErrorTexto(false);
    setFechaIso('');
    setPrioridadSeleccionada(Prioridad.MEDIA);
    setTextoBusqueda('');
    setActividadEnEdicion(null);
    setSiguienteId(1);
    showSnackbar('Memoria reiniciada (sin base de datos)');
  };

  const handleCargarEjemplos = () => {
    const iniciales = createInitialActividades();
    setActividades(iniciales);
    setSiguienteId(iniciales.length + 1);
    setTextoActividad('');
    setMostrarErrorTexto(false);
    setFechaIso('');
    setPrioridadSeleccionada(Prioridad.MEDIA);
    setTextoBusqueda('');
    setActividadEnEdicion(null);
    showSnackbar('Ejemplos cargados');
  };

  const openPanelTab = (tab: WorkbenchTab) => {
    setActiveTab(tab);
    setDrawerOpen(true);
  };

  const handleJumpToCode = (section: ComposeSectionId) => {
    setCodeFocusedSection(section);
    setHighlightedSection(section);
    setActiveTab('codigo');
    setDrawerOpen(true);
  };

  const handleSelectSectionFromPhone = (section: ComposeSectionId) => {
    setHighlightedSection(section);
    if (activeTab === 'codigo') {
      setCodeFocusedSection(section);
    } else {
      setActiveTab('estructura');
    }
    setDrawerOpen(true);
  };

  const handleCopyMainActivity = async () => {
    try {
      await navigator.clipboard.writeText(mainActivityCode);
      setHeaderCopied(true);
      window.setTimeout(() => setHeaderCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = mainActivityCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setHeaderCopied(true);
      window.setTimeout(() => setHeaderCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-dvh min-[460px]:h-dvh min-[460px]:overflow-hidden flex flex-col bg-[#F4FBF9] min-[460px]:bg-[#E9EFF2] text-slate-900">
      {/* Compact Top Bar shown on preview/desktop (>= 460px); hidden on real phones (< 460px) */}
      <header className="hidden min-[460px]:block h-[50px] shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-30">
        <div className="mx-auto flex h-full max-w-[1360px] items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <span className="font-display text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            Mi Agenda
          </span>

          {/* Zone 2: Concise Single-Line Controls */}
          <nav
            aria-label="Herramientas del proyecto Android"
            className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => openPanelTab('codigo')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 hover:underline underline-offset-4 ${
                drawerOpen && activeTab === 'codigo'
                  ? 'text-[#006A60] underline'
                  : ''
              }`}
            >
              Código Kotlin
            </button>
            <button
              type="button"
              onClick={() => openPanelTab('estructura')}
              className={`hidden sm:inline-block py-1 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 hover:underline underline-offset-4 ${
                drawerOpen && activeTab === 'estructura'
                  ? 'text-[#006A60] underline'
                  : ''
              }`}
            >
              Organización
            </button>
            <button
              type="button"
              onClick={() => openPanelTab('estado')}
              className={`hidden md:inline-block py-1 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 hover:underline underline-offset-4 ${
                drawerOpen && activeTab === 'estado'
                  ? 'text-[#006A60] underline'
                  : ''
              }`}
            >
              Memoria ({actividades.length})
            </button>
            <button
              type="button"
              onClick={() => setInspectorMode((prev) => !prev)}
              aria-pressed={inspectorMode}
              className={`hidden lg:inline-block py-1 transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 hover:underline underline-offset-4 ${
                inspectorMode ? 'text-[#006A60] underline' : ''
              }`}
            >
              {inspectorMode ? 'Ocultar bloques' : 'Inspeccionar'}
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleCopyMainActivity}
              className="inline-flex items-center gap-1.5 min-h-[34px] rounded-lg bg-[#006A60] px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#00554D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] focus-visible:ring-offset-2"
            >
              {headerCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copiar MainActivity.kt</span>
                  <span className="sm:hidden">Copiar .kt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Stage: Compact Real-Phone-Sized Android Device + Optional Kotlin Drawer */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* ANDROID PHONE STAGE */}
        <main
          aria-label="Dispositivo Android con aplicación Mi Agenda"
          className="flex flex-1 min-h-0 items-stretch min-[460px]:items-center justify-center min-[460px]:p-4 overflow-hidden"
        >
          {/* Real smartphone (< 460px): full-bleed edge-to-edge.
              Preview/Desktop (>= 460px): compact real Android phone dimensions (348px x 668px max) */}
          <div className="relative flex flex-1 min-[460px]:flex-none w-full min-[460px]:w-[348px] min-[460px]:h-full min-[460px]:max-h-[668px] min-[460px]:rounded-[38px] min-[460px]:bg-[#181C1F] min-[460px]:p-[9px] min-[460px]:shadow-[0_22px_50px_-18px_rgba(15,23,42,0.38)]">
            {/* Android Hardware Buttons (Framed shell only) */}
            <div
              aria-hidden="true"
              className="hidden min-[460px]:block absolute -right-[2.5px] top-24 h-9 w-[2.5px] rounded-r bg-[#2E353A]"
            />
            <div
              aria-hidden="true"
              className="hidden min-[460px]:block absolute -right-[2.5px] top-36 h-16 w-[2.5px] rounded-r bg-[#2E353A]"
            />

            {/* Inner Android Screen Viewport (~330px x 650px real phone size) */}
            <div className="relative flex flex-1 min-h-0 w-full flex-col overflow-hidden min-[460px]:rounded-[30px] bg-[#F4FBF9]">
              <AndroidPhonePreview
                actividades={actividades}
                textoActividad={textoActividad}
                mostrarErrorTexto={mostrarErrorTexto}
                fechaIso={fechaIso}
                prioridadSeleccionada={prioridadSeleccionada}
                textoBusqueda={textoBusqueda}
                actividadEnEdicion={actividadEnEdicion}
                snackbarMessage={snackbarMessage}
                canUndoDelete={lastDeleted !== null}
                onUndoDelete={handleUndoDelete}
                onTextoChange={handleTextoChange}
                onFechaChange={setFechaIso}
                onPrioridadChange={setPrioridadSeleccionada}
                onBusquedaChange={setTextoBusqueda}
                onAgregarActividad={handleAgregarActividad}
                onToggleActividad={handleToggleActividad}
                onIniciarEdicion={setActividadEnEdicion}
                onGuardarEdicion={handleGuardarEdicion}
                onCancelarEdicion={() => setActividadEnEdicion(null)}
                onEliminarActividad={handleEliminarActividad}
                onReiniciarApp={handleReiniciarApp}
                onCargarEjemplos={handleCargarEjemplos}
                onOpenMobileCode={() => openPanelTab('codigo')}
                highlightedSection={highlightedSection}
                inspectorMode={inspectorMode}
                onSelectSection={handleSelectSectionFromPhone}
              />
            </div>
          </div>
        </main>

        {/* OPTIONAL KOTLIN & ANDROID PROJECT DRAWER */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.aside
              key="android-code-drawer"
              aria-label="Código Kotlin y estructura del proyecto Android"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 lg:static lg:z-auto flex flex-col bg-white lg:w-[54%] lg:max-w-[740px] lg:min-w-[440px] lg:border-l lg:border-slate-200 lg:h-full overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 sm:px-5 py-3 shrink-0">
                <div
                  role="tablist"
                  aria-label="Vistas del proyecto Android"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'codigo'}
                    onClick={() => setActiveTab('codigo')}
                    className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] ${
                      activeTab === 'codigo'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Código Kotlin
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'estructura'}
                    onClick={() => setActiveTab('estructura')}
                    className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] ${
                      activeTab === 'estructura'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Organización
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'estado'}
                    onClick={() => setActiveTab('estado')}
                    className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60] ${
                      activeTab === 'estado'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Memoria ({actividades.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Cerrar panel de código"
                  className="inline-flex items-center gap-1 min-h-[36px] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 whitespace-nowrap shrink-0 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A60]"
                >
                  <X className="h-4 w-4" />
                  <span>Cerrar</span>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {activeTab === 'codigo' && (
                  <KotlinCodePanel
                    mainActivityCode={mainActivityCode}
                    androidManifestCode={androidManifestCode}
                    buildGradleCode={buildGradleCode}
                    focusedSection={codeFocusedSection}
                    onClearFocusedSection={() => {
                      setCodeFocusedSection(null);
                      setHighlightedSection(null);
                    }}
                  />
                )}

                {activeTab === 'estructura' && (
                  <ScreenOrganizationPanel
                    highlightedSection={highlightedSection}
                    onHoverSection={setHighlightedSection}
                    onJumpToCode={handleJumpToCode}
                  />
                )}

                {activeTab === 'estado' && (
                  <MemoryStatePanel
                    textoActividad={textoActividad}
                    mostrarErrorTexto={mostrarErrorTexto}
                    fechaIso={fechaIso}
                    prioridadSeleccionada={prioridadSeleccionada}
                    textoBusqueda={textoBusqueda}
                    actividadEnEdicion={actividadEnEdicion}
                    siguienteId={siguienteId}
                    actividades={actividades}
                  />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
