import PWAWebpackPlugin from './index';
import { ICustIcons, IItemIcons } from './types';
export declare const writeManifest: (plugin: PWAWebpackPlugin) => Promise<Error | undefined>;
/**
 * copy option icon to output path
 * @param icon
 * @param output
 */
export declare const copyIcons: (icon: IItemIcons, output: string) => Promise<string | Error>;
/**
 * generate different size of icon by option icon and put them into output path
 * @param icons
 * @param output
 */
export declare const genIcons: (icons: ICustIcons, output: string) => Promise<IItemIcons[]>;
