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
        return "(" + this.m_x.toString() + ", " + this.m_y.toString() + ")";
    }
}