/**
 * Módulo Validador Sintáctico y Semántico de Tiny++ para el IDE
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Detección estricta de errores para navegación interactiva
 */

const TinyValidator = {
    validate(sourceCode) {
        const errors = [];
        const lines = sourceCode.split('\n');

        // 1. Verificación de comentarios multilinea no cerrados
        let inComment = false;
        let commentStartLine = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (let c = 0; c < line.length; c++) {
                if (!inComment && line[c] === '{') {
                    inComment = true;
                    commentStartLine = i + 1;
                } else if (inComment && line[c] === '}') {
                    inComment = false;
                }
            }
        }
        if (inComment) {
            errors.push({
                line: commentStartLine,
                message: `Error sintáctico: Comentario sin cerrar iniciado en la línea ${commentStartLine}. Falta '}'`
            });
        }

        // 2. Registro de símbolos declarados y tipos
        const declaredSymbols = new Map(); // name -> type
        // Palabras clave y funciones integradas
        const builtins = new Set([
            'if', 'then', 'else', 'end', 'repeat', 'until', 'while', 'do',
            'read', 'write', 'procedure', 'function', 'return', 'begin', 'program',
            'true', 'false', 'int', 'bool', 'string', 'void'
        ]);

        // Primera pasada: recolectar declaraciones (int a, b; bool flag; int fun(int x);)
        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            // Remover comentarios entre llaves de la línea para análisis
            const cleanLine = lines[i].replace(/\{[^}]*\}/g, '').trim();
            if (!cleanLine) continue;

            // Coincidir declaraciones de variables simples o arreglos: int a, b; o bool activo; o int A[10];
            const declMatch = cleanLine.match(/^(int|bool|string)\s+([^;()]+);/);
            if (declMatch) {
                const type = declMatch[1];
                const rawVars = declMatch[2].split(',');
                rawVars.forEach(v => {
                    const varName = v.trim().replace(/\[.*\]/, '').trim();
                    if (varName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
                        declaredSymbols.set(varName, type);
                    }
                });
            }

            // Coincidir encabezado de funciones: int factorial(int n)
            const funcMatch = cleanLine.match(/^(?:int|bool|string|void)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
            if (funcMatch) {
                const funcName = funcMatch[1];
                if (!builtins.has(funcName)) {
                    declaredSymbols.set(funcName, 'function');
                }
                // Registrar parámetros formales
                const params = funcMatch[2].split(',');
                params.forEach(p => {
                    const pMatch = p.trim().match(/^(int|bool|string)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (pMatch) {
                        declaredSymbols.set(pMatch[2], pMatch[1]);
                    }
                });
            }
        }

        // Segunda pasada: verificación de uso de identificadores y tipos
        let insideFunctionOrBlock = false;
        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const cleanLine = lines[i].replace(/\{[^}]*\}/g, '').trim();
            if (!cleanLine) continue;

            // Comprobar asignaciones: <var> := <expr>
            const assignMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:\[[^\]]+\])?)\s*:=\s*(.+?);?$/);
            if (assignMatch) {
                const targetRaw = assignMatch[1].replace(/\[.*\]/, '').trim();
                const expr = assignMatch[2];

                // Verificar que la variable destino esté declarada
                if (!declaredSymbols.has(targetRaw) && !builtins.has(targetRaw)) {
                    errors.push({
                        line: lineNum,
                        message: `Error semántico en Línea ${lineNum}: La variable '${targetRaw}' no ha sido declarada previamente.`
                    });
                }

                // Incompatibilidad de tipos común: sumar booleano a entero (ej: b := a + activo)
                for (const [varName, varType] of declaredSymbols.entries()) {
                    if (varType === 'bool') {
                        // Si una variable booleana aparece en una suma o multiplicación (+)
                        const regexBoolInArithmetic = new RegExp(`[+\\-*\\/]\\s*\\b${varName}\\b|\\b${varName}\\b\\s*[+\\-*\\/]`);
                        if (regexBoolInArithmetic.test(expr)) {
                            errors.push({
                                line: lineNum,
                                message: `Error semántico en Línea ${lineNum}: Incompatibilidad de tipos en '+'. No se puede operar tipo 'int' con 'bool' ('${varName}').`
                            });
                        }
                    }
                }
            }

            // Comprobar variables en lectura: read <var>;
            const readMatch = cleanLine.match(/^read\s+([a-zA-Z_][a-zA-Z0-9_]*);/);
            if (readMatch) {
                const varName = readMatch[1];
                if (!declaredSymbols.has(varName) && !builtins.has(varName)) {
                    errors.push({
                        line: lineNum,
                        message: `Error semántico en Línea ${lineNum}: La variable '${varName}' en instrucción 'read' no ha sido declarada.`
                    });
                }
            }
        }

        return errors;
    }
};

window.TinyValidator = TinyValidator;
