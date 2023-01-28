"use strict";

(function(math) {

    this.vector = function(x, y) {
        this.x = x; this.y = y;
    }

    this.vector.prototype.toString = function() {
        return '(' + this.x + ',' + this.y + ')';
    }

    this.vector.prototype.clone = function() {
        return new teal.math.vector(this.x, this.y);
    }
    this.vector.prototype.set = function(v) {
        this.x = v.x; this.y = v.y;
    }

    this.vector.prototype.add = function(v) {
        this.x += v.x; this.y += v.y;
        return this;
    }

    this.vector.prototype.sub = function(v) {
        this.x -= v.x; this.y -= v.y;
        return this;
    }

    this.vector.prototype.mul = function(v) {
        return this.x * v.y - this.y * v.x;
    }

    this.vector.prototype.scalar = function(v) {
        return this.x * v.x + this.y * v.y;
    }

    this.vector.prototype.scale = function(k) {
        this.x *= k; this.y *= k;
        return this;
    }

    this.vector.prototype.descale = function(k) {
        this.x /= k; this.y /= k;
        return this;
    }

    this.vector.prototype.neg = function() {
        this.x = -this.x; this.y = -this.y;
        return this;
    }

    this.vector.prototype.len = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    this.vector.prototype.len2 = function() {
        return this.x * this.x + this.y * this.y;
    }

    this.vector.prototype.is_not_null = function() {
        return this.x + this.y;
    }

    this.vector.prototype.normalize = function() {
        var len = this.len();
        if (len) { this.x /= len; this.y /= len; }
        return this;
    }

    this.vector.prototype.rotate = function(h) {
        var cosh = Math.cos(h), sinh = Math.sin(h),
                x = this.x * cosh - this.y * sinh,
                y = this.x * sinh + this.y * cosh;
        this.x = x; this.y = y;
        return this;
    }

    this.vector.prototype.perpendicular = function() {
        var x = -this.y, y = this.x;
        this.x = x; this.y = y;
        return this;
    }

    this.vector.prototype.projection_from = function(v) {
        this.scale(this.scalar(v));
        return this;
    }

    this.vector.prototype.decomposition = function(v) {
        var projection = this.clone().normalize().projection_from(v);
        return {
            projection: projection,
            normal: v.clone().sub(projection)
        };
    }

    this.make_box_bound = function(sizes) {
        var x = sizes.width / 2, y = sizes.length / 2;
        return [
            new $t.math.vector(-x, -y),
            new $t.math.vector(-x, y),
            new $t.math.vector(x, y),
            new $t.math.vector(x, -y)
        ];
    }

    this.make_radius_bound = function(sizes) {
        var x = sizes.width / 2, y = sizes.length / 2;
        return Math.sqrt(x * x + y * y);
    }

    this.point_to_line_orientation = function(a, b, point) {
        return (a.x - point.x) * (b.y - point.y) - (a.y - point.y) * (b.x - point.x);
    }

    this.point_to_line_oriented_distance = function(a, b, point) {
        var d = a.clone().sub(b);
        return (d.x * (point.y - a.y) - d.y * (point.x - a.x)) / d.len();
    }

    this.line_intersection = function(a1, a2, b1, b2) {
        var d = (a1.x - a2.x) * (b2.y - b1.y) - (a1.y - a2.y) * (b2.x - b1.x),
              ta = ((a1.x - b1.x) * (b2.y - b1.y) - (a1.y - b1.y) * (b2.x - b1.x)) / d,
              tb = ((a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x)) / d;
        return ta > 0 && ta < 1 && tb > 0 && tb < 1
            ? new $t.math.vector(a1.x + ta * (a2.x - a1.x), a1.y + ta * (a2.y - a1.y))
            : null;
    }

    this.inside = function(polygon, point) {
        if (!polygon.length) return false;
        var intersections_num = 0, polygon_max = polygon.length - 1;
        var prev = polygon_max;
        var prev_under = polygon[prev].y < point.y;
        for (var i = 0; i <= polygon_max; ++i) {
            var cur_under = polygon[i].y < point.y;
            var a = polygon[prev].clone().sub(point);
            var b = polygon[i].clone().sub(point);
            var t = a.x * (b.y - a.y) - a.y * (b.x - a.x);
            if (cur_under && !prev_under && t > 0) ++intersections_num;
            if (!cur_under && prev_under && t < 0) ++intersections_num;
            prev = i;
            prev_under = cur_under;
        }
        return intersections_num % 2 != 0;
    }

    this.linear_regression_factor = function(points) {
        var sx = 0, sy = 0, sxx = 0, sxy = 0;
        var n = points.length;
        for (var i = n - 1; i >= 0; --i) {
            var x = points[i].x, y = points[i].y;
            sx += x; sy += y; sxx += x * x; sxy += x * y;
        }
        var a = (sxy - sx * sy / n) / (sxx - sx * sx / n);
        return a ? a : (a == 0 ? 0 : 1e10);
    }

}).apply(teal.math = teal.math || {});

