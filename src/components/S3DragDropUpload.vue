<script setup lang="ts">
import { ref, computed } from "vue";
import type { UploadFile, S3UploadConfig } from "../types";

const props = defineProps<{
    config: S3UploadConfig;
    multiple?: boolean;
    accept?: string;
}>();

const emit = defineEmits<{
    "upload-start": [file: UploadFile];
    "upload-progress": [file: UploadFile];
    "upload-complete": [file: UploadFile];
    "upload-error": [file: UploadFile, error: Error];
    "files-selected": [files: UploadFile[]];
}>();

const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const maxSizeMB = computed(() =>
    props.config.maxFileSize ? props.config.maxFileSize / (1024 * 1024) : 100,
);

const generateId = () => Math.random().toString(36).substring(2, 11);

const createUploadFile = (file: File): UploadFile => ({
    id: generateId(),
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date(),
    status: "pending",
    progress: 0,
});

const validateFile = (file: File): string | null => {
    if (props.config.maxFileSize && file.size > props.config.maxFileSize) {
        return `File exceeds maximum size of ${maxSizeMB.value}MB`;
    }
    if (
        props.config.allowedTypes?.length &&
        !props.config.allowedTypes.includes(file.type)
    ) {
        return `File type ${file.type} is not allowed`;
    }
    return null;
};

const uploadToS3 = async (file: File, uploadFile: UploadFile) => {
    try {
        uploadFile.status = "uploading";
        emit("upload-start", uploadFile);

        // Get presigned URL from Lambda
        const presignResponse = await fetch(props.config.presignedUrlEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            }),
        });

        if (!presignResponse.ok) {
            throw new Error("Failed to get presigned URL");
        }

        const { uploadUrl, key } = await presignResponse.json();
        uploadFile.s3Key = key;

        // Upload to S3 with progress tracking
        await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    uploadFile.progress = Math.round(
                        (e.loaded / e.total) * 100,
                    );
                    emit("upload-progress", uploadFile);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(
                        new Error(`Upload failed with status ${xhr.status}`),
                    );
                }
            });

            xhr.addEventListener("error", () =>
                reject(new Error("Upload failed")),
            );
            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
        });

        uploadFile.status = "completed";
        uploadFile.progress = 100;
        emit("upload-complete", uploadFile);
    } catch (error) {
        uploadFile.status = "error";
        uploadFile.error =
            error instanceof Error ? error.message : "Upload failed";
        emit(
            "upload-error",
            uploadFile,
            error instanceof Error ? error : new Error("Upload failed"),
        );
    }
};

const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    const uploadFiles: UploadFile[] = [];

    for (const file of Array.from(files)) {
        const uploadFile = createUploadFile(file);
        const validationError = validateFile(file);

        if (validationError) {
            uploadFile.status = "error";
            uploadFile.error = validationError;
        }

        uploadFiles.push(uploadFile);
    }

    emit("files-selected", uploadFiles);

    // Upload valid files
    for (let i = 0; i < uploadFiles.length; i++) {
        if (uploadFiles[i].status !== "error") {
            await uploadToS3(files[i], uploadFiles[i]);
        }
    }
};

const handleDrop = (event: DragEvent) => {
    isDragging.value = false;
    handleFiles(event.dataTransfer?.files || null);
};

const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    isDragging.value = true;
};

const handleDragLeave = () => {
    isDragging.value = false;
};

const openFilePicker = () => {
    fileInputRef.value?.click();
};

const handleInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    handleFiles(target.files);
    target.value = "";
};
</script>

<template>
    <div
        class="s3-drag-drop-upload"
        :class="{ dragging: isDragging }"
        @drop.prevent="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @click="openFilePicker"
    >
        <input
            ref="fileInputRef"
            type="file"
            :multiple="multiple"
            :accept="accept"
            @change="handleInputChange"
            hidden
        />

        <div class="upload-content">
            <div class="upload-icon">📁</div>
            <p class="primary-text">
                Drag & drop files here or <span class="link">browse</span>
            </p>
            <p class="secondary-text">
                Max file size: {{ maxSizeMB }}MB
                <template v-if="config.allowedTypes?.length">
                    <br />Allowed: {{ config.allowedTypes.join(", ") }}
                </template>
            </p>
        </div>
    </div>
</template>

<style scoped>
.s3-drag-drop-upload {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    background: #f9fafb;
    cursor: pointer;
    transition: all 0.2s;
}

.s3-drag-drop-upload:hover,
.s3-drag-drop-upload.dragging {
    border-color: #3b82f6;
    background: #eff6ff;
}

.upload-content {
    text-align: center;
}

.upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.primary-text {
    font-size: 16px;
    color: #374151;
    margin-bottom: 8px;
}

.link {
    color: #3b82f6;
    text-decoration: underline;
}

.secondary-text {
    font-size: 12px;
    color: #6b7280;
}
</style>
