<script setup>
import { useScopedI18n } from '@/i18n/app'
import { useGlobalState } from '../store'
import DOMPurify from 'dompurify'
const { openSettings } = useGlobalState()


const { t } = useScopedI18n('views.Footer')

</script>

<template>
    <div class="immortal-footer">
        <n-divider class="footer-divider" />
        <div style="text-align: center; padding: 18px 12px">
            <n-space justify="center" align="center">
                <span class="footer-brand">LeonMinGod · Immortal Mail</span>
                <n-text depth="3">
                    © 2026
                </n-text>
                <n-text depth="3" v-if="openSettings.copyright">
                    <div v-html="DOMPurify.sanitize(openSettings.copyright)"></div>
                </n-text>
            </n-space>
        </div>
    </div>
</template>


<style scoped>
.footer-divider {
    margin: 0;
    padding: 0 var(--x-padding);
}

.footer-brand {
    font-size: 0.76rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    color: var(--text-muted);
    text-transform: uppercase;
}
</style>
