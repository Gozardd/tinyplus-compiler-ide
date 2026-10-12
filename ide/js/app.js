/**
 * Tiny++ Studio IDE - Punto de Entrada y Orquestador Principal
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Arquitectura Modular
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar módulos base
    window.TinyEditor.init();
    window.TinyConsole.init();
    window.TinyDebuggerUI.init();

    // 2. Conectar selector de ejemplos precargados
    setupExampleSelector();

    // 3. Notificación de arranque
    window.TinyConsole.system('IDE Tiny++ Studio listo. Selecciona un ejemplo precargado o escribe tu código.');

    console.log('%c[Tiny++ Studio]%c IDE inicializado con éxito (Fase 2 - Henyer Molina)', 
        'color: #38bdf8; font-weight: bold;', 
        'color: #10b981;');
});

/**
 * Conecta el menú desplegable de ejemplos con el editor y la consola
 */
function setupExampleSelector() {
    const selector = document.getElementById('example-selector');
    const filenameLabel = document.getElementById('tab-filename');

    if (!selector) return;

    selector.addEventListener('change', () => {
        const selectedKey = selector.value;
        const example = window.TinyExamples.get(selectedKey);

        if (example) {
            // Actualizar contenido del editor
            window.TinyEditor.setValue(example.code);

            // Actualizar pestaña con el nombre del archivo
            if (filenameLabel) {
                filenameLabel.textContent = example.filename;
            }

            // Registrar en consola
            window.TinyConsole.info(`Ejemplo cargado: "${example.title}" (${example.filename})`);
        }
    });
}
