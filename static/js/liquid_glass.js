/**
 * ==========================================================================
 * HydroIntel — Liquid Glass Client Engine
 * VisionOS Interactivity, Real-Time Physics, Canvas Animation & Analytics
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ----------------------------------------------------------------------
       1. Real-Time Hyderabad IST Clock
       ---------------------------------------------------------------------- */
    function initLiveClock() {
        const clockEl = document.getElementById('liveClock');
        if (!clockEl) return;

        function update() {
            const now = new Date();
            const istTime = now.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kolkata',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            clockEl.textContent = `${istTime} IST`;
        }

        setInterval(update, 1000);
        update();
    }
    initLiveClock();

    /* ----------------------------------------------------------------------
       2. Light / Dark Mode Switcher (VisionOS Theme Engine)
       ---------------------------------------------------------------------- */
    function initThemeMode() {
        const modeToggle = document.getElementById('modeToggle');
        const modeLabel = document.getElementById('modeLabel');

        function applyMode(mode) {
            if (mode === 'light') {
                document.body.setAttribute('data-mode', 'light');
                if (modeLabel) modeLabel.textContent = 'Light';
            } else {
                document.body.removeAttribute('data-mode');
                if (modeLabel) modeLabel.textContent = 'Dark';
            }
            localStorage.setItem('hydro_mode', mode);

            // Re-render chart axes in the new theme
            if (typeof window.updateChartTheme === 'function') {
                window.updateChartTheme();
            }
        }

        if (modeToggle) {
            modeToggle.addEventListener('click', () => {
                const isLight = document.body.getAttribute('data-mode') === 'light';
                applyMode(isLight ? 'dark' : 'light');
            });
        }

        const savedMode = localStorage.getItem('hydro_mode') || 'dark';
        applyMode(savedMode);
    }
    initThemeMode();

    /* ----------------------------------------------------------------------
       3. Ambient Accent Tone Switcher (Cyan, Emerald, Violet, Amber)
       ---------------------------------------------------------------------- */
    function initAccentThemes() {
        const themeDots = document.querySelectorAll('.theme-dot');
        if (!themeDots.length) return;

        function setAccent(tone) {
            if (tone === 'cyan') {
                document.body.removeAttribute('data-theme');
            } else {
                document.body.setAttribute('data-theme', tone);
            }

            themeDots.forEach(dot => {
                if (dot.dataset.t === tone) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });

            localStorage.setItem('hydro_theme', tone);
        }

        themeDots.forEach(dot => {
            dot.addEventListener('click', () => setAccent(dot.dataset.t));
        });

        const savedAccent = localStorage.getItem('hydro_theme') || 'cyan';
        setAccent(savedAccent);
    }
    initAccentThemes();

    /* ----------------------------------------------------------------------
       4. Interactive 3D Card Tilt & Specular Cursor Spotlight
       ---------------------------------------------------------------------- */
    function init3DCardTilt() {
        const tiltCards = document.querySelectorAll('.card-tilt');

        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
                card.style.setProperty('--glare-x', `${x}px`);
                card.style.setProperty('--glare-y', `${y}px`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
            });
        });
    }
    init3DCardTilt();

    /* ----------------------------------------------------------------------
       5. Hydro Click Ripple Physics
       ---------------------------------------------------------------------- */
    function initWaterRipples() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('input, select, button, a')) return;

            const ripple = document.createElement('div');
            ripple.className = 'water-ripple';
            ripple.style.left = `${e.clientX}px`;
            ripple.style.top = `${e.clientY}px`;
            document.body.appendChild(ripple);

            setTimeout(() => ripple.remove(), 700);
        });
    }
    initWaterRipples();

    /* ----------------------------------------------------------------------
       6. Custom Dropdown & Zone Mini-Cards (Homepage)
       ---------------------------------------------------------------------- */
    function initZoneSelectors() {
        const selectEl = document.getElementById('zoneSelect');
        const trigger = document.getElementById('zoneTrigger');
        const hiddenInput = document.getElementById('zoneInput');
        const triggerName = document.getElementById('triggerName');
        const triggerDot = document.getElementById('triggerDot');
        const options = document.querySelectorAll('.custom-option');
        const miniCards = document.querySelectorAll('.zone-mini-card');

        if (!selectEl || !trigger || !hiddenInput) return;

        function applyZone(zone, pop, dispatch) {
            hiddenInput.value = zone;
            triggerName.textContent = zone;
            triggerName.style.color = 'var(--text-primary)';
            triggerName.style.fontWeight = '600';
            triggerDot.style.opacity = '1';

            // Auto-fill form fields
            const popEl = document.getElementById('population');
            const tempEl = document.getElementById('temperature');
            const rainEl = document.getElementById('rainfall');
            const prevEl = document.getElementById('prev_dispatch');

            if (popEl) popEl.value = pop;
            if (tempEl) tempEl.value = 32.5;
            if (rainEl) rainEl.value = 0.0;
            if (prevEl) prevEl.value = dispatch;

            options.forEach(o => {
                o.classList.toggle('selected', o.dataset.value === zone);
            });

            miniCards.forEach(mc => {
                mc.classList.toggle('active-zone', mc.dataset.zone === zone);
            });
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            selectEl.classList.toggle('open');
        });

        options.forEach(opt => {
            opt.addEventListener('click', () => {
                applyZone(opt.dataset.value, opt.dataset.pop, opt.dataset.dispatch);
                selectEl.classList.remove('open');
            });
        });

        miniCards.forEach(mc => {
            mc.addEventListener('click', () => {
                applyZone(mc.dataset.zone, mc.dataset.pop, mc.dataset.dispatch);
            });
        });

        document.addEventListener('click', (e) => {
            if (!selectEl.contains(e.target)) {
                selectEl.classList.remove('open');
            }
        });
    }
    initZoneSelectors();

    /* ----------------------------------------------------------------------
       7. Concept 1: Neural Core & Telemetry Terminal Loader
       ---------------------------------------------------------------------- */
    function initLoadingSequence() {
        const form = document.getElementById('predictForm');
        const hiddenInput = document.getElementById('zoneInput');
        const selectEl = document.getElementById('zoneSelect');
        const overlay = document.getElementById('loadingOverlay');

        if (!form || !overlay) return;

        form.addEventListener('submit', (e) => {
            if (!hiddenInput.value) {
                e.preventDefault();
                if (selectEl) selectEl.classList.add('open');
                return;
            }

            // Sync actual submitted values to HUD pill
            const zoneVal = hiddenInput.value;
            const popVal = Number(document.getElementById('population').value || 0).toLocaleString();
            const tempVal = document.getElementById('temperature').value || '32.5';
            const rainVal = document.getElementById('rainfall').value || '0.0';

            const hudZone = document.getElementById('hudZone');
            const hudPop = document.getElementById('hudPop');
            const hudTemp = document.getElementById('hudTemp');
            const hudRain = document.getElementById('hudRain');

            if (hudZone) hudZone.textContent = `📍 ${zoneVal}`;
            if (hudPop) hudPop.textContent = `👥 ${popVal}`;
            if (hudTemp) hudTemp.textContent = `🌡️ ${tempVal}°C`;
            if (hudRain) hudRain.textContent = `🌧️ ${rainVal} mm`;

            overlay.classList.add('active');

            // Stream terminal telemetry messages
            const logsEl = document.getElementById('terminalLogs');
            const barEl = document.getElementById('loadingBar');
            const pctEl = document.getElementById('loadingPct');
            if (!logsEl) return;

            logsEl.innerHTML = '';

            const timeline = [
                { time: '0.2s', pct: 15, msg: '⚡ Calibrating Hyderabad GHMC spatial telemetry matrix...', hl: false },
                { time: '0.9s', pct: 38, msg: `🌲 Aggregating 100 Random Forest decision trees for ${zoneVal}...`, hl: 'highlight' },
                { time: '1.8s', pct: 60, msg: `🛰️ Cross-referencing rainfall (${rainVal}mm) & ambient temp (${tempVal}°C)...`, hl: false },
                { time: '2.7s', pct: 78, msg: '🧠 Establishing neural handshake with Google Gemini 3.6 Flash...', hl: 'highlight' },
                { time: '3.8s', pct: 92, msg: '📋 Synthesizing operational dispatch directives & sustainability tips...', hl: false },
                { time: '4.8s', pct: 98, msg: '✓ Forecast verified. Rendering visionOS glass telemetry dashboard...', hl: 'success' }
            ];

            timeline.forEach((item, index) => {
                setTimeout(() => {
                    if (barEl) barEl.style.width = `${item.pct}%`;
                    if (pctEl) pctEl.textContent = `${item.pct}%`;

                    const line = document.createElement('div');
                    line.className = 'term-line';
                    line.innerHTML = `<span class="term-time">[${item.time}]</span> <span class="term-msg ${item.hl || ''}">${item.msg}</span>`;
                    logsEl.appendChild(line);
                }, index * 950);
            });
        });
    }
    initLoadingSequence();

    /* ----------------------------------------------------------------------
       8. Results Page Interactive Tools (Odometer, Reservoir, Charts, Speech)
       ---------------------------------------------------------------------- */
    function initResultsPage() {
        // Smooth Number Count-Up
        function countUp(el, endVal, duration = 1200, decimals = 2) {
            let start = 0;
            let startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const current = (start + (endVal - start) * ease).toFixed(decimals);
                el.textContent = current;

                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = endVal.toFixed(decimals);
            }
            requestAnimationFrame(step);
        }

        const odo = document.getElementById('odometerVal');
        if (odo) {
            const target = parseFloat(odo.dataset.target) || 0;
            countUp(odo, target, 1200, 2);

            const tank = document.getElementById('reservoirFluid');
            if (tank) {
                setTimeout(() => {
                    const pct = Math.min(Math.max((target / 100) * 100, 15), 90);
                    tank.style.height = `${pct}%`;
                }, 200);
            }
        }

        document.querySelectorAll('.count-up').forEach(el => {
            const val = parseFloat(el.dataset.target) || 0;
            countUp(el, val, 1000, 2);
        });

        // Toast notifications helper
        const toast = document.getElementById('toastNotify');
        function showToast(msg) {
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2400);
        }

        // Copy Directives
        const btnCopy = document.getElementById('btnCopyAI');
        const aiContent = document.getElementById('aiContent');
        if (btnCopy && aiContent) {
            btnCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(aiContent.innerText).then(() => {
                    showToast('Operational Directives Copied!');
                });
            });
        }

        // Web Speech Read-Aloud
        const btnSpeak = document.getElementById('btnSpeakAI');
        const speakIcon = document.getElementById('speakIcon');
        const speakText = document.getElementById('speakText');
        let isSpeaking = false;

        if (btnSpeak && aiContent) {
            btnSpeak.addEventListener('click', () => {
                if (!('speechSynthesis' in window)) {
                    showToast('Speech synthesis not supported in this browser.');
                    return;
                }

                if (isSpeaking) {
                    window.speechSynthesis.cancel();
                    isSpeaking = false;
                    if (speakIcon) speakIcon.textContent = '🔊';
                    if (speakText) speakText.textContent = 'Listen';
                    btnSpeak.classList.remove('active');
                } else {
                    const text = aiContent.innerText;
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 1.0;
                    utterance.pitch = 1.0;

                    utterance.onend = () => {
                        isSpeaking = false;
                        if (speakIcon) speakIcon.textContent = '🔊';
                        if (speakText) speakText.textContent = 'Listen';
                        btnSpeak.classList.remove('active');
                    };

                    window.speechSynthesis.speak(utterance);
                    isSpeaking = true;
                    if (speakIcon) speakIcon.textContent = '⏹️';
                    if (speakText) speakText.textContent = 'Stop';
                    btnSpeak.classList.add('active');
                }
            });
        }

        // Gauge Chart Initialization
        const gaugeEl = document.getElementById('gaugeChart');
        if (gaugeEl && typeof Chart !== 'undefined') {
            const prediction = parseFloat(gaugeEl.dataset.prediction) || 0;
            const baseline = parseFloat(gaugeEl.dataset.baseline) || 0;
            const maxVal = Math.max(prediction, baseline) * 1.4;

            new Chart(gaugeEl.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Predicted', 'Remaining'],
                    datasets: [{
                        data: [prediction, Math.max(maxVal - prediction, 0)],
                        backgroundColor: [
                            prediction > baseline ? '#FB7185' : '#34D399',
                            document.body.getAttribute('data-mode') === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)'
                        ],
                        borderWidth: 0,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '75%',
                    rotation: -90,
                    circumference: 180,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } }
                },
                plugins: [{
                    id: 'gaugeText',
                    afterDraw(chart) {
                        const { ctx, chartArea: { left, right, bottom } } = chart;
                        const cx = (left + right) / 2;
                        const cy = bottom - 10;
                        const isLight = document.body.getAttribute('data-mode') === 'light';
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.fillStyle = prediction > baseline ? '#FB7185' : '#34D399';
                        ctx.font = '700 13px Inter';
                        ctx.fillText(prediction > baseline ? '▲ Above' : '▼ Below', cx, cy - 4);
                        ctx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.35)';
                        ctx.font = '500 11px Inter';
                        ctx.fillText('baseline', cx, cy + 12);
                        ctx.restore();
                    }
                }]
            });
        }

        // Zone Multi-View Chart (Bar & Radar)
        const zoneCanvas = document.getElementById('zoneChart');
        if (zoneCanvas && typeof Chart !== 'undefined') {
            const labels = JSON.parse(zoneCanvas.dataset.labels || '[]');
            const baselineData = JSON.parse(zoneCanvas.dataset.baselines || '[]');
            const currentZone = zoneCanvas.dataset.currentzone || '';
            const prediction = parseFloat(zoneCanvas.dataset.prediction) || 0;
            const chartData = labels.map((z, i) => z === currentZone ? prediction : baselineData[i]);

            let currentType = 'bar';
            let zoneChartInstance = null;

            function renderChart(type) {
                if (zoneChartInstance) zoneChartInstance.destroy();

                const isLight = document.body.getAttribute('data-mode') === 'light';
                const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)';
                const tickColor = isLight ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.4)';
                const barBgOther = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)';

                if (type === 'bar') {
                    zoneChartInstance = new Chart(zoneCanvas.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Dispatch (ML)',
                                data: chartData,
                                backgroundColor: labels.map(z => z === currentZone ? 'rgba(56, 189, 248, 0.8)' : barBgOther),
                                borderColor: labels.map(z => z === currentZone ? '#38BDF8' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.1)')),
                                borderWidth: 1,
                                borderRadius: 8,
                                borderSkipped: false
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    titleColor: '#38BDF8',
                                    bodyColor: 'rgba(255,255,255,0.85)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    borderWidth: 1,
                                    padding: 12,
                                    cornerRadius: 8,
                                    callbacks: { label: c => `${c.parsed.y} ML` }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: gridColor },
                                    ticks: { color: tickColor, font: { family: 'Inter', size: 11 }, callback: v => `${v} ML` }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { color: tickColor, font: { family: 'Inter', size: 12, weight: '500' } }
                                }
                            }
                        }
                    });
                } else {
                    zoneChartInstance = new Chart(zoneCanvas.getContext('2d'), {
                        type: 'radar',
                        data: {
                            labels,
                            datasets: [
                                {
                                    label: 'Current Prediction / Baseline (ML)',
                                    data: chartData,
                                    backgroundColor: 'rgba(56, 189, 248, 0.25)',
                                    borderColor: '#38BDF8',
                                    borderWidth: 2,
                                    pointBackgroundColor: labels.map(z => z === currentZone ? '#FB7185' : '#38BDF8'),
                                    pointRadius: labels.map(z => z === currentZone ? 6 : 4)
                                },
                                {
                                    label: 'Zone Baseline Benchmark',
                                    data: baselineData,
                                    backgroundColor: isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)',
                                    borderColor: isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                                    borderWidth: 1,
                                    borderDash: [4, 4]
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                r: {
                                    angleLines: { color: gridColor },
                                    grid: { color: gridColor },
                                    pointLabels: { color: tickColor, font: { size: 11, weight: '600' } },
                                    ticks: { backdropColor: 'transparent', color: tickColor }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: true,
                                    labels: { color: tickColor, font: { size: 11 } }
                                }
                            }
                        }
                    });
                }
            }

            renderChart('bar');

            const btnBar = document.getElementById('btnBar');
            const btnRadar = document.getElementById('btnRadar');

            if (btnBar) {
                btnBar.addEventListener('click', () => {
                    currentType = 'bar';
                    btnBar.classList.add('active');
                    if (btnRadar) btnRadar.classList.remove('active');
                    renderChart('bar');
                });
            }

            if (btnRadar) {
                btnRadar.addEventListener('click', () => {
                    currentType = 'radar';
                    btnRadar.classList.add('active');
                    if (btnBar) btnBar.classList.remove('active');
                    renderChart('radar');
                });
            }

            window.updateChartTheme = function() {
                renderChart(currentType);
            };
        }
    }
    initResultsPage();

    /* ----------------------------------------------------------------------
       9. Fluid Ribbon Canvas Animation
       ---------------------------------------------------------------------- */
    function initFluidCanvas() {
        const canvas = document.getElementById('fluidCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let width, height;
        let time = 0;

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        const ribbons = [
            {
                amplitude: 140,
                frequency: 0.0018,
                speed: 0.006,
                yOffset: 0.45,
                thickness: 180,
                colorGrad: ['rgba(56, 189, 248, 0.12)', 'rgba(14, 165, 233, 0.18)', 'rgba(2, 132, 199, 0.06)']
            },
            {
                amplitude: 110,
                frequency: 0.0022,
                speed: 0.008,
                yOffset: 0.48,
                thickness: 140,
                colorGrad: ['rgba(45, 212, 191, 0.14)', 'rgba(56, 189, 248, 0.12)', 'rgba(14, 165, 233, 0.05)']
            },
            {
                amplitude: 80,
                frequency: 0.0028,
                speed: 0.005,
                yOffset: 0.42,
                thickness: 100,
                colorGrad: ['rgba(167, 139, 250, 0.10)', 'rgba(56, 189, 248, 0.12)', 'rgba(45, 212, 191, 0.04)']
            }
        ];

        function drawRibbon(ribbon) {
            ctx.save();
            ctx.beginPath();

            const baseY = height * ribbon.yOffset;
            const pointsUpper = [];
            const pointsLower = [];

            const step = 8;
            for (let x = -50; x <= width + 50; x += step) {
                const sin1 = Math.sin(x * ribbon.frequency + time * ribbon.speed);
                const sin2 = Math.cos(x * ribbon.frequency * 0.7 - time * ribbon.speed * 0.8);
                const waveY = baseY + (sin1 * ribbon.amplitude) + (sin2 * (ribbon.amplitude * 0.4));
                const currentThickness = ribbon.thickness * (0.8 + 0.3 * Math.sin(x * 0.0015 + time * 0.004));

                pointsUpper.push({ x, y: waveY - currentThickness * 0.5 });
                pointsLower.push({ x, y: waveY + currentThickness * 0.5 });
            }

            ctx.moveTo(pointsUpper[0].x, pointsUpper[0].y);
            for (let i = 1; i < pointsUpper.length; i++) {
                ctx.lineTo(pointsUpper[i].x, pointsUpper[i].y);
            }

            for (let i = pointsLower.length - 1; i >= 0; i--) {
                ctx.lineTo(pointsLower[i].x, pointsLower[i].y);
            }
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, baseY - ribbon.thickness, width, baseY + ribbon.thickness);
            grad.addColorStop(0, ribbon.colorGrad[0]);
            grad.addColorStop(0.5, ribbon.colorGrad[1]);
            grad.addColorStop(1, ribbon.colorGrad[2]);

            ctx.fillStyle = grad;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.08)';
            ctx.shadowBlur = 40;
            ctx.fill();
            ctx.restore();
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            time += 1;
            ribbons.forEach(drawRibbon);
            requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        animate();
    }
    initFluidCanvas();
});
