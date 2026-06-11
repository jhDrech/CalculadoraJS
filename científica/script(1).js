// ── Referências ao DOM ──────────────────────────────────────────────────────
const resEl  = document.getElementById('result');
const exprEl = document.getElementById('expr');

// ── Estado da calculadora ───────────────────────────────────────────────────
let cur       = '0';   // número visível no display
let prev      = '';    // primeiro operando (aguardando operação)
let op        = null;  // operador pendente
let freshOp   = false; // true logo após pressionar um operador
let justCalc  = false; // true logo após pressionar "="

// ── Funções auxiliares ──────────────────────────────────────────────────────

/**
 * Atualiza o display com o valor atual.
 * Reduz a fonte quando o número é muito longo.
 */
function updateDisplay() {
  resEl.textContent = cur;
  resEl.className   = 'result' + (cur.length > 9 ? ' small' : '');
}

/**
 * Formata um número removendo imprecisões de ponto flutuante.
 * Ex: 0.1 + 0.2 → 0.3 (e não 0.30000000000000004)
 */
function fmt(n) {
  if (!isFinite(n)) return String(n); // "Infinity" ou "NaN"
  return String(parseFloat(n.toPrecision(10)));
}

/**
 * Converte graus → radianos (usado internamente pelas funções trig).
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Converte radianos → graus (usado pelas funções trig inversas).
 */
function toDeg(rad) {
  return rad * (180 / Math.PI);
}

/**
 * Calcula o fatorial de n (inteiro não-negativo).
 * Retorna NaN para negativos e Infinity para n > 170.
 */
function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/**
 * Executa o cálculo com base nos operandos (prev, cur) e no operador (op).
 *
 * Operações binárias disponíveis:
 *   +     → adição
 *   −     → subtração
 *   ×     → multiplicação
 *   ÷     → divisão
 *   xʸ    → potenciação         (prev ^ cur)
 *   x%y   → divisão inteira     (Math.trunc(prev / cur))
 *   logₙ  → logaritmo base cur  (log(prev) / log(cur))
 *   ʸ√x   → radiciação          (prev ^ (1 / cur))  →  raiz cur-ésima de prev
 */
function calculate() {
  const p = parseFloat(prev);
  const c = parseFloat(cur);

  switch (op) {
    case '+':    return p + c;
    case '−':    return p - c;
    case '×':    return p * c;
    case '÷':    return p / c;
    case 'xʸ':   return Math.pow(p, c);
    case 'x%y':  return p % c;
    case 'logₙ': return Math.log(p) / Math.log(c);
    case 'ʸ√x':  return Math.pow(p, 1 / c);
    default:     return p + c;
  }
}

/**
 * Executa uma função científica unária sobre o número atual (cur).
 *
 * Funções disponíveis:
 *   sin   → seno (entrada em graus)
 *   cos   → cosseno (entrada em graus)
 *   tan   → tangente (entrada em graus)
 *   asin  → arco-seno, resultado em graus
 *   acos  → arco-cosseno, resultado em graus
 *   atan  → arco-tangente, resultado em graus
 *   fact  → fatorial (n!)
 *   ln    → logaritmo natural (base e)
 *   log10 → logaritmo base 10
 *   exp   → e elevado a x
 */
function applyUnary(fn) {
  const x = parseFloat(cur);
  let label = '';   // o que aparece na linha de expressão
  let result;

  switch (fn) {
    case 'sin':
      label  = `sin(${x}°)`;
      result = Math.sin(toRad(x));
      break;
    case 'cos':
      label  = `cos(${x}°)`;
      result = Math.cos(toRad(x));
      break;
    case 'tan':
      label  = `tan(${x}°)`;
      result = Math.tan(toRad(x));
      break;
    case 'asin':
      label  = `sin⁻¹(${x})`;
      result = toDeg(Math.asin(x));   // resultado em graus
      break;
    case 'acos':
      label  = `cos⁻¹(${x})`;
      result = toDeg(Math.acos(x));
      break;
    case 'atan':
      label  = `tan⁻¹(${x})`;
      result = toDeg(Math.atan(x));
      break;
    case 'fact':
      label  = `${x}!`;
      result = factorial(x);
      break;
    case 'ln':
      label  = `ln(${x})`;
      result = Math.log(x);
      break;
    case 'log10':
      label  = `log(${x})`;
      result = Math.log10(x);
      break;
    case 'exp':
      label  = `e^(${x})`;
      result = Math.exp(x);
      break;
    default:
      return;
  }

  exprEl.textContent = label + ' =';
  cur      = fmt(result);
  justCalc = true;
  freshOp  = false;
  updateDisplay();
}

// ── Listeners dos botões ────────────────────────────────────────────────────
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const val    = btn.dataset.val;

    // Dígito (0–9)
    if (action === 'num') {
      if (freshOp || justCalc) {
        cur = val;
        freshOp  = false;
        justCalc = false;
      } else {
        if (cur === '0' && val !== '.') cur = val;
        else if (cur.length < 12) cur += val;
      }

    // Ponto decimal
    } else if (action === 'dot') {
      if (freshOp || justCalc) {
        cur = '0.';
        freshOp  = false;
        justCalc = false;
      } else if (!cur.includes('.')) {
        cur += '.';
      }

    // Limpar tudo (AC)
    } else if (action === 'clear') {
      cur  = '0';
      prev = '';
      op   = null;
      freshOp  = false;
      justCalc = false;
      exprEl.textContent = '';

    // Inverter sinal (+/−)
    } else if (action === 'sign') {
      cur = String(parseFloat(cur) * -1);

    // Porcentagem (÷ 100)
    } else if (action === 'percent') {
      cur = String(parseFloat(cur) / 100);

    // Constantes matemáticas (π e e)
    } else if (action === 'const') {
      const value = val === 'pi' ? Math.PI : Math.E;
      cur      = fmt(value);
      justCalc = false;
      freshOp  = false;

    // Funções científicas unárias
    } else if (action === 'unary') {
      applyUnary(val);
      return; // applyUnary já chama updateDisplay()

    // Operador binário (incluindo os avançados)
    } else if (action === 'op') {
      // Se já havia uma operação pendente, calcula antes de trocar
      if (op && !freshOp && !justCalc) {
        cur = fmt(calculate());
      }
      prev     = cur;
      op       = val;
      freshOp  = true;
      justCalc = false;
      exprEl.textContent = prev + ' ' + op;

    // Igual (=)
    } else if (action === 'eq') {
      if (!op) return;
      const resultado = calculate();
      exprEl.textContent = prev + ' ' + op + ' ' + cur + ' =';
      cur      = fmt(resultado);
      op       = null;
      freshOp  = false;
      justCalc = true;
    }

    updateDisplay();
  });
});
