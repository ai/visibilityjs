declare module 'visibilityjs' {
    export function every(interval: number, callback: Function): number;
    export function every(interval: number, hiddenInterval: number, callback: Function): number;
    export function onVisible(callback: Function): number|boolean;
    export function afterPrerendering(callback: Function): number|boolean;
    export function isSupported(): boolean;
    export function state(): VisibilityState;
    export function hidden(): boolean;
    export function unbind(id: number): void;
    export function change(listener: VisiblityChangeListener): number;
    export function stop(id: number): boolean;

    // @See https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
    type VisibilityState = 'visible' | 'hidden'
    type VisiblityChangeListener = (event: Event, state: VisibilityState) => void;
}
