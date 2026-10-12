/**
 * Tiny++ Studio IDE - Punto de Entrada y Orquestador Principal
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Arquitectura Modular
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar módulos independientes
    window.TinyEditor.init();
    window.TinyConsole.init();
    window.TinyDebuggerUI.init();

    console.log('%c[Tiny++ Studio]%c IDE inicializado con éxito (Arquitectura Modular - Henyer Molina)', 
        'color: #38bdf8; font-weight: bold;', 
        'color: #10b981;');
});
