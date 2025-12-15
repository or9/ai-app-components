import type { App } from "vue";

// Components
import MessageTextField from "./components/MessageTextField.vue";
import RequestResponseDisplay from "./components/RequestResponseDisplay.vue";
import S3DragDropUpload from "./components/S3DragDropUpload.vue";
import UploadsTable from "./components/UploadsTable.vue";

// Types
export * from "./types";

// Export components
export {
    MessageTextField,
    RequestResponseDisplay,
    S3DragDropUpload,
    UploadsTable,
};

// Plugin install
export default {
    install(app: App) {
        app.component("MessageTextField", MessageTextField);
        app.component("RequestResponseDisplay", RequestResponseDisplay);
        app.component("S3DragDropUpload", S3DragDropUpload);
        app.component("UploadsTable", UploadsTable);
    },
};
