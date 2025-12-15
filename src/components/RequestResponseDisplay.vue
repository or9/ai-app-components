<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import type { Message } from "../types";

const props = defineProps<{
    messages: Message[];
    loading?: boolean;
}>();

const containerRef = ref<HTMLDivElement | null>(null);

const scrollToBottom = async () => {
    await nextTick();
    if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
};

watch(() => props.messages.length, scrollToBottom);

const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};
</script>

<template>
    <div class="request-response-display" ref="containerRef">
        <div v-if="messages.length === 0" class="empty-state">
            <p>No messages yet. Start a conversation!</p>
        </div>

        <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="[
                `message-${message.role}`,
                { streaming: message.isStreaming },
            ]"
        >
            <div class="message-header">
                <span class="role">{{
                    message.role === "user" ? "You" : "Assistant"
                }}</span>
                <span class="timestamp">{{
                    formatTime(message.timestamp)
                }}</span>
            </div>
            <div class="message-content">
                <span>{{ message.content }}</span>
                <span v-if="message.isStreaming" class="cursor">▊</span>
            </div>
        </div>

        <div v-if="loading" class="loading-indicator">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.request-response-display {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    height: 100%;
    overflow-y: auto;
    background: #f9fafb;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
}

.message {
    max-width: 80%;
    padding: 12px 16px;
    border-radius: 12px;
}

.message-user {
    align-self: flex-end;
    background: #3b82f6;
    color: white;
}

.message-assistant {
    align-self: flex-start;
    background: white;
    border: 1px solid #e0e0e0;
}

.message-system {
    align-self: center;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    font-size: 12px;
}

.message-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
    font-size: 11px;
    opacity: 0.7;
}

.message-content {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
}

.cursor {
    animation: blink 1s infinite;
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}

.loading-indicator {
    align-self: flex-start;
    padding: 12px 16px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    background: #666;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}
.typing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes bounce {
    0%,
    80%,
    100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1);
    }
}
</style>
