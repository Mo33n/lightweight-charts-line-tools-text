import { IChartApiBase, ISeriesApi, IHorzScaleBehavior, SeriesType, Coordinate } from 'lightweight-charts';
import { BaseLineTool, LineToolPoint, LineToolOptionsInternal, LineToolType, DeepPartial, LineToolsCorePlugin, PriceAxisLabelStackingManager, HitTestResult } from 'lightweight-charts-line-tools-core';
/**
 * Concrete implementation of the Text drawing tool.
 *
 * **What is a Text Tool?**
 * It is a tool defined by a **Single Point** (P0). This point acts as the anchor/pivot
 * for a text box.
 *
 * **Inheritance:**
 * It inherits directly from {@link BaseLineTool} because it does not share the 2-point geometry
 * logic of the Trend Line family. It implements its own simple 1-point logic.
 */
export declare class LineToolText<HorzScaleItem> extends BaseLineTool<HorzScaleItem> {
    /**
     * The unique identifier for this tool type ('Text').
     *
     * @override
     */
    readonly toolType: LineToolType;
    /**
     * Defines the number of anchor points required to draw this tool.
     *
     * A Text tool is defined by exactly **1 point** (the anchor location).
     *
     * @override
     */
    readonly pointsCount: number;
    /**
     * Initializes the Text tool.
     *
     * **Tutorial Note on Construction:**
     * 1. **Base Defaults:** Uses `TextToolDefaultOptions` which configures the specific cursors and hides axis labels.
     * 2. **User Options:** Merges user provided settings.
     * 3. **View:** Assigns `LineToolTextPaneView`, which handles the complex logic of calculating the text box size
     *    and aligning it relative to the single anchor point.
     *
     * @param coreApi - The Core Plugin API.
     * @param chart - The Lightweight Charts Chart API.
     * @param series - The Series API this tool is attached to.
     * @param horzScaleBehavior - The horizontal scale behavior.
     * @param options - Configuration overrides.
     * @param points - Initial points.
     * @param priceAxisLabelStackingManager - The manager for label collision.
     */
    constructor(coreApi: LineToolsCorePlugin<HorzScaleItem>, chart: IChartApiBase<HorzScaleItem>, series: ISeriesApi<SeriesType, HorzScaleItem>, horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>, options: DeepPartial<LineToolOptionsInternal<'Text'>>, points: LineToolPoint[] | undefined, priceAxisLabelStackingManager: PriceAxisLabelStackingManager<HorzScaleItem>);
    /**
     * Performs the hit test for the Text Tool.
     *
     * **Architecture Note:**
     * Since the text box dimensions are calculated in the View (based on font size, wrapping, etc.),
     * the Model doesn't know the hit area. We must delegate to the View's `CompositeRenderer`.
     *
     * @param x - X coordinate in pixels.
     * @param y - Y coordinate in pixels.
     * @returns A hit result if the mouse is over the text box or the anchor.
     * @override
     */
    _internalHitTest(x: Coordinate, y: Coordinate): HitTestResult<any> | null;
    /**
     * Updates the coordinates of the single anchor point.
     *
     * @param index - The index of the point (always 0).
     * @param point - The new logical coordinates.
     * @override
     */
    setPoint(index: number, point: LineToolPoint): void;
    /**
     * Explicitly defines the highest valid index for an interactive anchor point.
     *
     * Since `pointsCount` is 1, the only valid index is 0.
     *
     * @override
     * @returns `0`
     */
    maxAnchorIndex(): number;
    /**
     * Checks if the tool creation is complete.
     *
     * For a 1-point tool like Text, creation is finished as soon as the first point is placed.
     *
     * @returns `true` if at least one point exists.
     * @override
     */
    isFinished(): boolean;
    /**
     * Calculates the Text tool's visibility based on its single anchor point.
     *
     * ### Tutorial Note on Text Culling
     * The Text tool is defined by a single coordinate (P0). This method uses the
     * core culling engine to determine if that anchor point is within the
     * visible range of the chart (plus the safety buffer).
     *
     * Moving this check to the Model is highly efficient for Text tools because
     * it allows the View to completely skip the font measurement and alignment
     * calculations if the tool is off-screen.
     *
     * @protected
     * @override
     */
    protected updateCullingState(): void;
}
