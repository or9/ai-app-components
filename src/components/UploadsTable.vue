<script setup lang="ts">
import { ref, computed } from "vue";
import type { UploadFile, TableColumn } from "../types";

const props = defineProps<{
    uploads: UploadFile[];
    columns?: TableColumn[];
}>();

const emit = defineEmits<{
    delete: [file: UploadFile];
    download: [file: UploadFile];
}>();

const defaultColumns: TableColumn[] = [
    { key: "name", label: "File Name", sortable: true, filterable: true },
    { key: "size", label: "Size", sortable: true },
    { key: "type", label: "Type", sortable: true, filterable: true },
    { key: "status", label: "Status", sortable: true, filterable: true },
    { key: "uploadedAt", label: "Uploaded", sortable: true },
];

const tableColumns = computed(() => props.columns || defaultColumns);

const filterText = ref("");
const sortKey = ref<string>("uploadedAt");
const sortDirection = ref<"asc" | "desc">("desc");

const filteredAndSortedUploads = computed(() => {
    let result = [...props.uploads];

    // Filter
    if (filterText.value) {
        const search = filterText.value.toLowerCase();
        result = result.filter(
            (upload) =>
                upload.name.toLowerCase().includes(search) ||
                upload.type.toLowerCase().includes(search) ||
                upload.status.toLowerCase().includes(search),
        );
    }

    // Sort
    result.sort((a, b) => {
        const aVal = a[sortKey.value as keyof UploadFile];
        const bVal = b[sortKey.value as keyof UploadFile];

        if (aVal === bVal) return 0;

        let comparison = 0;
        if (aVal instanceof Date && bVal instanceof Date) {
            comparison = aVal.getTime() - bVal.getTime();
        } else if (typeof aVal === "number" && typeof bVal === "number") {
            comparison = aVal - bVal;
        } else {
            comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection.value === "asc" ? comparison : -comparison;
    });

    return result;
});

const handleSort = (key: string) => {
    if (sortKey.value === key) {
        sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    } else {
        sortKey.value = key;
        sortDirection.value = "asc";
    }
};

const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
};

const getCellValue = (upload: UploadFile, key: string): string => {
    const value = upload[key as keyof UploadFile];
    if (key === "size") return formatSize(value as number);
    if (key === "uploadedAt") return formatDate(value as Date);
    if (key === "progress") return `${value}%`;
    return String(value ?? "");
};

const getStatusClass = (status: string): string => {
    return `status-${status}`;
};
</script>

<template>
    <div class="uploads-table">
        <div class="table-controls">
            <input
                v-model="filterText"
                type="text"
                placeholder="Filter uploads..."
                class="filter-input"
            />
            <span class="upload-count"
                >{{ filteredAndSortedUploads.length }} files</span
            >
        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th
                            v-for="column in tableColumns"
                            :key="column.key"
                            :class="{
                                sortable: column.sortable,
                                active: sortKey === column.key,
                            }"
                            :style="column.width ? { width: column.width } : {}"
                            @click="column.sortable && handleSort(column.key)"
                        >
                            {{ column.label }}
                            <span
                                v-if="column.sortable && sortKey === column.key"
                                class="sort-indicator"
                            >
                                {{ sortDirection === "asc" ? "▲" : "▼" }}
                            </span>
                        </th>
                        <th class="actions-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="filteredAndSortedUploads.length === 0">
                        <td
                            :colspan="tableColumns.length + 1"
                            class="empty-row"
                        >
                            No uploads found
                        </td>
                    </tr>
                    <tr
                        v-for="upload in filteredAndSortedUploads"
                        :key="upload.id"
                    >
                        <td v-for="column in tableColumns" :key="column.key">
                            <template v-if="column.key === 'status'">
                                <span
                                    class="status-badge"
                                    :class="getStatusClass(upload.status)"
                                >
                                    {{ upload.status }}
                                </span>
                                <div
                                    v-if="
                                        upload.status === 'uploading' &&
                                        upload.progress
                                    "
                                    class="progress-bar"
                                >
                                    <div
                                        class="progress-fill"
                                        :style="{
                                            width: `${upload.progress}%`,
                                        }"
                                    />
                                </div>
                            </template>
                            <template v-else>
                                {{ getCellValue(upload, column.key) }}
                            </template>
                        </td>
                        <td class="actions-col">
                            <button
                                v-if="upload.status === 'completed'"
                                class="action-btn download"
                                @click="emit('download', upload)"
                                title="Download"
                            >
                                ↓
                            </button>
                            <button
                                class="action-btn delete"
                                @click="emit('delete', upload)"
                                title="Delete"
                            >
                                ×
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.uploads-table {
    width: 100%;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
}

.table-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #f9fafb;
}

.filter-input {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    width: 250px;
}

.filter-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.upload-count {
    font-size: 14px;
    color: #6b7280;
}

.table-wrapper {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
}

th {
    background: #f9fafb;
    font-weight: 600;
    font-size: 13px;
    color: #374151;
    user-select: none;
}

th.sortable {
    cursor: pointer;
}

th.sortable:hover {
    background: #f3f4f6;
}

.sort-indicator {
    margin-left: 4px;
    font-size: 10px;
}

td {
    font-size: 14px;
}

.empty-row {
    text-align: center;
    color: #6b7280;
    padding: 32px;
}

.status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-pending {
    background: #fef3c7;
    color: #92400e;
}
.status-uploading {
    background: #dbeafe;
    color: #1e40af;
}
.status-completed {
    background: #d1fae5;
    color: #065f46;
}
.status-error {
    background: #fee2e2;
    color: #991b1b;
}

.progress-bar {
    width: 100%;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    margin-top: 4px;
}

.progress-fill {
    height: 100%;
    background: #3b82f6;
    border-radius: 2px;
    transition: width 0.3s;
}

.actions-col {
    width: 80px;
    text-align: center;
}

.action-btn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin: 0 2px;
}

.action-btn.download {
    background: #dbeafe;
    color: #1e40af;
}

.action-btn.delete {
    background: #fee2e2;
    color: #991b1b;
}

.action-btn:hover {
    opacity: 0.8;
}
</style>
