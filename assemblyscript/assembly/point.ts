export class Point {
    constructor(
        public x: f32 = 0,
        public y: f32 = 0
    ) {}

    @inline
    squared_distance(other: Point): f32 {
        const dx = this.x - other.x;
        const dy = this.y - other.x;
        return dx * dx + dy * dy;
    }

    toString(): string {
        return `(${this.x}, ${this.y})`;
    }
}
