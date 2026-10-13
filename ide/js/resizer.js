/**
 * Módulo de Redimensionamiento Dinámico de Paneles (Splitters / Resizers)
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Permite ajustar arrastrando el divisor central y la altura de la consola
 */

const TinyResizer = {
    init() {
        this.mainResizer = document.getElementById('resizer-main');
        this.consoleResizer = document.getElementById('resizer-console');
        this.leftPane = document.getElementById('editor-section');
        this.consolePanel = document.getElementById('console-panel');

        if (this.mainResizer && this.leftPane) {
            this.setupHorizontalResizer();
        }

        if (this.consoleResizer && this.consolePanel) {
            this.setupVerticalResizer();
        }
    },

    /**
     * Divisor Horizontal: arrastra entre el panel izquierdo (Editor) y derecho (Depurador)
     */
    setupHorizontalResizer() {
        let isDragging = false;
        let startX = 0;
        let startWidth = 0;

        const onMouseDown = (e) => {
            isDragging = true;
            startX = e.clientX;
            startWidth = this.leftPane.getBoundingClientRect().width;

            this.mainResizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const newWidth = startWidth + deltaX;

            const minWidth = 280;
            const maxWidth = window.innerWidth - 320;

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                this.leftPane.style.width = `${newWidth}px`;
                this.leftPane.style.flex = 'none';
            }

            if (window.TinyEditor && typeof window.TinyEditor.update === 'function') {
                window.TinyEditor.update();
            }
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;

            this.mainResizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (window.TinyEditor && typeof window.TinyEditor.update === 'function') {
                window.TinyEditor.update();
            }
        };

        this.mainResizer.addEventListener('mousedown', onMouseDown);
    },

    /**
     * Divisor Vertical: arrastra entre el Editor de código y la Consola inferior
     */
    setupVerticalResizer() {
        let isDragging = false;
        let startY = 0;
        let startHeight = 0;

        const onMouseDown = (e) => {
            isDragging = true;
            startY = e.clientY;
            startHeight = this.consolePanel.getBoundingClientRect().height;

            this.consoleResizer.classList.add('resizing');
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            // Al mover hacia abajo, el delta es positivo -> la consola debe encogerse
            const deltaY = e.clientY - startY;
            const newHeight = startHeight - deltaY;

            const minHeight = 32; // Cabecera colapsada
            const maxHeight = window.innerHeight - 140;

            if (newHeight >= minHeight && newHeight <= maxHeight) {
                this.consolePanel.style.height = `${newHeight}px`;
                this.consolePanel.style.flex = 'none';
            }

            if (window.TinyEditor && typeof window.TinyEditor.update === 'function') {
                window.TinyEditor.update();
            }
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;

            this.consoleResizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (window.TinyEditor && typeof window.TinyEditor.update === 'function') {
                window.TinyEditor.update();
            }
        };

        this.consoleResizer.addEventListener('mousedown', onMouseDown);
    }
};

window.TinyResizer = TinyResizer;
