import { IOptions } from './types';
import { ICustIcons, IItemIcons, IDealedIcons } from './types';
export declare const writeManifest: (options: IOptions, publicPath: string) => Promise<Map<string, any>>;
/**
 * copy option icon to output path
 * @param icon
 * @param output
 */
export declare const copyIcons: (icon: IItemIcons) => Promise<IDealedIcons>;
/**
 * generate different size of icon by option icon and put them into output path
 * @param icons
 * @param output
 * @returns { icon: { src, sizes, type }, source: { name: source } }
 */
export declare const genIcons: (icons: ICustIcons) => Promise<IDealedIcons[]>;
