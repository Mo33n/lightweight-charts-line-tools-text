/**
 * Main entry point for the 'lightweight-charts-line-tools-text' plugin.
 * This file registers the Text line tool
 * with the core line tools plugin.
 */
import { ILineToolsPlugin } from 'lightweight-charts-line-tools-core';
import { LineToolText } from './model/LineToolText';
/**
 * Registers the Text tool with the provided Core Plugin instance.
 *
 * @param corePlugin - The instance of the Core Line Tools Plugin.
 * @returns void
 */
export declare function registerTextPlugin<HorzScaleItem>(corePlugin: ILineToolsPlugin & {
    registerLineTool: <H>(type: string, toolClass: new (...args: any[]) => any) => void;
}): void;
export { LineToolText };
export default registerTextPlugin;
