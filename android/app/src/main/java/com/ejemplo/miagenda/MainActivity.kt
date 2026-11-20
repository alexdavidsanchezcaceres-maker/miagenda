package com.ejemplo.miagenda

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

// Niveles de prioridad disponibles para cada actividad
enum class Prioridad(val etiqueta: String) {
    BAJA("Baja"),
    MEDIA("Media"),
    ALTA("Alta")
}

// Modelo de datos en memoria con fecha y prioridad
data class Actividad(
    val id: Int,
    val titulo: String,
    val fecha: String,
    val prioridad: Prioridad = Prioridad.MEDIA,
    val completada: Boolean = false
)

// Paleta clara de Material 3 para la aplicación móvil
private val MiAgendaColores = lightColorScheme(
    primary = Color(0xFF006A60),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFCCE8E3),
    onPrimaryContainer = Color(0xFF00201D),
    surface = Color(0xFFFAFDFC),
    surfaceVariant = Color(0xFFDAE5E2),
    error = Color(0xFFBA1A1A)
)

// Devuelve la fecha actual del teléfono en formato día/mes/año
private fun obtenerFechaDeHoy(): String {
    val formato = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
    return formato.format(Date())
}

// Formatea la fecha elegida en DatePicker (usa UTC para evitar desfase de día)
private fun formatearFechaUtc(millis: Long): String {
    val formato = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
    formato.timeZone = TimeZone.getTimeZone("UTC")
    return formato.format(Date(millis))
}

