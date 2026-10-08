<script setup>
import { useScopedI18n } from '@/i18n/app'

import { useGlobalState } from '../store'

import AddressMangement from './user/AddressManagement.vue';
import UserSettingsPage from './user/UserSettings.vue';
import UserBar from './user/UserBar.vue';
import BindAddress from './user/BindAddress.vue';
import UserMailBox from './user/UserMailBox.vue';
import UserSendBox from './user/UserSendBox.vue';

import {
    FolderSharedOutlined, InboxOutlined, OutboxOutlined,
    EditNoteOutlined, SettingsOutlined, AddLinkOutlined
} from '@vicons/material'

const {
    userTab, globalTabplacement, userSettings, openSettings
} = useGlobalState()

const { t } = useScopedI18n('views.User')
const { t: userMailT } = useScopedI18n('views.user.UserSendBox')

</script>

<template>
    <div>
        <UserBar />
        <n-tabs v-if="userSettings.user_email" type="card" v-model:value="userTab" :placement="globalTabplacement" class="immortal-nav-tabs">
            <n-tab-pane name="address_management">
                <template #tab>
                    <div class="immortal-tab-item">
                        <n-icon :component="FolderSharedOutlined" />
                        <span>{{ t('address_management') }}</span>
                    </div>
                </template>
                <AddressMangement />
            </n-tab-pane>
            <n-tab-pane name="user_mail_box_tab">
                <template #tab>
                    <div class="immortal-tab-item">
                        <n-icon :component="InboxOutlined" />
                        <span>{{ t('user_mail_box_tab') }}</span>
                    </div>
                </template>
                <UserMailBox />
            </n-tab-pane>
            <n-tab-pane v-if="openSettings.enableSendMail" name="user_sendbox">
                <template #tab>
                    <div class="immortal-tab-item">
                        <n-icon :component="OutboxOutlined" />
                        <span>{{ userMailT('sendbox') }}</span>
                    </div>
                </template>
                <UserSendBox mode="sendbox" />
            </n-tab-pane>
            <n-tab-pane v-if="openSettings.enableSendMail" name="user_send_mail">
                <template #tab>
                    <div class="immortal-tab-item">
                        <n-icon :component="EditNoteOutlined" />
                        <span>{{ t('send_mail') }}</span>
                    </div>
                </template>
                <UserSendBox mode="send_mail" @sent="userTab = 'user_sendbox'" />
            </n-tab-pane>
            <n-tab-pane name="user_settings">
                <template #tab>
                    <div class="immortal-tab-item">
                        <n-icon :component="SettingsOutlined" />
                        <span>{{ t('user_settings') }}</span>
                    </div>
                </template>
                <UserSettingsPage />
            </n-tab-pane>
            <n-tab-pane name="bind_address">
                <template #tab>
                    <div class="immortal-tab-item">
                        <n-icon :component="AddLinkOutlined" />
                        <span>{{ t('bind_address') }}</span>
                    </div>
                </template>
                <BindAddress />
            </n-tab-pane>
        </n-tabs>
    </div>
</template>
