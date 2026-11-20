export enum Prioridad {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
}

export const PRIORIDADES: Prioridad[] = [
  Prioridad.BAJA,
  Prioridad.MEDIA,
  Prioridad.ALTA,
];

export type FiltroPrioridad = Prioridad | null;

export const FILTROS_PRIORIDAD: Array<{
  valor: FiltroPrioridad;
  etiqueta: string;
}> = [
  { valor: null, etiqueta: 'Todas' },
  { valor: Prioridad.ALTA, etiqueta: Prioridad.ALTA },
  { valor: Prioridad.MEDIA, etiqueta: Prioridad.MEDIA },
  { valor: Prioridad.BAJA, etiqueta: Prioridad.BAJA },
];

export interface Actividad {
  id: number;
  titulo: string;
  fecha: string;
  prioridad: Prioridad;
  completada: boolean;
}

export type ComposeSectionId =
  | 'state'
  | 'scaffold'
  | 'topBar'
  | 'input'
  | 'date'
  | 'priority'
  | 'button'
  | 'summary'
  | 'search'
  | 'priorityFilter'
  | 'list'
  | 'item'
  | 'edit';

export type WorkbenchTab = 'codigo' | 'estructura' | 'estado';

export type MobileNavTab = 'agenda' | 'codigo';

export interface ScreenSectionMeta {
  id: ComposeSectionId;
  order: string;
  composable: string;
  roleTitle: string;
  description: string;
  indentLevel: 0 | 1 | 2 | 3;
  startMarker: string;
  endMarker: string;
}

