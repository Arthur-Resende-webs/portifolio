/* =========================================================
   NEXUS — ORGANIZADOR DE ROTINA
   Arquivo: script.js
   Armazenamento: localStorage
   ========================================================= */

(() => {
    "use strict";

    const STORAGE_KEY = "nexus-routine-data-v1";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const state = {
        tasks: [],
        goals: [],
        reminders: [],
        focusLog: [],
        pomodoro: {
            focus: 25,
            shortBreak: 5,
            longBreak: 15,
            sessions: 0,
            mode: "focus"
        },
        calendarDate: new Date(),
        selectedDate: dateKey(new Date()),
        timer: {
            running: false,
            remaining: 25 * 60,
            interval: null,
            endAt: null
        }
    };

    const PAGE_NAMES = {
        dashboard: "Visão geral",
        tasks: "Tarefas",
        calendar: "Calendário",
        goals: "Minhas metas",
        pomodoro: "Modo foco",
        reminders: "Lembretes",
        analytics: "Estatísticas",
        settings: "Configurações"
    };

    function dateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function parseDate(value) {
        if (!value) return null;
        const parts = value.split("-").map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function localDateTimeValue(date = new Date()) {
        const pad = number => String(number).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function formatDate(value, options = {}) {
        const date = typeof value === "string" ? parseDate(value) : value;
        if (!date || Number.isNaN(date.getTime())) return "Sem data";
        return new Intl.DateTimeFormat("pt-BR", options).format(date);
    }

    function formatDateTime(value) {
        const date = new Date(value);
        if (!value || Number.isNaN(date.getTime())) return "Data não definida";
        return `${formatDate(date, { day: "2-digit", month: "short" })} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function saveData() {
        const data = {
            version: 1,
            tasks: state.tasks,
            goals: state.goals,
            reminders: state.reminders,
            focusLog: state.focusLog,
            pomodoro: {
                focus: state.pomodoro.focus,
                shortBreak: state.pomodoro.shortBreak,
                longBreak: state.pomodoro.longBreak,
                sessions: state.pomodoro.sessions,
                mode: state.pomodoro.mode
            }
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            showToast("Não foi possível salvar. O armazenamento pode estar cheio ou bloqueado.", "error");
            console.error("Falha ao salvar dados:", error);
            return false;
        }
    }

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);

            if (!data || typeof data !== "object") throw new Error("Formato inválido");

            state.tasks = Array.isArray(data.tasks) ? data.tasks.map(normalizeTask).filter(Boolean) : [];
            state.goals = Array.isArray(data.goals) ? data.goals.map(normalizeGoal).filter(Boolean) : [];
            state.reminders = Array.isArray(data.reminders) ? data.reminders.map(normalizeReminder).filter(Boolean) : [];
            state.focusLog = Array.isArray(data.focusLog) ? data.focusLog.map(normalizeFocusLog).filter(Boolean) : [];

            if (data.pomodoro && typeof data.pomodoro === "object") {
                state.pomodoro.focus = validNumber(data.pomodoro.focus, 25, 1, 180);
                state.pomodoro.shortBreak = validNumber(data.pomodoro.shortBreak, 5, 1, 60);
                state.pomodoro.longBreak = validNumber(data.pomodoro.longBreak, 15, 1, 90);
                state.pomodoro.sessions = validNumber(data.pomodoro.sessions, 0, 0, 1000000);
                state.pomodoro.mode = ["focus", "shortBreak", "longBreak"].includes(data.pomodoro.mode)
                    ? data.pomodoro.mode : "focus";
            }
        } catch (error) {
            console.error("Os dados locais não puderam ser lidos:", error);
            showToast("Os dados salvos não puderam ser lidos. Um backup pode ajudar a recuperá-los.", "error");
        }
    }

    function validNumber(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.min(max, Math.max(min, Math.round(number)));
    }

    function normalizeTask(task) {
        if (!task || typeof task !== "object" || typeof task.title !== "string") return null;
        return {
            id: String(task.id || makeId()),
            title: task.title.slice(0, 120),
            description: String(task.description || "").slice(0, 1000),
            date: /^\d{4}-\d{2}-\d{2}$/.test(task.date || "") ? task.date : dateKey(new Date()),
            time: /^\d{2}:\d{2}$/.test(task.time || "") ? task.time : "",
            priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
            category: String(task.category || "Pessoal").slice(0, 40),
            completed: Boolean(task.completed),
            completedAt: typeof task.completedAt === "string" ? task.completedAt : "",
            createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString()
        };
    }

    function normalizeGoal(goal) {
        if (!goal || typeof goal !== "object" || typeof goal.title !== "string") return null;
        const target = validNumber(goal.target, 1, 1, 1000000);
        return {
            id: String(goal.id || makeId()),
            title: goal.title.slice(0, 120),
            description: String(goal.description || "").slice(0, 500),
            target,
            progress: validNumber(goal.progress, 0, 0, 1000000),
            unit: String(goal.unit || "etapas").slice(0, 30),
            deadline: /^\d{4}-\d{2}-\d{2}$/.test(goal.deadline || "") ? goal.deadline : "",
            createdAt: typeof goal.createdAt === "string" ? goal.createdAt : new Date().toISOString()
        };
    }

    function normalizeReminder(reminder) {
        if (!reminder || typeof reminder !== "object" || typeof reminder.title !== "string") return null;
        const timestamp = new Date(reminder.datetime).getTime();
        if (!Number.isFinite(timestamp)) return null;
        return {
            id: String(reminder.id || makeId()),
            title: reminder.title.slice(0, 120),
            message: String(reminder.message || "").slice(0, 500),
            datetime: new Date(timestamp).toISOString(),
            fired: Boolean(reminder.fired),
            createdAt: typeof reminder.createdAt === "string" ? reminder.createdAt : new Date().toISOString()
        };
    }

    function normalizeFocusLog(item) {
        if (!item || typeof item !== "object") return null;
        const minutes = Number(item.minutes);
        const timestamp = new Date(item.date).getTime();
        if (!Number.isFinite(minutes) || minutes <= 0 || !Number.isFinite(timestamp)) return null;
        return {
            id: String(item.id || makeId()),
            minutes: Math.min(180, Math.round(minutes)),
            date: new Date(timestamp).toISOString(),
            taskId: String(item.taskId || "")
        };
    }

    function showToast(message, type = "info") {
        const container = $("#toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        const icon = type === "success" ? "✓" : type === "error" ? "!" : "◈";
        toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icon}</span><span class="toast-message"></span>`;
        $(".toast-message", toast).textContent = message;
        container.appendChild(toast);

        window.setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(6px)";
            window.setTimeout(() => toast.remove(), 220);
        }, 3500);
    }

    function emptyState(title, description, symbol = "◇") {
        return `<div class="empty-state">
            <div class="empty-state-icon" aria-hidden="true">${symbol}</div>
            <strong>${escapeHTML(title)}</strong>
            <p>${escapeHTML(description)}</p>
        </div>`;
    }

    function priorityLabel(priority) {
        return ({ high: "Alta", medium: "Média", low: "Baixa" })[priority] || "Média";
    }

    function taskSort(a, b) {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || "99:99").localeCompare(b.time || "99:99");
    }

    function taskMarkup(task) {
        const priority = priorityLabel(task.priority);
        const time = task.time ? ` · ${escapeHTML(task.time)}` : "";
        const description = task.description
            ? `<p class="task-description">${escapeHTML(task.description)}</p>` : "";
        const completedClass = task.completed ? " is-completed" : "";

        return `<article class="task-item${completedClass}" data-task-row="${escapeHTML(task.id)}">
            <button class="task-checkbox ${task.completed ? "checked" : ""}"
                data-action="toggle-task" data-id="${escapeHTML(task.id)}"
                aria-label="${task.completed ? "Reabrir" : "Concluir"} tarefa: ${escapeHTML(task.title)}"
                aria-pressed="${task.completed ? "true" : "false"}"></button>
            <div class="task-content">
                <strong class="task-title">${escapeHTML(task.title)}</strong>
                ${description}
                <div class="task-meta">
                    <span>▦ ${escapeHTML(formatDate(task.date, { day: "2-digit", month: "short" }))}${time}</span>
                    <span class="priority-badge priority-${task.priority}">${priority}</span>
                    <span class="category-badge">${escapeHTML(task.category)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-button" data-action="edit-task" data-id="${escapeHTML(task.id)}"
                    aria-label="Editar tarefa">✎</button>
                <button class="task-action-button delete" data-action="delete-task" data-id="${escapeHTML(task.id)}"
                    aria-label="Excluir tarefa">×</button>
            </div>
        </article>`;
    }

    function renderTaskList(container, tasks, emptyTitle, emptyDescription) {
        if (!container) return;
        container.innerHTML = tasks.length
            ? tasks.map(taskMarkup).join("")
            : emptyState(emptyTitle, emptyDescription, "☷");
    }

    function renderDashboard() {
        const today = dateKey(new Date());
        const todayTasks = state.tasks.filter(task => task.date === today).sort(taskSort);
        const completed = todayTasks.filter(task => task.completed).length;
        const pending = todayTasks.length - completed;
        const percent = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;
        const activeGoals = state.goals.filter(goal => goal.progress < goal.target).length;
        const focusMinutes = state.focusLog
            .filter(item => dateKey(new Date(item.date)) === today)
            .reduce((sum, item) => sum + item.minutes, 0);

        $("#stat-tasks").textContent = String(todayTasks.length);
        $("#stat-completed").textContent = String(completed);
        $("#stat-goals").textContent = String(activeGoals);
        $("#stat-focus").textContent = `${focusMinutes} min`;
        $("#stat-tasks-caption").textContent = pending ? `${pending} pendente(s)` : "Tudo concluído por hoje";
        $("#nav-task-count").textContent = String(state.tasks.filter(task => !task.completed).length);

        $("#daily-progress-value").textContent = `${percent}%`;
        $("#daily-progress-count").textContent = `${completed} de ${todayTasks.length}`;
        $("#daily-progress-bar").style.width = `${percent}%`;
        $("#daily-progress-ring").style.background =
            `conic-gradient(var(--cyan) ${percent * 3.6}deg, #263249 ${percent * 3.6}deg)`;

        renderTaskList(
            $("#today-task-list"),
            todayTasks.slice(0, 5),
            "Dia livre de tarefas",
            "Adicione uma atividade para começar a organizar seu dia."
        );

        renderDashboardGoals();
        renderMiniCalendar();
    }

    function renderTasksPage() {
        const search = ($("#task-search")?.value || "").trim().toLocaleLowerCase("pt-BR");
        const filter = $("#task-filter")?.value || "all";
        const priority = $("#task-priority-filter")?.value || "all";
        const today = dateKey(new Date());

        let tasks = [...state.tasks];
        if (search) {
            tasks = tasks.filter(task =>
                `${task.title} ${task.description} ${task.category}`.toLocaleLowerCase("pt-BR").includes(search)
            );
        }
        if (filter === "pending") tasks = tasks.filter(task => !task.completed);
        if (filter === "completed") tasks = tasks.filter(task => task.completed);
        if (filter === "today") tasks = tasks.filter(task => task.date === today);
        if (priority !== "all") tasks = tasks.filter(task => task.priority === priority);

        tasks.sort(taskSort);
        renderTaskList(
            $("#all-task-list"),
            tasks,
            "Nenhuma tarefa encontrada",
            "Tente alterar os filtros ou crie uma nova tarefa."
        );
    }

    function renderMiniCalendar() {
        const container = $("#mini-calendar");
        if (!container) return;

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const selected = state.selectedDate;
        const taskDates = new Set(state.tasks.map(task => task.date));

        $("#mini-calendar-month").textContent = formatDate(today, { month: "long", year: "numeric" });

        const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
        let html = weekdays.map(day => `<div class="mini-calendar-weekday">${day}</div>`).join("");

        for (let i = 0; i < firstWeekday; i++) {
            html += '<div class="mini-calendar-day is-empty"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const key = dateKey(new Date(year, month, day));
            const classes = [
                "mini-calendar-day",
                key === dateKey(today) ? "is-today" : "",
                key === selected ? "is-selected" : "",
                taskDates.has(key) ? "has-tasks" : ""
            ].filter(Boolean).join(" ");

            html += `<button class="${classes}" data-action="select-mini-date" data-date="${key}"
                aria-label="${day} de ${formatDate(today, { month: "long" })}">${day}</button>`;
        }
        container.innerHTML = html;
    }

    function renderDashboardGoals() {
        const container = $("#dashboard-goals");
        if (!container) return;

        const goals = [...state.goals]
            .filter(goal => goal.progress < goal.target)
            .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"))
            .slice(0, 3);

        if (!goals.length) {
            container.innerHTML = emptyState("Nenhuma meta ativa", "Crie uma meta para acompanhar seu progresso.", "◎");
            return;
        }

        container.innerHTML = goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.progress / goal.target) * 100));
            return `<div class="dashboard-goal" style="margin-bottom:18px">
                <div class="goal-progress-info" style="margin-top:0">
                    <span>${escapeHTML(goal.title)}</span>
                    <strong>${percent}%</strong>
                </div>
                <div class="goal-progress-track">
                    <div class="goal-progress-fill" style="width:${percent}%"></div>
                </div>
            </div>`;
        }).join("");
    }

    function renderCalendar() {
        const date = state.calendarDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayKey = dateKey(new Date());
        const selected = state.selectedDate;

        $("#calendar-title").textContent = formatDate(date, { month: "long", year: "numeric" });

        const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        let html = weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join("");

        const previousMonthDays = new Date(year, month, 0).getDate();
        for (let i = firstWeekday - 1; i >= 0; i--) {
            const day = previousMonthDays - i;
            html += `<button class="calendar-day is-other-month" data-action="calendar-day"
                data-date="${dateKey(new Date(year, month - 1, day))}">
                <span class="calendar-day-number">${day}</span>
            </button>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const key = dateKey(new Date(year, month, day));
            const tasks = state.tasks.filter(task => task.date === key);
            const classes = [
                "calendar-day",
                key === todayKey ? "is-today" : "",
                key === selected ? "is-selected" : ""
            ].filter(Boolean).join(" ");
            const dots = tasks.slice(0, 4).map(task =>
                `<span class="calendar-day-dot ${task.priority === "high" ? "high" : ""}"></span>`
            ).join("");

            html += `<button class="${classes}" data-action="calendar-day" data-date="${key}">
                <span class="calendar-day-number">${day}</span>
                ${dots ? `<span class="calendar-day-dots">${dots}</span>` : ""}
                ${tasks.length ? `<span class="calendar-day-count">${tasks.length} tarefa(s)</span>` : ""}
            </button>`;
        }

        const usedCells = firstWeekday + daysInMonth;
        const trailing = (7 - (usedCells % 7)) % 7;
        for (let day = 1; day <= trailing; day++) {
            html += `<button class="calendar-day is-other-month" data-action="calendar-day"
                data-date="${dateKey(new Date(year, month + 1, day))}">
                <span class="calendar-day-number">${day}</span>
            </button>`;
        }

        $("#calendar-grid").innerHTML = html;
        renderSelectedDay();
    }

    function renderSelectedDay() {
        const selectedDate = state.selectedDate;
        const date = parseDate(selectedDate);
        $("#selected-day-title").textContent = date
            ? `Atividades de ${formatDate(date, { day: "numeric", month: "long", year: "numeric" })}`
            : "Atividades do dia";

        const tasks = state.tasks.filter(task => task.date === selectedDate).sort(taskSort);
        renderTaskList(
            $("#selected-day-tasks"),
            tasks,
            "Nenhuma atividade para este dia",
            "Selecione outra data ou agende uma tarefa."
        );
    }

    function renderGoals() {
        const container = $("#goals-list");
        if (!container) return;

        if (!state.goals.length) {
            container.innerHTML = emptyState("Nenhuma meta cadastrada", "Defina um objetivo e acompanhe sua evolução.", "◎");
            return;
        }

        container.innerHTML = [...state.goals].sort((a, b) => {
            const aDone = a.progress >= a.target;
            const bDone = b.progress >= b.target;
            return Number(aDone) - Number(bDone);
        }).map(goal => {
            const percent = Math.min(100, Math.round((goal.progress / goal.target) * 100));
            const done = goal.progress >= goal.target;
            const deadline = goal.deadline
                ? `Prazo: ${formatDate(goal.deadline, { day: "2-digit", month: "short", year: "numeric" })}`
                : "Sem prazo definido";

            return `<article class="goal-card" data-goal-card="${escapeHTML(goal.id)}">
                <div class="goal-card-top">
                    <div>
                        <h3>${escapeHTML(goal.title)}</h3>
                        <p>${escapeHTML(goal.description || "Meta pessoal")}</p>
                    </div>
                    <div class="goal-card-actions">
                        <button class="task-action-button" data-action="edit-goal" data-id="${escapeHTML(goal.id)}"
                            aria-label="Editar meta">✎</button>
                        <button class="task-action-button delete" data-action="delete-goal" data-id="${escapeHTML(goal.id)}"
                            aria-label="Excluir meta">×</button>
                    </div>
                </div>
                <div class="goal-progress-info">
                    <span>Progresso</span>
                    <strong>${percent}%</strong>
                </div>
                <div class="goal-progress-track">
                    <div class="goal-progress-fill" style="width:${percent}%"></div>
                </div>
                <div class="goal-card-bottom">
                    <span>${goal.progress} / ${goal.target} ${escapeHTML(goal.unit)}</span>
                    <span>${escapeHTML(deadline)}</span>
                </div>
                <div style="display:flex;gap:8px;margin-top:17px;align-items:center">
                    <button class="secondary-button" data-action="goal-decrease" data-id="${escapeHTML(goal.id)}"
                        aria-label="Diminuir progresso" ${goal.progress <= 0 ? "disabled" : ""}>−</button>
                    <button class="secondary-button" data-action="goal-increase" data-id="${escapeHTML(goal.id)}"
                        aria-label="Aumentar progresso" ${done ? "disabled" : ""}>＋ Progresso</button>
                    ${done ? '<span class="status-badge">Concluída</span>' : ""}
                </div>
            </article>`;
        }).join("");
    }

    function renderReminders() {
        const container = $("#reminders-list");
        if (!container) return;

        const reminders = [...state.reminders].sort((a, b) =>
            new Date(a.datetime) - new Date(b.datetime)
        );

        if (!reminders.length) {
            container.innerHTML = emptyState("Nenhum lembrete", "Crie um lembrete para um compromisso importante.", "♧");
            return;
        }

        container.innerHTML = reminders.map(reminder => {
            const past = new Date(reminder.datetime).getTime() < Date.now();
            return `<article class="reminder-item ${reminder.fired ? "is-fired" : ""}">
                <div class="reminder-icon" aria-hidden="true">♧</div>
                <div class="reminder-content">
                    <h3>${escapeHTML(reminder.title)}</h3>
                    ${reminder.message ? `<p>${escapeHTML(reminder.message)}</p>` : ""}
                    <div class="reminder-time">${escapeHTML(formatDateTime(reminder.datetime))}</div>
                    <div style="margin-top:8px">
                        ${reminder.fired
                            ? '<span class="status-badge">Notificado</span>'
                            : past
                                ? '<span class="status-badge is-past">Horário passado</span>'
                                : '<span class="status-badge">Agendado</span>'}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-button" data-action="edit-reminder" data-id="${escapeHTML(reminder.id)}"
                        aria-label="Editar lembrete">✎</button>
                    <button class="task-action-button delete" data-action="delete-reminder" data-id="${escapeHTML(reminder.id)}"
                        aria-label="Excluir lembrete">×</button>
                </div>
            </article>`;
        }).join("");
    }

    function renderPomodoro() {
        const timer = state.timer;
        const mins = Math.floor(timer.remaining / 60);
        const secs = timer.remaining % 60;
        $("#pomodoro-time").textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        const labels = {
            focus: "SESSÃO DE FOCO",
            shortBreak: "DESCANSO CURTO",
            longBreak: "DESCANSO LONGO"
        };
        $("#pomodoro-mode").textContent = labels[state.pomodoro.mode] || labels.focus;
        $("#pomodoro-status").textContent = timer.running ? "Sessão em andamento" : "Pronto para começar";
        $("#pomodoro-start").textContent = timer.running ? "Ⅱ Pausar foco" : "▶ Iniciar foco";
        $("#pomodoro-ring").classList.toggle("is-break", state.pomodoro.mode !== "focus");
        $("#pomodoro-sessions").textContent = String(state.pomodoro.sessions);

        $("#focus-duration").value = String(state.pomodoro.focus);
        $("#short-break-duration").value = String(state.pomodoro.shortBreak);
        $("#long-break-duration").value = String(state.pomodoro.longBreak);

        const taskSelect = $("#pomodoro-task");
        if (taskSelect) {
            const current = taskSelect.value;
            taskSelect.innerHTML = '<option value="">Foco livre</option>' +
                state.tasks.filter(task => !task.completed).sort(taskSort).map(task =>
                    `<option value="${escapeHTML(task.id)}">${escapeHTML(task.title)}</option>`
                ).join("");
            if (state.tasks.some(task => task.id === current && !task.completed)) {
                taskSelect.value = current;
            }
        }
    }

    function renderAnalytics() {
        const completed = state.tasks.filter(task => task.completed).length;
        const total = state.tasks.length;
        const rate = total ? Math.round((completed / total) * 100) : 0;
        const minutes = state.focusLog.reduce((sum, item) => sum + item.minutes, 0);

        $("#analytics-total").textContent = String(total);
        $("#analytics-rate").textContent = `${rate}%`;
        $("#analytics-sessions").textContent = String(state.focusLog.length);
        $("#analytics-minutes").textContent = String(minutes);

        renderWeeklyChart();
        renderDistributionChart();
    }

    function renderWeeklyChart() {
        const container = $("#weekly-chart");
        if (!container) return;

        const days = [];
        const now = new Date();
        for (let offset = 6; offset >= 0; offset--) {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
            const key = dateKey(date);
            const count = state.tasks.filter(task => task.completed && task.completedAt &&
                dateKey(new Date(task.completedAt)) === key).length;
            days.push({
                label: formatDate(date, { weekday: "short" }).replace(".", ""),
                count
            });
        }

        const max = Math.max(1, ...days.map(day => day.count));
        container.innerHTML = `<div class="bar-chart">${days.map(day => {
            const height = Math.max(3, (day.count / max) * 100);
            return `<div class="bar-chart-column">
                <span class="bar-chart-value">${day.count}</span>
                <div class="bar-chart-bar-wrap">
                    <div class="bar-chart-bar" style="height:${height}%"></div>
                </div>
                <span class="bar-chart-label">${escapeHTML(day.label)}</span>
            </div>`;
        }).join("")}</div>`;
    }

    function renderDistributionChart() {
        const container = $("#task-distribution-chart");
        if (!container) return;

        const completed = state.tasks.filter(task => task.completed).length;
        const pending = state.tasks.length - completed;
        const total = state.tasks.length;
        const completedPercent = total ? Math.round(completed / total * 100) : 0;
        const pendingPercent = total ? 100 - completedPercent : 0;

        container.innerHTML = `<div class="distribution-chart">
            <div class="distribution-row">
                <div class="distribution-label"><span>Concluídas</span><strong>${completed} (${completedPercent}%)</strong></div>
                <div class="distribution-track"><div class="distribution-fill" style="width:${completedPercent}%"></div></div>
            </div>
            <div class="distribution-row">
                <div class="distribution-label"><span>Pendentes</span><strong>${pending} (${pendingPercent}%)</strong></div>
                <div class="distribution-track"><div class="distribution-fill pending" style="width:${pendingPercent}%"></div></div>
            </div>
            ${total === 0 ? '<p class="chart-empty">Cadastre tarefas para visualizar sua distribuição.</p>' : ""}
        </div>`;
    }

    function renderAll() {
        renderDashboard();
        renderTasksPage();
        renderCalendar();
        renderGoals();
        renderReminders();
        renderPomodoro();
        renderAnalytics();
        updateNotificationStatus();
    }

    function showPage(pageName) {
        if (!PAGE_NAMES[pageName]) return;

        $$(".page").forEach(page => page.classList.toggle("active", page.id === `page-${pageName}`));
        $$(".nav-item[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === pageName));

        $("#current-section").textContent = PAGE_NAMES[pageName];
        closeMobileMenu();

        if (pageName === "calendar") renderCalendar();
        if (pageName === "analytics") renderAnalytics();
        if (pageName === "pomodoro") renderPomodoro();

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openDialog(id) {
        const dialog = document.getElementById(id);
        if (!dialog) return;
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
    }

    function closeDialog(id) {
        const dialog = document.getElementById(id);
        if (!dialog) return;
        if (typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
    }

    function openTaskDialog(task = null, presetDate = "") {
        $("#task-form").reset();
        $("#task-id").value = task?.id || "";
        $("#task-dialog-title").textContent = task ? "Editar tarefa" : "Nova tarefa";
        $("#task-title").value = task?.title || "";
        $("#task-description").value = task?.description || "";
        $("#task-date").value = task?.date || presetDate || dateKey(new Date());
        $("#task-time").value = task?.time || "";
        $("#task-priority").value = task?.priority || "medium";
        $("#task-category").value = task?.category || "Pessoal";
        openDialog("task-dialog");
        window.setTimeout(() => $("#task-title").focus(), 50);
    }

    function openGoalDialog(goal = null) {
        $("#goal-form").reset();
        $("#goal-id").value = goal?.id || "";
        $("#goal-dialog-title").textContent = goal ? "Editar meta" : "Nova meta";
        $("#goal-title").value = goal?.title || "";
        $("#goal-description").value = goal?.description || "";
        $("#goal-target").value = String(goal?.target ?? 12);
        $("#goal-progress").value = String(goal?.progress ?? 0);
        $("#goal-unit").value = goal?.unit || "";
        $("#goal-deadline").value = goal?.deadline || "";
        openDialog("goal-dialog");
        window.setTimeout(() => $("#goal-title").focus(), 50);
    }

    function openReminderDialog(reminder = null) {
        $("#reminder-form").reset();
        $("#reminder-id").value = reminder?.id || "";
        $("#reminder-dialog-title").textContent = reminder ? "Editar lembrete" : "Novo lembrete";
        $("#reminder-title").value = reminder?.title || "";
        $("#reminder-message").value = reminder?.message || "";
        $("#reminder-datetime").value = reminder
            ? localDateTimeValue(new Date(reminder.datetime))
            : localDateTimeValue(new Date(Date.now() + 60 * 60 * 1000));
        openDialog("reminder-dialog");
        window.setTimeout(() => $("#reminder-title").focus(), 50);
    }

    function handleTaskSubmit(event) {
        event.preventDefault();

        const title = $("#task-title").value.trim();
        const date = $("#task-date").value;
        if (!title || !date) {
            showToast("Preencha o título e a data da tarefa.", "error");
            return;
        }

        const id = $("#task-id").value;
        const previous = state.tasks.find(task => task.id === id);
        const task = normalizeTask({
            id: id || makeId(),
            title,
            description: $("#task-description").value.trim(),
            date,
            time: $("#task-time").value,
            priority: $("#task-priority").value,
            category: $("#task-category").value,
            completed: previous?.completed || false,
            completedAt: previous?.completedAt || "",
            createdAt: previous?.createdAt || new Date().toISOString()
        });

        if (previous) {
            state.tasks = state.tasks.map(item => item.id === id ? task : item);
        } else {
            state.tasks.push(task);
        }

        saveData();
        closeDialog("task-dialog");
        state.selectedDate = date;
        state.calendarDate = parseDate(date) || new Date();
        renderAll();
        showToast(previous ? "Tarefa atualizada." : "Tarefa criada.", "success");
    }

    function handleGoalSubmit(event) {
        event.preventDefault();

        const title = $("#goal-title").value.trim();
        const target = Number($("#goal-target").value);
        const progress = Number($("#goal-progress").value);

        if (!title || !Number.isFinite(target) || target < 1 ||
            !Number.isFinite(progress) || progress < 0) {
            showToast("Confira o nome, o objetivo e o progresso da meta.", "error");
            return;
        }

        const id = $("#goal-id").value;
        const previous = state.goals.find(goal => goal.id === id);
        const goal = normalizeGoal({
            id: id || makeId(),
            title,
            description: $("#goal-description").value.trim(),
            target,
            progress,
            unit: $("#goal-unit").value.trim() || "etapas",
            deadline: $("#goal-deadline").value,
            createdAt: previous?.createdAt || new Date().toISOString()
        });

        if (previous) state.goals = state.goals.map(item => item.id === id ? goal : item);
        else state.goals.push(goal);

        saveData();
        closeDialog("goal-dialog");
        renderAll();
        showToast(previous ? "Meta atualizada." : "Meta criada.", "success");
    }

    function handleReminderSubmit(event) {
        event.preventDefault();

        const title = $("#reminder-title").value.trim();
        const dateTime = $("#reminder-datetime").value;
        const timestamp = new Date(dateTime).getTime();

        if (!title || !dateTime || !Number.isFinite(timestamp)) {
            showToast("Preencha o título e uma data válida para o lembrete.", "error");
            return;
        }

        const id = $("#reminder-id").value;
        const previous = state.reminders.find(item => item.id === id);
        const reminder = normalizeReminder({
            id: id || makeId(),
            title,
            message: $("#reminder-message").value.trim(),
            datetime: new Date(timestamp).toISOString(),
            fired: previous && previous.datetime === new Date(timestamp).toISOString()
                ? previous.fired : false,
            createdAt: previous?.createdAt || new Date().toISOString()
        });

        if (previous) state.reminders = state.reminders.map(item => item.id === id ? reminder : item);
        else state.reminders.push(reminder);

        saveData();
        closeDialog("reminder-dialog");
        renderAll();
        showToast(previous ? "Lembrete atualizado." : "Lembrete criado.", "success");
    }

    function toggleTask(id) {
        const task = state.tasks.find(item => item.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : "";
        saveData();
        renderAll();
        showToast(task.completed ? "Tarefa concluída!" : "Tarefa reaberta.", "success");
    }

    function deleteTask(id) {
        const task = state.tasks.find(item => item.id === id);
        if (!task || !window.confirm(`Excluir a tarefa "${task.title}"?`)) return;

        state.tasks = state.tasks.filter(item => item.id !== id);
        saveData();
        renderAll();
        showToast("Tarefa excluída.", "success");
    }

    function deleteGoal(id) {
        const goal = state.goals.find(item => item.id === id);
        if (!goal || !window.confirm(`Excluir a meta "${goal.title}"?`)) return;

        state.goals = state.goals.filter(item => item.id !== id);
        saveData();
        renderAll();
        showToast("Meta excluída.", "success");
    }

    function changeGoalProgress(id, amount) {
        const goal = state.goals.find(item => item.id === id);
        if (!goal) return;
        goal.progress = Math.max(0, Math.min(goal.target, goal.progress + amount));
        saveData();
        renderAll();
        if (goal.progress >= goal.target) showToast(`Meta "${goal.title}" concluída!`, "success");
    }

    function deleteReminder(id) {
        const reminder = state.reminders.find(item => item.id === id);
        if (!reminder || !window.confirm(`Excluir o lembrete "${reminder.title}"?`)) return;

        state.reminders = state.reminders.filter(item => item.id !== id);
        saveData();
        renderAll();
        showToast("Lembrete excluído.", "success");
    }

    function handleAction(action, id, element) {
        switch (action) {
            case "toggle-task":
                toggleTask(id);
                break;
            case "edit-task": {
                const task = state.tasks.find(item => item.id === id);
                if (task) openTaskDialog(task);
                break;
            }
            case "delete-task":
                deleteTask(id);
                break;
            case "edit-goal": {
                const goal = state.goals.find(item => item.id === id);
                if (goal) openGoalDialog(goal);
                break;
            }
            case "delete-goal":
                deleteGoal(id);
                break;
            case "goal-increase":
                changeGoalProgress(id, 1);
                break;
            case "goal-decrease":
                changeGoalProgress(id, -1);
                break;
            case "edit-reminder": {
                const reminder = state.reminders.find(item => item.id === id);
                if (reminder) openReminderDialog(reminder);
                break;
            }
            case "delete-reminder":
                deleteReminder(id);
                break;
            case "calendar-day":
            case "select-mini-date": {
                const selected = element.dataset.date;
                if (!selected) break;
                state.selectedDate = selected;
                const date = parseDate(selected);
                if (date) state.calendarDate = date;
                renderCalendar();
                renderMiniCalendar();
                break;
            }
        }
    }

    function moveCalendar(amount) {
        const date = state.calendarDate;
        state.calendarDate = new Date(date.getFullYear(), date.getMonth() + amount, 1);
        renderCalendar();
    }

    function closeMobileMenu() {
        $("#sidebar").classList.remove("is-open");
        $("#mobile-overlay").classList.remove("visible");
        $("#menu-toggle").setAttribute("aria-expanded", "false");
    }

    function toggleMobileMenu() {
        const open = !$("#sidebar").classList.contains("is-open");
        $("#sidebar").classList.toggle("is-open", open);
        $("#mobile-overlay").classList.toggle("visible", open);
        $("#menu-toggle").setAttribute("aria-expanded", String(open));
    }

    function setPomodoroMode(mode, autoStart = false) {
        const durations = {
            focus: state.pomodoro.focus,
            shortBreak: state.pomodoro.shortBreak,
            longBreak: state.pomodoro.longBreak
        };

        pauseTimer();
        state.pomodoro.mode = mode;
        state.timer.remaining = durations[mode] * 60;
        state.timer.endAt = null;
        renderPomodoro();
        saveData();

        if (autoStart) startTimer();
    }

    function startTimer() {
        if (state.timer.running) {
            pauseTimer();
            renderPomodoro();
            return;
        }

        if (state.timer.remaining <= 0) {
            const duration = state.pomodoro[state.pomodoro.mode] || state.pomodoro.focus;
            state.timer.remaining = duration * 60;
        }

        state.timer.running = true;
        state.timer.endAt = Date.now() + state.timer.remaining * 1000;
        state.timer.interval = window.setInterval(tickTimer, 250);
        renderPomodoro();
    }

    function pauseTimer() {
        if (state.timer.interval) window.clearInterval(state.timer.interval);
        state.timer.interval = null;

        if (state.timer.running && state.timer.endAt) {
            state.timer.remaining = Math.max(0, Math.ceil((state.timer.endAt - Date.now()) / 1000));
        }

        state.timer.running = false;
        state.timer.endAt = null;
    }

    function tickTimer() {
        if (!state.timer.running || !state.timer.endAt) return;

        state.timer.remaining = Math.max(0, Math.ceil((state.timer.endAt - Date.now()) / 1000));
        if (state.timer.remaining <= 0) {
            finishTimer();
            return;
        }

        const mins = Math.floor(state.timer.remaining / 60);
        const secs = state.timer.remaining % 60;
        $("#pomodoro-time").textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function finishTimer() {
        const finishedMode = state.pomodoro.mode;
        pauseTimer();
        state.timer.remaining = 0;

        if (finishedMode === "focus") {
            const selectedTaskId = $("#pomodoro-task")?.value || "";
            state.focusLog.push({
                id: makeId(),
                minutes: state.pomodoro.focus,
                date: new Date().toISOString(),
                taskId: selectedTaskId
            });
            state.pomodoro.sessions += 1;
            saveData();
            showToast("Sessão de foco concluída. Hora de descansar!", "success");
            notifyUser("NEXUS — Foco concluído", "Sua sessão de foco terminou. Faça uma pausa.");
            setPomodoroMode(state.pomodoro.sessions % 4 === 0 ? "longBreak" : "shortBreak", true);
        } else {
            showToast("Pausa concluída. Pronto para voltar ao foco?", "success");
            notifyUser("NEXUS — Pausa concluída", "Seu intervalo terminou.");
            setPomodoroMode("focus", false);
        }

        renderAll();
    }

    function savePomodoroSettings() {
        const focus = Number($("#focus-duration").value);
        const shortBreak = Number($("#short-break-duration").value);
        const longBreak = Number($("#long-break-duration").value);

        if (!Number.isInteger(focus) || focus < 1 || focus > 180 ||
            !Number.isInteger(shortBreak) || shortBreak < 1 || shortBreak > 60 ||
            !Number.isInteger(longBreak) || longBreak < 1 || longBreak > 90) {
            showToast("Use valores inteiros dentro dos limites indicados.", "error");
            return;
        }

        pauseTimer();
        state.pomodoro.focus = focus;
        state.pomodoro.shortBreak = shortBreak;
        state.pomodoro.longBreak = longBreak;
        state.timer.remaining = (state.pomodoro[state.pomodoro.mode] || focus) * 60;
        saveData();
        renderPomodoro();
        showToast("Configurações do Pomodoro salvas.", "success");
    }

    async function requestNotifications() {
        if (!("Notification" in window)) {
            showToast("Este navegador não oferece notificações web.", "error");
            updateNotificationStatus();
            return;
        }

        if (Notification.permission === "granted") {
            showToast("As notificações já estão ativadas.", "success");
            updateNotificationStatus();
            return;
        }

        if (Notification.permission === "denied") {
            showToast("As notificações estão bloqueadas nas permissões do navegador.", "error");
            updateNotificationStatus();
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            updateNotificationStatus();
            showToast(
                permission === "granted"
                    ? "Notificações ativadas."
                    : "Permissão de notificação não concedida.",
                permission === "granted" ? "success" : "info"
            );
        } catch (error) {
            console.error("Falha ao solicitar notificações:", error);
            showToast("Não foi possível solicitar a permissão de notificações.", "error");
        }
    }

    function notifyUser(title, body) {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        try {
            new Notification(title, { body });
        } catch (error) {
            console.warn("Não foi possível exibir a notificação:", error);
        }
    }

    function updateNotificationStatus() {
        const status = $("#notification-permission-status");
        if (!status) return;

        if (!("Notification" in window)) {
            status.textContent = "Este navegador não oferece notificações web.";
            return;
        }

        const messages = {
            granted: "Notificações permitidas neste navegador.",
            denied: "Notificações bloqueadas. Verifique as permissões do site no navegador.",
            default: "Permissão ainda não concedida."
        };
        status.textContent = messages[Notification.permission] || messages.default;
    }

    function checkReminders() {
        const now = Date.now();
        let changed = false;

        for (const reminder of state.reminders) {
            const timestamp = new Date(reminder.datetime).getTime();
            if (!reminder.fired && timestamp <= now) {
                reminder.fired = true;
                changed = true;
                showToast(`Lembrete: ${reminder.title}`, "info");
                notifyUser(`NEXUS — ${reminder.title}`, reminder.message || "Você tem um lembrete.");
            }
        }

        if (changed) {
            saveData();
            renderReminders();
        }
    }

    function exportData() {
        const data = {
            app: "NEXUS",
            version: 1,
            exportedAt: new Date().toISOString(),
            tasks: state.tasks,
            goals: state.goals,
            reminders: state.reminders,
            focusLog: state.focusLog,
            pomodoro: {
                focus: state.pomodoro.focus,
                shortBreak: state.pomodoro.shortBreak,
                longBreak: state.pomodoro.longBreak,
                sessions: state.pomodoro.sessions,
                mode: state.pomodoro.mode
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `nexus-backup-${dateKey(new Date())}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast("Backup exportado.", "success");
    }

    function importDataFromFile(file) {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showToast("O arquivo é grande demais. O limite é 10 MB.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(String(reader.result || ""));
                if (!data || typeof data !== "object" ||
                    !Array.isArray(data.tasks) ||
                    !Array.isArray(data.goals) ||
                    !Array.isArray(data.reminders)) {
                    throw new Error("Este arquivo não parece ser um backup NEXUS válido.");
                }

                const importedTasks = data.tasks.map(normalizeTask).filter(Boolean);
                const importedGoals = data.goals.map(normalizeGoal).filter(Boolean);
                const importedReminders = data.reminders.map(normalizeReminder).filter(Boolean);
                const importedFocusLog = Array.isArray(data.focusLog)
                    ? data.focusLog.map(normalizeFocusLog).filter(Boolean) : [];

                if (!window.confirm(
                    `Importar este backup substituirá os dados atuais.\n\n` +
                    `Tarefas: ${importedTasks.length}\n` +
                    `Metas: ${importedGoals.length}\n` +
                    `Lembretes: ${importedReminders.length}\n\n` +
                    `Deseja continuar?`
                )) return;

                state.tasks = importedTasks;
                state.goals = importedGoals;
                state.reminders = importedReminders;
                state.focusLog = importedFocusLog;

                if (data.pomodoro && typeof data.pomodoro === "object") {
                    state.pomodoro.focus = validNumber(data.pomodoro.focus, 25, 1, 180);
                    state.pomodoro.shortBreak = validNumber(data.pomodoro.shortBreak, 5, 1, 60);
                    state.pomodoro.longBreak = validNumber(data.pomodoro.longBreak, 15, 1, 90);
                    state.pomodoro.sessions = validNumber(data.pomodoro.sessions, 0, 0, 1000000);
                    state.pomodoro.mode = ["focus", "shortBreak", "longBreak"].includes(data.pomodoro.mode)
                        ? data.pomodoro.mode : "focus";
                }

                pauseTimer();
                state.timer.remaining = state.pomodoro.focus * 60;
                state.pomodoro.mode = "focus";
                saveData();
                renderAll();
                showToast("Backup importado com sucesso.", "success");
            } catch (error) {
                console.error("Erro ao importar backup:", error);
                showToast(error.message || "Não foi possível ler o arquivo de backup.", "error");
            } finally {
                $("#import-file-input").value = "";
            }
        };

        reader.onerror = () => {
            showToast("Não foi possível ler o arquivo selecionado.", "error");
            $("#import-file-input").value = "";
        };

        reader.readAsText(file);
    }

    function clearAllData() {
        const confirmation = window.confirm(
            "Tem certeza de que deseja apagar todas as tarefas, metas, lembretes e registros de foco deste navegador?\n\nEsta ação não pode ser desfeita. Exporte um backup antes, se necessário."
        );
        if (!confirmation) return;

        pauseTimer();
        state.tasks = [];
        state.goals = [];
        state.reminders = [];
        state.focusLog = [];
        state.pomodoro.sessions = 0;
        state.pomodoro.mode = "focus";
        state.timer.remaining = state.pomodoro.focus * 60;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error("Falha ao limpar armazenamento:", error);
        }

        saveData();
        renderAll();
        showToast("Dados locais apagados.", "success");
    }

    function updateHeaderDate() {
        const now = new Date();
        $("#header-date").textContent = formatDate(now, {
            weekday: "short",
            day: "2-digit",
            month: "short"
        });

        $("#welcome-date").textContent = formatDate(now, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function bindEvents() {
        $$(".nav-item[data-page]").forEach(button => {
            button.addEventListener("click", () => showPage(button.dataset.page));
        });

        $$("[data-go]").forEach(button => {
            button.addEventListener("click", () => showPage(button.dataset.go));
        });

        $("#menu-toggle").addEventListener("click", toggleMobileMenu);
        $("#mobile-overlay").addEventListener("click", closeMobileMenu);

        $("#quick-add-task").addEventListener("click", () => openTaskDialog());
        $("#dashboard-add-task").addEventListener("click", () => openTaskDialog());
        $("#add-task-button").addEventListener("click", () => openTaskDialog());
        $("#calendar-add-task").addEventListener("click", () => openTaskDialog(null, state.selectedDate));

        $("#add-goal-button").addEventListener("click", () => openGoalDialog());
        $("#add-reminder-button").addEventListener("click", () => openReminderDialog());

        $("#task-form").addEventListener("submit", handleTaskSubmit);
        $("#goal-form").addEventListener("submit", handleGoalSubmit);
        $("#reminder-form").addEventListener("submit", handleReminderSubmit);

        $$("[data-close-dialog]").forEach(button => {
            button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
        });

        $$(".app-dialog").forEach(dialog => {
            dialog.addEventListener("click", event => {
                if (event.target === dialog) dialog.close();
            });
        });

        $("#task-search").addEventListener("input", renderTasksPage);
        $("#task-filter").addEventListener("change", renderTasksPage);
        $("#task-priority-filter").addEventListener("change", renderTasksPage);

        document.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) return;
            handleAction(button.dataset.action, button.dataset.id, button);
        });

        $("#calendar-prev").addEventListener("click", () => moveCalendar(-1));
        $("#calendar-next").addEventListener("click", () => moveCalendar(1));
        $("#calendar-today").addEventListener("click", () => {
            const today = new Date();
            state.calendarDate = today;
            state.selectedDate = dateKey(today);
            renderCalendar();
            renderMiniCalendar();
        });

        $("#pomodoro-start").addEventListener("click", startTimer);
        $("#pomodoro-reset").addEventListener("click", () => {
            pauseTimer();
            const duration = state.pomodoro[state.pomodoro.mode] || state.pomodoro.focus;
            state.timer.remaining = duration * 60;
            renderPomodoro();
            showToast("Temporizador reiniciado.", "info");
        });
        $("#pomodoro-save-settings").addEventListener("click", savePomodoroSettings);

        $("#notification-button").addEventListener("click", requestNotifications);
        $("#settings-notifications").addEventListener("click", requestNotifications);

        $("#export-data-button").addEventListener("click", exportData);
        $("#import-data-button").addEventListener("click", () => $("#import-file-input").click());
        $("#import-file-input").addEventListener("change", event => {
            importDataFromFile(event.target.files?.[0]);
        });

        $("#clear-data-button").addEventListener("click", clearAllData);

        $("#profile-button").addEventListener("click", () => {
            showToast("NEXUS funciona localmente neste navegador.", "info");
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") closeMobileMenu();

            const target = event.target;
            const typing = target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

            if (event.code === "Space" && !typing && !event.repeat &&
                $("#page-pomodoro").classList.contains("active")) {
                event.preventDefault();
                startTimer();
            }
        });

        window.addEventListener("beforeunload", () => {
            if (state.timer.running) {
                pauseTimer();
            }
        });
    }

    function init() {
        loadData();
        bindEvents();
        updateHeaderDate();

        state.timer.remaining = state.pomodoro.focus * 60;
        renderAll();

        window.setInterval(checkReminders, 15000);
        checkReminders();

        window.setInterval(() => {
            const currentDate = dateKey(new Date());
            if (currentDate !== state.selectedDate && state.selectedDate === dateKey(new Date(Date.now() - 86400000))) {
                state.selectedDate = currentDate;
                state.calendarDate = new Date();
                renderAll();
            }
            updateHeaderDate();
        }, 60000);

        if (location.protocol === "file:") {
            console.info("NEXUS está aberto como arquivo local. Para notificações mais confiáveis, use HTTPS ou localhost.");
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();