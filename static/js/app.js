/**
 * HydroIntel — Client Engine
 * Theme management, 3D glass physics, telemetry loader, charts, speech & ambient canvas.
 */

document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const isLightMode = () => document.body.getAttribute('data-mode') === 'light';
    const themeListeners = [];

    /* 1. Live Hyderabad IST Clock */
    const clockEl = $('liveClock');
    if (clockEl) {
        const updateClock = () => {
            const ist = new Date().toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kolkata',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            clockEl.textContent = `${ist} IST`;
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    /* 2. Light / Dark Mode Switcher */
    const modeToggle = $('modeToggle');
    const modeLabel = $('modeLabel');
    const applyMode = (mode) => {
        const light = mode === 'light';
        if (light) document.body.setAttribute('data-mode', 'light');
        else document.body.removeAttribute('data-mode');
        if (modeLabel) modeLabel.textContent = light ? 'Light' : 'Dark';
        localStorage.setItem('hydro_mode', mode);
        themeListeners.forEach((fn) => fn());
    };
    if (modeToggle) {
        modeToggle.addEventListener('click', () => applyMode(isLightMode() ? 'dark' : 'light'));
    }
    applyMode(localStorage.getItem('hydro_mode') || 'dark');

    /* 3. Ambient Accent Tone Switcher */
    const themeDots = document.querySelectorAll('.theme-dot');
    const setAccent = (tone) => {
        if (tone === 'cyan') document.body.removeAttribute('data-theme');
        else document.body.setAttribute('data-theme', tone);
        themeDots.forEach((dot) => dot.classList.toggle('active', dot.dataset.t === tone));
        localStorage.setItem('hydro_theme', tone);
    };
    themeDots.forEach((dot) => dot.addEventListener('click', () => setAccent(dot.dataset.t)));
    if (themeDots.length) setAccent(localStorage.getItem('hydro_theme') || 'cyan');

    /* 4. Interactive 3D Card Tilt & Specular Spotlight */
    document.querySelectorAll('.card-tilt').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotX = ((y - rect.height / 2) / (rect.height / 2)) * -5;
            const rotY = ((x - rect.width / 2) / (rect.width / 2)) * 5;
            card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
            card.style.setProperty('--glare-x', `${x}px`);
            card.style.setProperty('--glare-y', `${y}px`);
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });

    /* 5. Click Ripple Physics */
    document.addEventListener('click', (e) => {
        if (e.target.closest('input, select, button, a, .custom-select')) return;
        const ripple = document.createElement('div');
        ripple.className = 'water-ripple';
        ripple.style.left = `${e.clientX}px`;
        ripple.style.top = `${e.clientY}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
    });

    /* 6. Custom Zone Dropdown & Quick-Select Mini-Cards */
    const selectEl = $('zoneSelect');
    const trigger = $('zoneTrigger');
    const zoneInput = $('zoneInput');
    if (selectEl && trigger && zoneInput) {
        const triggerName = $('triggerName');
        const triggerDot = $('triggerDot');
        const options = selectEl.querySelectorAll('.custom-option');
        const miniCards = document.querySelectorAll('.zone-mini-card');

        const applyZone = (zone, pop, dispatch) => {
            zoneInput.value = zone;
            triggerName.textContent = zone;
            triggerName.classList.remove('placeholder');
            triggerDot.classList.add('selected');

            const defaults = { population: pop, temperature: 32.5, rainfall: 0.0, prev_dispatch: dispatch };
            Object.entries(defaults).forEach(([id, val]) => {
                const el = $(id);
                if (el) el.value = val;
            });

            options.forEach((o) => {
                const selected = o.dataset.value === zone;
                o.classList.toggle('selected', selected);
                o.setAttribute('aria-selected', String(selected));
            });
            miniCards.forEach((mc) => mc.classList.toggle('active-zone', mc.dataset.zone === zone));
        };

        const setDropdownOpen = (open) => {
            selectEl.classList.toggle('open', open);
            trigger.setAttribute('aria-expanded', String(open));
        };

        const toggleDropdown = (e) => {
            e.stopPropagation();
            setDropdownOpen(!selectEl.classList.contains('open'));
        };
        trigger.addEventListener('click', toggleDropdown);
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown(e);
            } else if (e.key === 'Escape') {
                setDropdownOpen(false);
            }
        });

        options.forEach((opt) => {
            opt.addEventListener('click', () => {
                applyZone(opt.dataset.value, opt.dataset.pop, opt.dataset.dispatch);
                setDropdownOpen(false);
            });
        });

        miniCards.forEach((mc) => {
            mc.addEventListener('click', () => applyZone(mc.dataset.zone, mc.dataset.pop, mc.dataset.dispatch));
        });

        document.addEventListener('click', (e) => {
            if (!selectEl.contains(e.target)) setDropdownOpen(false);
        });
    }

    /* 7. Telemetry Loading Sequence */
    const form = $('predictForm');
    const overlay = $('loadingOverlay');
    if (form && overlay && zoneInput) {
        form.addEventListener('submit', (e) => {
            if (!zoneInput.value) {
                e.preventDefault();
                if (selectEl) selectEl.classList.add('open');
                return;
            }

            const zoneVal = zoneInput.value;
            const popVal = Number($('population')?.value || 0).toLocaleString();
            const tempVal = $('temperature')?.value || '32.5';
            const rainVal = $('rainfall')?.value || '0.0';

            const hudMap = {
                hudZone: `📍 ${zoneVal}`,
                hudPop: `👥 ${popVal}`,
                hudTemp: `🌡️ ${tempVal}°C`,
                hudRain: `🌧️ ${rainVal} mm`,
            };
            Object.entries(hudMap).forEach(([id, text]) => {
                const el = $(id);
                if (el) el.textContent = text;
            });

            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');

            const logsEl = $('terminalLogs');
            const barEl = $('loadingBar');
            const pctEl = $('loadingPct');
            if (!logsEl) return;

            logsEl.textContent = '';
            const timeline = [
                { time: '0.2s', pct: 15, msg: '⚡ Calibrating Hyderabad GHMC spatial telemetry matrix...' },
                { time: '0.9s', pct: 38, msg: `🌲 Aggregating 100 Random Forest trees for ${zoneVal}...`, cls: 'highlight' },
                { time: '1.8s', pct: 60, msg: `🛰️ Cross-referencing rainfall (${rainVal} mm) & temp (${tempVal}°C)...` },
                { time: '2.7s', pct: 78, msg: '🧠 Establishing neural handshake with Google Gemini...', cls: 'highlight' },
                { time: '3.8s', pct: 92, msg: '📋 Synthesizing dispatch directives & sustainability plan...' },
                { time: '4.8s', pct: 98, msg: '✓ Forecast verified. Rendering telemetry dashboard...', cls: 'success' },
            ];

            timeline.forEach((item, index) => {
                setTimeout(() => {
                    if (barEl) barEl.style.width = `${item.pct}%`;
                    if (pctEl) pctEl.textContent = `${item.pct}%`;

                    const line = document.createElement('div');
                    line.className = 'term-line';

                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'term-time';
                    timeSpan.textContent = `[${item.time}]`;

                    const msgSpan = document.createElement('span');
                    msgSpan.className = `term-msg${item.cls ? ` ${item.cls}` : ''}`;
                    msgSpan.textContent = item.msg;

                    line.append(timeSpan, msgSpan);
                    logsEl.appendChild(line);
                }, index * 900);
            });
        });
    }

    /* 8. Results Dashboard: Counters, Reservoir, Actions & Charts */
    const countUp = (el, endVal, duration = 1200, decimals = 2) => {
        let startTime = null;
        const step = (ts) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            el.textContent = (endVal * ease).toFixed(decimals);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const odo = $('odometerVal');
    if (odo) {
        const target = parseFloat(odo.dataset.target) || 0;
        countUp(odo, target, 1200, 2);
        const tank = $('reservoirFluid');
        if (tank) {
            setTimeout(() => {
                tank.style.height = `${Math.min(Math.max(target, 15), 90)}%`;
            }, 200);
        }
    }

    document.querySelectorAll('.count-up').forEach((el) => {
        countUp(el, parseFloat(el.dataset.target) || 0, 1000, 2);
    });

    const toast = $('toastNotify');
    let toastTimer = null;
    const showToast = (msg) => {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    };

    const aiContent = $('aiContent');
    $('btnCopyAI')?.addEventListener('click', () => {
        if (!aiContent) return;
        navigator.clipboard?.writeText(aiContent.innerText)
            .then(() => showToast('Operational Directives Copied!'))
            .catch(() => showToast('Unable to copy to clipboard.'));
    });

    $('btnPrintAI')?.addEventListener('click', () => window.print());

    const btnSpeak = $('btnSpeakAI');
    if (btnSpeak && aiContent) {
        const speakIcon = $('speakIcon');
        const speakText = $('speakText');
        let isSpeaking = false;

        const setSpeakUI = (active) => {
            isSpeaking = active;
            if (speakIcon) speakIcon.textContent = active ? '⏹️' : '🔊';
            if (speakText) speakText.textContent = active ? 'Stop' : 'Listen';
            btnSpeak.classList.toggle('active', active);
        };

        btnSpeak.addEventListener('click', () => {
            if (!('speechSynthesis' in window)) {
                showToast('Speech synthesis not supported in this browser.');
                return;
            }
            if (isSpeaking) {
                window.speechSynthesis.cancel();
                setSpeakUI(false);
                return;
            }
            const utterance = new SpeechSynthesisUtterance(aiContent.innerText);
            utterance.onend = () => setSpeakUI(false);
            utterance.onerror = () => setSpeakUI(false);
            window.speechSynthesis.speak(utterance);
            setSpeakUI(true);
        });

        window.addEventListener('beforeunload', () => window.speechSynthesis?.cancel());
    }

    /* Gauge Chart */
    const ChartJS = window.Chart;
    const gaugeEl = $('gaugeChart');
    if (gaugeEl && ChartJS) {
        const prediction = parseFloat(gaugeEl.dataset.prediction) || 0;
        const baseline = parseFloat(gaugeEl.dataset.baseline) || 0;
        const maxVal = Math.max(prediction, baseline, 1) * 1.4;
        const accent = prediction > baseline ? '#FB7185' : '#34D399';
        let gaugeChart = null;

        const renderGauge = () => {
            gaugeChart?.destroy();
            const light = isLightMode();
            gaugeChart = new ChartJS(gaugeEl.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Predicted', 'Remaining'],
                    datasets: [{
                        data: [prediction, Math.max(maxVal - prediction, 0)],
                        backgroundColor: [accent, light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'],
                        borderWidth: 0,
                        borderRadius: 6,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '75%',
                    rotation: -90,
                    circumference: 180,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                },
                plugins: [{
                    id: 'gaugeText',
                    afterDraw(chart) {
                        const { ctx, chartArea: { left, right, bottom } } = chart;
                        const cx = (left + right) / 2;
                        const cy = bottom - 10;
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.fillStyle = accent;
                        ctx.font = '700 13px Inter';
                        ctx.fillText(prediction > baseline ? '▲ Above' : '▼ Below', cx, cy - 4);
                        ctx.fillStyle = light ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.40)';
                        ctx.font = '500 11px Inter';
                        ctx.fillText('baseline', cx, cy + 12);
                        ctx.restore();
                    },
                }],
            });
        };

        renderGauge();
        themeListeners.push(renderGauge);
    }

    /* Zone Comparison Chart (Bar / Radar) */
    const zoneCanvas = $('zoneChart');
    if (zoneCanvas && ChartJS) {
        const labels = JSON.parse(zoneCanvas.dataset.labels || '[]');
        const baselines = JSON.parse(zoneCanvas.dataset.baselines || '[]');
        const currentZone = zoneCanvas.dataset.currentzone || '';
        const prediction = parseFloat(zoneCanvas.dataset.prediction) || 0;
        const chartData = labels.map((z, i) => (z === currentZone ? prediction : baselines[i]));

        let chartType = 'bar';
        let zoneChart = null;

        const renderZoneChart = (type) => {
            zoneChart?.destroy();
            const light = isLightMode();
            const gridColor = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
            const tickColor = light ? 'rgba(71,85,105,0.85)' : 'rgba(255,255,255,0.45)';
            const mutedBg = light ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)';

            const config = type === 'bar'
                ? {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Dispatch (ML)',
                            data: chartData,
                            backgroundColor: labels.map((z) => (z === currentZone ? 'rgba(56,189,248,0.8)' : mutedBg)),
                            borderColor: labels.map((z) => (z === currentZone ? '#38BDF8' : (light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'))),
                            borderWidth: 1,
                            borderRadius: 8,
                            borderSkipped: false,
                        }],
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15,23,42,0.95)',
                                titleColor: '#38BDF8',
                                bodyColor: 'rgba(255,255,255,0.85)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderWidth: 1,
                                padding: 12,
                                cornerRadius: 8,
                                callbacks: { label: (c) => `${c.parsed.y} ML` },
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: gridColor },
                                ticks: { color: tickColor, font: { family: 'Inter', size: 11 }, callback: (v) => `${v} ML` },
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: tickColor, font: { family: 'Inter', size: 12, weight: '500' } },
                            },
                        },
                    },
                }
                : {
                    type: 'radar',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: 'Current Prediction / Baseline (ML)',
                                data: chartData,
                                backgroundColor: 'rgba(56,189,248,0.25)',
                                borderColor: '#38BDF8',
                                borderWidth: 2,
                                pointBackgroundColor: labels.map((z) => (z === currentZone ? '#FB7185' : '#38BDF8')),
                                pointRadius: labels.map((z) => (z === currentZone ? 6 : 4)),
                            },
                            {
                                label: 'Zone Baseline Benchmark',
                                data: baselines,
                                backgroundColor: light ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                                borderColor: light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                                borderWidth: 1,
                                borderDash: [4, 4],
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        scales: {
                            r: {
                                angleLines: { color: gridColor },
                                grid: { color: gridColor },
                                pointLabels: { color: tickColor, font: { size: 11, weight: '600' } },
                                ticks: { backdropColor: 'transparent', color: tickColor },
                            },
                        },
                        plugins: { legend: { display: true, labels: { color: tickColor, font: { size: 11 } } } },
                    },
                };

            zoneChart = new ChartJS(zoneCanvas.getContext('2d'), config);
        };

        renderZoneChart(chartType);
        themeListeners.push(() => renderZoneChart(chartType));

        const btnBar = $('btnBar');
        const btnRadar = $('btnRadar');
        const switchView = (type) => {
            chartType = type;
            btnBar?.classList.toggle('active', type === 'bar');
            btnRadar?.classList.toggle('active', type === 'radar');
            renderZoneChart(type);
        };
        btnBar?.addEventListener('click', () => switchView('bar'));
        btnRadar?.addEventListener('click', () => switchView('radar'));
    }

    /* 9. Fluid Ribbon Canvas Animation */
    const canvas = $('fluidCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const ribbons = [
            { amp: 140, freq: 0.0018, speed: 0.006, y: 0.45, thick: 180, colors: ['rgba(56,189,248,0.12)', 'rgba(14,165,233,0.18)', 'rgba(2,132,199,0.06)'] },
            { amp: 110, freq: 0.0022, speed: 0.008, y: 0.48, thick: 140, colors: ['rgba(45,212,191,0.14)', 'rgba(56,189,248,0.12)', 'rgba(14,165,233,0.05)'] },
            { amp: 80, freq: 0.0028, speed: 0.005, y: 0.42, thick: 100, colors: ['rgba(167,139,250,0.10)', 'rgba(56,189,248,0.12)', 'rgba(45,212,191,0.04)'] },
        ];
        let width = 0;
        let height = 0;
        let t = 0;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const drawRibbon = (r) => {
            const baseY = height * r.y;
            const upper = [];
            const lower = [];
            for (let x = -50; x <= width + 50; x += 10) {
                const waveY = baseY + Math.sin(x * r.freq + t * r.speed) * r.amp + Math.cos(x * r.freq * 0.7 - t * r.speed * 0.8) * (r.amp * 0.4);
                const half = r.thick * (0.4 + 0.15 * Math.sin(x * 0.0015 + t * 0.004));
                upper.push([x, waveY - half]);
                lower.push([x, waveY + half]);
            }

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(upper[0][0], upper[0][1]);
            for (let i = 1; i < upper.length; i++) ctx.lineTo(upper[i][0], upper[i][1]);
            for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1]);
            ctx.closePath();

            const grad = ctx.createLinearGradient(0, baseY - r.thick, width, baseY + r.thick);
            grad.addColorStop(0, r.colors[0]);
            grad.addColorStop(0.5, r.colors[1]);
            grad.addColorStop(1, r.colors[2]);
            ctx.fillStyle = grad;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.08)';
            ctx.shadowBlur = 40;
            ctx.fill();
            ctx.restore();
        };

        const animate = () => {
            if (!document.hidden) {
                ctx.clearRect(0, 0, width, height);
                t += 1;
                ribbons.forEach(drawRibbon);
            }
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();
    }
});
