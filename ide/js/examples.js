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
int n, resultado;

int factorial(int n)
begin
  if n <= 1 then
    return 1;
  else
    return n * factorial(n - 1);
  end
end

write "Calculo de Factorial";
read n;
resultado := factorial(n);
write "Resultado:";
write resultado;
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
int i, acumulador;

i := 0;
while i < 5 do
  { Indice con expresion compuesta: A[i*2+1] }
  A[i * 2 + 1] := (i + 1) * 10;
  i := i + 1;
end;

acumulador := A[1] + A[3] + A[5];
write "Valor calculado:";
write acumulador;
`
        },

        ambitos: {
            filename: 'ambitos_locales.tny',
            title: 'Ámbitos Globales y Locales',
            code: `{ ========================================================
  PROGRAMA 3: Ámbitos de Variables (Scopes)
  Demuestra: Variables globales vs variables locales,
  ocultamiento de nombres (shadowing) y retorno formal.
  ======================================================== }
int x, res;

int duplicar(int valor)
begin
  int x; { Variable local que oculta la global 'x' }
  x := valor * 2;
  return x;
end

x := 100;
res := duplicar(25);

write "Variable local procesada:";
write res;
write "Variable global intacta:";
write x;
`
        },

        error: {
            filename: 'error_semantico.tny',
            title: 'Detección de Errores Semánticos',
            code: `{ ========================================================
  PROGRAMA 4: Casos de Prueba de Errores Semánticos
  Demuestra: Detección estricta de variables no declaradas
  e incompatibilidad de tipos (int con bool).
  ======================================================== }
int a, b;
bool activo;

a := 10;
activo := true;

{ ERROR 1: Variable 'total' no ha sido declarada previamente }
total := a + 5;

{ ERROR 2: Incompatibilidad de tipos: sumar entero con booleano }
b := a + activo;

write b;
`
        }
    },

    get(key) {
        return this.presets[key] || null;
    }
};

window.TinyExamples = TinyExamples;
