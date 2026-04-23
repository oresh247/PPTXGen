// ========== КОНФИГУРАЦИЯ API ==========
// Выберите тип API: 'gemini', 'ollama', 'openai', 'custom', 'sfera', 'auto'
// 'auto' - автоматически попробует определить доступный API
const API_TYPE = 'sfera'; // Используем API Sfera

// Настройки для Gemini API
const GEMINI_API_KEY = 'AIzaSyDmQjhdKPWMCDr2Gtddf_SCkZcewfWDM-4'.trim();
const GEMINI_MODEL = "gemini-3-flash-preview";

// Настройки для локального Ollama API
const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama2'; // Или название вашей модели

// Настройки для OpenAI-совместимого API (локальный или внешний)
const OPENAI_BASE_URL = 'http://localhost:1234/v1'; // Или другой endpoint
const OPENAI_API_KEY = 'not-needed'; // Для локальных серверов может не требоваться
const OPENAI_MODEL = 'gpt-3.5-turbo';

// Настройки для API Sfera (devportal)
const SFERA_BASE_URL = 'https://sfera.inno.local/app/devportal/api/dvpr-gateway/dvpr-ai-service';
const SFERA_CHATS_URL = `${SFERA_BASE_URL}/api/chats`;
// URL для получения ответа от модели (найден из анализа веб-чата)
const SFERA_INFERENCE_URL = 'https://sfera.inno.local/app/devportal/api/dvpr-gateway/innocode/inference-vllm/v1/chat/completions';
const SFERA_MODELS_URL = SFERA_INFERENCE_URL.replace('/chat/completions', '/models');
// URL для поиска кода в репозиториях
const SFERA_PLUGIN_QUERY_URL = 'https://sfera.inno.local/app/devportal/api/dvpr-gateway/innocode-server/pimapi/project/plugin_query';
const SFERA_MODEL = 'Qwen3-Next-80B-A3B-Instruct-AWQ-4bit'; // Internal ID модели Qwen3-72B-Chat
const SFERA_FALLBACK_MODELS = ['qwen2-5-coder-32b-instruct-awq']; // Автооткат, если новая модель недоступна
const SFERA_MAX_CONTEXT_TOKENS = 96000; // Окно контекста новой модели
const SFERA_MAX_OUTPUT_TOKENS = 8000; // Практичный лимит длины ответа
// URL для получения данных задач
const SFERA_TASKS_API_URL = 'https://sfera.inno.local/app/tasks/api/v0.1/entities';
// URL для поиска задач по запросу (entity-views, как в GSferaUtility)
const SFERA_ENTITY_VIEWS_URL = 'https://sfera.inno.local/app/tasks/api/v1/entity-views';
// Запрос для "мои задачи": подзадачи текущего пользователя, не в статусе Done
const MY_TASKS_QUERY = "statusCategory!='Done' and type='subtask' and area='SKOKR' and assignee=me()";
// Базовый запрос для задач по исполнителю (без assignee in (...))
const TASKS_BY_ASSIGNEE_BASE_QUERY = "statusCategory!='Done' and type='subtask' and area='SKOKR'";
// Атрибуты для списка задач в entity-views
const ENTITY_VIEWS_ATTRIBUTES = 'number,name,status,priority,assignee,owner,actualSprint,dueDate,parent,createDate';
// URL поиска исполнителей
const SFERA_ASSIGNEE_VALUES_URL = 'https://sfera.inno.local/app/tasks/api/v1/attribute-views/assignee/values';
const SFERA_JWT_TOKEN = '';

// Настройка передачи контекста для Sfera API
// Если true - передается полный промпт с контекстом страницы в inference API
// Если false - передается только вопрос пользователя
const SFERA_INCLUDE_CONTEXT = true; // Включаем контекст для работы с текстом страницы

// Настройки для кастомного API (для плагина IDEA)
// Популярные варианты для локальных серверов:
const CUSTOM_API_URLS = [
    'http://localhost:8080/api/chat',
    'http://localhost:8080/v1/chat/completions',
    'http://localhost:11434/api/generate',
    'http://127.0.0.1:8080/api/chat',
    'http://localhost:5000/api/chat'
];
const CUSTOM_API_KEY = ''; // Если требуется авторизация

// Определенный тип API после автоопределения
let detectedApiType = null;

// Хранилище для чата Sfera
let sferaChatId = null;
// Выбранные репозитории для контекста
let selectedRepos = [];

// Данные проектов и репозиториев
const PROJECTS = ['GOLD_PUB', 'OSSO', 'SKMB'];
const REPOSITORIES = {
    'GOLD_PUB': [],
    'OSSO': [],
    'SKMB': [
        'edto-analyzer',
        'skmb-application-service',
        'skmb-client-default-adapter',
        'skmb-client-profile-adapter',
        'skmb-cr-factor-adapter',
        'skmb-credithistory-reactive-service',
        'skmb-currency-service',
        'skmb-dictionary-service',
        'skmb-digital-profile-adapter',
        'skmb-drp-reactive-adapter',
        'skmb-dto-exchange',
        'skmb-external-sources-adapter',
        'skmb-fin-condition-adapter',
        'skmb-fin-statements-adapter',
        'skmb-front-adapter',
        'skmb-fs-analysis-service',
        'skmb-fs-trigger-adapter',
        'skmb-leasing-front-adapter',
        'skmb-manual-verify-adapter',
        'skmb-monitoring-service',
        'skmb-moratorium-service',
        'skmb-notification-adapter',
        'skmb-okr-reactive-service-v2',
        'skmb-pim-adapter',
        'skmb-pledge-adapter',
        'skmb-rating-adapter',
        'skmb-reactive-dto',
        'skmb-revision-service',
        'skmb-spr3'
    ]
};
// ========================================

const chatDiv = document.getElementById('chat');
const input = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const summaryBtn = document.getElementById('summaryBtn');
const copyLastResponseBtn = document.getElementById('copyLastResponseBtn');
const savePromptQuickBtn = document.getElementById('savePromptQuickBtn');
const newChatBtn = document.getElementById('newChatBtn');
const typingIndicator = document.getElementById('typing-indicator');
const repoProject = document.getElementById('repoProject');
const repoRepository = document.getElementById('repoRepository');
const repoBranch = document.getElementById('repoBranch');
const addRepoBtn = document.getElementById('addRepoBtn');
const selectedReposDiv = document.getElementById('selectedRepos');
const promptLibHeader = document.getElementById('promptLibHeader');
const promptLibContent = document.getElementById('promptLibContent');
const promptLibToggle = document.getElementById('promptLibToggle');
const promptTitleInput = document.getElementById('promptTitleInput');
const promptTagsInput = document.getElementById('promptTagsInput');
const promptGroupSelect = document.getElementById('promptGroupSelect');
const promptFilterGroupSelect = document.getElementById('promptFilterGroupSelect');
const promptSearchInput = document.getElementById('promptSearchInput');
const promptList = document.getElementById('promptList');
const savePromptBtn = document.getElementById('savePromptBtn');
const newPromptGroupBtn = document.getElementById('newPromptGroupBtn');
const taskContextModeSelect = document.getElementById('taskContextModeSelect');

const PROMPT_LIBRARY_STORAGE_KEY = 'promptLibraryV1';
const TASK_CONTEXT_MODE_STORAGE_KEY = 'taskContextModeV1';
const DEFAULT_GROUP_ID = 'group_general';
const ALL_GROUPS_FILTER = '__all__';
const TASK_CONTEXT_MODES = {
    ASK: 'ask',
    ALWAYS: 'always',
    NEVER: 'never'
};

let pageContext = ""; 

// Глобальный счетчик для уникальных ID блоков кода
let globalCodeBlockCounter = 0;
let promptLibrary = {
    version: 1,
    groups: [{ id: DEFAULT_GROUP_ID, name: 'Общее' }],
    prompts: []
};
let lastSentPrompt = '';
let promptEditingId = null;
let taskContextMode = TASK_CONTEXT_MODES.ASK;

function setPromptSaveModeCreate() {
    promptEditingId = null;
    if (savePromptBtn) {
        savePromptBtn.textContent = '💾';
        savePromptBtn.title = 'Сохранить запрос';
        savePromptBtn.setAttribute('aria-label', 'Сохранить запрос');
    }
    if (savePromptQuickBtn) {
        savePromptQuickBtn.textContent = '💾 Сохранить запрос';
        savePromptQuickBtn.title = 'Сохранить запрос';
        savePromptQuickBtn.setAttribute('aria-label', 'Сохранить запрос');
    }
}

function setPromptSaveModeEdit(promptId) {
    promptEditingId = promptId;
    if (savePromptBtn) {
        savePromptBtn.textContent = '💾';
        savePromptBtn.title = 'Сохранить изменения';
        savePromptBtn.setAttribute('aria-label', 'Сохранить изменения');
    }
    if (savePromptQuickBtn) {
        savePromptQuickBtn.textContent = '💾 Сохранить изменения';
        savePromptQuickBtn.title = 'Сохранить изменения';
        savePromptQuickBtn.setAttribute('aria-label', 'Сохранить изменения');
    }
}

function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function parseTags(rawTags) {
    if (!rawTags) {
        return [];
    }
    return rawTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(Boolean);
}

async function loadPromptLibrary() {
    try {
        const data = await chrome.storage.local.get([PROMPT_LIBRARY_STORAGE_KEY]);
        const saved = data[PROMPT_LIBRARY_STORAGE_KEY];
        if (saved && typeof saved === 'object') {
            const groups = Array.isArray(saved.groups) && saved.groups.length > 0
                ? saved.groups
                : [{ id: DEFAULT_GROUP_ID, name: 'Общее' }];
            const prompts = Array.isArray(saved.prompts) ? saved.prompts : [];
            promptLibrary = {
                version: 1,
                groups,
                prompts
            };
        }
    } catch (error) {
        console.error('Ошибка загрузки библиотеки промптов:', error);
    }
}

async function persistPromptLibrary() {
    try {
        await chrome.storage.local.set({
            [PROMPT_LIBRARY_STORAGE_KEY]: promptLibrary
        });
    } catch (error) {
        console.error('Ошибка сохранения библиотеки промптов:', error);
    }
}

function normalizeTaskContextMode(value) {
    const allowedModes = Object.values(TASK_CONTEXT_MODES);
    return allowedModes.includes(value) ? value : TASK_CONTEXT_MODES.ASK;
}

async function loadTaskContextMode() {
    try {
        const data = await chrome.storage.local.get([TASK_CONTEXT_MODE_STORAGE_KEY]);
        taskContextMode = normalizeTaskContextMode(data[TASK_CONTEXT_MODE_STORAGE_KEY]);
    } catch (error) {
        taskContextMode = TASK_CONTEXT_MODES.ASK;
        console.error('Ошибка загрузки режима контекста задач:', error);
    }

    if (taskContextModeSelect) {
        taskContextModeSelect.value = taskContextMode;
    }
}

async function persistTaskContextMode(mode) {
    const normalizedMode = normalizeTaskContextMode(mode);
    taskContextMode = normalizedMode;
    try {
        await chrome.storage.local.set({
            [TASK_CONTEXT_MODE_STORAGE_KEY]: normalizedMode
        });
    } catch (error) {
        console.error('Ошибка сохранения режима контекста задач:', error);
    }
}

function getGroupName(groupId) {
    const group = promptLibrary.groups.find(item => item.id === groupId);
    return group ? group.name : 'Без группы';
}

function renderPromptGroupOptions() {
    if (!promptGroupSelect || !promptFilterGroupSelect) {
        return;
    }

    promptGroupSelect.innerHTML = '';
    promptFilterGroupSelect.innerHTML = '';

    const groupPlaceholder = document.createElement('option');
    groupPlaceholder.value = '';
    groupPlaceholder.textContent = 'Без группы';
    promptGroupSelect.appendChild(groupPlaceholder);

    const allOption = document.createElement('option');
    allOption.value = ALL_GROUPS_FILTER;
    allOption.textContent = 'Все группы';
    promptFilterGroupSelect.appendChild(allOption);

    promptLibrary.groups.forEach(group => {
        const createOption = document.createElement('option');
        createOption.value = group.id;
        createOption.textContent = group.name;
        promptGroupSelect.appendChild(createOption);

        const filterOption = document.createElement('option');
        filterOption.value = group.id;
        filterOption.textContent = group.name;
        promptFilterGroupSelect.appendChild(filterOption);
    });

    if (!promptFilterGroupSelect.value) {
        promptFilterGroupSelect.value = ALL_GROUPS_FILTER;
    }
}

function filterPrompts() {
    const search = (promptSearchInput?.value || '').trim().toLowerCase();
    const filterGroupId = promptFilterGroupSelect?.value || ALL_GROUPS_FILTER;

    return promptLibrary.prompts.filter(prompt => {
        const promptGroupId = typeof prompt.groupId === 'string' ? prompt.groupId : '';
        const matchesGroup = filterGroupId === ALL_GROUPS_FILTER || promptGroupId === filterGroupId;
        if (!matchesGroup) {
            return false;
        }

        if (!search) {
            return true;
        }

        const inTitle = (prompt.title || '').toLowerCase().includes(search);
        const inTags = Array.isArray(prompt.tags) && prompt.tags.some(tag => tag.includes(search));
        return inTitle || inTags;
    });
}