// Color visual con buen contraste para cada nivel de prioridad
private fun colorDePrioridad(prioridad: Prioridad): Color = when (prioridad) {
    Prioridad.BAJA -> Color(0xFF047857)
    Prioridad.MEDIA -> Color(0xFFB45309)
    Prioridad.ALTA -> Color(0xFFBA1A1A)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme(colorScheme = MiAgendaColores) {
                MiAgendaScreen()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MiAgendaScreen() {
    // Estado en memoria: existe solo mientras la aplicación está abierta
    var textoActividad by remember { mutableStateOf("") }
    var mostrarErrorTexto by remember { mutableStateOf(false) }
    var fechaSeleccionada by remember { mutableStateOf("") }
    var mostrarSelectorFecha by remember { mutableStateOf(false) }
    var prioridadSeleccionada by remember { mutableStateOf(Prioridad.MEDIA) }
    var textoBusqueda by remember { mutableStateOf("") }
    var actividadEnEdicion by remember { mutableStateOf<Actividad?>(null) }
    var siguienteId by remember { mutableStateOf(1) }
    val actividades = remember { mutableStateListOf<Actividad>() }

    val fechaDeHoy = obtenerFechaDeHoy()
    val fechaVisible = fechaSeleccionada.ifBlank { fechaDeHoy }

    // Cálculo de progreso sobre el total de tareas
    val totalTareas = actividades.size
    val tareasCompletadas = actividades.count { it.completada }
    val porcentajeCompletado = if (totalTareas > 0) {
        (tareasCompletadas * 100) / totalTareas
    } else {
        0
    }

    // Filtrado en tiempo real por nombre
    val consultaLimpia = textoBusqueda.trim()
    val actividadesFiltradas = if (consultaLimpia.isEmpty()) {
        actividades
    } else {
        actividades.filter { it.titulo.contains(consultaLimpia, ignoreCase = true) }
    }

    // Valida el campo de texto y agrega la actividad con su fecha y prioridad
    fun agregarActividad() {
        val textoLimpio = textoActividad.trim()
        if (textoLimpio.isEmpty()) {
            mostrarErrorTexto = true
            return
        }

        val fechaFinal = fechaSeleccionada.ifBlank { obtenerFechaDeHoy() }
        actividades.add(
            Actividad(
                id = siguienteId,
                titulo = textoLimpio,
                fecha = fechaFinal,
                prioridad = prioridadSeleccionada
            )
        )
        siguienteId++
        textoActividad = ""
        mostrarErrorTexto = false
        fechaSeleccionada = ""
        prioridadSeleccionada = Prioridad.MEDIA
    }

    // Diálogo nativo de Material 3 para elegir una fecha al crear
    if (mostrarSelectorFecha) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { mostrarSelectorFecha = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            fechaSeleccionada = formatearFechaUtc(millis)
                        }
                        mostrarSelectorFecha = false
                    }
                ) {
                    Text("Aceptar")
                }
            },
            dismissButton = {
                TextButton(onClick = { mostrarSelectorFecha = false }) {
                    Text("Cancelar")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    // Formulario sencillo para editar el nombre y la fecha de una actividad existente
    actividadEnEdicion?.let { actividad ->
        EditarActividadDialog(
            actividad = actividad,
            onGuardar = { nuevoTitulo, nuevaFecha ->
                val indice = actividades.indexOfFirst { it.id == actividad.id }
                if (indice != -1) {
                    actividades[indice] = actividades[indice].copy(
                        titulo = nuevoTitulo,
                        fecha = nuevaFecha
                    )
                }
                actividadEnEdicion = null
            },
            onCancelar = { actividadEnEdicion = null }
        )
    }

    // Estructura principal de Material 3 diseñada para pantalla vertical de teléfono
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mi Agenda") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingInterno ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingInterno),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Formulario para agregar una actividad
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = textoActividad,
                        onValueChange = { nuevoTexto ->
                            textoActividad = nuevoTexto
                            if (mostrarErrorTexto && nuevoTexto.isNotBlank()) {
                                mostrarErrorTexto = false
                            }
                        },
                        label = { Text("Escribe una actividad") },
                        placeholder = { Text("Ej. Repasar funciones @Composable") },
                        isError = mostrarErrorTexto,
                        supportingText = if (mostrarErrorTexto) {
                            { Text("Debes escribir una actividad.") }
                        } else {
                            null
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { agregarActividad() }),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Selector de fecha (si no se elige ninguna, usa la fecha de hoy)
                    OutlinedButton(
                        onClick = { mostrarSelectorFecha = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = Icons.Default.DateRange,
                            contentDescription = "Elegir fecha"
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (fechaSeleccionada.isBlank()) {
                                "Fecha: $fechaVisible (Hoy)"
                            } else {
                                "Fecha: $fechaVisible"
                            }
                        )
                    }

                    // Selector de prioridad: Baja, Media o Alta
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "Prioridad",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Prioridad.entries.forEach { nivel ->
                                val seleccionada = prioridadSeleccionada == nivel
                                FilterChip(
                                    selected = seleccionada,
                                    onClick = { prioridadSeleccionada = nivel },
                                    label = {
                                        Text(
                                            text = nivel.etiqueta,
                                            modifier = Modifier.fillMaxWidth(),
                                            textAlign = TextAlign.Center
                                        )
                                    },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = colorDePrioridad(nivel).copy(alpha = 0.14f),
                                        selectedLabelColor = colorDePrioridad(nivel)
                                    ),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // Botón principal: muestra el aviso si el campo está vacío o con espacios
                    Button(
                        onClick = { agregarActividad() },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Agregar actividad")
                    }
                }
            }

            // Tarjeta de resumen con círculo de porcentaje y barra de progreso
            item {
                ResumenProgresoCard(
                    completadas = tareasCompletadas,
                    total = totalTareas,
                    porcentaje = porcentajeCompletado
                )
            }

            // Barra de búsqueda Material 3 en la parte superior de la lista
            item {
                OutlinedTextField(
                    value = textoBusqueda,
                    onValueChange = { textoBusqueda = it },
                    placeholder = { Text("Buscar actividad por nombre...") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Buscar"
                        )
                    },
                    trailingIcon = if (textoBusqueda.isNotEmpty()) {
                        {
                            IconButton(onClick = { textoBusqueda = "" }) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Limpiar búsqueda"
                                )
                            }
                        }
                    } else {
                        null
                    },
                    shape = RoundedCornerShape(28.dp),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Lista de actividades filtradas o mensaje vacío
            if (actividades.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 28.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Aún no hay actividades. Escribe una arriba para comenzar.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else if (actividadesFiltradas.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No se encontraron actividades con \"$consultaLimpia\".",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                items(
                    items = actividadesFiltradas,
                    key = { it.id }
                ) { actividad ->
                    ActividadItem(
                        actividad = actividad,
                        onCambiarEstado = {
                            val indice = actividades.indexOfFirst { it.id == actividad.id }
                            if (indice != -1) {
                                actividades[indice] = actividad.copy(
                                    completada = !actividad.completada
                                )
                            }
                        },
                        onEditar = { actividadEnEdicion = actividad },
                        onEliminar = {
                            actividades.removeAll { it.id == actividad.id }
                        }
                    )
                }
            }
        }
    }
}

