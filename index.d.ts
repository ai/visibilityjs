declare module 'visibilityjs' {
    const _default: Visibility;
    export default _default;

    class Visibility {
        every(interval: number, callback: Function);

        onVisible(callback: Function);

        afterPrerendering(callback: Function);

        isSupported(): boolean;

        state(): string;

        hidden(): boolean;

        unbind(callback: Function);

        change(listener: VisiblityChangeListener);
    }

    type VisiblityChangeListener = (event, state: string) => void;
}
