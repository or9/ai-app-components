<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    maxLength?: number;
    loading?: boolean;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string];
    submit: [value: string];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const inputValue = computed({
    get: () => props.modelValue || "",
    set: (value: string) => emit("update:modelValue", value),
});

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
    }
};

const handleSubmit = () => {
    if (inputValue.value.trim() && !props.disabled && !props.loading) {
        emit("submit", inputValue.value.trim());
    }
};

const adjustHeight = () => {
    if (textareaRef.value) {
        textareaRef.value.style.height = "auto";
        textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 200)}px`;
    }
};
</script>

<template>
    <div class="message-textfield">
        <div class="input-wrapper">
            <textarea
                ref="textareaRef"
                v-model="inputValue"
                :placeholder="placeholder || 'Type your message...'"
                :disabled="disabled || loading"
                :maxlength="maxLength"
                @keydown="handleKeydown"
                @input="adjustHeight"
                rows="1"
            />
            <button
                class="submit-btn"
                :disabled="!inputValue.trim() || disabled || loading"
                @click="handleSubmit"
            >
                <span v-if="loading" class="loading-spinner" />
                <span v-else class="send-icon">➤</span>
            </button>
        </div>
        <div v-if="maxLength" class="char-count">
            {{ inputValue.length }} / {{ maxLength }}
        </div>
    </div>
</template>

<style scoped>
.message-textfield {
    width: 100%;
}

.input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
}

.input-wrapper:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

textarea {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    max-height: 200px;
    background: transparent;
}

textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 6px;
    background: #3b82f6;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
    background: #2563eb;
}

.submit-btn:disabled {
    background: #e0e0e0;
    cursor: not-allowed;
}

.loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.char-count {
    text-align: right;
    font-size: 12px;
    color: #666;
    margin-top: 4px;
}
</style>