export function getTodayIsoDate(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function formatIsoToDisplayDate(isoDate: string): string {
  const partes = isoDate.split('-');
  if (partes.length !== 3) return getTodayDisplayDate();
  const [anio, mes, dia] = partes;
  if (!anio || !mes || !dia) return getTodayDisplayDate();
  return `${dia}/${mes}/${anio}`;
}

export function displayDateToIso(displayDate: string): string {
  const partes = displayDate.split('/');
  if (partes.length !== 3) return getTodayIsoDate();
  const [dia, mes, anio] = partes;
  if (!dia || !mes || !anio) return getTodayIsoDate();
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

export function getTodayDisplayDate(): string {
  return formatIsoToDisplayDate(getTodayIsoDate());
}

export function createInitialActividades(): Actividad[] {
  const hoy = getTodayDisplayDate();
  return [
    {
      id: 1,
      titulo: 'Repasar cómo funciona @Composable',
      fecha: hoy,
      prioridad: Prioridad.BAJA,
      completada: true,
    },
    {
      id: 2,
      titulo: 'Probar validación de texto vacío o espacios',
      fecha: hoy,
      prioridad: Prioridad.ALTA,
      completada: false,
    },
    {
      id: 3,
      titulo: 'Editar fecha y filtrar tareas en tiempo real',
      fecha: hoy,
      prioridad: Prioridad.MEDIA,
      completada: false,
    },
  ];
}

export const SCREEN_SECTIONS: ScreenSectionMeta[] = [
  {
    id: 'state',
    order: '1',
    composable: 'remember + mutableStateListOf',
    roleTitle: 'Estado temporal en memoria',
    description:
      'Conserva el formulario, la búsqueda en tiempo real, el filtro de prioridad, la actividad en edición y la lista de actividades solo mientras la app está abierta.',
    indentLevel: 0,
    startMarker: '// Estado en memoria:',
    endMarker: 'val actividades = remember',
  },
  {
    id: 'scaffold',
    order: '2',
    composable: 'Scaffold',
    roleTitle: 'Estructura base de teléfono',
    description:
      'Ubica la barra superior y entrega el espacio seguro para desplazar todo el contenido cómodamente en pantallas verticales.',
    indentLevel: 0,
    startMarker: 'Scaffold(',
    endMarker: ') { paddingInterno ->',
  },
  {
    id: 'topBar',
    order: '3',
    composable: 'TopAppBar',
    roleTitle: 'Título "Mi Agenda"',
    description:
      'Mantiene visible el nombre de la aplicación en la parte superior con la paleta Material 3.',
    indentLevel: 1,
    startMarker: 'TopAppBar(',
    endMarker: 'titleContentColor =',
  },
  {
    id: 'input',
    order: '4',
    composable: 'OutlinedTextField',
    roleTitle: 'Campo con validación de texto',
    description:
      'Impide agregar actividades vacías o solo con espacios y muestra "Debes escribir una actividad." usando isError y supportingText.',
    indentLevel: 1,
    startMarker: 'OutlinedTextField(',
    endMarker: 'modifier = Modifier.fillMaxWidth()',
  },
  {
    id: 'date',
    order: '5',
    composable: 'OutlinedButton + DatePickerDialog',
    roleTitle: 'Selector de fecha (hoy por defecto)',
    description:
      'Abre el calendario nativo de Material 3 y utiliza automáticamente la fecha de hoy si el usuario no selecciona otra.',
    indentLevel: 1,
    startMarker: '// Selector de fecha',
    endMarker: '"Fecha: $fechaVisible"',
  },
  {
    id: 'priority',
    order: '6',
    composable: 'FilterChip (Prioridad)',
    roleTitle: 'Selector Baja, Media o Alta',
    description:
      'Tres chips táctiles iguales enlazados al enum Prioridad para definir la importancia de cada tarea.',
    indentLevel: 1,
    startMarker: '// Selector de prioridad:',
    endMarker: 'modifier = Modifier.weight(1f)',
  },
  {
    id: 'button',
    order: '7',
    composable: 'Button',
    roleTitle: 'Botón "Agregar actividad"',
    description:
      'Valida el texto, agrega la nueva actividad con fecha y prioridad a la memoria y limpia el formulario.',
    indentLevel: 1,
    startMarker: '// Botón principal:',
    endMarker: 'Text("Agregar actividad")',
  },
  {
    id: 'summary',
    order: '8',
    composable: 'ResumenProgresoCard',
    roleTitle: 'Tarjeta de resumen y progreso (%)',
    description:
      'Muestra un círculo de porcentaje (CircularProgressIndicator) y una barra de progreso (LinearProgressIndicator) sobre el total de tareas completadas.',
    indentLevel: 1,
    startMarker: 'fun ResumenProgresoCard(',
    endMarker: 'RoundedCornerShape(4.dp)',
  },
  {
    id: 'search',
    order: '9',
    composable: 'OutlinedTextField (Búsqueda)',
    roleTitle: 'Barra de búsqueda en tiempo real',
    description:
      'Filtra la lista por nombre al instante con contains(..., ignoreCase = true) e incluye un botón para limpiar la consulta.',
    indentLevel: 1,
    startMarker: '// Barra de búsqueda',
    endMarker: 'singleLine = true,',
  },
  {
    id: 'priorityFilter',
    order: '10',
    composable: 'FilterChip (Filtro de lista)',
    roleTitle: 'Chips de filtro por prioridad',
    description:
      'Permite filtrar las actividades visibles por prioridad (Todas, Alta, Media, Baja) combinándose con la barra de búsqueda.',
    indentLevel: 1,
    startMarker: '// Selector de filtros por prioridad',
    endMarker: 'modifier = Modifier.weight(1f)',
  },
  {
    id: 'list',
    order: '11',
    composable: 'LazyColumn',
    roleTitle: 'Lista desplazable de tareas',
    description:
      'Renderiza las actividades filtradas con key = { it.id } y muestra estados claros cuando no hay tareas o sin coincidencias.',
    indentLevel: 1,
    startMarker: 'items = actividadesFiltradas,',
    endMarker: 'actividades.removeAll',
  },
  {
    id: 'item',
    order: '12',
    composable: 'ActividadItem (Row)',
    roleTitle: 'Completar, fecha, prioridad, editar y eliminar',
    description:
      'Combina Checkbox, nombre con fecha y prioridad de color + texto, botón Editar y botón Eliminar en cada tarjeta.',
    indentLevel: 2,
    startMarker: 'fun ActividadItem(',
    endMarker: 'tint = MaterialTheme.colorScheme.error',
  },
  {
    id: 'edit',
    order: '13',
    composable: 'EditarActividadDialog',
    roleTitle: 'Formulario para editar nombre y fecha',
    description:
      'Diálogo sencillo de Material 3 con validación de texto, cambio de fecha y botones Guardar y Cancelar.',
    indentLevel: 2,
    startMarker: 'fun EditarActividadDialog(',
    endMarker: 'Text("Guardar")',
  },
];
