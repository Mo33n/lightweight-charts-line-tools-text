(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('lightweight-charts-line-tools-core')) :
    typeof define === 'function' && define.amd ? define(['exports', 'lightweight-charts-line-tools-core'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LightweightChartsLineToolsText = {}, global.LightweightChartsLineToolsCore));
})(this, (function (exports, lightweightChartsLineToolsCore) { 'use strict';

    // /src/views/LineToolTextPaneView.ts
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
    class LineToolTextPaneView extends lightweightChartsLineToolsCore.LineToolPaneView {
        /**
         * Initializes the Text View.
         *
         * @param source - The specific Text model instance.
         * @param chart - The Chart API.
         * @param series - The Series API.
         */
        constructor(source, chart, series) {
            super(source, chart, series);
            /**
             * Internal renderer for the text content and its surrounding box.
             * @protected
             */
            this._textRenderer = new lightweightChartsLineToolsCore.TextRenderer();
            /**
             * Container renderer used to group the text and the anchor point for hit-testing.
             * @private
             */
            this._compositeRenderer = new lightweightChartsLineToolsCore.CompositeRenderer();
            this._compositeRenderer.append(this._textRenderer);
        }
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
        _updateImpl(height, width) {
            this._invalidated = false;
            this._compositeRenderer.clear();
            const options = this._tool.options();
            if (!options.visible) {
                return;
            }
            // --- CULLING CHECK ---
            // We query the pre-calculated state from the Model. If the anchor 
            // point is off-screen, we exit early to avoid the expensive 
            // font measurement and alignment logic below.
            if (this._tool.isCulled()) {
                //console.log('text culled')
                return;
            }
            const points = this._tool.points();
            // Tool requires at least one point to draw.
            if (points.length < 1) {
                return;
            }
            // 1. Coordinate Conversion: Get screen coordinates for the single point P0.
            const hasScreenPoints = this._updatePoints(); // Converts logical points to screen coordinates (_points array)
            if (!hasScreenPoints) {
                return;
            }
            const [anchorPoint] = this._points; // Screen coordinates of the single anchor P0
            const rawPivot = anchorPoint; // The raw anchor point is the starting reference for the pivot.
            // --- 2. Text Renderer Setup (Text Box Size and Pivot Offset Calculation) ---
            // --- 2a. Temporarily set data to measure the box size (must happen BEFORE pivot calculation) ---
            /**
             * TEXT MEASUREMENT (PRE-CALCULATION)
             *
             * Before we can determine where to draw the box, we need to know how big it is.
             * We configure the TextRenderer with the content and font options and call `measure()`.
             * This returns the calculated pixel width and height of the final box.
             */
            const textOptions = lightweightChartsLineToolsCore.deepCopy(options.text);
            const temporaryTextRendererData = {
                points: [rawPivot],
                text: textOptions,
                hitTestBackground: true,
            };
            this._textRenderer.setData(temporaryTextRendererData);
            const boxDimensions = this._textRenderer.measure(); // { width: boxWidth, height: boxHeight }
            //console.log('boxDimensions', boxDimensions)
            // --- 2b. Calculate Adjusted Pivot (textPivot) ---
            /**
             * PIVOT ADJUSTMENT (ALIGNMENT LOGIC)
             *
             * The `TextRenderer` draws starting from a specific point. However, the user might want
             * that point to represent the "Bottom Right" of the box, not the "Top Left".
             *
             * We calculate offsets based on the `boxDimensions` found in the previous step.
             * - **Horizontal:** If aligned Right, we shift the x-pivot left by the box width.
             * - **Vertical:** If aligned Bottom, we shift the y-pivot up by the box height.
             */
            let adjustedPivotX = rawPivot.x;
            let adjustedPivotY = rawPivot.y;
            // Adjust X based on box width and box.alignment.horizontal
            const horizontalAlignment = options.text.box?.alignment?.horizontal;
            //console.log('horizontalAlignment', horizontalAlignment)
            // Note: The TextRenderer draws the box *starting* at the pivot X and Y.
            // To achieve the desired alignment, we must offset the pivot based on the box's size.
            switch (horizontalAlignment) {
                case lightweightChartsLineToolsCore.BoxHorizontalAlignment.Right:
                    // Goal: The right edge of the text box should touch the anchor point.
                    // Action: Offset the pivot LEFT by the full box width.
                    adjustedPivotX = (rawPivot.x + (boxDimensions.width));
                    break;
                case lightweightChartsLineToolsCore.BoxHorizontalAlignment.Center:
                    // Goal: The center of the text box should align with the anchor point.
                    // Action: Offset the pivot LEFT by half the box width.
                    adjustedPivotX = (rawPivot.x);
                    break;
                case lightweightChartsLineToolsCore.BoxHorizontalAlignment.Left:
                    // Goal: The left edge of the text box should touch the anchor point.
                    // Action: No horizontal offset needed (pivot is already at the left edge).
                    adjustedPivotX = (rawPivot.x - (boxDimensions.width));
                    break;
            }
            // Adjust Y based on box height and box.alignment.vertical
            const verticalAlignment = options.text.box?.alignment?.vertical;
            //console.log('verticalAlignment', verticalAlignment)
            switch (verticalAlignment) {
                case lightweightChartsLineToolsCore.BoxVerticalAlignment.Bottom:
                    // Goal: The bottom edge of the text box should touch the anchor point.
                    // Action: Offset the pivot UP by the full box height.
                    adjustedPivotY = (rawPivot.y + (boxDimensions.height / 2));
                    break;
                case lightweightChartsLineToolsCore.BoxVerticalAlignment.Middle:
                    // Goal: The center of the text box should align with the anchor point.
                    // Action: Offset the pivot UP by half the box height.
                    adjustedPivotY = (rawPivot.y);
                    break;
                case lightweightChartsLineToolsCore.BoxVerticalAlignment.Top:
                    // Goal: The top edge of the text box should touch the anchor point.
                    // Action: No vertical offset needed.
                    adjustedPivotY = (rawPivot.y - (boxDimensions.height / 2));
                    break;
            }
            // Create the new adjusted pivot point
            const adjustedPivot = new lightweightChartsLineToolsCore.AnchorPoint(adjustedPivotX, adjustedPivotY, rawPivot.data);
            // --- 2c. Final Renderer Data Setup ---
            /**
             * FINAL RENDERER DATA SETUP
             *
             * We configure the `TextRenderer` with the **Adjusted Pivot**.
             * This ensures that when the renderer draws the box at (x,y), it visually aligns
             * correctly with the user's original anchor point.
             */
            const textRendererData = {
                // The calculated pivot point is now passed as the attachment point
                points: [adjustedPivot],
                text: textOptions,
                hitTestBackground: true, // Allow clicking inside the box to select/drag
                toolDefaultHoverCursor: options.defaultHoverCursor,
                toolDefaultDragCursor: options.defaultDragCursor,
            };
            this._textRenderer.setData(textRendererData);
            this._compositeRenderer.append(this._textRenderer);
            // 3. Line Anchors (Handles for P0)
            //if (this.areAnchorsVisible()) {
            this._addAnchors(this._compositeRenderer);
            //}
            this._renderer = this._compositeRenderer;
        }
        /**
         * Adds the single interactive anchor point.
         *
         * We use the `Move` cursor to indicate that this point controls the position of the entire text element.
         *
         * @param renderer - The composite renderer to append the anchor to.
         * @protected
         * @override
         */
        _addAnchors(renderer) {
            if (this._points.length < 1)
                return;
            const [anchorPoint] = this._points;
            // The single anchor point (P0)
            const anchorData = {
                points: [anchorPoint],
                // Use the default move cursor as the Text Tool is usually dragged from this point
                pointsCursorType: [lightweightChartsLineToolsCore.PaneCursorType.Move],
            };
            // Add the single LineAnchorRenderer set
            renderer.append(this.createLineAnchor(anchorData, 0));
        }
    }

    // /src/model/LineToolText.ts
    // --- Default Options (Mimicking the base TrendLine structure but with specific Text defaults) ---
    /**
     * Defines the default configuration options for the Text tool.
     *
     * **Tutorial Note:**
     * The Text tool is unique because it is a **Single Point** tool (`pointsCount: 1`) that renders
     * a complex text box.
     *
     * Key Defaults:
     * - **Cursors:** Uses `Grabbing` for drag and `Pointer` for hover to mimic standard UI elements.
     * - **Axis Labels:** Hidden by default (`showPriceAxisLabels: false`), as text annotations are usually informational, not analytical.
     * - **Box:** Defaults to a standard text box alignment (Centered horizontally, Top vertically relative to the anchor).
     */
    const TextToolDefaultOptions = {
        visible: true,
        editable: true,
        defaultHoverCursor: lightweightChartsLineToolsCore.PaneCursorType.Pointer,
        defaultDragCursor: lightweightChartsLineToolsCore.PaneCursorType.Grab,
        defaultAnchorHoverCursor: lightweightChartsLineToolsCore.PaneCursorType.Pointer,
        defaultAnchorDragCursor: lightweightChartsLineToolsCore.PaneCursorType.Grabbing,
        notEditableCursor: lightweightChartsLineToolsCore.PaneCursorType.NotAllowed,
        showPriceAxisLabels: false,
        showTimeAxisLabels: false,
        priceAxisLabelAlwaysVisible: false,
        timeAxisLabelAlwaysVisible: false,
        // Specific Options for TextTool (Inherits from core's TextToolOptions)
        text: {
            value: 'Text', // Default value
            padding: 0,
            wordWrapWidth: 0,
            forceTextAlign: false,
            forceCalculateMaxLineWidth: false,
            alignment: lightweightChartsLineToolsCore.TextAlignment.Center,
            font: {
                color: '#2962ff',
                size: 12,
                bold: false,
                italic: false,
                family: 'sans-serif',
            },
            box: {
                scale: 1,
                angle: 0,
                alignment: { vertical: lightweightChartsLineToolsCore.BoxVerticalAlignment.Top, horizontal: lightweightChartsLineToolsCore.BoxHorizontalAlignment.Center },
                // Default box is empty/transparent.
            },
        },
    };
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
    class LineToolText extends lightweightChartsLineToolsCore.BaseLineTool {
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
        constructor(coreApi, chart, series, horzScaleBehavior, options = {}, points = [], priceAxisLabelStackingManager) {
            // 1. Start with a deep copy of the base defaults.
            const finalOptions = lightweightChartsLineToolsCore.deepCopy(TextToolDefaultOptions);
            // 2. Merge the user's provided options last (User wins).
            lightweightChartsLineToolsCore.merge(finalOptions, options);
            // 3. Call the parent (BaseLineTool) constructor.
            super(coreApi, chart, series, horzScaleBehavior, finalOptions, points, 'Text', 1, // 1-point tool
            priceAxisLabelStackingManager);
            /**
             * The unique identifier for this tool type ('Text').
             *
             * @override
             */
            this.toolType = 'Text';
            /**
             * Defines the number of anchor points required to draw this tool.
             *
             * A Text tool is defined by exactly **1 point** (the anchor location).
             *
             * @override
             */
            this.pointsCount = 1;
            // 4. Set the specific PaneView for this tool.
            this._setPaneViews([new LineToolTextPaneView(this, this._chart, this._series)]);
            console.log(`Text Tool created with ID: ${this.id()}`);
        }
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
        _internalHitTest(x, y) {
            // Guard: Ensure pane view exists
            if (!this._paneViews || this._paneViews.length === 0 || !this._paneViews[0]) {
                return null;
            }
            // 1. Get the Pane View
            const paneView = this._paneViews[0];
            // 2. Get the Composite Renderer (calling renderer() ensures it's updated)
            const compositeRenderer = paneView.renderer();
            // 3. Delegate the hit test
            if (!compositeRenderer || !compositeRenderer.hitTest) {
                return null;
            }
            return compositeRenderer.hitTest(x, y);
        }
        /**
         * Updates the coordinates of the single anchor point.
         *
         * @param index - The index of the point (always 0).
         * @param point - The new logical coordinates.
         * @override
         */
        setPoint(index, point) {
            if (index === 0) {
                this._points[0] = point;
                this._triggerChartUpdate();
            }
        }
        /**
         * Explicitly defines the highest valid index for an interactive anchor point.
         *
         * Since `pointsCount` is 1, the only valid index is 0.
         *
         * @override
         * @returns `0`
         */
        maxAnchorIndex() {
            return 0;
        }
        /**
         * Checks if the tool creation is complete.
         *
         * For a 1-point tool like Text, creation is finished as soon as the first point is placed.
         *
         * @returns `true` if at least one point exists.
         * @override
         */
        isFinished() {
            return this._points.length >= this.pointsCount;
        }
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
        updateCullingState() {
            const points = this.points();
            // --- CULLING IMPLEMENTATION START ---
            // Perform standard point culling. If the anchor point is off-screen, 
            // the tool is considered hidden.
            const cullingState = lightweightChartsLineToolsCore.getToolCullingState(points, this);
            // Any state other than 'Visible' results in the tool being culled.
            this._setIsCulled(cullingState !== lightweightChartsLineToolsCore.OffScreenState.Visible);
            // --- CULLING IMPLEMENTATION END ---
        }
    }

    // /src/index.ts
    // Define the name under which this specific tool will be registered
    const TEXT_LINE_NAME = 'Text';
    /**
     * Registers the Text tool with the provided Core Plugin instance.
     *
     * @param corePlugin - The instance of the Core Line Tools Plugin.
     * @returns void
     */
    function registerTextPlugin(corePlugin) {
        // Register the Text Tool
        // We pass the specific name and the class constructor.
        corePlugin.registerLineTool(TEXT_LINE_NAME, LineToolText);
        console.log(`Registered Line Tool: ${TEXT_LINE_NAME}`);
    }

    exports.LineToolText = LineToolText;
    exports.default = registerTextPlugin;
    exports.registerTextPlugin = registerTextPlugin;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=lightweight-charts-line-tools-text.umd.js.map
