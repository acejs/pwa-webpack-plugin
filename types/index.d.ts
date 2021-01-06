import { Compiler } from 'webpack';
import { IOptions } from './types';
declare class PWAWebpackPlugin {
    webpackConfig: {
        path: string;
        publicPath: string;
    };
    cacheList: string[];
    options: IOptions;
    constructor(options: IOptions);
    apply(compiler: Compiler): void;
}
export default PWAWebpackPlugin;
