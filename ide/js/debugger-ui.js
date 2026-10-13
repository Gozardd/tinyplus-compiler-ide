/**
 * Módulo de la Interfaz del Depurador Visual de la Tiny Machine
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Características:
 * - Registros de hardware de la TM (PC=r7, GP=r5, MP=r6, AC=r0, AC1=r1)
 * - Memoria de Instrucciones (IMem) con puntero activo de PC y Breakpoints interactivos
 * - Memoria de Datos (DMem - 1024 celdas) con selector de vista (Globales, Pila, Todas)
 * - Carga de programas objeto TM precompilados para demostración y evaluación
 */

const TinyDebuggerUI = {
    // Estado del hardware virtual de la Tiny Machine
    registers: {
        pc: 0,    // r7: Program Counter
        gp: 0,    // r5: Global Pointer (base de datos estáticos)
        mp: 1023, // r6: Memory/Stack Pointer (tope de pila)
        ac: 0,    // r0: Acumulador principal
        ac1: 0    // r1: Acumulador secundario
    },

    previousRegisters: {},
    dMem: new Array(1024).fill(0),
    iMem: [],
    breakpoints: new Set(),
    dMemViewMode: 'gp',

    init() {
        this.setupTabs();
        this.setupIMemControls();
        this.setupDMemControls();
        this.updateRegisters(this.registers);
        this.renderDMem();
    },

    /**
     * Alternador de pestañas de inspección (IMem, DMem, AST, Símbolos)
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.inspector-tabs .tab-btn');
        const tabPanes = document.querySelectorAll('.inspector-content .tab-pane');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                tabButtons.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                btn.classList.add('active');
                const targetPane = document.getElementById(targetTab);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    },

    /**
     * Controles superiores de la Memoria de Instrucciones (IMem)
     */
    setupIMemControls() {
        const btnToPC = document.getElementById('btn-imem-topc');
        const btnClearBP = document.getElementById('btn-imem-clearbp');

        if (btnToPC) {
            btnToPC.addEventListener('click', () => this.scrollToPC());
        }

        if (btnClearBP) {
            btnClearBP.addEventListener('click', () => this.clearBreakpoints());
        }
    },

    /**
     * Controles superiores de la Memoria de Datos (DMem)
     */
    setupDMemControls() {
        const selectMode = document.getElementById('dmem-view-mode');
        const jumpInput = document.getElementById('dmem-jump-input');
        const btnJump = document.getElementById('btn-dmem-jump');

        if (selectMode) {
            selectMode.addEventListener('change', () => {
                this.dMemViewMode = selectMode.value;
                this.renderDMem();
            });
        }

        const handleJump = () => {
            if (!jumpInput) return;
            const target = parseInt(jumpInput.value, 10);
            if (!isNaN(target) && target >= 0 && target < 1024) {
                this.jumpToDMemCell(target);
            }
        };

        if (btnJump) btnJump.addEventListener('click', handleJump);
        if (jumpInput) {
            jumpInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleJump();
            });
        }
    },

    // =========================================================================
    // GESTIÓN DE REGISTROS DE LA TM
    // =========================================================================
    updateRegisters(newRegs = {}) {
        const regMap = {
            pc: { id: 'val-pc', box: 'reg-pc' },
            gp: { id: 'val-gp', box: 'reg-gp' },
            mp: { id: 'val-mp', box: 'reg-mp' },
            ac: { id: 'val-ac', box: 'reg-ac' },
            ac1: { id: 'val-ac1', box: 'reg-ac1' }
        };

        let pcChanged = false;

        for (const [key, val] of Object.entries(newRegs)) {
            if (this.registers[key] !== undefined) {
                const prev = this.registers[key];
                this.registers[key] = val;

                if (key === 'pc' && prev !== val) {
                    pcChanged = true;
                }

                const domInfo = regMap[key];
                if (domInfo) {
                    const el = document.getElementById(domInfo.id);
                    const box = document.getElementById(domInfo.box);
                    if (el) el.textContent = val;

                    // Destello sutil cuando el registro cambia de valor
                    if (box && prev !== val && this.previousRegisters[key] !== undefined) {
                        box.classList.add('reg-changed');
                        setTimeout(() => box.classList.remove('reg-changed'), 600);
                    }
                }
            }
        }

        this.previousRegisters = { ...this.registers };

        if (pcChanged && this.iMem.length > 0) {
            this.highlightCurrentPC();
        }
    },

    setStatus(statusText) {
        const pill = document.getElementById('tm-status');
        if (pill) {
            pill.textContent = statusText;
        }
    },

    // =========================================================================
    // MEMORIA DE INSTRUCCIONES (IMEM) Y BREAKPOINTS
    // =========================================================================
    /**
     * Parsea y carga instrucciones en formato estándar de Kenneth Louden
     * Ejemplo: "0: LDC 6, 1023(0) * inicializar mp"
     */
    loadInstructions(instructionStrings) {
        this.iMem = [];
        this.breakpoints.clear();

        instructionStrings.forEach(raw => {
            const trimmed = raw.trim();
            if (!trimmed || trimmed.startsWith('*')) return;

            // Formato: <loc>: <opcode> <args> * <comment>
            const match = trimmed.match(/^(\d+):\s*([A-Za-z]+)\s+([^*]+)(?:\*\s*(.*))?$/);
            if (match) {
                this.iMem.push({
                    addr: parseInt(match[1], 10),
                    opcode: match[2].trim().toUpperCase(),
                    args: match[3].trim(),
                    comment: match[4] ? match[4].trim() : '',
                    raw: trimmed
                });
            }
        });

        const countBadge = document.getElementById('imem-count');
        if (countBadge) {
            countBadge.textContent = `${this.iMem.length} instrs`;
        }

        this.renderIMem();
        this.updateBreakpointCount();
    },

    renderIMem() {
        const list = document.getElementById('imem-list');
        if (!list) return;

        if (this.iMem.length === 0) {
            list.innerHTML = '<div class="memory-placeholder">No se ha cargado ningún programa objeto TM todavía. Pulsa "Compilar".</div>';
            return;
        }

        let html = '';
        this.iMem.forEach(instr => {
            const hasBP = this.breakpoints.has(instr.addr);
            const isPC = instr.addr === this.registers.pc;

            html += `
                <div class="imem-row ${isPC ? 'active-pc' : ''}" data-addr="${instr.addr}">
                    <div class="imem-bp-col" data-addr="${instr.addr}" title="Alternar punto de interrupción">
                        <span class="bp-dot ${hasBP ? 'active' : ''}"></span>
                    </div>
                    <div class="imem-addr">${instr.addr}:</div>
                    <div class="imem-code" title="${instr.opcode} ${instr.args}">
                        <span class="imem-opcode">${instr.opcode}</span> <span class="imem-args">${instr.args}</span>
                    </div>
                    <div class="imem-comment" title="${instr.comment}">* ${instr.comment}</div>
                </div>
            `;
        });

        list.innerHTML = html;

        // Conectar eventos interactivos de Breakpoints en cada fila
        const rows = list.querySelectorAll('.imem-row');
        rows.forEach(row => {
            const addr = parseInt(row.getAttribute('data-addr'), 10);
            const bpCol = row.querySelector('.imem-bp-col');

            if (bpCol) {
                bpCol.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleBreakpoint(addr);
                });
            }
        });
    },

    toggleBreakpoint(addr) {
        if (this.breakpoints.has(addr)) {
            this.breakpoints.delete(addr);
            if (window.TinyConsole) {
                window.TinyConsole.info(`Breakpoint eliminado en dirección de memoria TM [${addr}]`);
            }
        } else {
            this.breakpoints.add(addr);
            if (window.TinyConsole) {
                window.TinyConsole.warn(`Breakpoint establecido en dirección de memoria TM [${addr}]`);
            }
        }

        // Actualizar visualmente la fila afectada
        const row = document.querySelector(`.imem-row[data-addr="${addr}"] .bp-dot`);
        if (row) {
            row.classList.toggle('active', this.breakpoints.has(addr));
        }

        this.updateBreakpointCount();
    },

    clearBreakpoints() {
        if (this.breakpoints.size === 0) return;
        this.breakpoints.clear();
        const activeDots = document.querySelectorAll('.imem-list .bp-dot.active');
        activeDots.forEach(d => d.classList.remove('active'));
        this.updateBreakpointCount();
        if (window.TinyConsole) {
            window.TinyConsole.info('Todos los puntos de interrupción han sido removidos.');
        }
    },

    updateBreakpointCount() {
        const bpBadge = document.getElementById('imem-bp-count');
        if (bpBadge) {
            bpBadge.textContent = `${this.breakpoints.size} BPs`;
            bpBadge.classList.toggle('has-bp', this.breakpoints.size > 0);
        }
    },

    highlightCurrentPC() {
        const currentPC = this.registers.pc;
        const rows = document.querySelectorAll('.imem-list .imem-row');
        rows.forEach(r => {
            const addr = parseInt(r.getAttribute('data-addr'), 10);
            r.classList.toggle('active-pc', addr === currentPC);
        });
    },

    scrollToPC() {
        const activeRow = document.querySelector('.imem-list .imem-row.active-pc');
        if (activeRow) {
            activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    },

    // =========================================================================
    // MEMORIA DE DATOS (DMEM - 1024 CELDAS)
    // =========================================================================
    renderDMem() {
        const list = document.getElementById('dmem-list');
        if (!list) return;

        let cellsToRender = [];

        if (this.dMemViewMode === 'gp') {
            // Variables Globales: primeras 32 celdas
            for (let i = 0; i < 32; i++) cellsToRender.push(i);
        } else if (this.dMemViewMode === 'mp') {
            // Pila de llamadas: desde 1023 hacia abajo
            for (let i = 1023; i >= 992; i--) cellsToRender.push(i);
        } else if (this.dMemViewMode === 'active') {
            // Celdas no vacías o celdas especiales
            for (let i = 0; i < 1024; i++) {
                if (this.dMem[i] !== 0 || i === this.registers.gp || i === this.registers.mp) {
                    cellsToRender.push(i);
                }
            }
            if (cellsToRender.length === 0) {
                for (let i = 0; i < 16; i++) cellsToRender.push(i);
            }
        } else {
            // Todas las 1024 celdas
            for (let i = 0; i < 1024; i++) cellsToRender.push(i);
        }

        let html = '';
        cellsToRender.forEach(idx => {
            const val = this.dMem[idx] || 0;
            const isZero = val === 0;
            const hexVal = '0x' + (val >>> 0).toString(16).toUpperCase().padStart(4, '0');

            // Determinar etiqueta según punteros GP y MP
            let role = 'Memoria';
            let roleClass = '';
            if (idx === this.registers.gp && idx === 0) {
                role = 'Base Global (GP)';
                roleClass = 'tag-gp';
            } else if (idx === this.registers.mp) {
                role = 'Tope Pila (MP)';
                roleClass = 'tag-mp';
            } else if (idx < 20) {
                role = `Variable Global (GP+${idx})`;
                roleClass = 'tag-gp';
            } else if (idx >= 1000) {
                role = `Marco Pila (${1023 - idx})`;
                roleClass = 'tag-mp';
            }

            html += `
                <div class="dmem-row" id="dmem-cell-${idx}">
                    <div class="dmem-cell-addr">${idx}</div>
                    <div class="dmem-cell-dec ${isZero ? 'zero' : ''}">${val}</div>
                    <div class="dmem-cell-hex ${isZero ? 'zero' : ''}">${hexVal}</div>
                    <div class="dmem-cell-role ${roleClass}">${role}</div>
                </div>
            `;
        });

        list.innerHTML = html;
    },

    setDMemValue(addr, val) {
        if (addr >= 0 && addr < 1024) {
            this.dMem[addr] = val;
            this.renderDMem();
        }
    },

    jumpToDMemCell(targetAddr) {
        // Asegurarse de que esté en vista 'all' si la celda no pertenece a la vista actual
        if (this.dMemViewMode === 'gp' && targetAddr >= 32) {
            const sel = document.getElementById('dmem-view-mode');
            if (sel) {
                sel.value = 'all';
                this.dMemViewMode = 'all';
            }
        } else if (this.dMemViewMode === 'mp' && targetAddr < 992) {
            const sel = document.getElementById('dmem-view-mode');
            if (sel) {
                sel.value = 'all';
                this.dMemViewMode = 'all';
            }
        }

        this.renderDMem();

        setTimeout(() => {
            const row = document.getElementById(`dmem-cell-${targetAddr}`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.classList.add('highlight-target');
                setTimeout(() => row.classList.remove('highlight-target'), 1500);
            }
        }, 50);
    },

    // =========================================================================
    // PROGRAMAS OBJETO TM PREENSAMBLADOS (CONTRATO CON EL COMPILADOR)
    // =========================================================================
    loadSampleProgram(sampleKey) {
        const presets = {
            factorial: {
                registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
                dmem: { 0: 0, 1: 0 },
                instructions: [
                    '0:  LDC  6, 1023(0)  * inicializar mp en 1023 (tope de pila)',
                    '1:  LDC  5, 0(0)     * inicializar gp en 0 (base global)',
                    '2:  IN   0, 0, 0     * leer valor de entrada n al acumulador ac',
                    '3:  ST   0, 0(5)     * guardar n en dMem[0] (variable global n)',
                    '4:  LD   0, 0(5)     * cargar n para preparar llamada',
                    '5:  LDA  1, 3(7)     * return address (PC+3) en ac1',
                    '6:  ST   1, -1(6)    * apilar direccion de retorno en pila',
                    '7:  ST   0, -2(6)    * apilar parametro formal n en pila',
                    '8:  LDA  6, -3(6)    * decrementar mp para marco de activacion',
                    '9:  LD   0, 1(6)     * cuerpo funcion: evaluar parametro n',
                    '10: LDC  1, 1(0)     * cargar constante 1 para caso base',
                    '11: SUB  0, 0, 1     * verificar si n <= 1',
                    '12: JGT  0, 3(7)     * si n > 1 saltar a caso recursivo',
                    '13: LDC  0, 1(0)     * caso base: retorno 1',
                    '14: LDA  7, 4(7)     * saltar a epilogo de retorno',
                    '15: LD   0, 1(6)     * caso recursivo: n * factorial(n-1)',
                    '16: OUT  0, 0, 0     * emitir resultado final por OUT',
                    '17: HALT 0, 0, 0     * fin de ejecucion de la Tiny Machine'
                ]
            },

            arreglos: {
                registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
                dmem: { 0: 0, 1: 10, 2: 0, 3: 20, 10: 5 },
                instructions: [
                    '0:  LDC  6, 1023(0)  * inicializar mp en 1023',
                    '1:  LDC  5, 0(0)     * base del vector A[10] en dMem[0..9]',
                    '2:  LDC  0, 0(0)     * i := 0',
                    '3:  ST   0, 10(5)    * almacenar i en dMem[10]',
                    '4:  LDC  0, 10(0)    * calcular valor a guardar: 10',
                    '5:  LDC  1, 1(0)     * indice compuesto calculado: 1',
                    '6:  ADD  1, 1, 5     * direccion fisica efectiva: GP + 1',
                    '7:  ST   0, 0(1)     * asignar A[1] := 10 en memoria',
                    '8:  LDC  0, 20(0)    * calcular segundo valor: 20',
                    '9:  LDC  1, 3(0)     * indice compuesto calculado: 3',
                    '10: ADD  1, 1, 5     * direccion fisica efectiva: GP + 3',
                    '11: ST   0, 0(1)     * asignar A[3] := 20 en memoria',
                    '12: LD   0, 1(5)     * cargar A[1]',
                    '13: LD   1, 3(5)     * cargar A[3]',
                    '14: ADD  0, 0, 1     * acumular suma de elementos',
                    '15: OUT  0, 0, 0     * write acumulador',
                    '16: HALT 0, 0, 0     * fin del programa de vectores'
                ]
            },

            ambitos: {
                registers: { pc: 0, gp: 0, mp: 1023, ac: 0, ac1: 0 },
                dmem: { 0: 100, 1: 50, 1022: 25 },
                instructions: [
                    '0:  LDC  6, 1023(0)  * inicializar mp',
                    '1:  LDC  5, 0(0)     * inicializar gp',
                    '2:  LDC  0, 100(0)   * variable global x := 100',
                    '3:  ST   0, 0(5)     * guardar x en dMem[0]',
                    '4:  LDC  0, 25(0)    * parametro formal valor := 25',
                    '5:  LDA  1, 3(7)     * return address',
                    '6:  ST   1, -1(6)    * salvar retorno en marco de pila',
                    '7:  ST   0, -2(6)    * pasar parametro en pila',
                    '8:  LDA  6, -3(6)    * activar marco local',
                    '9:  LD   0, 1(6)     * acceder a parametro formal',
                    '10: LDC  1, 2(0)     * constante 2',
                    '11: MUL  0, 0, 1     * x local := valor * 2 = 50',
                    '12: ST   0, 0(6)     * guardar en variable local x (sombra)',
                    '13: LD   0, 0(5)     * verificar que x global sigue intacta (100)',
                    '14: OUT  0, 0, 0     * write x global',
                    '15: HALT 0, 0, 0     * fin'
                ]
            }
        };

        const preset = presets[sampleKey];
        if (preset) {
            // Reiniciar memoria y registros
            this.dMem.fill(0);
            for (const [cell, val] of Object.entries(preset.dmem)) {
                this.dMem[parseInt(cell, 10)] = val;
            }
            this.updateRegisters(preset.registers);
            this.loadInstructions(preset.instructions);
            this.renderDMem();
            this.setStatus('CARGADO');
        }
    }
};

window.TinyDebuggerUI = TinyDebuggerUI;
