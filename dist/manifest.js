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
const utils_1 = require("./utils");
exports.writeManifest = (options, publicPath) => __awaiter(void 0, void 0, void 0, function* () {
    const { manifest, manifestFilename, manifestIconDir } = options;
    const result = yield dealWithIcons(manifest.icons);
    const map = new Map();
    manifest.icons = result.map((item) => {
        const src = path_1.default.join(manifestIconDir, item.icon.src);
        map.set(src, item.source);
        return Object.assign(Object.assign({}, item.icon), { src: `${publicPath}${src}` });
    });
    map.set(manifestFilename, JSON.stringify(manifest));
    return map;
});
/**
 * deal width option icon
 * @param icons options
 * @param output output path
 */
const dealWithIcons = (icons) => __awaiter(void 0, void 0, void 0, function* () {
    function isCust(target) {
        return typeof target === 'object' && 'targetSizes' in target;
    }
    let result = [];
    if (isCust(icons)) {
        result = yield exports.genIcons(icons);
    }
    else {
        for (const value of icons.values()) {
            if (isCust(value)) {
                result = result.concat(yield exports.genIcons(value));
            }
            else {
                result.push(yield exports.copyIcons(value));
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
exports.copyIcons = (icon) => __awaiter(void 0, void 0, void 0, function* () {
    const { src } = icon;
    // get File name
    const name = src.split('/').pop();
    if (!name) {
        utils_1.warn(`File: ${String(src)} does't exist`);
        process.exit(1);
    }
    return {
        icon: Object.assign(Object.assign({}, icon), { src: name }),
        source: yield sharp_1.default(src).toBuffer(),
    };
});
/**
 * generate different size of icon by option icon and put them into output path
 * @param icons
 * @param output
 * @returns { icon: { src, sizes, type }, source: { name: source } }
 */
exports.genIcons = (icons) => __awaiter(void 0, void 0, void 0, function* () {
    const result = [];
    const { src, type, targetSizes } = icons;
    const list = targetSizes.map((size) => size.split('x').map((i) => Number.parseInt(i, 10)));
    // file type
    const suffix = type.split('/')[1];
    const pipeline = yield sharp_1.default(src);
    for (const size of list.values()) {
        const sizes = size.join('x');
        const src = `icon${sizes}.${suffix}`;
        const source = yield pipeline
            .clone()
            .resize(...size)
            .toBuffer();
        result.push({ icon: { src, sizes, type }, source });
    }
    return result;
});