function renderPromptList() {
    if (!promptList) {
        return;
    }

    promptList.innerHTML = '';
    const filtered = filterPrompts();

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Нет сохраненных запросов по текущему фильтру.';
        promptList.appendChild(empty);
        return;
    }

    filtered
        .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
        .forEach(prompt => {
            const item = document.createElement('div');
            item.className = 'prompt-item';

            const title = document.createElement('div');
            title.className = 'prompt-title';
            title.textContent = prompt.title;

            const meta = document.createElement('div');
            meta.className = 'prompt-meta';
            const tags = Array.isArray(prompt.tags) && prompt.tags.length > 0
                ? `#${prompt.tags.join(' #')}`
                : 'без тегов';
            const groupName = getGroupName(prompt.groupId);
            meta.textContent = `${groupName} | ${tags}`;

            const actions = document.createElement('div');
            actions.className = 'prompt-actions';

            const runBtn = document.createElement('button');
            runBtn.className = 'mini-btn primary';
            runBtn.textContent = 'Отправить';
            runBtn.addEventListener('click', () => usePrompt(prompt.id, true));

            const fillBtn = document.createElement('button');
            fillBtn.className = 'mini-btn';
            fillBtn.textContent = 'Вставить';
            fillBtn.addEventListener('click', () => usePrompt(prompt.id, false));

            const editBtn = document.createElement('button');
            editBtn.className = 'mini-btn';
            editBtn.textContent = 'Изменить';
            editBtn.addEventListener('click', () => startEditPrompt(prompt.id));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'mini-btn danger';
            deleteBtn.textContent = 'Удалить';
            deleteBtn.addEventListener('click', () => deletePrompt(prompt.id));

            actions.appendChild(runBtn);
            actions.appendChild(fillBtn);
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            item.appendChild(title);
            item.appendChild(meta);
            item.appendChild(actions);

            promptList.appendChild(item);
        });
}

async function saveCurrentPrompt(customTitle) {
    if (!input) {
        return;
    }

    const isEditing = typeof promptEditingId === 'string' && promptEditingId.length > 0;
    const explicitTitle = typeof customTitle === 'string' ? customTitle : '';
    const title = (explicitTitle || promptTitleInput?.value || '').trim();
    const content = (isEditing ? (input.value || '') : (lastSentPrompt || input.value || '')).trim();
    const groupId = promptGroupSelect?.value || '';
    const tags = parseTags(promptTagsInput?.value || '');

    if (!title) {
        appendMessage('Система', '⚠️ Укажите краткое имя для запроса.');
        return;
    }
    if (!content) {
        appendMessage('Система', isEditing ? '⚠️ В поле запроса нет текста для изменений.' : '⚠️ Нет отправленного запроса для сохранения.');
        return;
    }

    const now = new Date().toISOString();
    if (isEditing) {
        const existing = promptLibrary.prompts.find(item => item.id === promptEditingId);
        if (!existing) {
            appendMessage('Система', '⚠️ Не удалось найти редактируемый запрос.');
            setPromptSaveModeCreate();
            return;
        }
        existing.title = title;
        existing.content = content;
        existing.groupId = groupId;
        existing.tags = tags;
        existing.updatedAt = now;
        lastSentPrompt = content;
    } else {
        const prompt = {
            id: generateId('prompt'),
            title,
            content,
            groupId,
            tags,
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
            lastUsedAt: null
        };
        promptLibrary.prompts.push(prompt);
    }
    await persistPromptLibrary();
    renderPromptList();
    if (promptTitleInput) {
        promptTitleInput.value = '';
    }
    if (promptTagsInput) {
        promptTagsInput.value = '';
    }
    setPromptSaveModeCreate();
    appendMessage('Система', `✅ Запрос "${title}" сохранен.`);
}

async function quickSaveCurrentPrompt() {
    if (!input) {
        return;
    }
    if (promptEditingId) {
        await saveCurrentPrompt();
        return;
    }
    const content = (lastSentPrompt || input.value || '').trim();
    if (!content) {
        appendMessage('Система', '⚠️ Нет отправленного запроса для сохранения.');
        return;
    }
    const defaultTitle = content.length > 40 ? `${content.slice(0, 40)}...` : content;
    const title = window.prompt('Краткое имя запроса:', defaultTitle);
    if (title === null) {
        return;
    }
    await saveCurrentPrompt(title);
}

async function usePrompt(promptId, sendNow) {
    const prompt = promptLibrary.prompts.find(item => item.id === promptId);
    if (!prompt) {
        return;
    }

    // Если пользователь переключился на другой промпт — выходим из режима редактирования.
    setPromptSaveModeCreate();

    if (input) {
        input.value = prompt.content;
        input.focus();
    }

    prompt.usageCount = (prompt.usageCount || 0) + 1;
    prompt.lastUsedAt = new Date().toISOString();
    prompt.updatedAt = prompt.lastUsedAt;
    await persistPromptLibrary();
    renderPromptList();

    if (sendNow) {
        lastSentPrompt = prompt.content;
        appendMessage('Вы', prompt.content);
        if (input) {
            input.value = '';
        }
        callAI(prompt.content);
    }
}

async function renamePrompt(promptId) {
    const prompt = promptLibrary.prompts.find(item => item.id === promptId);
    if (!prompt) {
        return;
    }
    const nextTitle = window.prompt('Новое имя запроса:', prompt.title);
    if (nextTitle === null) {
        return;
    }
    const normalized = nextTitle.trim();
    if (!normalized) {
        appendMessage('Система', '⚠️ Имя не может быть пустым.');
        return;
    }
    prompt.title = normalized;
    prompt.updatedAt = new Date().toISOString();
    await persistPromptLibrary();
    renderPromptList();
}

async function deletePrompt(promptId) {
    const prompt = promptLibrary.prompts.find(item => item.id === promptId);
    if (!prompt) {
        return;
    }
    const confirmed = window.confirm(`Удалить запрос "${prompt.title}"?`);
    if (!confirmed) {
        return;
    }
    promptLibrary.prompts = promptLibrary.prompts.filter(item => item.id !== promptId);
    if (promptEditingId === promptId) {
        setPromptSaveModeCreate();
    }
    await persistPromptLibrary();
    renderPromptList();
}

async function createPromptGroup() {
    const groupName = window.prompt('Название новой группы:');
    if (groupName === null) {
        return;
    }
    const normalized = groupName.trim();
    if (!normalized) {
        appendMessage('Система', '⚠️ Название группы не может быть пустым.');
        return;
    }
    const exists = promptLibrary.groups.some(group => group.name.toLowerCase() === normalized.toLowerCase());
    if (exists) {
        appendMessage('Система', '⚠️ Группа с таким названием уже существует.');
        return;
    }
    const createdGroup = {
        id: generateId('group'),
        name: normalized
    };
    promptLibrary.groups.push(createdGroup);
    await persistPromptLibrary();
    renderPromptGroupOptions();
    if (promptGroupSelect) {
        promptGroupSelect.value = createdGroup.id;
    }
}

function togglePromptLibraryCollapse() {
    if (!promptLibContent || !promptLibToggle) {
        return;
    }
    const isCollapsed = promptLibContent.classList.contains('collapsed');
    if (isCollapsed) {
        promptLibContent.classList.remove('collapsed');
        promptLibToggle.classList.remove('collapsed');
    } else {
        promptLibContent.classList.add('collapsed');
        promptLibToggle.classList.add('collapsed');
    }
}

// Управление индикатором загрузки
function setLoader(show) {
    if (typingIndicator) typingIndicator.style.display = show ? 'block' : 'none';
    summaryBtn.disabled = show;
    analyzeBtn.disabled = show;
    sendBtn.disabled = show;
    input.disabled = show;
}

// Выполняет запросы к Sfera API с cookie текущей сессии.
async function sferaFetch(url, options = {}) {
    const jwt_token = await getSferaJwtToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(jwt_token ? { 'Authorization': `Bearer ${jwt_token}` } : {}),
        ...(options.headers || {})
    };
    return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });
}

function parseSferaErrorPayload(error_text) {
    try {
        return JSON.parse(error_text);
    } catch (error) {
        return { message: error_text || 'Неизвестная ошибка' };
    }
}

function extractSferaErrorMessage(error_data) {
    return error_data?.error?.message || error_data?.message || 'Неизвестная ошибка';
}

function buildSferaModelCandidates(configured_model, available_models = [], fallback_models = []) {
    const source_model = (configured_model || '').trim();
    const candidates = [
        source_model,
        source_model.toLowerCase(),
        source_model.replace(/-4bit$/i, ''),
        source_model.toLowerCase().replace(/-4bit$/i, '')
    ].filter(Boolean);

    if (Array.isArray(available_models) && available_models.length > 0) {
        const exact_case_insensitive = available_models.find(
            (model_name) => model_name.toLowerCase() === source_model.toLowerCase()
        );
        if (exact_case_insensitive) {
            candidates.unshift(exact_case_insensitive);
        }

        const likely_qwen3 = available_models.find(
            (model_name) => /qwen3/i.test(model_name) && /80b/i.test(model_name) && /a3b/i.test(model_name)
        );
        if (likely_qwen3) {
            candidates.unshift(likely_qwen3);
        }
    }

    if (Array.isArray(fallback_models) && fallback_models.length > 0) {
        candidates.push(...fallback_models.filter((model_name) => typeof model_name === 'string' && model_name.trim().length > 0));
    }

    return [...new Set(candidates)];
}

async function getSferaAvailableModels() {
    try {
        const models_response = await sferaFetch(SFERA_MODELS_URL, { method: 'GET' });
        if (!models_response.ok) {
            return [];
        }

        const models_data = await models_response.json();
        if (Array.isArray(models_data?.data)) {
            return models_data.data
                .map((item) => item?.id)
                .filter((model_name) => typeof model_name === 'string' && model_name.length > 0);
        }
        if (Array.isArray(models_data?.models)) {
            return models_data.models
                .map((item) => (typeof item === 'string' ? item : item?.id))
                .filter((model_name) => typeof model_name === 'string' && model_name.length > 0);
        }
        return [];
    } catch (error) {
        console.warn('Не удалось получить список моделей Sfera:', error);
        return [];
    }
}

function isLikelyJwtToken(value) {
    return typeof value === 'string' && /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(value);
}

async function getJwtFromChromeStorage() {
    try {
        const storage_data = await chrome.storage.local.get([
            'sferaJwtToken',
            'jwtToken',
            'accessToken',
            'token',
            'authToken'
        ]);
        const candidates = Object.values(storage_data);
        return candidates.find(isLikelyJwtToken) || '';
    } catch (error) {
        return '';
    }
}

async function getJwtFromSferaTab() {
    try {
        const tabs = await chrome.tabs.query({ url: 'https://sfera.inno.local/*' });
        if (!tabs || tabs.length === 0 || !tabs[0].id) {
            return '';
        }

        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                const jwt_regex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
                const keys = Object.keys(window.localStorage || {});
                for (const key of keys) {
                    const raw = window.localStorage.getItem(key);
                    if (!raw || typeof raw !== 'string') {
                        continue;
                    }

                    if (jwt_regex.test(raw)) {
                        return raw;
                    }

                    try {
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed === 'object') {
                            const nested_values = Object.values(parsed);
                            for (const nested of nested_values) {
                                if (typeof nested === 'string' && jwt_regex.test(nested)) {
                                    return nested;
                                }
                            }
                        }
                    } catch (error) {
                        // ignore non-json values
                    }
                }
                return '';
            }
        });

        return result?.result && isLikelyJwtToken(result.result) ? result.result : '';
    } catch (error) {
        return '';
    }
}

async function getSferaJwtToken() {
    if (isLikelyJwtToken(SFERA_JWT_TOKEN)) {
        return SFERA_JWT_TOKEN;
    }

    const from_storage = await getJwtFromChromeStorage();
    if (from_storage) {
        return from_storage;
    }

    return getJwtFromSferaTab();
}

async function readResponseError(response) {
    try {
        const error_text = await response.text();
        if (!error_text) {
            return response.statusText || 'Пустое тело ошибки';
        }
        try {
            const parsed_error = JSON.parse(error_text);
            return parsed_error.message || parsed_error.error || JSON.stringify(parsed_error);
        } catch (error) {
            return error_text;
        }
    } catch (error) {
        return `Не удалось прочитать тело ошибки: ${error instanceof Error ? error.message : String(error)}`;
    }
}

// 1. Захват текста
async function grabPageText() {
    setLoader(true);
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id || tab.url.startsWith('chrome://')) {
            appendMessage('Система', '⚠️ Не могу прочитать системную страницу. Откройте любой сайт.');
            setLoader(false);
            return;
        }

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.body.innerText,
        });

        if (results && results[0] && results[0].result) {
            pageContext = results[0].result.trim();
            appendMessage('Система', `✅ Текст прочитан! (${pageContext.length} симв.)`);
        } else {
            appendMessage('Система', '⚠️ Не удалось получить текст со страницы.');
        }
    } catch (e) {
        console.error(e);
        appendMessage('Система', '❌ Ошибка доступа. Обновите страницу (F5).');
    }
    setLoader(false);
}

// 2. Автоматическое определение типа API
async function detectApiType() {
    if (detectedApiType) {
        return detectedApiType;
    }

    // Автоматическое определение API (без сообщения пользователю)

    // Проверяем Ollama
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            detectedApiType = 'ollama';
            return 'ollama';
        }
    } catch (e) {
        // Ollama недоступен
    }

    // Проверяем OpenAI-совместимый API
    try {
        const response = await fetch(`${OPENAI_BASE_URL}/models`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });
        if (response.ok) {
            detectedApiType = 'openai';
            return 'openai';
        }
    } catch (e) {
        // OpenAI API недоступен
    }

    // Проверяем API Sfera
    try {
        const response = await sferaFetch(SFERA_CHATS_URL + '?page=0&size=1', {
            method: 'GET'
        });
        if (response.ok || response.status === 200) {
            detectedApiType = 'sfera';
            return 'sfera';
        }
    } catch (e) {
        // Sfera API недоступен
    }

    // Проверяем кастомные API
    for (const url of CUSTOM_API_URLS) {
        try {
            const response = await fetch(url.replace('/api/chat', '/health').replace('/v1/chat/completions', '/health'), {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok || response.status === 404) { // 404 может означать, что сервер работает
                detectedApiType = 'custom';
                return 'custom';
            }
        } catch (e) {
            // Этот URL недоступен
        }
    }

    // По умолчанию используем Gemini
    detectedApiType = 'gemini';
    return 'gemini';
}

