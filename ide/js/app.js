/**
 * Tiny++ Studio IDE - Punto de Entrada y Orquestador Principal
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Arquitectura Modular
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar módulos base
    window.TinyEditor.init();
    window.TinyConsole.init();
    if (window.TinyResizer) window.TinyResizer.init();
    window.TinyDebuggerUI.init();
    window.TinyDebuggerUI.loadSampleProgram('factorial');
    if (window.TinyInspector) window.TinyInspector.init();

    // 2. Conectar selector de ejemplos precargados
    setupExampleSelector();

    // 3. Conectar controles de ejecución del depurador (Fase 5)
    setupExecutionControls();

    // 4. Conectar botón y atajos de compilación
    setupCompilation();

    // 5. Conectar diálogo modal de información del equipo
    setupAboutModal();

    // 6. Notificación de arranque
    window.TinyConsole.system('IDE Tiny++ Studio listo. Compilador y depurador TM preparados.');

    console.log('%c[Tiny++ Studio]%c IDE inicializado con éxito', 
        'color: #007acc; font-weight: bold;', 
        'color: #4ec9b0;');
});

/**
 * Conecta los botones de la barra de control del depurador (Run, Step, Pausa, Reset)
 * y los atajos de teclado estándar de depuración (F5, F10, Shift+F5)
 */
function setupExecutionControls() {
    const btnRun = document.getElementById('btn-run');
    const btnStep = document.getElementById('btn-step');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');

    if (btnRun) {
        btnRun.addEventListener('click', () => {
            if (window.TinyDebuggerUI) window.TinyDebuggerUI.run();
        });
    }

    if (btnStep) {
        btnStep.addEventListener('click', () => {
            if (window.TinyDebuggerUI) window.TinyDebuggerUI.step();
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            if (window.TinyDebuggerUI) window.TinyDebuggerUI.pause();
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (window.TinyDebuggerUI) window.TinyDebuggerUI.reset();
        });
    }

    // Atajos de teclado para depuración ágil
    document.addEventListener('keydown', (e) => {
        // F5: Iniciar o Pausar ejecución continua (Run / Pause)
        if (e.key === 'F5' && !e.shiftKey && !e.ctrlKey) {
            e.preventDefault();
            if (window.TinyDebuggerUI) {
                if (window.TinyDebuggerUI.isRunning) {
                    window.TinyDebuggerUI.pause();
                } else {
                    window.TinyDebuggerUI.run();
                }
            }
        }
        // Shift + F5: Reiniciar depurador (Reset)
        else if (e.key === 'F5' && e.shiftKey) {
            e.preventDefault();
            if (window.TinyDebuggerUI) {
                window.TinyDebuggerUI.reset();
            }
        }
        // F10: Avanzar un paso (Step)
        else if (e.key === 'F10') {
            e.preventDefault();
            if (window.TinyDebuggerUI) {
                window.TinyDebuggerUI.step();
            }
        }
    });
}

/**
 * Conecta el menú desplegable de ejemplos con el editor y la consola
 */
function setupExampleSelector() {
    const selector = document.getElementById('example-selector');
    const filenameLabel = document.getElementById('tab-filename');
    const statusLabel = document.getElementById('editor-status');

    if (!selector) return;

    selector.addEventListener('change', () => {
        const selectedKey = selector.value;
        const example = window.TinyExamples.get(selectedKey);

        if (example) {
            // Actualizar contenido del editor y reiniciar estado
            window.TinyEditor.setValue(example.code);

            if (statusLabel) {
                statusLabel.textContent = 'Modificado';
                statusLabel.className = 'status-indicator-idle';
            }

            // Actualizar pestaña con el nombre del archivo
            if (filenameLabel) {
                filenameLabel.textContent = example.filename;
            }

            // Registrar en consola
            window.TinyConsole.info(`Ejemplo cargado: "${example.title}" (${example.filename})`);

            // Cargar programa TM si no es el ejemplo de error
            if (selectedKey !== 'error' && window.TinyDebuggerUI) {
                window.TinyDebuggerUI.loadSampleProgram(selectedKey);
            }

            // Actualizar árbol AST y tabla de símbolos en el inspector
            if (window.TinyInspector) {
                window.TinyInspector.updateFromSource(example.code, selectedKey);
            }

            // Si se cargó el ejemplo de error, ofrecer sugerencia al usuario
            if (selectedKey === 'error') {
                window.TinyConsole.warn('Pulsa el botón "Compilar" para ver la detección semántica y navegación de errores en acción.');
            }
        }
    });
}

/**
 * Conecta el flujo de compilación y verificación interactiva de errores
 */
function setupCompilation() {
    const btnCompile = document.getElementById('btn-compile');
    const statusLabel = document.getElementById('editor-status');

    const handleCompile = () => {
        const code = window.TinyEditor.getValue();
        window.TinyConsole.info('Iniciando compilación y análisis semántico...');

        if (window.TinyValidator) {
            const errors = window.TinyValidator.validate(code);

            if (errors.length > 0) {
                if (statusLabel) {
                    statusLabel.textContent = `${errors.length} error(es)`;
                    statusLabel.className = 'error-msg';
                }

                window.TinyConsole.warn(`Compilación fallida: Se encontraron ${errors.length} error(es) en el código.`);
                
                // Publicar cada error en la consola con botón interactivo de navegación
                errors.forEach(err => {
                    window.TinyConsole.error(err.message, err.line);
                });

                // Saltar y enfocar automáticamente el primer error detectado
                window.TinyEditor.goToLine(errors[0].line);
                window.TinyConsole.info('Haz clic en el botón [Línea X] o en la fila de error para saltar a la línea infractora.');
            } else {
                if (statusLabel) {
                    statusLabel.textContent = 'Compilado OK';
                    statusLabel.className = 'status-indicator-idle';
                    statusLabel.style.color = 'var(--accent-success)';
                }

                window.TinyConsole.success('Compilación exitosa: 0 errores léxicos, sintácticos o semánticos. Código objeto TM generado.');

                // Cargar código objeto en la memoria de la Tiny Machine
                const selector = document.getElementById('example-selector');
                const selectedKey = selector ? selector.value : 'factorial';
                const currentPreset = window.TinyExamples ? window.TinyExamples.get(selectedKey) : null;
                const isCustom = !currentPreset || currentPreset.code.trim() !== code.trim();

                if (window.TinyDebuggerUI) {
                    window.TinyDebuggerUI.loadSampleProgram(selectedKey || 'factorial');
                    window.TinyConsole.info('Instrucciones ensamblador cargadas en IMem. Depurador TM listo.');
                }

                // Actualizar árbol AST y tabla de símbolos con el código compilado
                if (window.TinyInspector) {
                    window.TinyInspector.updateFromSource(code, isCustom ? null : selectedKey);
                }
            }
        }
    };

    if (btnCompile) {
        btnCompile.addEventListener('click', handleCompile);
    }

    // Atajo de teclado: Ctrl+Enter o F9 para compilar rápidamente
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.key === 'Enter') || e.key === 'F9') {
            e.preventDefault();
            handleCompile();
        }
    });
}

/**
 * Controla la apertura y cierre del diálogo modal Acerca de
 */
function setupAboutModal() {
    const btnAbout = document.getElementById('btn-about');
    const modal = document.getElementById('modal-about');
    const btnClose = document.getElementById('modal-close-btn');

    if (!btnAbout || !modal) return;

    btnAbout.addEventListener('click', () => {
        modal.classList.add('active');
    });

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}
