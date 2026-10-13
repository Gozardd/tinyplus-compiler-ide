/**
 * Módulo de Control del Editor de Código Tiny++ con Resaltado y Navegación
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Características:
 * - Capa sincronizada de resaltado léxico para Tiny++
 * - Gutter con numeración de líneas e indicadores de error
 * - Navegación instantánea al código infractor desde la consola
 * - Marcador visual con animación pulse para líneas con error
 * - Soporte de tabulación y seguimiento de cursor
 */

const TinyEditor = {
    LINE_HEIGHT: 22,
    PADDING_TOP: 12,

    init() {
        this.editor = document.getElementById('code-editor');
        this.lineNumbers = document.getElementById('line-numbers');
        this.cursorPos = document.getElementById('cursor-pos');
        this.highlightLayer = document.getElementById('code-highlight-layer');
        this.highlightCode = document.getElementById('code-highlight-content');
        this.errorMarker = document.getElementById('error-line-marker');
        this.activeErrorLine = null;

        if (!this.editor) return;

        this.setupEventListeners();
        this.update();
    },

    setupEventListeners() {
        // Entrada de texto y edición
        this.editor.addEventListener('input', () => {
            this.update();
            this.clearErrorHighlight();
        });

        // Sincronización de desplazamiento (scroll)
        this.editor.addEventListener('scroll', () => {
            if (this.highlightLayer) {
                this.highlightLayer.scrollTop = this.editor.scrollTop;
                this.highlightLayer.scrollLeft = this.editor.scrollLeft;
            }
            if (this.lineNumbers) {
                this.lineNumbers.scrollTop = this.editor.scrollTop;
            }
            this.updateErrorMarkerPosition();
        });

        // Rastreo de posición de cursor
        const updateCursor = () => this.updateCursorTracker();
        this.editor.addEventListener('keyup', updateCursor);
        this.editor.addEventListener('click', updateCursor);

        // Tecla Tab para sangría cómoda de 4 espacios
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.editor.selectionStart;
                const end = this.editor.selectionEnd;
                this.editor.value = this.editor.value.substring(0, start) + '    ' + this.editor.value.substring(end);
                this.editor.selectionStart = this.editor.selectionEnd = start + 4;
                this.update();
            }
        });
    },

    /**
     * Actualiza tanto la capa de resaltado sintáctico como la numeración de líneas
     */
    update() {
        const text = this.editor.value;

        // 1. Resaltado de sintaxis Tiny++
        if (this.highlightCode && window.TinyHighlighter) {
            this.highlightCode.innerHTML = window.TinyHighlighter.highlight(text);
        }

        // 2. Numeración de líneas
        if (this.lineNumbers) {
            const lineCount = text.split('\n').length;
            let html = '';
            for (let i = 1; i <= lineCount; i++) {
                const isError = this.activeErrorLine === i;
                html += `<div class="line-num ${isError ? 'error' : ''}" data-line="${i}">${i}</div>`;
            }
            this.lineNumbers.innerHTML = html;
        }

        // 3. Sincronizar scroll de las capas
        if (this.highlightLayer) {
            this.highlightLayer.scrollTop = this.editor.scrollTop;
            this.highlightLayer.scrollLeft = this.editor.scrollLeft;
        }
        if (this.lineNumbers) {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
        }

        this.updateCursorTracker();
        this.updateErrorMarkerPosition();
    },

    updateCursorTracker() {
        if (!this.cursorPos || !this.editor) return;
        const textBeforeCursor = this.editor.value.substring(0, this.editor.selectionStart);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const currentCol = lines[lines.length - 1].length + 1;
        this.cursorPos.textContent = `Lín: ${currentLine}, Col: ${currentCol}`;
    },

    /**
     * Mueve el foco y cursor a una línea específica y resalta visualmente el error
     * @param {number} lineNumber - Línea 1-indexed
     */
    goToLine(lineNumber) {
        if (!this.editor) return;
        const lines = this.editor.value.split('\n');
        const totalLines = lines.length;

        if (lineNumber < 1 || lineNumber > totalLines) return;

        // Calcular posición de inicio y fin en caracteres
        let startIndex = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
            startIndex += lines[i].length + 1; // +1 por '\n'
        }
        const lineContentLength = lines[lineNumber - 1].length;

        // Enfocar el editor y seleccionar la línea infractora
        this.editor.focus();
        this.editor.setSelectionRange(startIndex, startIndex + lineContentLength);

        // Desplazamiento suave para centrar la línea en el viewport
        const targetScroll = Math.max(0, (lineNumber - 3) * this.LINE_HEIGHT);
        this.editor.scrollTop = targetScroll;

        // Activar marcador visual de error
        this.highlightErrorLine(lineNumber);
        this.updateCursorTracker();
    },

    /**
     * Activa el indicador y resplandor de error en una línea dada
     * @param {number} lineNumber - Línea donde ocurrió el error
     */
    highlightErrorLine(lineNumber) {
        this.activeErrorLine = lineNumber;

        // Marcar en la numeración de líneas
        if (this.lineNumbers) {
            const lineElements = this.lineNumbers.querySelectorAll('.line-num');
            lineElements.forEach(el => {
                const line = parseInt(el.getAttribute('data-line'), 10);
                if (line === lineNumber) {
                    el.classList.add('error');
                } else {
                    el.classList.remove('error');
                }
            });
        }

        // Posicionar el marcador visual animado
        this.updateErrorMarkerPosition();

        if (this.errorMarker) {
            this.errorMarker.classList.add('active');
        }
    },

    updateErrorMarkerPosition() {
        if (!this.errorMarker || !this.activeErrorLine) return;

        const top = this.PADDING_TOP + (this.activeErrorLine - 1) * this.LINE_HEIGHT - this.editor.scrollTop;
        this.errorMarker.style.top = `${top}px`;

        if (top < -this.LINE_HEIGHT || top > this.editor.clientHeight) {
            this.errorMarker.style.display = 'none';
        } else {
            this.errorMarker.style.display = 'block';
        }
    },

    clearErrorHighlight() {
        this.activeErrorLine = null;
        if (this.errorMarker) {
            this.errorMarker.classList.remove('active');
            this.errorMarker.style.display = 'none';
        }
        if (this.lineNumbers) {
            const errorItems = this.lineNumbers.querySelectorAll('.line-num.error');
            errorItems.forEach(el => el.classList.remove('error'));
        }
    },

    getValue() {
        return this.editor ? this.editor.value : '';
    },

    setValue(text) {
        if (this.editor) {
            this.editor.value = text;
            this.clearErrorHighlight();
            this.update();
            this.editor.scrollTop = 0;
            this.editor.scrollLeft = 0;
        }
    }
};

window.TinyEditor = TinyEditor;
