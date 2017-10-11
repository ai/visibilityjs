declare module 'visibilityjs' {
    export default new Visibility();

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
