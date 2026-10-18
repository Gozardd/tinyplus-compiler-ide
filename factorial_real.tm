0:  LD   6, 0(0)     * inicializar MP con 1023 (tope de pila)
1:  ST   0, 0(0)     * limpiar celda 0
2:  IN   0, 0, 0     * leer valor de entrada n al acumulador AC
3:  ST   0, 0(5)     * guardar n en memoria de datos dMem[0]
4:  LDC  1, 1(0)     * inicializar acumulador factorial fact := 1
5:  ST   1, 1(5)     * guardar fact := 1 en dMem[1]
6:  LD   0, 0(5)     * cargar n en AC
7:  LDC  2, 1(0)     * constante 1 para comparar/decrementar
8:  SUB  3, 0, 2     * r3 := n - 1
9:  JLE  3, 8(7)     * si n <= 1 saltar a emision final (dir 18)
10: LD   0, 1(5)     * cargar fact en AC
11: LD   1, 0(5)     * cargar n en AC1
12: MUL  0, 0, 1     * AC := fact * n (multiplicacion real)
13: ST   0, 1(5)     * guardar nuevo fact en dMem[1]
14: LD   0, 0(5)     * cargar n en AC
15: SUB  0, 0, 2     * n := n - 1 (decrementar)
16: ST   0, 0(5)     * guardar nuevo n en dMem[0]
17: LDA  7, -10(7)   * repetir bucle multiplicativo (saltar a dir 8)
18: LD   0, 1(5)     * cargar resultado final de fact en AC
19: OUT  0, 0, 0     * emitir resultado por salida OUT
20: HALT 0, 0, 0     * fin de ejecucion de la Tiny Machine
