export { };

declare global {
    interface HTMLElement {
        webkitRequestFullscreen?: () => void;
        webkitEnterFullscreen?: () => void;
    }
}
