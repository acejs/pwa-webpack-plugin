"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dir = 'manifest-icon';
exports.writeManifest = (plugin) => __awaiter(void 0, void 0, void 0, function* () {
    const { webpackConfig: { path: output }, manifest, manifest: { icons }, manifestFilename, } = plugin;
    // 创建 icon 文件夹
    fs_1.default.mkdirSync(path_1.default.join(output, dir));
    const result = yield dealWithIcons(icons, output);
    if (result instanceof Error)
        return result;
    plugin.manifest.icons = result;
    fs_1.default.writeFileSync(path_1.default.join(output, manifestFilename), JSON.stringify(manifest), 'utf8');
});
/**
 * deal width option icon
 * @param icons options
 * @param output output path
 */
const dealWithIcons = (icons, output) => __awaiter(void 0, void 0, void 0, function* () {
    function isCust(target) {
        return typeof target === 'object' && 'targetSizes' in target;
    }
    let result = [];
    if (isCust(icons)) {
        result = yield exports.genIcons(icons, output);
    }
    else {
        for (const value of icons.values()) {
            if (isCust(value)) {
                result = result.concat(yield exports.genIcons(value, output));
            }
            else {
                const copy = yield exports.copyIcons(value, output);
                if (copy instanceof Error)
                    return copy;
                result.push(Object.assign(Object.assign({}, value), { src: copy }));
            }
        }
    }
    return result;
});
/**
 * copy option icon to output path
 * @param icon
 * @param output
 */
exports.copyIcons = (icon, output) => __awaiter(void 0, void 0, void 0, function* () {
    const { src } = icon;
    // 默认截取最后的为文件名
    const name = src.split('/').pop();
    if (!name)
        return new Error(`File: ${String(src)} does't exist`);
    const newSrc = path_1.default.join(dir, name);
    fs_1.default.copyFileSync(src, path_1.default.join(output, newSrc));
    return newSrc;
});
/**
 * generate different size of icon by option icon and put them into output path
 * @param icons
 * @param output
 */
exports.genIcons = (icons, output) => __awaiter(void 0, void 0, void 0, function* () {
    const result = [];
    const { src, type, targetSizes } = icons;
    const list = targetSizes.map((size) => size.split('x').map((i) => Number.parseInt(i, 10)));
    const pipeline = sharp_1.default(src);
    const suffix = type.split('/')[1];
    for (const size of list.values()) {
        const sizes = size.join('x');
        const src = path_1.default.join(dir, `icon${sizes}.${suffix}`);
        yield pipeline
            .clone()
            .resize(...size)
            .toFile(path_1.default.join(output, src));
        result.push({ src, sizes, type });
    }
    return result;
});
