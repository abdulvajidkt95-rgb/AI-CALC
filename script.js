(function () {
    let currentInput = '0';
    let prevOperation = '';
    let isDark = false;
    let physMode = '';
    let history = JSON.parse(localStorage.getItem('aic-history') || '[]');

    const SPEED_OF_LIGHT = 299792458;

    function updateDisplay() {
        const curEl = document.getElementById('current-value');
        const prevEl = document.getElementById('prev-operation');
        if (curEl) curEl.innerText = currentInput;
        if (prevEl) prevEl.innerText = prevOperation;
    }

    window.appendNumber = function (n) {
        if (currentInput === '0' || currentInput === 'Error') currentInput = n;
        else if (n === '.' && currentInput.includes('.')) return;
        else currentInput += n;
        updateDisplay();
    };

    window.appendOperator = function (op) {
        const last = currentInput.slice(-1);
        if (['+', '-', '*', '/', '%'].includes(last)) currentInput = currentInput.slice(0, -1) + op;
        else currentInput += op;
        updateDisplay();
    };

    window.calculate = function () {
        try {
            let expression = currentInput.replace(/×/g, '*').replace(/÷/g, '/');
            let res = eval(expression);
            res = Number.isInteger(res) ? res : parseFloat(res.toFixed(8));
            logHistory(currentInput, res);
            prevOperation = currentInput + ' =';
            currentInput = res.toString();
        } catch (e) { currentInput = 'Error'; }
        updateDisplay();
    };

    window.clearAll = function () { currentInput = '0'; prevOperation = ''; updateDisplay(); };

    window.deleteLast = function () {
        currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
        updateDisplay();
    };

    window.mathFunc = function (f) {
        let v = parseFloat(currentInput);
        let res;
        if (f === 'sin') res = Math.sin(v * Math.PI / 180);
        if (f === 'cos') res = Math.cos(v * Math.PI / 180);
        if (f === 'tan') res = Math.tan(v * Math.PI / 180);
        if (f === 'sqrt') res = Math.sqrt(v);

        if (res !== undefined) {
            currentInput = res.toFixed(6).replace(/\.?0+$/, "");
            updateDisplay();
        }
    };

    // Physics Logic
    window.calcGamma = function () {
        let v = parseFloat(document.getElementById('phys-v').value);
        if (isNaN(v)) return;
        if (v >= SPEED_OF_LIGHT) { currentInput = "Error (v >= c)"; updateDisplay(); return; }
        let g = 1 / Math.sqrt(1 - Math.pow(v / SPEED_OF_LIGHT, 2));
        currentInput = g.toFixed(10);
        prevOperation = `Lorentz Factor (γ) for ${v} m/s`;
        logHistory(prevOperation, currentInput);
        updateDisplay();
    };

    window.calcEta = function () {
        let win = parseFloat(document.getElementById('phys-win').value);
        let wout = parseFloat(document.getElementById('phys-wout').value);
        if (isNaN(win) || isNaN(wout) || win === 0) return;
        let eta = (wout / win) * 100;
        currentInput = eta.toFixed(2) + "%";
        prevOperation = `Efficiency (η) | Win:${win} Wout:${wout}`;
        logHistory(prevOperation, currentInput);
        updateDisplay();
    };

    window.setPhysMode = function (m) {
        physMode = m;
        const area = document.getElementById('phys-input-area');
        const title = document.getElementById('phys-title');
        const fields = document.getElementById('phys-fields');
        area.classList.remove('hidden');
        fields.innerHTML = '';

        if (m === 'ke') {
            title.innerText = "Kinetic Energy (1/2 mv²)";
            fields.innerHTML = `<input id="p1" type="number" placeholder="Mass (kg)" class="w-full p-3 rounded-lg text-slate-900"><input id="p2" type="number" placeholder="Velocity (m/s)" class="w-full p-3 rounded-lg text-slate-900">`;
        } else if (m === 'force') {
            title.innerText = "Force (Newton's 2nd Law)";
            fields.innerHTML = `<input id="p1" type="number" placeholder="Mass (kg)" class="w-full p-3 rounded-lg text-slate-900"><input id="p2" type="number" placeholder="Acceleration (m/s²)" class="w-full p-3 rounded-lg text-slate-900">`;
        } else if (m === 'wave') {
            title.innerText = "Wavelength (λ = v/f)";
            fields.innerHTML = `<input id="p1" type="number" placeholder="Velocity (m/s)" class="w-full p-3 rounded-lg text-slate-900"><input id="p2" type="number" placeholder="Frequency (Hz)" class="w-full p-3 rounded-lg text-slate-900">`;
        }
    };

    window.executePhysics = function () {
        let p1 = parseFloat(document.getElementById('p1').value);
        let p2 = parseFloat(document.getElementById('p2').value);
        if (isNaN(p1) || isNaN(p2)) return;
        let res, label;

        if (physMode === 'ke') { res = 0.5 * p1 * Math.pow(p2, 2); label = "K.E (Joules)"; }
        if (physMode === 'force') { res = p1 * p2; label = "Force (Newtons)"; }
        if (physMode === 'wave') { res = p1 / p2; label = "Wavelength (m)"; }

        currentInput = res.toString();
        prevOperation = label;
        logHistory(label, res);
        updateDisplay();
    };

    // Converter Logic
    const units = {
        length: { m: 1, km: 1000, mile: 1609.34, lightyear: 9.461e15 },
        weight: { kg: 1, g: 0.001, lb: 0.4535, solar_mass: 1.989e30 },
        energy: { joule: 1, ev: 1.602e-19, calorie: 4.184 }
    };

    window.updateUnits = function () {
        const cat = document.getElementById('conv-cat').value;
        const fromS = document.getElementById('c-from');
        const toS = document.getElementById('c-to');
        fromS.innerHTML = toS.innerHTML = '';
        Object.keys(units[cat]).forEach(u => {
            fromS.add(new Option(u, u));
            toS.add(new Option(u, u));
        });
        toS.selectedIndex = 1;
        window.runConv();
    };

    window.runConv = function () {
        const cat = document.getElementById('conv-cat').value;
        const val = parseFloat(document.getElementById('c-input').value) || 0;
        const from = document.getElementById('c-from').value;
        const to = document.getElementById('c-to').value;
        const res = (val * units[cat][from]) / units[cat][to];
        document.getElementById('c-output').innerText = res.toExponential(4);
    };

    window.switchTab = function (t) {
        ['scientific', 'physics', 'converter', 'ai'].forEach(p => {
            const panel = document.getElementById(`panel-${p}`);
            const tab = document.getElementById(`tab-${p}`);
            if (panel) panel.classList.add('hidden');
            if (tab) {
                tab.classList.remove('active', 'bg-indigo-600', 'text-white');
                tab.classList.add('bg-white', 'dark:bg-gray-900/50', 'text-slate-500');
            }
        });
        const activePanel = document.getElementById(`panel-${t}`);
        const activeTab = document.getElementById(`tab-${t}`);
        if (activePanel) activePanel.classList.remove('hidden');
        if (activeTab) {
            activeTab.classList.add('active', 'bg-indigo-600', 'text-white');
            activeTab.classList.remove('bg-white', 'dark:bg-gray-900/50', 'text-slate-500');
        }
    };

    window.toggleDarkMode = function () {
        isDark = !isDark;
        document.documentElement.classList.toggle('dark');
        document.getElementById('mode-text').innerText = isDark ? 'Light Mode' : 'Dark Mode';
        const iconD = document.getElementById('theme-icon-desktop');
        const iconM = document.getElementById('theme-icon-mobile');
        iconD.className = isDark ? 'fas fa-sun text-amber-400' : 'fas fa-moon text-indigo-500';
        iconM.className = isDark ? 'fas fa-sun text-amber-400' : 'fas fa-moon';
    };

    window.neuralProcess = function () {
        const q = document.getElementById("aiQ").value.trim();
        const loader = document.getElementById("neural-loader");
        const resContainer = document.getElementById("aiRes-container");
        const resPath = document.getElementById("aiRes-path");
        const defaultView = document.getElementById("ai-default-view");

        if (!q) return;

        // UI State: Loading
        defaultView.classList.add('hidden');
        resContainer.classList.add('hidden');
        loader.classList.remove('hidden');

        setTimeout(() => {
            let result = solveProblem(q.toLowerCase());

            resPath.innerHTML = result.path.map(step => `
                <div class="animate-fade-in">
                    <p class="text-[10px] font-black uppercase text-indigo-500/50 mb-1">${step.label}</p>
                    <p class="text-sm md:text-base font-bold dark:text-white leading-relaxed">${step.content}</p>
                </div>
            `).join('<div class="h-px bg-slate-200 dark:bg-gray-800 my-4"></div>');

            loader.classList.add('hidden');
            resContainer.classList.remove('hidden');
            logHistory("AI Solve: " + q.substring(0, 15) + "...", result.final);
        }, 800);
    };

    function solveProblem(q) {
        // Physics Solver Logic
        const physicsRules = [
            { reg: /force.*(\d+).*kg.*(\d+).*m\/s\^2/, label: "Dynamics (F=ma)", solve: (m, a) => ({ steps: ["Identified Mass (m) = " + m + "kg", "Identified Acceleration (a) = " + a + "m/s²", "Applying Newton's Second Law: F = m × a", "Calculation: " + m + " × " + a + " = " + (m * a) + " Newtons"], res: (m * a) + " N" }) },
            { reg: /speed.*(\d+).*m.*(\d+).*s/, label: "Kinematics (v=d/t)", solve: (d, t) => ({ steps: ["Identified Distance (d) = " + d + "m", "Identified Time (t) = " + t + "s", "Applying Velocity Formula: v = d / t", "Calculation: " + d + " / " + t + " = " + (d / t) + " m/s"], res: (d / t) + " m/s" }) },
            { reg: /energy.*(\d+).*kg.*(\d+).*m\/s/, label: "Kinetic Energy (E=1/2mv²)", solve: (m, v) => ({ steps: ["Identified Mass (m) = " + m + "kg", "Identified Velocity (v) = " + v + "m/s", "Applying K.E Formula: E = ½mv²", "Calculation: ½ × " + m + " × (" + v + ")² = " + (0.5 * m * v * v) + " Joules"], res: (0.5 * m * v * v) + " J" }) }
        ];

        for (let rule of physicsRules) {
            let match = q.match(rule.reg);
            if (match) {
                let s = rule.solve(parseFloat(match[1]), parseFloat(match[2]));
                return { path: s.steps.map((content, i) => ({ label: i === s.steps.length - 1 ? "Result" : "Step " + (i + 1), content })), final: s.res };
            }
        }

        // Math.js Solver Logic (Advanced Math)
        try {
            let cleanQ = q.replace(/solve|what is|calculate/g, '').trim();
            let mode = "evaluation";
            let path = [];

            if (cleanQ.includes("deriv")) {
                mode = "calculus";
                let exprMatch = cleanQ.match(/deriv\((.*)\)/);
                if (exprMatch) {
                    let expr = exprMatch[1];
                    let res = math.derivative(expr, 'x').toString();
                    path.push({ label: "Objective", content: "Calculate Derivative of " + expr + " with respect to x." });
                    path.push({ label: "Rule Applied", content: "Power rule / Chain rule differentiation." });
                    path.push({ label: "Calculus Path", content: "d/dx[" + expr + "] = " + res });
                    return { path, final: res };
                }
            }

            let res = math.evaluate(cleanQ);
            path.push({ label: "Analysis", content: "Parsing mathematical expression: " + cleanQ });
            path.push({ label: "Process", content: "Executing standard algebraic computation using Math.js engine." });
            path.push({ label: "Solution", content: "The evaluated result is " + res });
            return { path, final: res.toString() };

        } catch (e) {
            return {
                path: [{ label: "Error", content: "Neural processor could not parse this request." }, { label: "Tip", content: "Try queries like 'force for 10kg at 5m/s²' or 'sin(45) * log(10)'" }],
                final: "Error"
            };
        }
    }

    function logHistory(op, res) {
        history.unshift({ op, res, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        if (history.length > 20) history.pop();
        localStorage.setItem('aic-history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const list = document.getElementById('history-list');
        if (!list) return;
        if (!history.length) { list.innerHTML = `<p class="text-[10px] text-center py-10 opacity-30 font-bold uppercase">Empty</p>`; return; }
        list.innerHTML = history.map(i => `
            <div class="p-3 bg-white dark:bg-gray-800/40 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <p class="text-[8px] font-black text-indigo-500 mb-1">${i.time}</p>
                <p class="text-[10px] text-slate-400 truncate mb-1">${i.op}</p>
                <p class="text-xs font-black dark:text-white">${i.res}</p>
            </div>
        `).join('');
    }

    window.clearHistory = function () { history = []; localStorage.removeItem('aic-history'); renderHistory(); };

    window.addEventListener('load', () => {
        renderHistory();
        window.updateUnits();
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) window.toggleDarkMode();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') window.appendNumber(e.key);
        if (['+', '-', '*', '/'].includes(e.key)) window.appendOperator(e.key);
        if (e.key === 'Enter') window.calculate();
        if (e.key === 'Backspace') window.deleteLast();
        if (e.key === 'Escape') window.clearAll();
    });

})();