// Проверка, является ли запрос запросом на описание релиза
function isReleaseDescriptionQuery(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    const normalized = text.toLowerCase().trim();
    const phrases = [
        'сделай описание релиза',
        'описание релиза',
        'подготовь описание релиза',
        'создай описание релиза',
        'напиши описание релиза'
    ];
    return phrases.some(phrase => normalized === phrase || normalized.includes(phrase));
}

// Промпт для описания релиза
function getReleaseDescriptionPrompt() {
    return `Ты аналитик, который должен написать список задач, которые идут в релиз.
Список должен содержать:
1) Префиксы
[НФ] - если задача с бизнес функциональностью
[АР] - если архитектурная задача
[Дефект] - если это дефект

2) Строка списка формируется следующим образом:
Префикс Код задачи Название задачи
Пример:
[АР] SKOKR-8724 [skmb-dictionary-service] Переход на Spring Boot 3.5 для ИС 1864 и 1854 - (Разработка)

3) Нумерация пунктов списка не нужна

4) Сделай сортировку задач по названию

5) Выдели подготовленный список в блок, который можно скопировать, как блок кода`;
}

// 3. Универсальная функция отправки запроса к ИИ
async function callAI(userQuery) {
    setLoader(true);

    // Определяем тип API, если нужно
    let apiType = API_TYPE;
    if (API_TYPE === 'auto') {
        apiType = await detectApiType();
    }

    // Проверяем, является ли запрос запросом на описание релиза
    // Если да, заменяем userQuery на специальный промпт
    const actualUserQuery = isReleaseDescriptionQuery(userQuery) 
        ? getReleaseDescriptionPrompt() 
        : userQuery;

    // Формируем промпт: с контекстом страницы, если он есть, иначе просто вопрос пользователя
    const finalPrompt = pageContext.length > 0
        ? `Ты — профессиональный ассистент. 
Используй предоставленный текст страницы для ответа.

ТЕКСТ СТРАНИЦЫ (первые 20к символов):
${pageContext.slice(0, 20000)}

ЗАПРОС ПОЛЬЗОВАТЕЛЯ:
${actualUserQuery}`
        : actualUserQuery;

    try {
        let response;
        let responseData;

        switch (apiType) {
            case 'gemini':
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: finalPrompt }] }]
                    })
                });
                responseData = await response.json();
                
                if (responseData.error) {
                    appendMessage('Ошибка API', responseData.error.message);
                    setLoader(false);
                    return;
                }
                
                if (responseData.candidates && responseData.candidates[0].content) {
                    formatAndDisplayResponse(responseData.candidates[0].content.parts[0].text);
                } else {
                    appendMessage('Бот', 'ИИ не смог сгенерировать ответ.');
                }
                break;

            case 'ollama':
                response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: OLLAMA_MODEL,
                        prompt: finalPrompt,
                        stream: false
                    })
                });
                responseData = await response.json();
                
                if (responseData.error) {
                    appendMessage('Ошибка API', responseData.error);
                    setLoader(false);
                    return;
                }
                
                if (responseData.response) {
                    formatAndDisplayResponse(responseData.response);
                } else {
                    appendMessage('Бот', 'ИИ не смог сгенерировать ответ.');
                }
                break;

            case 'openai':
                response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: OPENAI_MODEL,
                        messages: [
                            { role: 'system', content: 'Ты — профессиональный ассистент.' },
                            { role: 'user', content: finalPrompt }
                        ]
                    })
                });
                responseData = await response.json();
                
                if (responseData.error) {
                    appendMessage('Ошибка API', responseData.error.message);
                    setLoader(false);
                    return;
                }
                
                if (responseData.choices && responseData.choices[0].message) {
                    formatAndDisplayResponse(responseData.choices[0].message.content);
                } else {
                    appendMessage('Бот', 'ИИ не смог сгенерировать ответ.');
                }
                break;

            case 'sfera':
                // API Sfera требует создания чата и отправки сообщений через PATCH
                try {
                    // 1. Инициализируем чат, если еще не инициализирован
                    if (!sferaChatId) {
                        await initSferaChat();
                        if (!sferaChatId) {
                            throw new Error('Не удалось инициализировать чат');
                        }
                    }
                    
                    // 2. Получаем существующие сообщения чата
                    let existingMessages = [];
                    try {
                        const getChatResponse = await sferaFetch(`${SFERA_BASE_URL}/api/chats/${sferaChatId}`, {
                            method: 'GET'
                        });
                        if (getChatResponse.ok) {
                            const chatData = await getChatResponse.json();
                            existingMessages = chatData.messages || [];
                            // Загружаем выбранные репозитории из чата (на случай, если они изменились)
                            if (chatData.selectedRepos && Array.isArray(chatData.selectedRepos)) {
                                selectedRepos = chatData.selectedRepos;
                                renderSelectedRepos();
                            }
                        }
                    } catch (e) {
                        // Игнорируем ошибку получения сообщений
                    }
                    
                    // 3. Отправляем сообщение в чат через PATCH
                    // Генерируем UUID для сообщений (точный формат UUID v4)
                    const generateUUID = () => {
                        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            const r = Math.random() * 16 | 0;
                            const v = c === 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                    };
                    
                    // Генерируем requestId в формате из примера: "57b0d06f4851-0d18-4914-95ca-9983b96a"
                    // Это не UUID, а строка из hex символов с дефисами
                    const generateRequestId = () => {
                        const hex = '0123456789abcdef';
                        const parts = [];
                        // Первая часть: 12 символов
                        parts.push(Array.from({length: 12}, () => hex[Math.floor(Math.random() * 16)]).join(''));
                        // Остальные 3 части по 4 символа
                        for (let i = 0; i < 3; i++) {
                            parts.push(Array.from({length: 4}, () => hex[Math.floor(Math.random() * 16)]).join(''));
                        }
                        return parts.join('-');
                    };
                    
                    const userMessageId = generateUUID();
                    const assistantMessageId = generateUUID();
                    const traceId = generateUUID();
                    const requestId = generateRequestId();
                    const timestamp = Date.now();
                    
                    // Создаем новое сообщение пользователя
                    // Используем контекст только если он есть и включен
                    const messageContent = (SFERA_INCLUDE_CONTEXT && pageContext.length > 0) ? finalPrompt : actualUserQuery;
                    
                    const newUserMessage = {
                        role: 'user',
                        content: messageContent,
                        id: userMessageId,
                        timestamp: timestamp
                    };
                    
                    // Формируем массив: существующие + новое user сообщение (как в веб-чате)
                    const messagesToSend = existingMessages.length > 0 
                        ? [...existingMessages, newUserMessage]
                        : [newUserMessage];
                    
                    const chatUpdateUrl = `${SFERA_BASE_URL}/api/chats/${sferaChatId}`;
                    
                    let requestBody = {
                        messages: messagesToSend
                    };
                    
                    response = await fetch(chatUpdateUrl, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorData;
                        try {
                            errorData = JSON.parse(errorText);
                        } catch (e) {
                            errorData = { message: errorText || 'Неизвестная ошибка' };
                        }
                        
                        console.error('=== Ошибка API ===');
                        console.error('Status:', response.status);
                        console.error('Error Data:', errorData);
                        console.error('Request Body:', JSON.stringify(requestBody, null, 2));
                        
                        appendMessage('Ошибка', `Не удалось отправить сообщение: ${errorData.message || errorData.error || 'Неизвестная ошибка'}`);
                        throw new Error(`Ошибка отправки сообщения: ${response.status} - ${errorData.message || errorData.error || JSON.stringify(errorData) || response.statusText}`);
                    }
                    
                    responseData = await response.json();
                    
                    // 3.5. Контекст по задачам: приоритетно подтягиваем данные по указанным номерам задач
                    let taskContextText = '';
                    const taskNumbers = resolveTaskNumbersForContext(actualUserQuery, pageContext);
                    const hasMyTasksQuery = isMyTasksQuery(actualUserQuery);
                    const hasTasksByLastNameQuery = isTasksByLastNameQuery(actualUserQuery);
                    const hasRelatedEntitiesRequest = isRelatedEntitiesQuery(actualUserQuery);
                    const taskNumbersFromQuery = extractTaskNumbers(actualUserQuery);
                    const hasTaskContextTriggers = taskNumbers.length > 0 || hasMyTasksQuery || hasTasksByLastNameQuery;
                    let shouldLoadTaskContext = false;

                    if (hasTaskContextTriggers) {
                        if (taskContextMode === TASK_CONTEXT_MODES.ALWAYS) {
                            shouldLoadTaskContext = true;
                        } else if (taskContextMode === TASK_CONTEXT_MODES.ASK) {
                            // Для запроса связанных задач с номерами из контекста не блокируемся на confirm.
                            if (hasRelatedEntitiesRequest && taskNumbersFromQuery.length === 0 && taskNumbers.length > 0) {
                                shouldLoadTaskContext = true;
                            } else {
                                shouldLoadTaskContext = window.confirm('В запросе обнаружены номера/признаки задач. Подтянуть данные задач через API?');
                            }
                        }
                    }
                    
                    // Загрузка данных по конкретным задачам (если в запросе есть номера)
                    if (shouldLoadTaskContext && taskNumbers.length > 0) {
                        try {
                            const taskDataPromises = taskNumbers.map(taskNumber => fetchTaskData(taskNumber));
                            const taskDataResults = await Promise.allSettled(taskDataPromises);

                            const formattedTasks = [];
                            const taskLoadReport = [];
                            const apiCallLogs = [];
                            const loadedTaskCards = [];
                            let loadedCount = 0;

                            for (let index = 0; index < taskDataResults.length; index += 1) {
                                const result = taskDataResults[index];
                                const taskNumber = taskNumbers[index];

                                if (result.status === 'fulfilled' && result.value) {
                                    const taskPayload = result.value.taskData || result.value;
                                    const httpStatus = result.value.httpStatus || 200;
                                    const responseUrl = result.value.url || `${SFERA_TASKS_API_URL}/${encodeURIComponent(taskNumber)}`;
                                    const formattedTask = await formatTaskData(taskNumber, taskPayload, actualUserQuery);
                                    formattedTasks.push(formattedTask);
                                    taskLoadReport.push(`${taskNumber}\t${httpStatus}\tLOADED`);
                                    apiCallLogs.push({
                                        taskNumber: taskNumber,
                                        endpoint: responseUrl,
                                        httpStatus: httpStatus,
                                        loadStatus: 'LOADED'
                                    });
                                    loadedTaskCards.push(taskPayload);
                                    loadedCount += 1;
                                    continue;
                                }

                                const httpStatus = result.status === 'rejected' ? (result.reason?.httpStatus || '') : '';
                                const responseUrl = result.status === 'rejected'
                                    ? (result.reason?.url || `${SFERA_TASKS_API_URL}/${encodeURIComponent(taskNumber)}`)
                                    : `${SFERA_TASKS_API_URL}/${encodeURIComponent(taskNumber)}`;
                                const errorReason = result.status === 'rejected'
                                    ? (result.reason?.message || String(result.reason))
                                    : 'данные не получены';
                                console.warn(`Не удалось загрузить задачу ${taskNumber}:`, result.reason || errorReason);
                                formattedTasks.push(`Задача ${taskNumber}: не удалось загрузить данные (${errorReason}).`);
                                taskLoadReport.push(`${taskNumber}\t${httpStatus || 'N/A'}\tERROR\t${errorReason}`);
                                apiCallLogs.push({
                                    taskNumber: taskNumber,
                                    endpoint: responseUrl,
                                    httpStatus: httpStatus || null,
                                    loadStatus: 'ERROR',
                                    details: errorReason
                                });
                            }

                            if (formattedTasks.length > 0) {
                                taskContextText = formattedTasks.join('\n\n---\n\n');
                            }
                            if (taskLoadReport.length > 0) {
                                const taskLoadReportText = [
                                    'Отчет API загрузки карточек (доказуемые статусы):',
                                    'TASK_NUMBER\tHTTP_STATUS\tLOAD_STATUS\tDETAILS',
                                    ...taskLoadReport
                                ].join('\n');
                                taskContextText = taskContextText
                                    ? `${taskLoadReportText}\n\n---\n\n${taskContextText}`
                                    : taskLoadReportText;
                            }
                            // Для сценариев со связанными задачами добавляем сырые JSON-структуры,
                            // чтобы модель могла валидировать вход по строгому контракту.
                            if (hasRelatedEntitiesRequest) {
                                const loadedStoryCards = loadedTaskCards.filter((taskCard) =>
                                    taskCard &&
                                    typeof taskCard === 'object' &&
                                    typeof taskCard.type === 'string' &&
                                    taskCard.type.toLowerCase() === 'story'
                                );
                                const storyCardsForProcessing = loadedStoryCards.map((taskCard) => {
                                    const relatedEntities = Array.isArray(taskCard.relatedEntities) ? taskCard.relatedEntities : [];
                                    const relatedTaskNumbers = relatedEntities
                                        .map((item) => item?.entity?.number)
                                        .filter((number) => typeof number === 'string' && number.length > 0);
                                    return {
                                        number: taskCard.number || '',
                                        type: taskCard.type || '',
                                        areaCode: taskCard.areaCode || '',
                                        name: taskCard.name || '',
                                        relatedCount: relatedTaskNumbers.length,
                                        relatedTaskNumbers: relatedTaskNumbers
                                    };
                                });
                                const structuredContext = [
                                    'КРИТИЧЕСКОЕ_ПРАВИЛО: используй ВСЕ story из STORY_CARDS_FOR_PROCESSING без пропусков.',
                                    'КРИТИЧЕСКОЕ_ПРАВИЛО: SCORAFS-* это валидные номера задач и не должны исключаться.',
                                    '',
                                    'STORY_CARDS_FOR_PROCESSING:',
                                    JSON.stringify(storyCardsForProcessing, null, 2),
                                    '',
                                    'API_CALL_LOGS:',
                                    JSON.stringify(apiCallLogs, null, 2),
                                    '',
                                    'TASK_CARDS_JSON:',
                                    JSON.stringify(loadedTaskCards, null, 2)
                                ].join('\n');
                                taskContextText = taskContextText
                                    ? `${structuredContext}\n\n---\n\n${taskContextText}`
                                    : structuredContext;
                            }

                            console.log(`Загружено данных из ${loadedCount} задач: ${taskNumbers.join(', ')}`);
                        } catch (e) {
                            console.error('Ошибка загрузки данных задач:', e);
                        }
                    }
                    
                    // Загрузка списка "моих задач" (если в запросе есть фраза "мои задачи")
                    if (shouldLoadTaskContext && taskNumbers.length === 0 && hasMyTasksQuery) {
                        try {
                            const myTasks = await fetchMyTasks();
                            const myTasksFormatted = formatMyTasksList(myTasks);
                            taskContextText = taskContextText 
                                ? (taskContextText + '\n\n---\n\n' + myTasksFormatted) 
                                : myTasksFormatted;
                            console.log(`Загружено моих задач: ${myTasks.length}`);
                        } catch (e) {
                            console.error('Ошибка загрузки моих задач:', e);
                        }
                    }
                    
                    // Загрузка задач по фамилии исполнителя (вариант Б: assignee/values → entity-views по identifier)
                    if (shouldLoadTaskContext && taskNumbers.length === 0 && hasTasksByLastNameQuery) {
                        const lastName = extractLastNameFromQuery(actualUserQuery);
                        if (lastName) {
                            try {
                                const identifiers = await findAssigneeIdentifiersByLastName(lastName);
                                if (identifiers.length > 0) {
                                    const tasksByAssignee = await fetchTasksByAssigneeIdentifiers(identifiers);
                                    const formatted = formatTasksByAssigneeList(tasksByAssignee, lastName);
                                    taskContextText = taskContextText 
                                        ? (taskContextText + '\n\n---\n\n' + formatted) 
                                        : formatted;
                                    console.log(`Задачи по фамилии ${lastName}: найдено исполнителей ${identifiers.length}, задач ${tasksByAssignee.length}`);
                                }
                            } catch (e) {
                                console.error('Ошибка загрузки задач по фамилии:', e);
                            }
                        }
                    }
                    
                    // 4. Поиск кода в репозиториях, если есть selectedRepos
                    let codeSearchResults = null;
                    let systemMessageId = null;
                    if (selectedRepos.length > 0) {
                        try {
                            // Формируем запрос для поиска кода
                            const projects = [...new Set(selectedRepos.map(repo => repo.project))];
                            const repos = [...new Set(selectedRepos.map(repo => repo.repository))];
                            const branches = [...new Set(selectedRepos.map(repo => repo.branch))];
                            
                            const pluginQueryResponse = await sferaFetch(SFERA_PLUGIN_QUERY_URL, {
                                method: 'POST',
                                body: JSON.stringify({
                                    query: actualUserQuery,
                                    projects: projects,
                                    repos: repos,
                                    branches: branches
                                })
                            });
                            
                            if (pluginQueryResponse.ok) {
                                codeSearchResults = await pluginQueryResponse.json();
                                const foundCount = Array.isArray(codeSearchResults) ? codeSearchResults.length : 0;
                                
                                // Генерируем ID для system сообщения
                                systemMessageId = generateUUID();
                                const systemMessage = {
                                    role: 'system',
                                    content: `Найдено ${foundCount} фрагментов кода.`,
                                    status: 'completed',
                                    id: systemMessageId,
                                    timestamp: Date.now()
                                };
                                
                                // Обновляем чат с system сообщением (как в веб-чате)
                                const messagesWithSystem = [...messagesToSend, systemMessage];
                                await fetch(chatUpdateUrl, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        messages: messagesWithSystem
                                    })
                                });
                                
                                console.log(`Найдено ${foundCount} фрагментов кода в репозиториях`);
                            }
                        } catch (e) {
                            console.error('Ошибка поиска кода в репозиториях:', e);
                        }
                    }
                    
                    // 5. Получаем ответ от модели через inference API (как в веб-чате)
                    // Формируем массив сообщений для inference API
                    // Если включен контекст, заменяем последнее user сообщение на полный промпт с контекстом
                    let inferenceMessages = messagesToSend.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    }));
                    
                    // Добавляем системное сообщение с информацией о модели (чтобы модель знала, кто она)
                    const availableSferaModels = await getSferaAvailableModels();
                    const modelCandidates = buildSferaModelCandidates(SFERA_MODEL, availableSferaModels, SFERA_FALLBACK_MODELS);
                    let selectedSferaModel = modelCandidates[0] || SFERA_MODEL;

                    // Проверяем, нет ли уже системного сообщения в начале
                    if (!inferenceMessages.length || inferenceMessages[0].role !== 'system') {
                        inferenceMessages.unshift({
                            role: 'system',
                            content: `Ты — ассистент программиста на основе модели ${selectedSferaModel}. Отвечай профессионально и точно. Не упоминай другие модели (например, GPT-4), так как ты работаешь на модели ${selectedSferaModel}.`
                        });
                    }
                    
                    // Добавляем найденные фрагменты кода в контекст, если они есть
                    let codeContextText = '';
                    if (codeSearchResults && Array.isArray(codeSearchResults) && codeSearchResults.length > 0) {
                        codeContextText = codeSearchResults.map(result => 
                            `Файл: ${result.file_path}\n${result['code-snap'] || ''}`
                        ).join('\n\n---\n\n');
                    }
                    
                    // Если контекст включен, заменяем последнее user сообщение на полный промпт с контекстом
                    if (SFERA_INCLUDE_CONTEXT && pageContext.length > 0) {
                        // Находим последнее user сообщение и заменяем его на полный промпт
                        for (let i = inferenceMessages.length - 1; i >= 0; i--) {
                            if (inferenceMessages[i].role === 'user') {
                                let enhancedPrompt = finalPrompt;
                                // Добавляем контекст задач, если он есть
                                if (taskContextText) {
                                    enhancedPrompt = `${enhancedPrompt}\n\nДанные из задач:\n${taskContextText}`;
                                }
                                // Добавляем контекст кода, если он есть
                                if (codeContextText) {
                                    enhancedPrompt = `${enhancedPrompt}\n\nКонтекст из репозиториев:\n${codeContextText}`;
                                }
                                inferenceMessages[i].content = enhancedPrompt;
                                break;
                            }
                        }
                    } else {
                        // Если контекст страницы не включен, добавляем контекст задач и кода к последнему user сообщению
                        for (let i = inferenceMessages.length - 1; i >= 0; i--) {
                            if (inferenceMessages[i].role === 'user') {
                                let enhancedContent = inferenceMessages[i].content;
                                // Добавляем контекст задач, если он есть
                                if (taskContextText) {
                                    enhancedContent = `${enhancedContent}\n\nДанные из задач:\n${taskContextText}`;
                                }
                                // Добавляем контекст кода, если он есть
                                if (codeContextText) {
                                    enhancedContent = `${enhancedContent}\n\nКонтекст из репозиториев:\n${codeContextText}`;
                                }
                                inferenceMessages[i].content = enhancedContent;
                                break;
                            }
                        }
                    }
                    
                    // Рассчитываем max_tokens на основе размера входного контекста
                    // Модель имеет максимальный контекст 96000 токенов
                    // Приблизительная оценка: 1 токен ≈ 2-3 символа для русского текста
                    const totalInputLength = JSON.stringify(inferenceMessages).length;
                    const estimatedInputTokens = Math.ceil(totalInputLength / 2.5); // Консервативная оценка
                    const SAFE_BUFFER = 500; // Запас на случай неточной оценки
                    const maxAllowedTokens = Math.max(1000, SFERA_MAX_CONTEXT_TOKENS - estimatedInputTokens - SAFE_BUFFER);
                    const maxTokens = Math.min(SFERA_MAX_OUTPUT_TOKENS, maxAllowedTokens);
                    
                    const inferenceRequestBody = {
                        model: selectedSferaModel,
                        messages: inferenceMessages,
                        stream: true,
                        temperature: 0,
                        max_tokens: maxTokens
                    };
                    
                    console.log('=== Запрос к inference API ===');
                    console.log('URL:', SFERA_INFERENCE_URL);
                    console.log('Кандидаты моделей:', modelCandidates);

                    let inferenceResponse = null;
                    let lastErrorData = null;
                    for (const candidateModel of modelCandidates) {
                        inferenceRequestBody.model = candidateModel;
                        console.log('Body:', JSON.stringify(inferenceRequestBody, null, 2));

                        inferenceResponse = await sferaFetch(SFERA_INFERENCE_URL, {
                            method: 'POST',
                            body: JSON.stringify(inferenceRequestBody)
                        });

                        if (inferenceResponse.ok) {
                            selectedSferaModel = candidateModel;
                            break;
                        }

                        const errorText = await inferenceResponse.text();
                        const errorData = parseSferaErrorPayload(errorText);
                        lastErrorData = errorData;
                        const errorMessage = extractSferaErrorMessage(errorData);
                        const isModelNotFound =
                            inferenceResponse.status === 404 &&
                            /does not exist|notfounderror|model/i.test(JSON.stringify(errorData));

                        console.warn(`Ошибка Sfera для модели ${candidateModel}:`, inferenceResponse.status, errorMessage);

                        if (!isModelNotFound) {
                            break;
                        }
                    }

                    if (!inferenceResponse || !inferenceResponse.ok) {
                        const errorMessage = extractSferaErrorMessage(lastErrorData);
                        appendMessage('Ошибка', `Не удалось получить ответ от модели: ${errorMessage}`);
                        throw new Error(`Ошибка получения ответа от модели: ${inferenceResponse ? inferenceResponse.status : 'no-response'} - ${errorMessage}`);
                    }
                    
                    // Обрабатываем streaming ответ (SSE формат)
                    const reader = inferenceResponse.body.getReader();
                    const decoder = new TextDecoder();
                    let aiResponse = '';
                    let buffer = '';
                    
                    // Создаем элемент для ответа (без пошагового вывода во время стрима)
                    const streamingMessageDiv = document.createElement('div');
                    streamingMessageDiv.className = 'message ai-message';
                    streamingMessageDiv.textContent = 'Бот печатает...';
                    chatDiv.appendChild(streamingMessageDiv);
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                    
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            
                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split('\n');
                            buffer = lines.pop() || ''; // Оставляем неполную строку в буфере
                            
                            for (const line of lines) {
                                if (line.trim() === '') continue;
                                
                                // Парсим SSE формат: data: {...}
                                if (line.startsWith('data: ')) {
                                    const dataStr = line.substring(6).trim();
                                    
                                    if (dataStr === '[DONE]') {
                                        continue;
                                    }
                                    
                                    try {
                                        const chunk = JSON.parse(dataStr);
                                        
                                        // Извлекаем контент из чанка (без обновления UI на каждом чанке)
                                        if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
                                            const deltaContent = chunk.choices[0].delta.content;
                                            if (deltaContent) {
                                                aiResponse += deltaContent;
                                            }
                                            
                                            if (chunk.choices[0].finish_reason) {
                                                break;
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Ошибка парсинга чанка:', e, 'Data:', dataStr);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Ошибка чтения streaming ответа:', e);
                        appendMessage('Ошибка', `Ошибка чтения ответа: ${e.message}`);
                        setLoader(false);
                        return;
                    }
                    
                    if (!aiResponse) {
                        appendMessage('Ошибка', 'Не удалось получить ответ из streaming API.');
                        streamingMessageDiv.remove();
                        setLoader(false);
                        return;
                    }
                    
                    // Применяем форматирование к финальному ответу и выводим один раз
                    const formatted = formatMarkdownToHtml(aiResponse);
                    streamingMessageDiv.innerHTML = `<b>Бот:</b><br>${formatted}`;
                    chatDiv.scrollTop = chatDiv.scrollHeight;
                    
                    // 6. Обновляем чат с ответом assistant через PATCH (как в веб-чате)
                    const assistantMessage = {
                        role: 'assistant',
                        content: aiResponse,
                        status: 'completed',
                        id: assistantMessageId,
                        timestamp: timestamp + 1,
                        traceId: traceId,
                        requestId: requestId
                    };
                    
                    // Формируем финальный массив сообщений: user + system (если есть) + assistant
                    const finalMessages = [...messagesToSend];
                    if (systemMessageId) {
                        // Добавляем system сообщение, если оно было создано
                        const systemMsg = {
                            role: 'system',
                            content: codeSearchResults ? `Найдено ${codeSearchResults.length} фрагментов кода.` : 'Найдено 0 фрагментов кода.',
                            status: 'completed',
                            id: systemMessageId,
                            timestamp: Date.now()
                        };
                        finalMessages.push(systemMsg);
                    }
                    finalMessages.push(assistantMessage);
                    
                    const finalPatchResponse = await fetch(chatUpdateUrl, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messages: finalMessages
                        })
                    });
                    
                    if (!finalPatchResponse.ok) {
                        console.warn('Failed to save response to chat:', await finalPatchResponse.text());
                    }
                    
                    setLoader(false);
                } catch (e) {
                    console.error('Sfera API error:', e);
                    appendMessage('Ошибка', `Проблема с API Sfera: ${e.message}`);
                    // Сбрасываем chatId при ошибке, чтобы создать новый чат при следующем запросе
                    sferaChatId = null;
                }
                break;

            case 'custom':
                // Пробуем разные варианты кастомного API
                let customSuccess = false;
                for (const customUrl of CUSTOM_API_URLS) {
                    try {
                        const headers = {
                            'Content-Type': 'application/json'
                        };
                        if (CUSTOM_API_KEY) {
                            headers['Authorization'] = `Bearer ${CUSTOM_API_KEY}`;
                        }

                        response = await fetch(customUrl, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({
                                prompt: finalPrompt,
                                query: userQuery,
                                context: pageContext.slice(0, 20000),
                                message: finalPrompt,
                                messages: [{ role: 'user', content: finalPrompt }]
                            })
                        });
                        
                        if (response.ok) {
                            responseData = await response.json();
                            
                            if (responseData.error) {
                                continue; // Пробуем следующий URL
                            }
                            
                            // Пробуем разные форматы ответа
                            const aiResponse = responseData.response || responseData.text || 
                                             responseData.content || responseData.message || 
                                             (responseData.choices && responseData.choices[0]?.message?.content) ||
                                             JSON.stringify(responseData);
                            
                            if (aiResponse && aiResponse !== '{}') {
                                formatAndDisplayResponse(aiResponse);
                                customSuccess = true;
                                break;
                            }
                        }
                    } catch (e) {
                        // Пробуем следующий URL
                        continue;
                    }
                }
                
                if (!customSuccess) {
                    appendMessage('Ошибка', 'Не удалось подключиться ни к одному кастомному API. Проверьте настройки.');
                }
                break;

            default:
                appendMessage('Ошибка', `Неизвестный тип API: ${apiType}`);
                setLoader(false);
                return;
        }
    } catch (e) {
        console.error(e);
        appendMessage('Ошибка', `Проблема с сетью или API: ${e.message}`);
    }
    setLoader(false);
}

