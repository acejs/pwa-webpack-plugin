import { Compiler } from 'webpack';
import { IOptions, IManifest } from './types';
declare class PWAWebpackPlugin {
    webpackConfig: {
        path: string;
        publicPath: string;
    };
    cacheList: string[];
    noStaticAssets: string[];
    noCache: string[];
    skipWaiting: boolean;
    cacheStorageName: string;
    manifestFilename: string;
    serviceWorkerFilename: string;
    manifest: IManifest;
    constructor(options: IOptions);
    apply(compiler: Compiler): void;
}
export default PWAWebpackPlugin;
