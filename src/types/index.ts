export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

export interface UploadFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt: Date;
    s3Key?: string;
    status: "pending" | "uploading" | "completed" | "error";
    progress?: number;
    error?: string;
}

export interface S3UploadConfig {
    presignedUrlEndpoint: string;
    bucket?: string;
    maxFileSize?: number;
    allowedTypes?: string[];
}

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    width?: string;
}