// Tarjeta compacta de resumen con círculo de porcentaje y barra de progreso
@Composable
fun ResumenProgresoCard(
    completadas: Int,
    total: Int,
    porcentaje: Int
) {
    val progreso = if (total > 0) completadas.toFloat() / total.toFloat() else 0f

    OutlinedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.outlinedCardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(56.dp)
            ) {
                CircularProgressIndicator(
                    progress = { progreso },
                    modifier = Modifier.fillMaxSize(),
                    strokeWidth = 5.dp,
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )
                Text(
                    text = "$porcentaje%",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Progreso de tareas",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "$completadas de $total completadas",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                LinearProgressIndicator(
                    progress = { progreso },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(7.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )
            }
        }
    }
}

// Diálogo sencillo para editar el nombre y la fecha de una actividad
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditarActividadDialog(
    actividad: Actividad,
    onGuardar: (String, String) -> Unit,
    onCancelar: () -> Unit
) {
    var tituloEditado by remember(actividad.id) { mutableStateOf(actividad.titulo) }
    var fechaEditada by remember(actividad.id) { mutableStateOf(actividad.fecha) }
    var mostrarError by remember(actividad.id) { mutableStateOf(false) }
    var mostrarCalendario by remember(actividad.id) { mutableStateOf(false) }

    if (mostrarCalendario) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { mostrarCalendario = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            fechaEditada = formatearFechaUtc(millis)
                        }
                        mostrarCalendario = false
                    }
                ) {
                    Text("Aceptar")
                }
            },
            dismissButton = {
                TextButton(onClick = { mostrarCalendario = false }) {
                    Text("Cancelar")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    AlertDialog(
        onDismissRequest = onCancelar,
        title = { Text("Editar actividad") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = tituloEditado,
                    onValueChange = { nuevo ->
                        tituloEditado = nuevo
                        if (mostrarError && nuevo.isNotBlank()) {
                            mostrarError = false
                        }
                    },
                    label = { Text("Nombre de la actividad") },
                    isError = mostrarError,
                    supportingText = if (mostrarError) {
                        { Text("Debes escribir una actividad.") }
                    } else {
                        null
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedButton(
                    onClick = { mostrarCalendario = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.DateRange,
                        contentDescription = "Cambiar fecha"
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Fecha: ${fechaEditada.ifBlank { obtenerFechaDeHoy() }}")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val tituloLimpio = tituloEditado.trim()
                    if (tituloLimpio.isEmpty()) {
                        mostrarError = true
                    } else {
                        onGuardar(tituloLimpio, fechaEditada.ifBlank { obtenerFechaDeHoy() })
                    }
                }
            ) {
                Text("Guardar")
            }
        },
        dismissButton = {
            TextButton(onClick = onCancelar) {
                Text("Cancelar")
            }
        }
    )
}

// Fila reutilizable para cada actividad: casilla, datos, editar y eliminar
@Composable
fun ActividadItem(
    actividad: Actividad,
    onCambiarEstado: () -> Unit,
    onEditar: () -> Unit,
    onEliminar: () -> Unit
) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.outlinedCardColors(
            containerColor = if (actividad.completada) {
                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f)
            } else {
                MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 6.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = actividad.completada,
                onCheckedChange = { onCambiarEstado() }
            )

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 6.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = actividad.titulo,
                    style = MaterialTheme.typography.bodyLarge,
                    textDecoration = if (actividad.completada) {
                        TextDecoration.LineThrough
                    } else {
                        TextDecoration.None
                    },
                    color = if (actividad.completada) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    }
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = actividad.fecha,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "·",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Prioridad ${actividad.prioridad.etiqueta}",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = if (actividad.completada) {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        } else {
                            colorDePrioridad(actividad.prioridad)
                        }
                    )
                }
            }

            // Botón para editar el nombre y la fecha
            IconButton(onClick = onEditar) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Editar actividad",
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            // Botón para eliminar la actividad de la lista
            IconButton(onClick = onEliminar) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Eliminar actividad",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
fun MiAgendaPreview() {
    MaterialTheme(colorScheme = MiAgendaColores) {
        MiAgendaScreen()
    }
}
