/**
 * A color map is a gradient palette with user defined colors.
 * Each color stop is editable using color picker.
 * An offscreen canvas, which is the source of the dynamic texture, is used to draw the gradient. Then its content is copied
 * to the visible canvas with markers overlay for user interaction.
 */
export class ColorMap {

    private positionOffset: number; // for the pasted canvas content
    private canvas: HTMLCanvasElement;
    private offscreenCanvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private offscreenContext: CanvasRenderingContext2D;
    private colorPicker: HTMLInputElement;
    private width: number;
    private height: number;
    private gradient: CanvasGradient;
    private colorStops: ColorStop[] = [];
    private shouldUpdate: boolean = true;

    // When canvas are updated
    public onUpdate?: () => void;

    public getCanvas(): HTMLCanvasElement { return this.offscreenCanvas; }

    /**
     * Create the color map and start the render loop.
     */
    constructor(canvasId: string, width: number, height: number) {
        // Canvas size is increased in order to encompass the markers
        this.positionOffset = 10;
        this.canvas = document.querySelector<HTMLCanvasElement>("#" + canvasId)!;
        this.canvas = document.createElement("canvas");
        this.canvas.setAttribute("id", "colorMap");
        this.canvas.setAttribute("width", String(width + this.positionOffset * 2));
        this.canvas.setAttribute("height", String(height + this.positionOffset * 2));
        this.canvas.style.top = "20px";
        this.canvas.style.right = "20px";
        this.canvas.style.position = "absolute";
        console.log(this.canvas.style);
        this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        document.body.append(this.canvas);

        // Offscreen canvas is used for dynamic texture (full size, no markers)
        this.offscreenCanvas = document.createElement("canvas");
        this.offscreenCanvas.style.width = this.canvas.width.toString();
        this.offscreenCanvas.style.height = this.canvas.height.toString();
        this.offscreenContext = this.offscreenCanvas.getContext("2d") as CanvasRenderingContext2D;
        this.canvas.append(this.offscreenCanvas);

        this.colorPicker = document.createElement("input");
        this.colorPicker.setAttribute("type", "color");
        this.canvas.append(this.colorPicker);

        this.context.shadowColor = "black";
        this.width = width;
        this.height = height;
        this.gradient = this.context.createLinearGradient(0, 0, this.offscreenCanvas.width, 0);

        this.canvas.addEventListener("mousemove", this.onCanvasMouseMove.bind(this));
        this.canvas.addEventListener("click", this.onCanvasClick.bind(this));
        this.colorPicker.addEventListener("change", this.onColorPickerChange.bind(this));

        requestAnimationFrame(() => this.render());
    }

    /**
     * Flag mouse over color stop (used to display shadow) and trigger redraw.
     */
    private onCanvasMouseMove(event: MouseEvent): void {
        this.colorStops.forEach(colorStop => {
            if (this.context.isPointInPath(colorStop.path, event.offsetX, event.offsetY)) {
                colorStop.isMouseOver = true;
                this.shouldUpdate = true;
            } else {
                if (colorStop.isMouseOver) {
                    colorStop.isMouseOver = false;
                    this.shouldUpdate = true;
                }
            }
        });
    }

    /**
     * Flag clicked color stop (used to change color stop).
     */
    private onCanvasClick(event: MouseEvent): void {
        this.colorStops.forEach(colorStop => {
            if (this.context.isPointInPath(colorStop.path, event.offsetX, event.offsetY)) {
                this.colorPicker.click();
                colorStop.isClicked = true;
            } else {
                colorStop.isClicked = false;
            }
        });
    }

    /**
     * Change the color stop value and trigger redraw.
     */
    private onColorPickerChange(event: Event): void {
        this.gradient = this.context.createLinearGradient(0, 0, this.offscreenCanvas.width, 0);

        this.colorStops.forEach(colorStop => {
            if (!colorStop.isClicked) {
                this.gradient.addColorStop(colorStop.offset, colorStop.color)
            } else {
                colorStop.color = (event.target as HTMLInputElement).value;
                this.gradient.addColorStop(colorStop.offset, (event.target as HTMLInputElement).value);
            }
        });

        this.shouldUpdate = true;
    }

    /**
     * Create color stops from colors.
     */
    public setColors(colors: string[]): void {
        const markerSize: number = 15;

        this.colorStops = colors.map((color, index) => {
            const offset: number = index / (colors.length - 1);
            this.gradient.addColorStop(offset, color);

            const position = this.positionOffset + offset * this.width;
            const path: Path2D = new Path2D();
            path.moveTo(position, this.positionOffset + this.height / 2 + markerSize / 2);
            path.lineTo(position - markerSize / 2, this.positionOffset + this.height / 2);
            path.lineTo(position, this.positionOffset + this.height / 2 - markerSize / 2);
            path.lineTo(position + markerSize / 2, this.positionOffset + this.height / 2);
            path.closePath();

            return { offset: offset, color: color, path: path, isMouseOver: false, isClicked: false };
        });
    }

    /**
     * Draw the gradient using defined color stops.
     */
    private drawGradient(): void {
        // Draw gradient to offscreen canvas
        this.offscreenContext.fillStyle = this.gradient;
        this.offscreenContext.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

        // Copy it to visible canvas
        this.context.drawImage(this.offscreenCanvas, this.positionOffset, this.positionOffset, this.width, this.height);
    }

    /**
     * Draw a marker above each color stop.
     */
    private drawMarkers(): void {
        this.context.strokeStyle = "white";
        this.context.lineWidth = 3;
        this.colorStops.forEach((colorStop) => {
            if (colorStop.isMouseOver) {
                this.context.shadowBlur = 3;
            } else {
                this.context.shadowBlur = 0;
            }
            this.context.stroke(colorStop.path);
            this.context.fillStyle = colorStop.color;
            this.context.fill(colorStop.path);
        });
        this.context.strokeStyle = "black";
        this.context.lineWidth = 1;
    }

    /**
     * Render loop.
     */
    private render(): void {
        requestAnimationFrame(() => this.render());

        if (!this.shouldUpdate) return;
        this.shouldUpdate = false;

        this.context.shadowBlur = 0;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

        this.drawGradient();
        this.drawMarkers();
        if (this.onUpdate) this.onUpdate();
    }

}

interface ColorStop {
    offset: number;
    color: string;
    path: Path2D;
    isMouseOver: boolean;
    isClicked: boolean;
}