// Извлечение номеров задач из текста
function extractTaskNumbers(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }
    
    // Паттерны для различных типов задач
    const taskPatterns = [
        /SKOKR-\d+/gi,
        /RDS-\d+/gi,
        /SKSPR-\d+/gi,
        /SCOR-\d+/gi,
        /SCORAFS-\d+/gi,
        /SKPLINT-\d+/gi
    ];
    
    const foundTasks = new Set();
    
    taskPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            matches.forEach(match => foundTasks.add(match.toUpperCase()));
        }
    });
    
    return Array.from(foundTasks);
}

// Выбирает номера задач для загрузки контекста:
// 1) сначала из пользовательского запроса;
// 2) если это запрос связанных задач и в тексте запроса номеров нет,
//    берем номера из контекста страницы.
function resolveTaskNumbersForContext(userQueryText, pageContextText = '') {
    const fromQuery = extractTaskNumbers(userQueryText);
    if (fromQuery.length > 0) {
        return fromQuery;
    }

    if (!isRelatedEntitiesQuery(userQueryText)) {
        return [];
    }

    const fromPageContext = extractTaskNumbers(pageContextText).filter((taskNumber) => {
        if (!taskNumber || typeof taskNumber !== 'string') {
            return false;
        }
        // Исключаем epic-ссылки SCOR-* и оставляем ожидаемые домены задач.
        if (/^SCOR-/i.test(taskNumber)) {
            return false;
        }
        return /^(SKOKR|SCORAFS|RDS|SKSPR|SKPLINT)-/i.test(taskNumber);
    });

    return [...new Set(fromPageContext)];
}

