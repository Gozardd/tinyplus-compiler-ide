/**
 * Módulo Validador Sintáctico y Semántico de Tiny++ para el IDE
 * Autor: Henyer Molina (Módulo 4) - UNET 2026
 * Detección estricta de errores para navegación interactiva
 */

const TinyValidator = {
    validate(sourceCode) {
        const errors = [];
        const lines = sourceCode.split('\n');

        // 1. Verificación de comentarios multilínea no cerrados
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

        // Primera pasada: recolectar declaraciones de variables y subrutinas
        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const cleanLine = lines[i].replace(/\{[^}]*\}/g, '').trim();
            if (!cleanLine) continue;

            // Declaraciones de subrutinas Tiny++: function f(int x): int  o  procedure p(string msg)
            const subMatch = cleanLine.match(/^(?:function|procedure)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)(?:\s*:\s*(int|bool|string))?/);
            if (subMatch) {
                const subName = subMatch[1];
                const retType = subMatch[3] || 'void';
                declaredSymbols.set(subName, 'function');

                // Registrar parámetros formales
                const params = subMatch[2].split(',');
                params.forEach(p => {
                    const pMatch = p.trim().match(/^(int|bool|string)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (pMatch) {
                        declaredSymbols.set(pMatch[2], pMatch[1]);
                    }
                });
                continue;
            }

            // Encabezados estilo C/Pascal por compatibilidad: int factorial(int n)
            const funcMatch = cleanLine.match(/^(?:int|bool|string|void)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
            if (funcMatch) {
                const funcName = funcMatch[1];
                if (!builtins.has(funcName)) {
                    declaredSymbols.set(funcName, 'function');
                }
                const params = funcMatch[2].split(',');
                params.forEach(p => {
                    const pMatch = p.trim().match(/^(int|bool|string)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (pMatch) {
                        declaredSymbols.set(pMatch[2], pMatch[1]);
                    }
                });
                continue;
            }

            // Declaraciones de variables simples o arreglos: int a; bool activo; int A[10]; int a, b;
            const declMatch = cleanLine.match(/^(int|bool|string)\s+([^;()]+);?/);
            if (declMatch) {
                const type = declMatch[1];
                const rawVars = declMatch[2].split(',');
                rawVars.forEach(v => {
                    const varName = v.trim().replace(/\[.*\]/, '').trim();
                    if (varName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName) && !builtins.has(varName)) {
                        declaredSymbols.set(varName, type);
                    }
                });
            }
        }

        // Segunda pasada: verificación semántica de uso de identificadores y tipos
        for (let i = 0; i < lines.length; i++) {
            const lineNum = i + 1;
            const cleanLine = lines[i].replace(/\{[^}]*\}/g, '').trim();
            if (!cleanLine) continue;

            // Saltar líneas que son únicamente declaraciones o encabezados
            if (/^(?:function|procedure|int|bool|string)\b/.test(cleanLine)) continue;

            // Comprobar asignaciones: <var> := <expr>  o  <arr>[i] := <expr>
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

                // Incompatibilidad de tipos en operaciones aritméticas (+, -, *, /) con booleanos
                for (const [varName, varType] of declaredSymbols.entries()) {
                    if (varType === 'bool') {
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

            // Comprobar llamadas a procedimientos como sentencias: reportar(...)
            const callMatch = cleanLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\);?$/);
            if (callMatch) {
                const procName = callMatch[1];
                if (!declaredSymbols.has(procName) && !builtins.has(procName)) {
                    errors.push({
                        line: lineNum,
                        message: `Error semántico en Línea ${lineNum}: La subrutina '${procName}' no ha sido declarada.`
                    });
                }
            }

            // Comprobar variables en instrucción read: read <var>;
            const readMatch = cleanLine.match(/^read\s+([a-zA-Z_][a-zA-Z0-9_]*);?/);
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
