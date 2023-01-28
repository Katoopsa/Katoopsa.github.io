"use strict";
(function(storedroids) {
    var sd = this;

    this.CELL = { VOID: undefined, NORMAL: 1, PACK: 2, OPERATOR: 3, CHARGE: 4, DIRECTION: 5, APPROACH: 6 };
    this.IMG = { rack: 'rack', droid: 'droid', del: 'delete', floor: 'floor',
            2: 'pack_point', 3: 'operator_point', 4: 'charge_point', 5: 'direction', 6: 'charge_approach' };
    this.STATE = { READY: 0, MOVING: 1, DRAGGING: 2, OPERATOR: 3, GOINGBACK: 4,
            RETURNING: 5, WAITING: 6, CHARGING: 7, PATHFAIL: 8, DISCHARGE: 9 };

    this.store = function() {
        this.clear();
    };

    this.store.prototype.clear = function() {
        this.geometry = [];
        this.width = 0;
        this.height = 0;
        this.racks = [];
        this.droids = [];
        this.map = [];
        this.color = 1;
        this.current_time = 0;
    }

    this.store.prototype.apply_geometry = function(geometry) {
        this.geometry = geometry;
        this.width = geometry[0].length;
        this.height = geometry.length;
    };

    this.store.prototype.cell = function(c) {
        var cell = { type: sd.CELL.VOID };
        var row = this.geometry[c.j];
        return row ? (row[c.i] ? row[c.i] : cell) : cell;
    }

    this.store.prototype.for_each_cell = function(callback) {
        if (!callback) return;
        for (var j = 0; j < this.geometry.length; ++j) {
            var row = this.geometry[j];
            for (var i = 0; i < row.length; ++i) {
                var res = callback.call(row[i], i, j);
                if (res === true) return;
            }
        }
    };

    this.store.prototype.for_each_cell_vertically = function(callback) {
        if (!callback) return;
        for (var i = 0; i < this.width; ++i) {
            for (var j = 0; j < this.height; ++j) {
                var res = callback.call(this.geometry[j][i], i, j);
                if (res === true) return;
            }
        }
    };

    this.store.prototype.get_readable_coords = function(c) {
        return "(" + Math.round(c.i + 1) + "; " + Math.round(this.height - c.j) + ")";
    }

    function up_cell(store, i, j, t, r) {
        var cell = store.cell({ i: i, j: j });
        cell[t] = r;
    }

    this.store.prototype.update_map = function() {
        this.for_each_cell(function() {
            delete this.rackno;
            delete this.droidno;
        });
        for (var r = 0, rl = this.racks.length; r < rl; ++r) {
            var obj = this.racks[r];
            if (obj.loader == undefined)
                up_cell(this, obj.i, obj.j, 'rackno', r);
        }
        for (var r = 0, rl = this.droids.length; r < rl; ++r) {
            var obj = this.droids[r];
            if (!obj.path.length || obj.waiting) up_cell(this, obj.i, obj.j, 'droidno', obj.number);
            if (obj.state == sd.STATE.RETURNING) 
                if (this.cell(obj.path[0]).droidno == undefined)
                    up_cell(this, obj.path[0].i, obj.path[0].j, 'droidno', obj.number);
        }
    }

    this.store.prototype.prepare_map = function() {
        var packs = this.get_typed_points(sd.CELL.PACK);
        this.for_each_cell(function(i, j) {
            this.colors = [];
            this.cost = 0;
            for (var p = 0, pl = packs.length; p < pl; ++p) {
                var pack = packs[p];
                if (Math.abs(pack.i - i) < 3 && Math.abs(pack.j - j) < 3)
                    this.cost = 10000;
            }
        });
        for (var r = 0, rl = this.racks.length; r < rl; ++r) {
            var obj = this.racks[r];
            up_cell(this, obj.i, obj.j, 'park', obj.no);
        }
    }

    this.store.prototype.add_color = function(c, color) {
        this.geometry[c.j][c.i].colors.push(color);
    }
    this.store.prototype.del_color = function(c, color) {
        var colors = this.geometry[c.j][c.i].colors;
        var index = colors.indexOf(color);
        if (index > -1) colors.splice(index, 1);
    }

    this.store.prototype.get_droid_index = function(c) {
        for (var i = 0, l = this.droids.length; i < l; ++i) {
            var droid = this.droids[i];
            if (c.i == droid.i && c.j == droid.j) return i;
        }
    }
    this.store.prototype.get_rack_index = function(c) {
        for (var i = 0, l = this.racks.length; i < l; ++i) {
            var rack = this.racks[i];
            if (c.i == rack.i && c.j == rack.j) return i;
        }
    }

    this.store.prototype.get_typed_points = function(type) {
        var res = [];
        this.for_each_cell(function(i, j) {
            if (this.type == type)
                res.push(Object.assign(this, { i: i, j: j }));
        });
        return res;
    }

    this.generate_rect_geometry = function(width, height) {
        var geometry = [];
        for (var j = 0; j < height; ++j) {
            var row = geometry[j] = [];
            for (var i = 0; i < width; ++i) {
                row[i] = { type: sd.CELL.NORMAL };
            }
        }
        return geometry;
    };
    
    function compress_map(map) {
        var res = '', seq = '', count = 1;
        for (var i = 0; i < map.length; i += 2) {
            var ns = map.substr(i, 2);
            if (ns == seq) ++count;
            else {
                if (count > 1) res += count;
                if (seq == '~~') seq = '~';
                res += seq;
                seq = ns;
                count = 1;
            }
        }
        if (count > 1) res += count;
        if (seq == '~~') seq = '~';
        res += seq;
        return res;
    }
    
    function decompress_map(str) {
        var map = '', count = '';
        for (var i = 0; i < str.length; ++i) {
            var c = str[i];
            if (c < 10) count += c;
            else if (c == '~') map += '~~';
            else {
                var seq = str.substr(i, 2);
                if (count == '') count = 1;
                for (var j = 0; j < count; ++j) map += seq;
                count = '';
                ++i;
            }
        }
        return map;
    }

    this.save_to_string = function(store) {
        var res = "";
        res += store.width + '!' + store.height + '!';
        var zero = 'A'.charCodeAt(0);
        function process_cell(map) {
            var n = '-'.charCodeAt(0), p = zero;
            if (this.type == sd.CELL.VOID) p = zero + 1;
            else if (this.type == sd.CELL.OPERATOR) p = zero + 2;
            else if (this.type == sd.CELL.PACK) p = zero + 3;
            else if (this.type == sd.CELL.CHARGE) p = zero + 4;
            else if (this.type == sd.CELL.DIRECTION) p = zero + 5 + this.r / 90;
            else if (this.type == sd.CELL.APPROACH) p = zero + 9;
            if (this.rackno != undefined) {
                var rack = store.racks[this.rackno];
                n = rack.text.charCodeAt(0);
                p += 10 + (rack.r / 90 + 1) * 10;
            }
            map.push(n); map.push(p);
            if (this.droidno) { map.push('~'.charCodeAt(0)); map.push('~'.charCodeAt(0)); }
        }
        var map = [];
        store.for_each_cell(function() { process_cell.call(this, map); });
        var s1 = compress_map(String.fromCharCode.apply(null, map));
        var map = [];
        store.for_each_cell_vertically(function() { process_cell.call(this, map); });
        var s2 = compress_map(String.fromCharCode.apply(null, map));
        if (s1.length < s2.length) res += 'h!' + s1;
        else res += 'v!' + s2;
        function get_param(val, def) {
            if (val.toFixed(2) != def.toFixed(2)) return val;
            else return '';
        }
        res += '!' + get_param(sd.droid_params.rotate_velocity[0], sd.dpe.rotate_velocity[0]);
        res += '!' + get_param(sd.droid_params.rotate_velocity[1], sd.dpe.rotate_velocity[1]);
        res += '!' + get_param(sd.droid_params.move_velocity[0], sd.dpe.move_velocity[0]);
        res += '!' + get_param(sd.droid_params.move_velocity[1], sd.dpe.move_velocity[1]);
        res += '!' + get_param(sd.droid_params.move_accel[0], sd.dpe.move_accel[0]);
        res += '!' + get_param(sd.droid_params.move_accel[1], sd.dpe.move_accel[1]);
        res += '!' + get_param(-sd.droid_params.move_accel[2], -sd.dpe.move_accel[2]);
        res += '!' + get_param(-sd.droid_params.move_accel[3], -sd.dpe.move_accel[3]);
        res += '!' + get_param(sd.droid_params.grab_time, sd.dpe.grab_time);
        res += '!' + get_param(sd.droid_params.drop_time, sd.dpe.drop_time);
        res += '!' + get_param(sd.droid_params.unload_time, sd.dpe.unload_time);
        res += '!' + get_param(sd.droid_params.mass[0], sd.dpe.mass[0]);
        res += '!' + get_param(sd.droid_params.mass[1], sd.dpe.mass[1]);
        res += '!' + get_param(sd.droid_params.max_charge, sd.dpe.max_charge);
        res += '!' + get_param(sd.droid_params.charge_threshold_gold * 100, sd.dpe.charge_threshold_gold * 100);
        res += '!' + get_param(sd.droid_params.charge_threshold_red * 100, sd.dpe.charge_threshold_red * 100);
        res += '!' + get_param(sd.droid_params.charge_threshold_crit * 100, sd.dpe.charge_threshold_crit * 100);
        res += '!' + get_param(sd.droid_params.charge_velocity, sd.dpe.charge_velocity);
        res += '!' + get_param(sd.droid_params.const_loss, sd.dpe.const_loss);
        res += '!' + get_param(sd.droid_params.efficiency * 100, sd.dpe.efficiency * 100);
        res += '!' + get_param(sd.droid_params.crr * 1000, sd.dpe.crr * 1000);
        res += '!' + get_param(sd.droid_params.s[0], sd.dpe.s[0]);
        res += '!' + get_param(sd.droid_params.s[1], sd.dpe.s[1]);
        res = res.replace(/!*$/, '');
        return res;
    }

    this.load_from_string = function(store, str) {
        var ser = str.split('!');
        var w = parseInt(ser[0]);
        var h = parseInt(ser[1]);
        store.apply_geometry(sd.generate_rect_geometry(w, h));
        var ver = ser[2] == 'v';
        var map = decompress_map(ser[3]);
        var c = { i: 0, j: 0 };
        var last_droid_number = 1;
        for (var s = 0; s < map.length; s += 2) {
            if (map[s] != '~') {
                var t = map.charCodeAt(s + 1) - 'A'.charCodeAt(0), tt = sd.CELL.NORMAL, r = undefined;
                var rr = Math.floor((t - 10) / 10 - 1);
                t = t % 10;
                if (t == 1) tt = sd.CELL.VOID;
                else if (t == 2) tt = sd.CELL.OPERATOR;
                else if (t == 3) tt = sd.CELL.PACK;
                else if (t == 4) tt = sd.CELL.CHARGE;
                else if (t >= 5 && t <= 8) { tt = sd.CELL.DIRECTION; r = 90 * (t - 5); }
                else if (t == 9) tt = sd.CELL.APPROACH;
                var cell = store.cell(c);
                cell.type = tt; cell.r = r;
                var obj = map[s];
                if (obj != '-') {
                    store.racks.push({ i: c.i, j: c.j, r: rr * 90, text: obj });
                    if (map[s + 2] == '~') store.droids.push({ i: c.i, j: c.j, r: rr * 90,
                            number: last_droid_number++, path: [], charge: 1.0 });
                }
                if (ver && ++c.j == h) { c.j = 0; ++c.i; }
                if (!ver && ++c.i == w) { c.i = 0; ++c.j; }
            }
        }
        function get_param(str, def) {
            var f = parseFloat(str);
            if (isNaN(f)) f = def;
            return f;
        }
        sd.droid_params.rotate_velocity[0] = get_param(ser[4], sd.dpe.rotate_velocity[0]);
        sd.droid_params.rotate_velocity[1] = get_param(ser[5], sd.dpe.rotate_velocity[1]);
        sd.droid_params.move_velocity[0] = get_param(ser[6], sd.dpe.move_velocity[0]);
        sd.droid_params.move_velocity[1] = get_param(ser[7], sd.dpe.move_velocity[1]);
        sd.droid_params.move_accel[0] = get_param(ser[8], sd.dpe.move_accel[0]);
        sd.droid_params.move_accel[1] = get_param(ser[9], sd.dpe.move_accel[1]);
        sd.droid_params.move_accel[2] = -get_param(ser[10], -sd.dpe.move_accel[2]);
        sd.droid_params.move_accel[3] = -get_param(ser[11], -sd.dpe.move_accel[3]);
        sd.droid_params.grab_time = get_param(ser[12], sd.dpe.grab_time);
        sd.droid_params.drop_time = get_param(ser[13], sd.dpe.drop_time);
        sd.droid_params.unload_time = get_param(ser[14], sd.dpe.unload_time);
        sd.droid_params.mass[0] = get_param(ser[15], sd.dpe.mass[0]);
        sd.droid_params.mass[1] = get_param(ser[16], sd.dpe.mass[1]);
        sd.droid_params.max_charge = get_param(ser[17], sd.dpe.max_charge);
        sd.droid_params.charge_threshold_gold = get_param(ser[18], sd.dpe.charge_threshold_gold * 100) / 100;
        sd.droid_params.charge_threshold_red = get_param(ser[19], sd.dpe.charge_threshold_red * 100) / 100;
        sd.droid_params.charge_threshold_crit = get_param(ser[20], sd.dpe.charge_threshold_crit * 100) / 100;
        sd.droid_params.charge_velocity = get_param(ser[21], sd.dpe.charge_velocity);
        sd.droid_params.const_loss = get_param(ser[22], sd.dpe.const_loss);
        sd.droid_params.efficiency = get_param(ser[23], sd.dpe.efficiency * 100) / 100;
        sd.droid_params.crr = get_param(ser[24], sd.dpe.crr * 1000) / 1000;
        sd.droid_params.s[0] = get_param(ser[25], sd.dpe.s[0]);
        sd.droid_params.s[1] = get_param(ser[26], sd.dpe.s[1]);
    }

    this.save_to_json = function(store) {
        var res = {};
        res.dimentions = [store.width, store.height];
        res.void_cells = [];
        res.pack_cells = [];
        res.charge_cells = [];
        res.operator_cells = [];
        res.direction_cells = [];
        store.for_each_cell(function(i, j) {
            
        });
        res.racks = [];
        res.droids = [];
        return res;
    }

    this.ics = function(store) {
        this.store = store;
        this.working = false;
        this.timescale = 2;
        this.last_operation_time = 0;
        this.current_time = 0;
        this.last_time = (new Date()).getTime();
        this.last_info_update_time = 0;
        this.min_order_time = undefined;
        this.max_order_time = undefined;
        this.order_time = 0;
        this.order_count = 0;
        this.load_time = 0;
        this.charge_time = 0;
        this.charge_count = 0;
        this.charge_carry_loss = 0;
        this.charge_empty_loss = 0;
        this.min_charge = 1;
        this.packs = store.get_typed_points(sd.CELL.PACK);
        this.operators = store.get_typed_points(sd.CELL.OPERATOR);
        this.chps = store.get_typed_points(sd.CELL.APPROACH);
        this.chsts = store.get_typed_points(sd.CELL.CHARGE);

        var get_closest_droid = function(c) {
            var min_dist = 100000, min_droid;
            for (var i in store.droids) {
                var droid = store.droids[i];
                if (droid.state != sd.STATE.READY) {
                    if (droid.state == sd.STATE.RETURNING && 
                            c.i == droid.path[0].i && c.j == droid.path[0].j)
                        return droid;
                    continue;
                }
                var dist = Math.abs(droid.i - c.i) + Math.abs(droid.j - c.j);
                if (min_dist > dist) { min_dist = dist; min_droid = droid; }
            }
            return min_droid;
        };

        var get_closest_from = function(c, fs) {
            var min_dist = 100000, min_op;
            for (var i in fs) {
                var op = fs[i];
                var dist = Math.abs(op.i - c.i) + Math.abs(op.j - c.j);
                if (min_dist > dist) { min_dist = dist; min_op = op; }
            }
            return min_op;
        }

        this.check_droid_charge = function(store, droid) {
            if (droid.charge_loss > 0) {
                if (droid.carry) this.charge_carry_loss += droid.charge_loss;
                else this.charge_empty_loss += droid.charge_loss;
            }
            if (droid.charge < this.min_charge) this.min_charge = droid.charge;
            if (droid.charge < sd.droid_params.charge_threshold_crit && !droid.discharged) {
                droid.discharged = true;
                droid.path.splice(0, 0, { t: "state", state: sd.STATE.DISCHARGE });
                sd.update_error_discharge(store, droid);
                return;
            }
            if (!droid.path.length) {
                if (droid.charge < sd.droid_params.charge_threshold_red)
                    this.make_charge_request(droid);
                else if (droid.charge < sd.droid_params.charge_threshold_gold)
                    this.make_charge_request(droid, true);
            }
        }

        this.make_load_request = function(no, op) {
            var rack = store.racks[no];
            if (rack.busy != undefined) return;
            var droid = get_closest_droid(rack);
            if (!droid) return;
            var ics = this;
            var time = ics.current_time, load_time;
            sd.add_droid_state(droid, sd.STATE.MOVING, rack, function() {
                rack.busy = droid.number;
            });
            sd.add_droid_move_dest(droid, rack);
            sd.add_droid_grab(droid, rack);
            sd.add_droid_state(droid, sd.STATE.DRAGGING, rack);
            sd.add_droid_move_dest(droid, op);
            sd.add_droid_state(droid, sd.STATE.OPERATOR, rack, function() {
                load_time = ics.current_time;
            });
            sd.add_droid_unload(droid, rack, get_closest_from(op, this.operators));
            sd.add_droid_state(droid, sd.STATE.GOINGBACK, rack, function() {
                var dt = ics.current_time - time;
                if (ics.min_order_time == undefined || ics.min_order_time > dt)
                    ics.min_order_time = dt;
                if (ics.max_order_time == undefined || ics.max_order_time < dt)
                    ics.max_order_time = dt;
                ics.order_time += dt;
                ics.order_count += 1;
                ics.load_time += ics.current_time - load_time;
            });
            sd.add_droid_move_dest(droid, rack);
            sd.add_droid_drop(droid, rack);
            sd.add_droid_state(droid, sd.STATE.RETURNING, null, function() { 
                rack.busy = undefined; 
            });
            //sd.add_droid_move_dest(droid, droid.waitpoint);
            sd.add_droid_state(droid, sd.STATE.READY);
        };

        this.make_charge_request = function(droid, canwait) {
            var min = store.droids.length, dist = 100000, chp;
            for (var i = 0; i < this.chps.length; ++i) {
                if (!this.chps[i].occupy) this.chps[i].occupy = 0;
                var c = this.chps[i].occupy;
                if (c <= min) {
                    var d = Math.abs(droid.i - this.chps[i].i) + Math.abs(droid.j - this.chps[i].j);
                    if (c < min) { min = c; chp = this.chps[i]; dist = d; }
                    else if (d < dist) { dist = d; chp = this.chps[i]; }
                }
            }
            if (!chp) {
                sd.add_droid_state(droid, sd.STATE.PATHFAIL, { type: sd.CELL.CHARGE });
                return;
            }
            var ics = this;
            var time = ics.current_time;
            if (canwait && chp.occupy != 0) return;
            chp.occupy += 1;
            sd.add_droid_state(droid, sd.STATE.MOVING, chp);
            sd.add_droid_move_dest(droid, chp);
            sd.add_droid_state(droid, sd.STATE.CHARGING);
            sd.add_droid_charge(droid, get_closest_from(chp, this.chsts));
            sd.add_droid_state(droid, sd.STATE.RETURNING, null, function() {
                chp.occupy -= 1;
                ics.charge_time += ics.current_time - time;
                ics.charge_count += 1;
            });
            //sd.add_droid_move_dest(droid, droid.waitpoint);
            sd.add_droid_state(droid, sd.STATE.READY);
        };

        this.process_droid = function(droid, delta, index) {
            if (droid.path && droid.path.length) {
                var store = this.store;
                var res = sd.droid_path_factory[droid.path[index].t](
                        store, droid, droid.path[index], delta);
                if (droid.path[index].linked && droid.path[index + 1]
                        && droid.path[index + 1].child)
                    this.process_droid(droid, delta, index + 1);
                if (droid.laden != undefined && droid.carry) {
                    droid.laden.r = droid.rack_r;
                    droid.laden.i = droid.i;
                    droid.laden.j = droid.j;
                    droid.laden.nochange = false;
                }
                if (res) {
                    var child = droid.path[index].child;
                    droid.path.splice(index, 1);
                    if (res !== true)
                        for (var i = res.length - 1; i >= 0; --i)
                            droid.path.splice(index, 0, res[i]);
                    if (droid.path[index] && droid.path[index].child == child)
                        this.process_droid(droid, delta, index);
                }
            }
        };

        this.animate_interval = function(delta) {
            function process(delta) {
                for (var i in store.droids) {
                    var droid = store.droids[i];
                    droid.charge_loss = 0;
                    this.process_droid(droid, delta, 0);
                    sd.droid_charge_loss(droid, delta);
                    this.check_droid_charge(store, droid);
                    if (store.collision) return;
                }
                if (this.last_operation_time + 1 < this.current_time) {
                    var no = Math.floor(Math.random() * store.racks.length);
                    if (store.racks[no]) {
                        var op = get_closest_from(store.racks[no], this.packs);
                        if (op) {
                            this.make_load_request(no, op);
                            this.last_operation_time = this.current_time;
                        }
                    }
                }
            }
            while (delta > 0.05) {
                delta -= 0.05;
                this.current_time += 0.05;
                this.store.current_time += 0.05;
                process.call(this, 0.05);
                if (store.collision) return;
            }
            if (delta > 0) {
                this.current_time += delta;
                this.store.current_time += delta;
                process.call(this, delta);
            }
        }

        this.animate = function() {
            if (this.working) {
                var render_time = (new Date()).getTime();
                var delta = (render_time - this.last_time) / 1000 * this.timescale;
                this.last_time = render_time;
                this.animate_interval(delta);
                if (store.collision) {
                    $t.raise_event($t.id('bpause'), 'click');
                }
            }
            if (!this.stopped) {
                (function(t) {
                    requestAnimationFrame(function() { t.animate(); });
                })(this);
            }
        };
    };


}).apply(teal.storedroids = teal.storedroids || {});