// Проверка, содержит ли запрос фразу о "моих задачах"
function isMyTasksQuery(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    const normalized = text.toLowerCase().trim();
    const phrases = ['мои задачи', 'покажи мои задачи', 'список моих задач', 'загрузи мои задачи', 'выведи мои задачи', 'какие у меня задачи'];
    return phrases.some(phrase => normalized.includes(phrase));
}

// Загрузка списка "моих задач" через entity-views API (как в GSferaUtility)
async function fetchMyTasks() {
    try {
        const encodedQuery = encodeURIComponent(MY_TASKS_QUERY);
        const encodedAttrs = encodeURIComponent(ENTITY_VIEWS_ATTRIBUTES);
        const url = `${SFERA_ENTITY_VIEWS_URL}?page=0&size=200&attributes=${encodedAttrs}&query=${encodedQuery}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.content;
        if (!Array.isArray(content)) {
            return [];
        }
        return content;
    } catch (error) {
        console.error('Ошибка загрузки списка моих задач:', error);
        return [];
    }
}

// Извлечение фамилии из запроса ("задачи Иванова", "подзадачи Петрова", "по фамилии Козлов" и т.д.)
function extractLastNameFromQuery(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }
    const trimmed = text.trim();
    const patterns = [
        /(?:задачи|подзадачи|задачах)\s+([а-яёА-ЯЁ\-]+)/i,
        /(?:исполнителя?|автора?)\s+([а-яёА-ЯЁ\-]+)/i,
        /по\s+фамилии\s+([а-яёА-ЯЁ\-]+)/i,
        /(?:в работе |у )?([а-яёА-ЯЁ\-]+)\s+(?:задачи|подзадачи)/i,
        /(?:что в работе у|задачи у)\s+([а-яёА-ЯЁ\-]+)/i
    ];
    for (const re of patterns) {
        const m = trimmed.match(re);
        if (m && m[1] && m[1].length > 1) {
            return m[1].trim();
        }
    }
    return null;
}

// Проверка, спрашивает ли пользователь про задачи по фамилии исполнителя
function isTasksByLastNameQuery(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    const normalized = text.toLowerCase();
    const hints = ['задачи ', 'подзадачи ', 'по фамилии', 'исполнителя ', 'автора ', 'в работе у'];
    const hasHint = hints.some(h => normalized.includes(h));
    return hasHint && !!extractLastNameFromQuery(text);
}

// Проверка, запрошен ли список связанных задач
function isRelatedEntitiesQuery(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }

    const normalized = text.toLowerCase();
    if (normalized.includes('relationtype') || normalized.includes('related entities') || normalized.includes('relatedentities')) {
        return true;
    }

    const relatedEntitiesHints = [
        'связанные задачи',
        'связанных задач',
        'список связанных задач',
        'список задач в',
        'какие задачи в',
        'дай список задач в',
        'покажи список задач в'
    ];

    return relatedEntitiesHints.some((hint) => normalized.includes(hint));
}

// Нормализация значений фильтров связанных задач (type/status/relationType)
function normalizeRelatedEntityFilterValue(filterKey, rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
        return '';
    }

    const cleanedValue = rawValue.trim().toLowerCase().replace(/^['"]|['"]$/g, '');
    if (!cleanedValue) {
        return '';
    }

    if (filterKey === 'type') {
        const typeAliases = {
            'подзадача': 'subtask',
            'подзадачи': 'subtask',
            'сабтаск': 'subtask',
            'story': 'story',
            'стори': 'story',
            'эпик': 'epic',
            'epic': 'epic',
            'bug': 'bug',
            'баг': 'bug',
            'task': 'task',
            'задача': 'task'
        };
        return typeAliases[cleanedValue] || cleanedValue;
    }

    if (filterKey === 'status') {
        const statusAliases = {
            'создан': 'created',
            'created': 'created',
            'вработе': 'inProgress',
            'в работе': 'inProgress',
            'inprogress': 'inProgress',
            'in_progress': 'inProgress',
            'закрыт': 'done',
            'закрыта': 'done',
            'выполнен': 'done',
            'выполнена': 'done',
            'done': 'done',
            'planned': 'planned',
            'план': 'planned',
            'запланирован': 'planned'
        };
        return statusAliases[cleanedValue] || cleanedValue;
    }

    return cleanedValue;
}

// Извлечение фильтров для relatedEntities из пользовательского запроса
function extractRelatedEntitiesFilters(text) {
    if (!text || typeof text !== 'string') {
        return {
            relationType: '',
            type: '',
            status: ''
        };
    }

    const extractByPatterns = (patterns) => {
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return '';
    };

    const relationTypeRaw = extractByPatterns([
        /relationtype\s*[:=]?\s*([a-zA-Z0-9_-]+)/i,
        /тип\s+связи\s*[:=]?\s*([a-zA-Z0-9_-]+)/i
    ]);
    const typeRaw = extractByPatterns([
        /\btype\s*[:=]?\s*([a-zA-Zа-яА-ЯёЁ0-9_-]+)/i,
        /тип\s*[:=]?\s*([a-zA-Zа-яА-ЯёЁ0-9_-]+)/i
    ]);
    const statusRaw = extractByPatterns([
        /\bstatus\s*[:=]?\s*([a-zA-Zа-яА-ЯёЁ0-9_-]+)/i,
        /статус\s*[:=]?\s*([a-zA-Zа-яА-ЯёЁ0-9_-]+)/i
    ]);

    return {
        relationType: normalizeRelatedEntityFilterValue('relationType', relationTypeRaw),
        type: normalizeRelatedEntityFilterValue('type', typeRaw),
        status: normalizeRelatedEntityFilterValue('status', statusRaw)
    };
}

// Поиск идентификаторов (login) исполнителей по фамилии через assignee/values
async function findAssigneeIdentifiersByLastName(lastName) {
    if (!lastName || typeof lastName !== 'string') {
        return [];
    }
    try {
        const url = `${SFERA_ASSIGNEE_VALUES_URL}?keyword=${encodeURIComponent(lastName)}&page=0&size=20`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) return [];
        const data = await response.json();
        const content = data.content;
        if (!Array.isArray(content)) return [];
        const normalizedLastName = lastName.toLowerCase();
        const identifiers = [];
        for (const user of content) {
            const name = (user.name || '').toLowerCase();
            const identifier = user.identifier;
            if (!identifier) continue;
            const nameParts = name.split(/\s+/);
            const lastNameMatch = nameParts.some(part => part.startsWith(normalizedLastName) || normalizedLastName.startsWith(part));
            if (lastNameMatch || name.includes(normalizedLastName)) {
                identifiers.push(identifier);
            }
        }
        return [...new Set(identifiers)];
    } catch (e) {
        console.error('Ошибка поиска исполнителей по фамилии:', e);
        return [];
    }
}

// Загрузка задач по списку идентификаторов исполнителей (вариант Б)
async function fetchTasksByAssigneeIdentifiers(identifiers) {
    if (!identifiers || identifiers.length === 0) return [];
    const list = identifiers.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
    const query = `${TASKS_BY_ASSIGNEE_BASE_QUERY} and assignee in (${list})`;
    try {
        const encodedQuery = encodeURIComponent(query);
        const encodedAttrs = encodeURIComponent(ENTITY_VIEWS_ATTRIBUTES);
        const url = `${SFERA_ENTITY_VIEWS_URL}?page=0&size=200&attributes=${encodedAttrs}&query=${encodedQuery}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return Array.isArray(data.content) ? data.content : [];
    } catch (e) {
        console.error('Ошибка загрузки задач по исполнителям:', e);
        return [];
    }
}

// Форматирование списка задач по исполнителю для контекста
function formatTasksByAssigneeList(tasks, lastName) {
    if (!tasks || tasks.length === 0) {
        return `Задачи исполнителя ${lastName}: список пуст или не удалось загрузить.`;
    }
    let formatted = `Задачи исполнителя (${lastName}), всего ${tasks.length}:\n\n`;
    tasks.forEach((task, index) => {
        const number = task.number || task.id || '';
        const name = task.name || '(без названия)';
        const status = typeof task.status === 'object' ? (task.status?.name || task.status?.identifier || '') : (task.status || '');
        const sprint = task.actualSprint;
        const sprintName = typeof sprint === 'object' ? (sprint?.name || sprint?.number || '') : (sprint || '');
        const parent = task.parent;
        const parentStr = typeof parent === 'object' ? (parent?.number || parent?.name || '') : (parent || '');
        const dueDate = task.dueDate || '';
        formatted += `${index + 1}. ${number}: ${name}\n`;
        formatted += `   Статус: ${status}\n`;
        if (sprintName) formatted += `   Спринт: ${sprintName}\n`;
        if (parentStr) formatted += `   Родитель: ${parentStr}\n`;
        if (dueDate) formatted += `   Срок: ${dueDate}\n`;
        formatted += '\n';
    });
    return formatted;
}

// Форматирование списка задач из entity-views для контекста
function formatMyTasksList(tasks) {
    if (!tasks || tasks.length === 0) {
        return 'Список моих задач пуст или не удалось загрузить.';
    }
    
    let formatted = `Мои задачи (всего ${tasks.length}):\n\n`;
    
    tasks.forEach((task, index) => {
        const number = task.number || task.id || '';
        const name = task.name || '(без названия)';
        const status = typeof task.status === 'object' ? (task.status?.name || task.status?.identifier || '') : (task.status || '');
        const priority = typeof task.priority === 'object' ? (task.priority?.name || task.priority?.identifier || '') : (task.priority || '');
        const assignee = typeof task.assignee === 'object' ? (task.assignee?.name || task.assignee?.identifier || '') : (task.assignee || '');
        const sprint = task.actualSprint;
        const sprintName = typeof sprint === 'object' ? (sprint?.name || sprint?.number || '') : (sprint || '');
        const parent = task.parent;
        const parentStr = typeof parent === 'object' ? (parent?.number || parent?.name || '') : (parent || '');
        const dueDate = task.dueDate || '';
        
        formatted += `${index + 1}. ${number}: ${name}\n`;
        formatted += `   Статус: ${status}`;
        if (priority) formatted += `, Приоритет: ${priority}`;
        formatted += '\n';
        if (sprintName) formatted += `   Спринт: ${sprintName}\n`;
        if (parentStr) formatted += `   Родитель: ${parentStr}\n`;
        if (dueDate) formatted += `   Срок: ${dueDate}\n`;
        formatted += '\n';
    });
    
    return formatted;
}

