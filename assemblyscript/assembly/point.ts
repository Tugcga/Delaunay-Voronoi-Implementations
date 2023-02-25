export class Point {
    private m_x: f32;
    private m_y: f32;

    constructor(in_x: f32 = 0.0, in_y: f32 = 0.0) {
        this.m_x = in_x;
        this.m_y = in_y;
    }

    @inline
    x(): f32 {
        return this.m_x;
    }

    @inline
    y(): f32 {
        return this.m_y;
    }

    toString(): string {
        return `(${this.m_x}, ${this.m_y})`;
    }
}

export class IndexedPoint extends Point {
    private m_index: i32;

    constructor(in_x: f32, in_y: f32, in_index: i32) {
        super(in_x, in_y);

        this.m_index = in_index;
    }

    index(): i32 {
        return this.m_index;
    }
}