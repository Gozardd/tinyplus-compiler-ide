/**
 * Módulo de Resaltado de Sintaxis para Tiny++
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Motor léxico optimizado para el lenguaje Tiny++
 */

const TinyHighlighter = {
    // Expresión regular que tokeniza el lenguaje Tiny++ en una sola pasada ordenada
    // 1: Comentarios { ... } o // ...
    // 2: Cadenas de caracteres "..."
    // 3: Tipos de datos primitivos (int, bool, string, void)
    // 4: Literales booleanos (true, false)
    // 5: Palabras clave reservadas (if, then, else, end, repeat, until, while, do, read, write, procedure, function, return, begin, program)
    // 6: Literales numéricos enteros
    // 7: Operadores aritméticos, relacionales y de asignación (:=, <=, >=, !=, ==, +, -, *, /, <, >, =)
    // 8: Puntuación y delimitadores (; , : ( ) [ ])
    // 9: Identificadores de variables y funciones
    tokenRegex: /(\{[^}]*\}?|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b(?:int|bool|string|void)\b)|(\b(?:true|false)\b)|(\b(?:if|then|else|end|repeat|until|while|do|read|write|procedure|function|return|begin|program)\b)|(\b\d+\b)|(:=|<=|>=|!=|==|[+\-*\/=<>]|\b(?:and|or|not)\b)|([;:,()\[\]])|([a-zA-Z_][a-zA-Z0-9_]*)/g,

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    /**
     * Resalta el código fuente y genera HTML con spans estilizados
     * @param {string} code - Código fuente en texto plano
     * @returns {string} - Código HTML con clases de sintaxis
     */
    highlight(code) {
        if (!code) return '<br>';

        let lastIndex = 0;
        let html = '';
        this.tokenRegex.lastIndex = 0;
        let match;

        while ((match = this.tokenRegex.exec(code)) !== null) {
            // Texto sin tokenizar entre coincidencias (espacios, saltos de línea, tabulaciones)
            if (match.index > lastIndex) {
                html += this.escapeHtml(code.slice(lastIndex, match.index));
            }

            const [
                fullMatch,
                comment,
                str,
                type,
                boolean,
                keyword,
                number,
                operator,
                punctuation,
                identifier
            ] = match;

            const escaped = this.escapeHtml(fullMatch);

            if (comment !== undefined) {
                html += `<span class="tok-comment">${escaped}</span>`;
            } else if (str !== undefined) {
                html += `<span class="tok-string">${escaped}</span>`;
            } else if (type !== undefined) {
                html += `<span class="tok-type">${escaped}</span>`;
            } else if (boolean !== undefined) {
                html += `<span class="tok-bool">${escaped}</span>`;
            } else if (keyword !== undefined) {
                html += `<span class="tok-kw">${escaped}</span>`;
            } else if (number !== undefined) {
                html += `<span class="tok-num">${escaped}</span>`;
            } else if (operator !== undefined) {
                html += `<span class="tok-op">${escaped}</span>`;
            } else if (punctuation !== undefined) {
                html += `<span class="tok-punct">${escaped}</span>`;
            } else if (identifier !== undefined) {
                html += `<span class="tok-id">${escaped}</span>`;
            } else {
                html += escaped;
            }

            lastIndex = this.tokenRegex.lastIndex;
        }

        // Remanente final después del último token
        if (lastIndex < code.length) {
            html += this.escapeHtml(code.slice(lastIndex));
        }

        // Si el código termina en salto de línea, se agrega un espacio para que el cursor y el pre no se desfasen
        if (code.endsWith('\n')) {
            html += ' ';
        }

        return html;
    }
};

window.TinyHighlighter = TinyHighlighter;