// Получение имени пользователя по email через API (только ФИО, без логина и email)
async function fetchUserNameByEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return null;
    }
    
    try {
        // Пробуем поиск по полному email
        let url = `https://sfera.inno.local/app/tasks/api/v1/attribute-views/assignee/values?keyword=${encodeURIComponent(email)}&page=0&size=20`;
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            // Если не получилось, пробуем поиск по части email (до @)
            const emailPrefix = email.split('@')[0];
            url = `https://sfera.inno.local/app/tasks/api/v1/attribute-views/assignee/values?keyword=${encodeURIComponent(emailPrefix)}&page=0&size=20`;
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        }
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        if (data.content && Array.isArray(data.content) && data.content.length > 0) {
            // Ищем пользователя с таким identifier (email) - точное совпадение
            let foundUser = data.content.find(u => 
                u.identifier && u.identifier.toLowerCase() === email.toLowerCase()
            );
            
            // Если точного совпадения нет, ищем по части email
            if (!foundUser) {
                const emailPrefix = email.split('@')[0].toLowerCase();
                foundUser = data.content.find(u => 
                    u.identifier && u.identifier.toLowerCase().startsWith(emailPrefix + '@')
                );
            }
            
            // Если все еще не найдено, берем первый результат
            if (!foundUser) {
                foundUser = data.content[0];
            }
            
            // Возвращаем только поле name (ФИО), игнорируем identifier (email)
            if (foundUser && foundUser.name && typeof foundUser.name === 'string') {
                // Убираем возможные упоминания email или логина из имени
                let userName = foundUser.name.trim();
                // Удаляем email-подобные строки из имени
                userName = userName.replace(/\s*\([^)]*@[^)]*\)/g, ''); // Удаляет (email@domain)
                userName = userName.replace(/\s*\[[^\]]*@[^\]]*\]/g, ''); // Удаляет [email@domain]
                userName = userName.replace(/\s+с логином\s+[^\s]+/gi, ''); // Удаляет "с логином ..."
                userName = userName.replace(/\s+и электронной почтой\s+[^\s]+/gi, ''); // Удаляет "и электронной почтой ..."
                userName = userName.replace(/\s+логин[:\s]+[^\s]+/gi, ''); // Удаляет "логин: ..."
                userName = userName.replace(/\s+email[:\s]+[^\s]+/gi, ''); // Удаляет "email: ..."
                // Удаляем email-адреса в конце строки
                userName = userName.replace(/\s+[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/g, '');
                const cleanedName = userName.trim();
                // Возвращаем имя только если оно не пустое и не является email
                if (cleanedName && !cleanedName.includes('@')) {
                    return cleanedName;
                }
            }
            
            // Если name не найден или является email, возвращаем null
            return null;
        }
        
        return null;
    } catch (error) {
        console.error(`Ошибка получения имени пользователя для ${email}:`, error);
        return null;
    }
}

// Получение данных задачи по API
async function fetchTaskData(taskNumber) {
    try {
        const url = `${SFERA_TASKS_API_URL}/${encodeURIComponent(taskNumber)}`;
        const response = await sferaFetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.httpStatus = response.status;
            error.statusText = response.statusText || '';
            error.url = url;
            throw error;
        }
        
        const taskData = await response.json();
        return {
            taskData,
            httpStatus: response.status,
            url
        };
    } catch (error) {
        console.error(`Ошибка загрузки задачи ${taskNumber}:`, error);
        throw error;
    }
}

// Вспомогательная функция для извлечения значения из атрибутов
function getAttributeValue(attributes, attrName) {
    if (!attributes || !Array.isArray(attributes)) {
        return null;
    }
    const attr = attributes.find(a => a.name && a.name.toLowerCase() === attrName.toLowerCase());
    if (attr && attr.value !== undefined && attr.value !== null) {
        return attr.value;
    }
    return null;
}

// Вспомогательная функция для извлечения ФИО из объекта пользователя
function extractFullName(userObj) {
    if (!userObj || typeof userObj !== 'object') {
        return null;
    }
    
    // Если есть готовое поле name (например, из attachments.createdBy)
    if (userObj.name && typeof userObj.name === 'string' && !userObj.name.includes('@')) {
        return userObj.name;
    }
    
    // Собираем ФИО из отдельных полей (формат: Фамилия Имя Отчество)
    const parts = [];
    if (userObj.lastName) parts.push(userObj.lastName);
    if (userObj.firstName) parts.push(userObj.firstName);
    if (userObj.patronymic) parts.push(userObj.patronymic);
    
    if (parts.length > 0) {
        return parts.join(' ');
    }
    
    return null;
}

// Форматирование данных задачи для контекста
async function formatTaskData(taskNumber, taskData, sourceQuery = '') {
    if (!taskData) {
        return `Задача ${taskNumber}: Данные не получены`;
    }
    
    let formatted = `Задача: ${taskNumber}\n`;
    
    // Извлекаем основные поля задачи (сначала из корня, потом из атрибутов)
    const name = taskData.name || taskData.title || getAttributeValue(taskData.attributes, 'name');
    if (name) {
        const nameText = typeof name === 'object' ? (name.name || name.value || JSON.stringify(name)) : name;
        formatted += `Название: ${nameText}\n`;
    }
    
    const description = taskData.description || getAttributeValue(taskData.attributes, 'description');
    if (description) {
        const descText = typeof description === 'object' ? (description.value || JSON.stringify(description)) : description;
        formatted += `Описание: ${descText}\n`;
    }
    
    const status = taskData.status || taskData.state || getAttributeValue(taskData.attributes, 'status');
    if (status) {
        const statusText = typeof status === 'object' 
            ? (status.name || status.identifier || status.value || JSON.stringify(status))
            : status;
        formatted += `Статус: ${statusText}\n`;
    }
    
    // Вспомогательная функция для извлечения ФИО из объекта пользователя
    function extractFullName(userObj) {
        if (!userObj || typeof userObj !== 'object') {
            return null;
        }
        
        // Если есть готовое поле name (например, из attachments.createdBy)
        if (userObj.name && typeof userObj.name === 'string' && !userObj.name.includes('@')) {
            return userObj.name;
        }
        
        // Собираем ФИО из отдельных полей
        const parts = [];
        if (userObj.lastName) parts.push(userObj.lastName);
        if (userObj.firstName) parts.push(userObj.firstName);
        if (userObj.patronymic) parts.push(userObj.patronymic);
        
        if (parts.length > 0) {
            return parts.join(' ');
        }
        
        return null;
    }
    
    // Обработка исполнителя (assignee)
    const assignee = taskData.assignee || 
                   getAttributeValue(taskData.attributes, 'assignee') ||
                   (taskData.attributes && taskData.attributes.find ? taskData.attributes.find(a => a.code === 'assignee')?.value : null);
    
    if (assignee) {
        let assigneeName = '';
        if (typeof assignee === 'string') {
            // Если assignee - это строка (email), пытаемся получить имя через API
            assigneeName = await fetchUserNameByEmail(assignee);
        } else if (typeof assignee === 'object') {
            // Пытаемся извлечь ФИО из объекта
            assigneeName = extractFullName(assignee);
            
            // Если не получилось извлечь ФИО, пытаемся через API по login или email
            if (!assigneeName) {
                const email = assignee.login || assignee.email || assignee.identifier;
                if (email && typeof email === 'string' && email.includes('@')) {
                    assigneeName = await fetchUserNameByEmail(email);
                }
            }
        }
        
        // Показываем исполнителя только если есть имя (не email)
        if (assigneeName && !assigneeName.includes('@')) {
            formatted += `Исполнитель: ${assigneeName}\n`;
        }
    }
    
    // Обработка автора/владельца (owner/createdBy)
    const owner = taskData.owner || taskData.createdBy;
    
    if (owner) {
        let ownerName = '';
        if (typeof owner === 'string') {
            // Если owner - это строка (email), пытаемся получить имя через API
            ownerName = await fetchUserNameByEmail(owner);
        } else if (typeof owner === 'object') {
            // Пытаемся извлечь ФИО из объекта
            ownerName = extractFullName(owner);
            
            // Если не получилось извлечь ФИО, пытаемся через API по login или email
            if (!ownerName) {
                const email = owner.login || owner.email || owner.identifier;
                if (email && typeof email === 'string' && email.includes('@')) {
                    ownerName = await fetchUserNameByEmail(email);
                }
            }
        }
        
        // Показываем автора только если есть имя (не email)
        if (ownerName && !ownerName.includes('@')) {
            formatted += `Автор: ${ownerName}\n`;
        }
    }
    
    const priority = taskData.priority || getAttributeValue(taskData.attributes, 'priority');
    if (priority) {
        const priorityText = typeof priority === 'object'
            ? (priority.name || priority.identifier || priority.value || JSON.stringify(priority))
            : priority;
        formatted += `Приоритет: ${priorityText}\n`;
    }
    
    // Тип задачи, область, родительская задача
    if (taskData.type) {
        formatted += `Тип: ${taskData.type}\n`;
    }
    if (taskData.areaCode) {
        formatted += `Область: ${taskData.areaCode}\n`;
    }
    if (taskData.parentNumber || (taskData.parent && taskData.parent.number)) {
        const parentNum = taskData.parentNumber || (taskData.parent && taskData.parent.number);
        const parentName = taskData.parent && taskData.parent.name ? ` — ${taskData.parent.name}` : '';
        formatted += `Родительская задача: ${parentNum}${parentName}\n`;
    }
    
    // Даты создания и обновления
    if (taskData.createDate) {
        formatted += `Дата создания: ${taskData.createDate}\n`;
    }
    if (taskData.updateDate) {
        formatted += `Дата обновления: ${taskData.updateDate}\n`;
    }
    
    // Кто последний обновлял задачу
    if (taskData.updatedBy) {
        const updatedByName = extractFullName(taskData.updatedBy);
        if (updatedByName) {
            formatted += `Обновил: ${updatedByName}\n`;
        }
    }
    
    // Актуальный спринт (в каком спринте задача)
    if (taskData.actualSprint) {
        const sprint = taskData.actualSprint;
        const sprintName = sprint.name || sprint.number || '';
        const sprintStatus = sprint.status || sprint.statusCategoryCode || '';
        const sprintDates = (sprint.startDate && sprint.endDate) ? ` (${sprint.startDate} — ${sprint.endDate})` : '';
        formatted += `Актуальный спринт: ${sprintName}${sprintStatus ? `, статус: ${sprintStatus}` : ''}${sprintDates}\n`;
    }
    
    // Закрытые спринты (если есть)
    if (taskData.closedSprints && Array.isArray(taskData.closedSprints) && taskData.closedSprints.length > 0) {
        formatted += 'Закрытые спринты:\n';
        taskData.closedSprints.slice(0, 5).forEach(s => {
            formatted += `  - ${s.name || s.id} (${s.status || ''})\n`;
        });
    }

    // Связанные задачи (relatedEntities) — только по прямому запросу пользователя
    if (isRelatedEntitiesQuery(sourceQuery)) {
        const relatedEntities = Array.isArray(taskData.relatedEntities) ? taskData.relatedEntities : [];
        const relatedFilters = extractRelatedEntitiesFilters(sourceQuery);
        const hasRelatedFilters = !!(relatedFilters.relationType || relatedFilters.type || relatedFilters.status);

        let filteredRelatedEntities = relatedEntities;
        if (hasRelatedFilters) {
            filteredRelatedEntities = relatedEntities.filter((item) => {
                const relationType = (item?.relationType || '').toLowerCase();
                const entityType = (item?.entity?.type || '').toLowerCase();
                const entityStatus = (item?.entity?.status || '').toLowerCase();

                if (relatedFilters.relationType && relationType !== relatedFilters.relationType) {
                    return false;
                }
                if (relatedFilters.type && entityType !== relatedFilters.type) {
                    return false;
                }
                if (relatedFilters.status && entityStatus !== relatedFilters.status.toLowerCase()) {
                    return false;
                }
                return true;
            });
        }

        formatted += 'Связанные задачи (из relatedEntities). Используй только элементы из этого списка:\n';
        if (hasRelatedFilters) {
            const appliedFilters = [];
            if (relatedFilters.relationType) appliedFilters.push(`relationType=${relatedFilters.relationType}`);
            if (relatedFilters.type) appliedFilters.push(`type=${relatedFilters.type}`);
            if (relatedFilters.status) appliedFilters.push(`status=${relatedFilters.status}`);
            formatted += `  Фильтры: ${appliedFilters.join(', ')}\n`;
        }

        if (filteredRelatedEntities.length === 0) {
            formatted += '  - Нет связанных задач по указанным условиям.\n';
        } else {
            const maxRelatedEntitiesInContext = 100;
            const entitiesForOutput = filteredRelatedEntities.slice(0, maxRelatedEntitiesInContext);
            entitiesForOutput.forEach((item) => {
                const entityNumber = item?.entity?.number || '(без номера)';
                const entityName = item?.entity?.name || '(без названия)';
                const entityType = item?.entity?.type || '';
                const entityStatus = item?.entity?.status || '';
                const relationType = item?.relationType || '';
                const details = [
                    entityType ? `type=${entityType}` : '',
                    entityStatus ? `status=${entityStatus}` : '',
                    relationType ? `relationType=${relationType}` : ''
                ].filter(Boolean).join(', ');

                formatted += `  - ${entityNumber}: ${entityName}${details ? ` (${details})` : ''}\n`;
            });

            if (filteredRelatedEntities.length > maxRelatedEntitiesInContext) {
                formatted += `  - ... еще ${filteredRelatedEntities.length - maxRelatedEntitiesInContext} связанных задач\n`;
            }
        }
    }
    
    // Вложения
    if (taskData.attachments && Array.isArray(taskData.attachments) && taskData.attachments.length > 0) {
        formatted += 'Вложения:\n';
        taskData.attachments.forEach(a => {
            formatted += `  - ${a.name || a.id}\n`;
        });
    }
    
    // Кастомные поля
    if (taskData.customFieldsValues && Array.isArray(taskData.customFieldsValues) && taskData.customFieldsValues.length > 0) {
        formatted += 'Дополнительные поля:\n';
        taskData.customFieldsValues.forEach(f => {
            const val = f.value !== undefined && f.value !== null ? f.value : '';
            formatted += `  - ${f.name || f.code}: ${val}\n`;
        });
    }
    
    // Состояние и ранг
    if (taskData.state) {
        formatted += `Состояние: ${taskData.state}\n`;
    }
    
    // Если есть другие атрибуты (кроме уже обработанных), добавляем их
    const processedAttrs = ['name', 'description', 'status', 'assignee', 'priority'];
    if (taskData.attributes && Array.isArray(taskData.attributes)) {
        const otherAttrs = taskData.attributes.filter(attr => 
            attr.name && 
            attr.value !== undefined && 
            attr.value !== null &&
            !processedAttrs.includes(attr.name.toLowerCase())
        );
        if (otherAttrs.length > 0) {
            formatted += '\nАтрибуты:\n';
            for (const attr of otherAttrs) {
                let attrValue = attr.value;
                // Если это атрибут assignee и значение - строка (email), получаем имя
                if (attr.name.toLowerCase() === 'assignee' && typeof attrValue === 'string' && attrValue.includes('@')) {
                    const userName = await fetchUserNameByEmail(attrValue);
                    if (userName) {
                        attrValue = userName;
                    } else {
                        // Пропускаем атрибут assignee, если имя не найдено (чтобы не показывать email)
                        continue;
                    }
                } else if (attr.name.toLowerCase() === 'assignee' && typeof attrValue === 'object') {
                    if (attrValue.name && typeof attrValue.name === 'string' && !attrValue.name.includes('@')) {
                        attrValue = attrValue.name;
                    } else if (attrValue.identifier && typeof attrValue.identifier === 'string') {
                        const userName = await fetchUserNameByEmail(attrValue.identifier);
                        if (userName) {
                            attrValue = userName;
                        } else {
                            // Пропускаем атрибут assignee, если имя не найдено
                            continue;
                        }
                    } else {
                        // Пропускаем, если не можем получить имя
                        continue;
                    }
                }
                const attrValueText = typeof attrValue === 'object' 
                    ? (attrValue.name || attrValue.value || JSON.stringify(attrValue))
                    : attrValue;
                // Не показываем email в атрибутах
                if (typeof attrValueText === 'string' && attrValueText.includes('@')) {
                    continue;
                }
                formatted += `  - ${attr.name}: ${attrValueText}\n`;
            }
        }
    }
    
    // Если есть комментарии, добавляем последние
    if (taskData.comments && Array.isArray(taskData.comments) && taskData.comments.length > 0) {
        formatted += '\nКомментарии:\n';
        const recentComments = taskData.comments.slice(-5); // Последние 5 комментариев
        recentComments.forEach((comment, index) => {
            const commentText = typeof comment === 'string' 
                ? comment 
                : (comment.text || comment.content || JSON.stringify(comment));
            const author = comment.author || comment.createdBy || '';
            formatted += `  ${index + 1}. ${commentText}${author ? ` (${author})` : ''}\n`;
        });
    }
    
    // Если структура данных отличается, добавляем основные поля
    if (!taskData.name && !taskData.description && !taskData.attributes) {
        // Пытаемся извлечь полезную информацию из любого объекта
        const importantFields = ['id', 'number', 'type', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
        importantFields.forEach(field => {
            if (taskData[field] !== undefined) {
                formatted += `${field}: ${taskData[field]}\n`;
            }
        });
    }
    
    return formatted;
}

// Форматирование markdown в HTML
function formatMarkdownToHtml(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    let formatted = text;
    
    // Сначала обрабатываем блоки кода с тройными обратными кавычками (чтобы не форматировать их содержимое)
    const codeBlocks = [];
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        const codeContent = code.trim()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        // Генерируем уникальный ID используя глобальный счетчик и timestamp
        const blockId = `code-block-${Date.now()}-${++globalCodeBlockCounter}`;
        codeBlocks.push({
            placeholder: placeholder,
            html: `<div class="code-block-wrapper">
                <button class="copy-code-btn" data-code-block-id="${blockId}" title="Скопировать">Скопировать</button>
                <pre id="${blockId}"><code class="language-${lang || 'text'}">${codeContent}</code></pre>
            </div>`
        });
        return placeholder;
    });
    
    // Инлайн код с одинарными обратными кавычками
    formatted = formatted.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    
    // Жирный текст **текст**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Курсив *текст* (но не списки и не жирный)
    formatted = formatted.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
    
    // Заголовки
    formatted = formatted.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Нумерованные списки (обрабатываем группы)
    formatted = formatted.replace(/((?:^\d+\.\s+.*\n?)+)/gm, (match) => {
        const items = match.trim().split(/\n/).map(line => {
            const content = line.replace(/^\d+\.\s+/, '');
            return `<li>${content}</li>`;
        }).join('');
        return `<ol>${items}</ol>`;
    });
    
    // Маркированные списки (обрабатываем группы)
    formatted = formatted.replace(/((?:^[-*]\s+.*\n?)+)/gm, (match) => {
        // Проверяем, не является ли это уже частью <ol>
        if (match.includes('</ol>') || match.includes('<ol>')) {
            return match;
        }
        const items = match.trim().split(/\n/).map(line => {
            const content = line.replace(/^[-*]\s+/, '');
            return `<li>${content}</li>`;
        }).join('');
        return `<ul>${items}</ul>`;
    });
    
    // Параграфы (разбиваем по двойным переносам строк)
    const paragraphs = formatted.split(/\n\n+/);
    formatted = paragraphs.map(para => {
        para = para.trim();
        if (!para) return '';
        // Если это уже HTML тег, не оборачиваем в <p>
        if (para.match(/^<(pre|h[1-6]|ul|ol|code|strong|em|li)/)) {
            return para;
        }
        // Если это список, не оборачиваем
        if (para.startsWith('<ul>') || para.startsWith('<ol>')) {
            return para;
        }
        // Заменяем одиночные переносы на <br>
        para = para.replace(/\n/g, '<br>');
        return '<p>' + para + '</p>';
    }).join('\n');
    
    // Восстанавливаем блоки кода
    codeBlocks.forEach(block => {
        formatted = formatted.replace(block.placeholder, block.html);
    });
    
    return formatted;
}

