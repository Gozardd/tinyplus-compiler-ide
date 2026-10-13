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

    // 2. Conectar selector de ejemplos precargados
    setupExampleSelector();

    // 3. Conectar botón y atajos de compilación
    setupCompilation();

    // 4. Conectar diálogo modal de información del equipo
    setupAboutModal();

    // 5. Notificación de arranque
    window.TinyConsole.system('IDE Tiny++ Studio listo. Compilador y depurador TM preparados.');

    console.log('%c[Tiny++ Studio]%c IDE inicializado con éxito (Henyer Molina - UNET 2026)', 
        'color: #007acc; font-weight: bold;', 
        'color: #4ec9b0;');
});

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
                window.TinyConsole.info('💡 Haz clic en el botón [Línea X] o en la fila de error para saltar a la línea infractora.');
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
                if (window.TinyDebuggerUI) {
                    window.TinyDebuggerUI.loadSampleProgram(selectedKey || 'factorial');
                    window.TinyConsole.info('Instrucciones ensamblador cargadas en IMem. Depurador TM listo.');
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

