"use strict";

(function(physics) {

    var apply_impulse = function(velocity, properties, point, impulse) {
        velocity.heading += point.mul(impulse) / properties.inertia;
        velocity.vector.add(impulse.descale(properties.mass));
    }

    var apply_sigma = function(collector, sigma, current) {
        if (sigma.func) if (!sigma.func.call(sigma, this, current)) return;
        apply_impulse(collector, this.properties,
            sigma.point.clone().rotate(current.position.heading), sigma.vector.clone());
        if (sigma.heading) {
            var shift = sigma.point.clone().neg();
            var rotation_accel = sigma.heading / (this.properties.inertia +
                this.properties.mass * shift.len2());
            shift.rotate(rotation_accel).add(sigma.point);
            collector.vector.add(shift);
            collector.heading += rotation_accel;
        }
    }

    var apply_forces = function(current) {
        var acceleration = { vector: new $tvector(0, 0), heading: 0 };
        for (var i in this.forces)
            apply_sigma.call(this, acceleration, this.forces[i], current);
        return { velocity: acceleration };
    }

    var apply_impulses = function(current) {
        var velocity = $t.copy(current.velocity);
        if (this.impulses) {
            for (var i in this.impulses)
                apply_sigma.call(this, velocity, this.impulses[i], current);
        }
        return { position: velocity };
    }

    var apply_integral_velocities = function(current) {
        return { position: $t.copy(current.integral_velocity) };
    }

    var apply_joint = function(depth, o1, n1, p1, w1, o2, n2, p2, w2, e) {
        function lambda(velocity_name, velocity_add) {
            var v1 = o1.values[velocity_name], v2 = o2.values[velocity_name];
            var u = n1.scalar(v1.vector) + w1 * v1.heading + n2.scalar(v2.vector) + w2 * v2.heading;
            var d = n1.scalar(n1) / o1.properties.mass + n2.scalar(n2) / o2.properties.mass +
                w1 * w1 / o1.properties.inertia + w2 * w2 / o2.properties.inertia;
            return (velocity_add - u) / d;
        }
        function apply(velocity_name, impulse) {
            if (impulse < 0) return;
            apply_impulse(o1.values[velocity_name], o1.properties, p1, n1.clone().scale(impulse));
            apply_impulse(o2.values[velocity_name], o2.properties, p2, n2.clone().scale(impulse));
        }

        if (!isNaN(o1)) o1 = this.objects[o1];
        if (!isNaN(o2)) o2 = this.objects[o2];
        apply('velocity', lambda('velocity', 0) * (1 + e));
        apply('integral_velocity', lambda('integral_velocity', depth * 50));
    }

    this.world_to_object = function(point, object) {
        return point.clone().sub(object.values.position.vector).rotate(-object.values.position.heading);
    }
    this.object_to_world = function(point, object) {
        return point.clone().rotate(object.values.position.heading).add(object.values.position.vector);
    }

    this.earth = {
        name: 'earth',
        properties: { mass: 1.0e30, inertia: 1.0e30 },
        values: {
            position: { vector: new $t.math.vector(0, 0), heading: 0 },
            velocity: { vector: new $t.math.vector(0, 0), heading: 0 },
            integral_velocity: { vector: new $t.math.vector(0, 0), heading: 0 }
        }
    };

    this.scene = function(objects, impulses) {
        this.objects = objects;
        this.impulses = impulses;
        this.neighborhood = this.all_objects_are_heighbors;
        this.differential_method = teal.diffeq.euler;
        this.time = 0;
        this.joints = [];
        this.onetime_joints = [];
    }
 
    this.scene.prototype.step = function(time_delta, do_collisions) {
        for (var i = this.objects.length - 1; i >= 0; --i) {
            var object = this.objects[i];
            object.time = this.time;
            object.values.integral_velocity = { vector: new $t.math.vector(0, 0), heading: 0 };
            this.differential_method(object, time_delta, apply_forces);
        }
        if (do_collisions) this.process_collisions();
        for (var i = this.onetime_joints.length - 1; i >= 0; --i)
            apply_joint.apply(this, this.onetime_joints[i]);
        for (var i = this.joints.length - 1; i >= 0; --i)
            apply_joint.apply(this, this.joints[i]);
        for (var i = this.objects.length - 1; i >= 0; --i)
            this.differential_method(this.objects[i], time_delta, apply_impulses);
        for (var i = this.objects.length - 1; i >= 0; --i)
            this.differential_method(this.objects[i], time_delta, apply_integral_velocities);
        this.time += time_delta;
        this.onetime_joints = [];
        for (var i = this.objects.length - 1; i >= 0; --i) {
            var object = this.objects[i];
            if (!object.current_bound) object.current_bound = new Array(object.bound.length);
            for (var j = object.bound.length - 1; j >= 0; --j)
                object.current_bound[j] = object.bound[j].clone()
                    .rotate(object.values.position.heading)
                    .add(object.values.position.vector);
        }
    }

    var radius_approachability = function(object1, object2) {
        var d = object1.radius_bound + object2.radius_bound;
        return object1.values.position.vector.clone()
            .sub(object2.values.position.vector).len2() <= d * d;
    }

    var collision_joints = function(joints, object1, object2) {
        function intersection(object1, object2) {
            function make_collision_joint(point, poly) {
                var n1, min_distance = undefined;
                for (var j2 = 0, j = poly.length - 1; j >= 0; j2 = j, --j) {
                    var distance = $t.math.point_to_line_oriented_distance(point, poly[j], poly[j2]);
                    if (distance < 0) return undefined;
                    if (!(min_distance < distance)) {
                        min_distance = distance;
                        n1 = poly[j2].clone().sub(poly[j]).perpendicular().normalize();
                    }
                }
                if (!n1) return false;
                var p1 = point.clone().sub(object1.values.position.vector);
                var p2 = point.clone().sub(object2.values.position.vector);
                var n2 = n1.clone().neg(), w1 = p1.mul(n1), w2 = p2.mul(n2);
                joints.push([min_distance, object1, n1, p1, w1, object2, n2, p2, w2, 0.8]);
                return true;
            }

            if (!make_collision_joint(object1.values.position.vector, object2.current_bound)) {
                var bound = object1.current_bound;
                for (var i = bound.length - 1; i >= 0; --i)
                    make_collision_joint(bound[i], object2.current_bound);
            }
        }

        intersection(object1, object2);
        intersection(object2, object1);
    }

    this.scene.prototype.process_collisions = function() {
        for (var i = 0; i < this.objects.length; ++i) {
            var object = this.objects[i];
            var neighbors = this.neighborhood.call(this, i);
            for (var j = neighbors.length - 1; j >= 0; --j) {
                var neighbor = this.objects[neighbors[j]];
                if (object.stoped && neighbor.stoped) continue;
                if (!radius_approachability(object, neighbor)) continue;
                collision_joints(this.onetime_joints, object, neighbor);
            }
        }
    }

    this.scene.prototype.all_objects_are_heighbors = function(object_index) {
        var res = [];
        for (var i = object_index + 1; i < this.objects.length; ++i) res.push(i);
        return res;
    }

}).apply(teal.physics = teal.physics || {});
