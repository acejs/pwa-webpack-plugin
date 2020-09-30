interface IBasicIcons {
    src: string;
    type: string;
}
export interface IItemIcons extends IBasicIcons {
    sizes: string;
}
export interface ICustIcons extends IBasicIcons {
    targetSizes: string[];
}
export declare type IIcons = (IItemIcons | ICustIcons)[] | ICustIcons;
export interface IManifest {
    name: string;
    short_name: string;
    start_url: string;
    theme_color: string;
    background_color: string;
    display: 'fullscreen' | 'standalone' | 'browser' | 'minimal-ui';
    icons: IIcons;
}
export interface IOptions {
    skipWaiting?: boolean;
    runtimeCache?: string;
    noCache?: string[];
    manifest: IManifest;
    manifestFilename?: string;
    serviceWorkerFilename?: string;
    noStaticAssets?: string[];
}
export declare type LogFn = (message: string, color?: 'red' | 'blue' | 'green') => void;
export {};
