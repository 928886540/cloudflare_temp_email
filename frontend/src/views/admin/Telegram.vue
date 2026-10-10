<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useScopedI18n } from '@/i18n/app'
// @ts-ignore
import { api } from '../../api'

const message = useMessage()
const { t } = useScopedI18n('views.admin.Telegram')
const configuration = ref<{ hasToken: boolean; hasKV: boolean } | null>(null)
const configured = computed(() => configuration.value?.hasToken && configuration.value?.hasKV)
const loadingConfiguration = ref(true)
const configurationError = ref(false)
const settingsLoaded = ref(false)
const operation = ref('')
const actionError = ref('')
const busy = computed(() => loadingConfiguration.value || !!operation.value)
const canEdit = computed(() => configured.value && settingsLoaded.value && !busy.value)
const status = ref<{ info: { url?: string; pending_update_count?: number; last_error_message?: string }; commands: unknown[] } | null>(null)
const settings = ref({
    enableAllowList: false,
    allowList: [] as string[],
    miniAppUrl: '',
    enableGlobalMailPush: false,
    globalMailPushList: [] as string[],
})

const loadSettings = async () => {
    if (operation.value) return
    loadingConfiguration.value = true
    configurationError.value = false
    actionError.value = ''
    settingsLoaded.value = false
    status.value = null
    try {
        configuration.value = await api.fetch('/admin/telegram/configuration', { showLoading: false })
        if (configured.value) {
            const data = await api.fetch('/admin/telegram/settings', { showLoading: false })
            Object.assign(settings.value, data)
            settingsLoaded.value = true
        }
    } catch {
        configurationError.value = true
    } finally {
        loadingConfiguration.value = false
    }
}

const fetchStatus = async () => {
    if (busy.value || !configured.value) return
    operation.value = 'status'
    actionError.value = ''
    status.value = null
    try {
        status.value = await api.fetch('/admin/telegram/status', { showLoading: false })
    } catch {
        actionError.value = t('statusFailed')
    } finally {
        operation.value = ''
    }
}

const init = async () => {
    if (busy.value || !configured.value) return
    operation.value = 'init'
    actionError.value = ''
    status.value = null
    try {
        await api.fetch('/admin/telegram/init', { method: 'POST', showLoading: false })
        message.success(t('successTip'))
    } catch {
        actionError.value = t('initFailed')
    } finally {
        operation.value = ''
    }
}

const saveSettings = async () => {
    if (!canEdit.value) return
    operation.value = 'save'
    actionError.value = ''
    try {
        await api.fetch('/admin/telegram/settings', {
            method: 'POST', showLoading: false, body: settings.value,
        })
        message.success(t('successTip'))
    } catch {
        actionError.value = t('saveFailed')
    } finally {
        operation.value = ''
    }
}

onMounted(loadSettings)
</script>

<template>
    <div class="center">
        <n-card :bordered="false" embedded style="max-width: 800px; overflow: auto;">
            <n-flex justify="end" class="telegram-actions">
                <n-button @click="loadSettings" secondary :loading="loadingConfiguration" :disabled="busy">
                    {{ t('refreshConfiguration') }}
                </n-button>
                <n-button @click="fetchStatus" secondary :loading="operation === 'status'" :disabled="!configured || busy || configurationError">
                    {{ t('status') }}
                </n-button>
                <n-button @click="init" type="primary" :loading="operation === 'init'" :disabled="!configured || busy || configurationError">
                    {{ t('init') }}
                </n-button>
                <n-button @click="saveSettings" type="primary" :loading="operation === 'save'" :disabled="!canEdit">
                    {{ t('save') }}
                </n-button>
            </n-flex>
            <n-alert v-if="configurationError" type="error" :show-icon="false" :bordered="false" class="telegram-config-alert">
                {{ t('configurationFailed') }}
            </n-alert>
            <n-alert v-else-if="configuration && !configured" type="info" :show-icon="false" :bordered="false" class="telegram-config-alert">
                <strong>{{ t('configurationRequiredTitle') }}</strong>
                <p>{{ t('optionalFeature') }}</p>
                <p v-if="!configuration.hasToken">{{ t('tokenRequired') }}</p>
                <p v-if="!configuration.hasKV">{{ t('kvRequired') }}</p>
                <p>{{ t('setupThenRefresh') }}</p>
            </n-alert>
            <n-alert v-if="actionError" type="error" :show-icon="false" :bordered="false" class="telegram-config-alert">
                {{ actionError }}
            </n-alert>
            <n-form :disabled="!canEdit">
            <n-card :bordered="false" embedded>
                <n-form-item-row :label="t('enableTelegramAllowList')">
                    <div class="telegram-setting-row">
                        <n-checkbox v-model:checked="settings.enableAllowList">
                            {{ t('enable') }}
                        </n-checkbox>
                        <n-select v-model:value="settings.allowList" filterable multiple tag
                            :placeholder="t('telegramAllowList')">
                            <template #empty>
                                <n-text depth="3">
                                    {{ t('manualInputPrompt') }}
                                </n-text>
                            </template>
                        </n-select>
                    </div>
                </n-form-item-row>
                <n-form-item-row :label="t('enableGlobalMailPush')">
                    <div class="telegram-setting-row">
                        <n-checkbox v-model:checked="settings.enableGlobalMailPush">
                            {{ t('enable') }}
                        </n-checkbox>
                        <n-select v-model:value="settings.globalMailPushList" filterable multiple tag
                            :placeholder="t('globalMailPushList')">
                            <template #empty>
                                <n-text depth="3">
                                    {{ t('manualInputPrompt') }}
                                </n-text>
                            </template>
                        </n-select>
                    </div>
                    <template #feedback>
                        <n-text depth="3">
                            {{ t('globalMailPushListTip') }}
                        </n-text>
                    </template>
                </n-form-item-row>
                <n-form-item-row :label="t('miniAppUrl')">
                    <n-input v-model:value="settings.miniAppUrl"></n-input>
                </n-form-item-row>
            </n-card>
            </n-form>
            <div v-if="status" class="telegram-status-alert">
                <n-tag :type="status.info.url ? 'success' : 'warning'" :bordered="false">
                    {{ t(status.info.url ? 'webhookReady' : 'webhookMissing') }}
                </n-tag>
                <p v-if="status.info.url">Webhook: {{ status.info.url }}</p>
                <p>{{ t('pendingUpdates') }}: {{ status.info.pending_update_count ?? 0 }}</p>
                <p v-if="status.info.last_error_message">{{ t('lastError') }}: {{ status.info.last_error_message }}</p>
            </div>
        </n-card>
    </div>
</template>

<style scoped>
.center {
    display: flex;
    text-align: left;
    place-items: center;
    justify-content: center;
}

.telegram-config-alert,
.telegram-status-alert {
    margin: 12px 0;
    text-align: left;
}

.telegram-config-alert strong {
    display: block;
    margin-bottom: 4px;
}

.telegram-actions { margin-bottom: 16px; }
.telegram-config-alert p { margin: 6px 0 0; }
.telegram-setting-row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    min-width: 0;
}
.telegram-setting-row .n-checkbox { flex-shrink: 0; }
.telegram-setting-row .n-select { min-width: 0; flex: 1; }
.telegram-status-alert { overflow-wrap: anywhere; }
@media (max-width: 480px) {
    .telegram-setting-row { flex-direction: column; align-items: stretch; gap: 8px; }
}
</style>
