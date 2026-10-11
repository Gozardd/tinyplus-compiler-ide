# UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TÁCHIRA
## VICERRECTORADO ACADÉMICO - DECANATO DE DOCENCIA
### DEPARTAMENTO DE INFORMÁTICA
**Asignatura:** Compiladores e Intérpretes  
**Proyecto:** Compilador "Tiny++" e IDE con Depurador Visual de la Tiny Machine (TM)

---

## 👥 Integrantes del Equipo

| Integrante | Cédula | Módulo Asignado |
| :--- | :--- | :--- |
| **Theryan Colmenares** | V-31.060.894 | **Módulo 1:** Analizador Frontend y Verificador Semántico |
| **Ismael Hidalgo** | V-31.470.047 | **Módulo 2:** Generación de Código Objetivo (Backend TM) |
| **Santiago Hernández** | V-31.098.297 | **Módulo 3:** Interfaz de Depuración del Simulador TM |
| **Henyer Molina** | V-31.098.304 | **Módulo 4:** Interfaz Gráfica del IDE e Integración |

---

## 📖 Descripción del Proyecto

Este proyecto consiste en la evolución del compilador del lenguaje académico **Tiny** hacia la especificación **Tiny++**, incorporando tipado estricto, estructuras de datos avanzadas, funciones con marcos de activación y un Entorno de Desarrollo Integrado (IDE) con Depurador Visual acoplado a la máquina virtual **Tiny Machine (TM)**.

### Características del Lenguaje Tiny++:
1. **Tipado Estricto:** Declaración obligatoria de variables previo a su uso. Tipos soportados: `int`, `bool`, `string`.
2. **Arreglos Unidimensionales (Vectores):** Declaración y acceso indexado con expresiones compuestas (`A[i*2+1] := 10;`).
3. **Subrutinas y Funciones:** Declaración de procedimientos (`procedure`) y funciones tipadas con valor de retorno (`function ... return ...;`), con paso formal de parámetros por valor.
4. **Control de Ámbitos (Scopes):** Manejo de variables globales y locales a bloques/funciones con resolución estática y enmascaramiento (*shadowing*).
5. **Verificaciones Semánticas Estrictas:** Detección de identificadores no declarados, incompatibilidad de tipos en operaciones, asignaciones y paso de parámetros.

### Entorno de Desarrollo (IDE) y Depurador Visual:
- **Editor de Código:** Interfaz de escritura para Tiny++ con numeración de líneas y resaltado.
- **Consola de Compilación:** Reporte detallado de errores léxicos, sintácticos y semánticos con referencia de línea.
- **Depurador Paso a Paso (Step-by-Step):**
  - Inspección en tiempo real de los Registros TM (`PC`, `GP`, `MP`, `AC`, `AC1`).
  - Visualización interactiva de la **Memoria de Instrucciones** (con breakpoints).
  - Visualización de la **Memoria de Datos** (zona estática/global y zona de pila de llamadas).
  - Entrada y salida gráfica interactiva para instrucciones `read` y `write`.

---

## 🏗️ Estructura del Repositorio

- `proyecto/`: Código base del compilador en Java (JFlex y Java-CUP) y simulador de la TM.
- `src/ve/edu/unet/`: Clases del compilador, analizador léxico, sintáctico, AST y generador de código.
- `ejemplo_fuente/`: Programas de prueba en Tiny++ (factorial recursivo, vectores, pruebas semánticas).

---

## ⚙️ Requisitos y Compilación

- Java JDK 17 o superior.
- Java-CUP 11b y JFlex 1.8.2 (incluidos en `src/especificacion/`).