// Форматирование и вывод ответа
function formatAndDisplayResponse(aiResponse) {
    if (!aiResponse || typeof aiResponse !== 'string') {
        appendMessage('Бот', 'Получен некорректный ответ от API.');
        return;
    }
    
    // Форматируем markdown в HTML
    const formatted = formatMarkdownToHtml(aiResponse);
    appendMessage('Бот', formatted);
}

// Функция копирования блока кода в буфер обмена
function copyCodeBlock(blockId) {
    console.log('copyCodeBlock вызвана с blockId:', blockId);
    const codeElement = document.getElementById(blockId);
    if (!codeElement) {
        console.error('Элемент с id', blockId, 'не найден');
        return;
    }
    
    // Получаем текст из элемента <code> внутри <pre>
    let codeText = '';
    const codeNode = codeElement.querySelector('code');
    if (codeNode) {
        codeText = codeNode.textContent || codeNode.innerText;
    } else {
        codeText = codeElement.textContent || codeElement.innerText;
    }
    
    // Удаляем лишние пробелы и переносы в начале и конце
    codeText = codeText.trim();
    
    if (!codeText || codeText === '') {
        console.error('Не удалось получить текст из блока кода. Элемент:', codeElement);
        return;
    }
    
    console.log('Текст для копирования:', codeText.substring(0, 100) + '...');
    
    // Функция для обновления кнопки
    const updateButton = (button) => {
        if (button) {
            const originalText = button.textContent;
            button.textContent = 'Скопировано!';
            button.style.background = '#28a745';
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        }
    };
    
    // Копируем в буфер обмена
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeText).then(() => {
            console.log('Текст успешно скопирован через clipboard API');
            const button = codeElement.closest('.code-block-wrapper')?.querySelector('.copy-code-btn');
            updateButton(button);
        }).catch(err => {
            console.error('Ошибка копирования через clipboard API:', err);
            // Fallback для старых браузеров или когда clipboard API недоступен
            copyTextFallback(codeText, codeElement, updateButton);
        });
    } else {
        console.log('Clipboard API недоступен, используем fallback');
        // Fallback для старых браузеров
        copyTextFallback(codeText, codeElement, updateButton);
    }
    
    function copyTextFallback(text, codeElement, updateButton) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.style.opacity = '0';
        textArea.style.zIndex = '-9999';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('Текст успешно скопирован через execCommand');
                const button = codeElement.closest('.code-block-wrapper')?.querySelector('.copy-code-btn');
                updateButton(button);
            } else {
                console.error('Не удалось скопировать через execCommand');
                alert('Не удалось скопировать текст. Пожалуйста, выделите и скопируйте вручную.');
            }
        } catch (e) {
            console.error('Fallback копирование не удалось:', e);
            alert('Не удалось скопировать текст. Пожалуйста, выделите и скопируйте вручную.');
        }
        document.body.removeChild(textArea);
    }
}

// Делаем функцию доступной глобально для обратной совместимости
window.copyCodeBlock = copyCodeBlock;

// 3. Функция вывода сообщений
function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.className = `message ${sender === 'Вы' ? 'user-message' : (sender === 'Система' ? 'system-message' : 'ai-message')}`;
    msg.innerHTML = `<b>${sender}:</b><br>${text.replace(/\n/g, '<br>')}`;
    chatDiv.appendChild(msg);
    
    // Добавляем обработчики событий для кнопок копирования в новом сообщении
    const copyButtons = msg.querySelectorAll('.copy-code-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const blockId = this.getAttribute('data-code-block-id');
            if (blockId) {
                copyCodeBlock(blockId);
            }
        });
    });
    
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

// --- Слушатели событий ---

// Делегирование событий для кнопок копирования кода (работает для динамически добавленных элементов)
if (chatDiv) {
    chatDiv.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('copy-code-btn')) {
            const blockId = e.target.getAttribute('data-code-block-id');
            if (blockId) {
                copyCodeBlock(blockId);
            }
        }
    });
}

// Кнопка анализа
analyzeBtn.addEventListener('click', grabPageText);

// Кнопка создания нового чата
if (newChatBtn) {
    newChatBtn.addEventListener('click', async () => {
        // Очищаем отображение чата
        chatDiv.innerHTML = '';
        
        // Сбрасываем состояние
        pageContext = '';
        selectedRepos = [];
        
        // Обновляем отображение репозиториев
        renderSelectedRepos();
        
        // Очищаем поля ввода репозиториев
        if (repoProject) repoProject.value = '';
        if (repoRepository) {
            repoRepository.value = '';
            repoRepository.innerHTML = '<option value="">Выберите репозиторий</option>';
        }
        if (repoBranch) repoBranch.value = 'develop';
        
        // Очищаем поле ввода сообщения
        if (input) input.value = '';
        
        // Создаем новый чат в API с пустым списком репозиториев
        const currentApiType = API_TYPE === 'auto' ? detectedApiType : API_TYPE;
        if (currentApiType === 'sfera') {
            try {
                const createResponse = await sferaFetch(SFERA_CHATS_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        title: 'sfera.inno.local.chat',
                        selectedRepos: []
                    })
                });
                
                if (createResponse.ok) {
                    const createData = await createResponse.json();
                    sferaChatId = createData.id;
                    selectedRepos = [];
                    renderSelectedRepos();
                    console.log('Создан новый чат:', sferaChatId);
                } else {
                    const error_details = await readResponseError(createResponse);
                    console.error('Ошибка создания нового чата:', createResponse.status, error_details);
                    // Сбрасываем chatId, чтобы при следующем запросе создался новый
                    sferaChatId = null;
                }
            } catch (e) {
                console.error('Ошибка при создании нового чата:', e);
                // Сбрасываем chatId, чтобы при следующем запросе создался новый
                sferaChatId = null;
            }
        } else {
            // Для других типов API просто сбрасываем chatId
            sferaChatId = null;
        }
    });
}

// Кнопка пересказа
summaryBtn.addEventListener('click', () => {
    if (!pageContext) {
        appendMessage('Система', '⚠️ Нужно сначала проанализировать страницу!');
        return;
    }
    const summaryPrompt = 'Сделай краткий, структурированный пересказ этой страницы. Выдели 5 главных мыслей.';
    lastSentPrompt = summaryPrompt;
    appendMessage('Вы', 'Сделай краткий пересказ.');
    callAI(summaryPrompt);
});

function startEditPrompt(promptId) {
    renderPromptGroupOptions();
    const prompt = promptLibrary.prompts.find(item => item.id === promptId);
    if (!prompt) {
        return;
    }

    // Делаем секцию видимой, чтобы была доступна форма сохранения
    if (promptLibContent && promptLibToggle) {
        if (promptLibContent.classList.contains('collapsed')) {
            promptLibContent.classList.remove('collapsed');
            promptLibToggle.classList.remove('collapsed');
        }
    }

    if (promptTitleInput) {
        promptTitleInput.value = prompt.title || '';
    }
    if (promptGroupSelect) {
        const groupValue = typeof prompt.groupId === 'string' ? prompt.groupId : '';
        promptGroupSelect.value = groupValue;
    }
    if (promptTagsInput) {
        const tagsText = Array.isArray(prompt.tags) ? prompt.tags.join(', ') : '';
        promptTagsInput.value = tagsText;
    }
    if (input) {
        input.value = prompt.content || '';
        input.focus();
    }

    setPromptSaveModeEdit(promptId);
}

