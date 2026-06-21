import { IChartApiBase, ISeriesApi, SeriesType } from 'lightweight-charts';
import { LineToolPaneView, CompositeRenderer, TextRenderer } from 'lightweight-charts-line-tools-core';
import { LineToolText } from '../model/LineToolText';
/**
 * Pane View for the Text tool.
 *
 * **Tutorial Note on Logic:**
 * This view implements complex alignment logic. Unlike simple shapes, a Text Box's size depends
 * on its content, font, and word wrapping.
 *
 * This view performs a 3-step process:
 * 1. **Measure:** Pre-renders the text internally to determine its pixel width/height.
 * 2. **Align:** Calculates an "Adjusted Pivot" point based on the user's alignment settings
 *    (e.g., if aligned "Right", the box is shifted left so its right edge touches the anchor).
 * 3. **Render:** configure the final renderer with this adjusted position.
 */
export declare class LineToolTextPaneView<HorzScaleItem> extends LineToolPaneView<HorzScaleItem> {
    /**
     * Internal renderer for the text content and its surrounding box.
     * @protected
     */
    protected _textRenderer: TextRenderer<HorzScaleItem>;
    /**
     * Container renderer used to group the text and the anchor point for hit-testing.
     * @private
     */
    private _compositeRenderer;
    /**
     * Initializes the Text View.
     *
     * @param source - The specific Text model instance.
     * @param chart - The Chart API.
     * @param series - The Series API.
     */
    constructor(source: LineToolText<HorzScaleItem>, chart: IChartApiBase<any>, series: ISeriesApi<SeriesType, any>);
    /**
     * The core update logic.
     *
     * It handles the "Measure -> Calculate Offset -> Render" pipeline to ensure the text box
     * appears exactly where the user expects relative to the anchor point.
     *
     * @param height - The height of the pane.
     * @param width - The width of the pane.
     * @protected
     * @override
     */
    protected _updateImpl(height: number, width: number): void;
    /**
     * Adds the single interactive anchor point.
     *
     * We use the `Move` cursor to indicate that this point controls the position of the entire text element.
     *
     * @param renderer - The composite renderer to append the anchor to.
     * @protected
     * @override
     */
    protected _addAnchors(renderer: CompositeRenderer<HorzScaleItem>): void;
}
