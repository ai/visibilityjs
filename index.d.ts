declare module 'visibilityjs' {
    export function every(interval: number, callback: Function);
    export function onVisible(callback: Function);
    export function afterPrerendering(callback: Function);
    export function isSupported(): boolean;
    export function state(): string;
    export function hidden(): boolean;
    export function unbind(callback: Function);
    export function change(listener: VisiblityChangeListener);
    export function stop(listener: VisiblityChangeListener);
  
    type VisiblityChangeListener = (event, state: string) => void;
}