// Функция копирования последнего ответа бота
function copyLastBotResponse() {
    // Находим все сообщения бота
    const botMessages = chatDiv.querySelectorAll('.ai-message');
    
    if (botMessages.length === 0) {
        appendMessage('Система', '⚠️ Нет ответов бота для копирования.');
        return;
    }
    
    // Берем последнее сообщение бота
    const lastMessage = botMessages[botMessages.length - 1];
    
    // Клонируем элемент, чтобы не изменять оригинал
    const clone = lastMessage.cloneNode(true);
    
    // Удаляем заголовок "Бот:" и тег <br> после него
    const boldTag = clone.querySelector('b');
    if (boldTag) {
        const nextBr = boldTag.nextElementSibling;
        if (nextBr && nextBr.tagName === 'BR') {
            nextBr.remove();
        }
        boldTag.remove();
    }
    
    // Извлекаем текст из клона
    // Используем textContent для получения чистого текста без HTML-разметки
    let textToCopy = clone.textContent || clone.innerText;
    
    // Убираем "Бот:" если осталось в начале
    textToCopy = textToCopy.replace(/^Бот:\s*/i, '').trim();
    
    // Очищаем от лишних пробелов и переносов (более 2 подряд)
    textToCopy = textToCopy.replace(/\n{3,}/g, '\n\n');
    
    if (!textToCopy || textToCopy === '') {
        appendMessage('Система', '⚠️ Не удалось извлечь текст из ответа бота.');
        return;
    }
    
    // Копируем в буфер обмена
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Визуальная обратная связь
            const originalText = copyLastResponseBtn.textContent;
            copyLastResponseBtn.textContent = '✓ Скопировано!';
            copyLastResponseBtn.style.background = '#28a745';
            setTimeout(() => {
                copyLastResponseBtn.textContent = originalText;
                copyLastResponseBtn.style.background = '';
            }, 2000);
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            // Fallback для старых браузеров
            copyTextFallback(textToCopy);
        });
    } else {
        // Fallback для старых браузеров
        copyTextFallback(textToCopy);
    }
    
    function copyTextFallback(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.style.opacity = '0';
        textArea.style.zIndex = '-9999';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                const originalText = copyLastResponseBtn.textContent;
                copyLastResponseBtn.textContent = '✓ Скопировано!';
                copyLastResponseBtn.style.background = '#28a745';
                setTimeout(() => {
                    copyLastResponseBtn.textContent = originalText;
                    copyLastResponseBtn.style.background = '';
                }, 2000);
            } else {
                appendMessage('Система', '⚠️ Не удалось скопировать текст. Пожалуйста, скопируйте вручную.');
            }
        } catch (e) {
            console.error('Fallback копирование не удалось:', e);
            appendMessage('Система', '⚠️ Не удалось скопировать текст. Пожалуйста, скопируйте вручную.');
        }
        document.body.removeChild(textArea);
    }
}

// Обработчик кнопки "Скопировать ответ"
if (copyLastResponseBtn) {
    copyLastResponseBtn.addEventListener('click', copyLastBotResponse);
}

// Функция отправки сообщения
function sendMessage() {
    const val = input.value.trim();
    if (val && !typingIndicator.style.display || typingIndicator.style.display === 'none') {
        lastSentPrompt = val;
        appendMessage('Вы', val);
        input.value = '';
        input.style.height = 'auto'; // Сброс высоты textarea
        callAI(val);
    }
}

// Отправка по кнопке
sendBtn.addEventListener('click', sendMessage);

// Ввод вопроса через Ctrl+Enter (Enter создает новую строку)
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Функция тестирования подключения к API
async function testApiConnection() {
    setLoader(true);
    
    const testPrompt = 'Привет! Ответь одним словом: "Работает"';
    
    try {
        // Определяем тип API
        let apiType = API_TYPE;
        if (API_TYPE === 'auto') {
            apiType = await detectApiType();
        }
        
        // Выполняем тестовый запрос
        const testContext = 'Тестовый контекст';
        pageContext = testContext; // Временно устанавливаем контекст для теста
        
        await callAI(testPrompt);
    } catch (e) {
        appendMessage('Ошибка', `Ошибка при тестировании: ${e.message}`);
        console.error('Test error:', e);
    } finally {
        setLoader(false);
        pageContext = ''; // Очищаем тестовый контекст
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ЧАТА SFERA ==========

// Инициализация чата: создание нового чата при отсутствии chatId
async function initSferaChat() {
    if (API_TYPE !== 'sfera' && (API_TYPE !== 'auto' || detectedApiType !== 'sfera')) {
        return;
    }
    
    if (sferaChatId) {
        // Чат уже инициализирован, просто загружаем selectedRepos
        await loadChatSelectedRepos();
        return;
    }
    
    try {
        // Всегда создаем новый чат, без поиска по title.
        const createResponse = await sferaFetch(SFERA_CHATS_URL, {
            method: 'POST',
            body: JSON.stringify({
                title: 'sfera.inno.local.chat',
                selectedRepos: []
            })
        });
        
        if (createResponse.ok) {
            const createData = await createResponse.json();
            sferaChatId = createData.id;
            selectedRepos = createData.selectedRepos || [];
            renderSelectedRepos();
            console.log('Создан новый чат:', sferaChatId);
        } else {
            const error_details = await readResponseError(createResponse);
            console.error('Ошибка создания чата:', createResponse.status, error_details);
        }
    } catch (e) {
        console.error('Ошибка инициализации чата:', e);
    }
}

// Загрузка selectedRepos из текущего чата
async function loadChatSelectedRepos() {
    if (!sferaChatId) return;
    
    try {
        const getChatResponse = await sferaFetch(`${SFERA_BASE_URL}/api/chats/${sferaChatId}`, {
            method: 'GET'
        });
        
        if (getChatResponse.ok) {
            const chatData = await getChatResponse.json();
            if (chatData.selectedRepos && Array.isArray(chatData.selectedRepos)) {
                selectedRepos = chatData.selectedRepos;
                renderSelectedRepos();
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки selectedRepos:', e);
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С РЕПОЗИТОРИЯМИ ==========

// Отображение выбранных репозиториев
function renderSelectedRepos() {
    if (!selectedReposDiv) return;
    
    selectedReposDiv.innerHTML = '';
    
    selectedRepos.forEach((repo, index) => {
        const tag = document.createElement('div');
        tag.className = 'repo-tag';
        
        const text = document.createElement('span');
        text.className = 'repo-tag-text';
        const displayText = `${repo.project} / ${repo.repository.length > 25 ? repo.repository.substring(0, 25) + '...' : repo.repository} / ${repo.branch}`;
        text.textContent = displayText;
        text.title = `${repo.project} / ${repo.repository} / ${repo.branch}`;
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'repo-tag-remove';
        removeBtn.textContent = '×';
        removeBtn.onclick = () => removeRepo(index);
        
        tag.appendChild(text);
        tag.appendChild(removeBtn);
        selectedReposDiv.appendChild(tag);
    });
}

// Добавление репозитория
async function addRepo() {
    const project = repoProject.value;
    const repository = repoRepository.value;
    const branch = repoBranch.value.trim();
    
    if (!project || !repository || !branch) {
        appendMessage('Система', '⚠️ Заполните все поля: проект, репозиторий и ветка');
        return;
    }
    
    // Проверяем, не добавлен ли уже такой репозиторий
    const exists = selectedRepos.some(repo => 
        repo.project === project && 
        repo.repository === repository && 
        repo.branch === branch
    );
    
    if (exists) {
        appendMessage('Система', '⚠️ Этот репозиторий уже добавлен');
        return;
    }
    
    // Добавляем репозиторий
    selectedRepos.push({ project, repository, branch });
    renderSelectedRepos();
    
    // Очищаем поля ввода
    repoProject.value = '';
    repoRepository.value = '';
    repoRepository.innerHTML = '<option value="">Выберите репозиторий</option>';
    repoBranch.value = 'develop';
    
    // Обновляем selectedRepos в чате через API
    await updateSelectedRepos();
}

// Удаление репозитория
async function removeRepo(index) {
    selectedRepos.splice(index, 1);
    renderSelectedRepos();
    
    // Обновляем selectedRepos в чате через API
    await updateSelectedRepos();
}

// Обновление selectedRepos в чате через API
async function updateSelectedRepos() {
    if (!sferaChatId) {
        return;
    }
    
    // Проверяем, что используется API Sfera
    const currentApiType = API_TYPE === 'auto' ? detectedApiType : API_TYPE;
    if (currentApiType !== 'sfera') {
        return;
    }
    
    try {
        const response = await sferaFetch(`${SFERA_BASE_URL}/api/chats/${sferaChatId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                selectedRepos: selectedRepos
            })
        });
        
        if (!response.ok) {
            console.error('Ошибка обновления репозиториев:', response.status);
            const errorText = await response.text();
            console.error('Детали ошибки:', errorText);
        } else {
            console.log('Репозитории успешно обновлены:', selectedRepos);
        }
    } catch (e) {
        console.error('Ошибка при обновлении репозиториев:', e);
    }
}

// Инициализация select'ов для проектов и репозиториев
function initReposSelects() {
    if (!repoProject || !repoRepository) return;
    
    // Заполняем проекты
    PROJECTS.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        repoProject.appendChild(option);
    });
    
    // Обработчик изменения проекта - фильтруем репозитории
    repoProject.addEventListener('change', () => {
        const selectedProject = repoProject.value;
        repoRepository.innerHTML = '<option value="">Выберите репозиторий</option>';
        
        if (selectedProject && REPOSITORIES[selectedProject]) {
            REPOSITORIES[selectedProject].forEach(repo => {
                const option = document.createElement('option');
                option.value = repo;
                option.textContent = repo;
                repoRepository.appendChild(option);
            });
        }
    });
}

// Обработчики событий для репозиториев
if (addRepoBtn) {
    addRepoBtn.addEventListener('click', addRepo);
}

// Добавление по Enter в поле ветки
if (repoBranch) {
    repoBranch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (repoProject.value && repoRepository.value && repoBranch.value.trim()) {
                addRepo();
            }
        }
    });
}

// Обработчики библиотеки промптов
if (promptLibHeader) {
    promptLibHeader.addEventListener('click', togglePromptLibraryCollapse);
}
if (savePromptBtn) {
    savePromptBtn.addEventListener('click', () => {
        saveCurrentPrompt();
    });
}
if (savePromptQuickBtn) {
    savePromptQuickBtn.addEventListener('click', quickSaveCurrentPrompt);
}
if (newPromptGroupBtn) {
    newPromptGroupBtn.addEventListener('click', createPromptGroup);
}
if (promptSearchInput) {
    promptSearchInput.addEventListener('input', renderPromptList);
}
if (promptFilterGroupSelect) {
    promptFilterGroupSelect.addEventListener('change', renderPromptList);
}
if (taskContextModeSelect) {
    taskContextModeSelect.addEventListener('change', async () => {
        await persistTaskContextMode(taskContextModeSelect.value);
    });
}

// ========================================================

// Показываем/скрываем секцию репозиториев в зависимости от типа API
function toggleReposSection() {
    const reposSection = document.getElementById('repos-section');
    if (reposSection) {
        const currentApiType = API_TYPE === 'auto' ? detectedApiType : API_TYPE;
        reposSection.style.display = currentApiType === 'sfera' ? 'block' : 'none';
    }
}

// Показываем/скрываем кнопку нового чата в зависимости от типа API
function toggleNewChatButton() {
    const chatHeader = document.getElementById('chat-header');
    if (chatHeader && newChatBtn) {
        const currentApiType = API_TYPE === 'auto' ? detectedApiType : API_TYPE;
        newChatBtn.style.display = currentApiType === 'sfera' ? 'block' : 'none';
    }
}

// Переключение сворачивания/разворачивания блока репозиториев
function toggleReposCollapse() {
    const reposContent = document.getElementById('reposContent');
    const reposToggle = document.getElementById('reposToggle');
    
    if (reposContent && reposToggle) {
        const isCollapsed = reposContent.classList.contains('collapsed');
        
        if (isCollapsed) {
            reposContent.classList.remove('collapsed');
            reposToggle.classList.remove('collapsed');
        } else {
            reposContent.classList.add('collapsed');
            reposToggle.classList.add('collapsed');
        }
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Инициализируем select'ы для проектов и репозиториев
    initReposSelects();
    
    // Инициализируем отображение репозиториев
    renderSelectedRepos();
    await loadPromptLibrary();
    await loadTaskContextMode();
    renderPromptGroupOptions();
    renderPromptList();
    setPromptSaveModeCreate();
    
    // Обработчик клика на заголовок репозиториев для сворачивания/разворачивания
    const reposHeader = document.getElementById('reposHeader');
    if (reposHeader) {
        reposHeader.addEventListener('click', toggleReposCollapse);
    }
    
    // Показываем/скрываем секцию репозиториев и кнопку нового чата в зависимости от типа API.
    // Важно: не создаем чат автоматически при загрузке.
    // Чат создается только по кнопке "+ Новый чат" или при первой отправке сообщения.
    if (API_TYPE === 'auto') {
        setTimeout(async () => {
            await detectApiType();
            toggleReposSection();
            toggleNewChatButton();
        }, 1000);
    } else {
        toggleReposSection();
        toggleNewChatButton();
    }
});
