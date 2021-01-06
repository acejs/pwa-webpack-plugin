"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
exports.toRawType = (target) => {
    return Object.prototype.toString.call(target).slice(8, -1);
};
exports.log = (message, color = 'blue') => {
    console.log(chalk_1.default[color](`
	
    ******************************** PWAWebpackPlugin ********************************

    ${message}
	
	`));
};
exports.warn = (message, color = 'red') => {
    exports.log(message, color);
    process.exit(1);
};
