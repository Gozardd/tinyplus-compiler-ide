/**
 * Módulo de Ejemplos Precargados de Tiny++
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Especificación formal para la evaluación de la cátedra
 */

const TinyExamples = {
    presets: {
        factorial: {
            filename: 'factorial_recursivo.tny',
            title: 'Factorial Recursivo',
            code: `{ ========================================================
  PROGRAMA 1: Factorial Recursivo
  Demuestra: Declaración de subrutinas, parámetros formales,
  marcos de activación en la pila y llamadas recursivas.
  ======================================================== }
function factorial(int n): int
  if n = 1 then
    return 1
  else
    return n * factorial(n - 1)
  end
end

int n;
int resultado;

write "Calculo de Factorial";
read n;
resultado := factorial(n);
write "Resultado:";
write resultado
`
        },

        arreglos: {
            filename: 'arreglos_expresiones.tny',
            title: 'Arreglos con Índices Compuestos',
            code: `{ ========================================================
  PROGRAMA 2: Arreglos Unidimensionales
  Demuestra: Vectores en memoria, asignación indexada y
  expresiones aritméticas compuestas en el subíndice.
  ======================================================== }
int A[10];
int i;
int acumulador;

i := 0;
repeat
  { Indice con expresion compuesta: A[i*2+1] }
  A[i * 2 + 1] := (i + 1) * 10;
  i := i + 1
until i = 5;

acumulador := A[1] + A[3] + A[5];
write "Valor calculado:";
write acumulador
`
        },

        ambitos: {
            filename: 'ambitos_locales.tny',
            title: 'Ámbitos Globales y Locales (Shadowing)',
            code: `{ ========================================================
  PROGRAMA 3: Ámbitos de Variables (Scopes)
  Demuestra: Variables globales vs variables locales,
  ocultamiento de nombres (shadowing) y retorno formal.
  ======================================================== }
int x;
int res;

function duplicar(int x): int
  return x * 2
end

x := 100;
res := duplicar(25);

write "Variable local procesada:";
write res;
write "Variable global intacta:";
write x
`
        },

        strings: {
            filename: '04_strings_en_memoria.tny',
            title: 'Cadenas Literales en Memoria (Strings)',
            code: `{ ========================================================
  PROGRAMA 4: Cadenas Literales en Memoria
  Demuestra: Reserva y almacenamiento ASCII en dMem,
  punteros a memoria estática y bucles de salida write.
  ======================================================== }
string saludo;
string status;

saludo := "Compiladores ";
status := "Exito";

write saludo;
write status;
write 2026
`
        },

        completo: {
            filename: '06_programa_completo_tinyplus.tny',
            title: 'Programa Completo Tiny++ (Vectores, Subrutinas, Strings)',
            code: `{ ========================================================
  PROGRAMA 5: Integración Total de Tiny++
  Demuestra: Funciones con retorno, procedimientos,
  arreglos unidimensionales, bucle repeat y strings.
  ======================================================== }
function cuadrado(int x): int
  return x * x
end

procedure reportar(string msg, int valor)
  write msg;
  write valor
end

int datos[4];
int k;
int total;
bool procesado;

k := 0;
repeat
  datos[k] := cuadrado(k + 1);
  k := k + 1
until k = 4;

total := datos[0] + datos[1] + datos[2] + datos[3];
procesado := total < 50;

if procesado then
  reportar("SumaCuadrados: ", total)
else
  reportar("Excede: ", total)
end
`
        },

        error: {
            filename: 'error_semantico.tny',
            title: 'Detección de Errores Semánticos',
            code: `{ ========================================================
  PROGRAMA 6: Casos de Prueba de Errores Semánticos
  Demuestra: Detección estricta de variables no declaradas
  e incompatibilidad de tipos (int con bool).
  ======================================================== }
int a;
int b;
bool activo;

a := 10;
activo := true;

{ ERROR 1: Variable 'total' no ha sido declarada previamente }
total := a + 5;

{ ERROR 2: Incompatibilidad de tipos: sumar entero con booleano }
b := a + activo;

write b
`
        }
    },

    get(key) {
        return this.presets[key] || null;
    }
};

window.TinyExamples = TinyExamples;

