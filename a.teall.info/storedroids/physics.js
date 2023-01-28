"use strict";
(function(storedroids) {
    var sd = this;

    var droid_params = {
        rotate_velocity: [45, 45], // empty, laden
        move_velocity: [4.0, 2.0], // empty, laden
        move_accel: [1, 1, -1, -1], // empty, laden, break empty, break laden
        grab_time: 3,
        drop_time: 3,
        unload_time: 6,
        mass: [150, 500], // empty, laden
        max_charge: 3000,
        charge_threshold_gold: 0.5,
        charge_threshold_red: 0.2,
        charge_threshold_crit: 0.05,
        charge_velocity: 1,
        const_loss: 50,
        efficiency: 0.8,
        crr: 0.009,
        s: [0.3, 2], // empty, laden
        stop_on_collision_flag: true,
    };
    sd.droid_params = droid_params;
    sd.dpe = JSON.parse(JSON.stringify(droid_params));
    
    this.make_and_color_path = function(store, droid, dest) {
        var cc = store.cell(dest);
        if (droid.state == sd.STATE.PATHFAIL) return false;
        if (cc.rackno != undefined && droid.waitpoint.i == dest.i && droid.waitpoint.j == dest.j
                && cc.droidno != undefined && cc.droidno != droid.number) return false;
        else if (cc.rackno == undefined && cc.park != undefined && droid.laden == undefined) return false;
        else if (cc.rackno != undefined && store.racks[cc.rackno].busy 
                && store.racks[cc.rackno].busy != droid.number) return false;
        var paths = sd.dynamic_find_path(store, droid, dest);
        if (!paths) { droid.nostatechange = false; droid.state = sd.STATE.PATHFAIL; return false; }
        droid.uncolorable = false;
        droid.destignation = { i: dest.i, j: dest.j };
        var color = [store.color++, droid];
        var c = { i: droid.i, j: droid.j };
        for (var p in paths) {
            var path = paths[p];
            if (path.t != 'move') continue;
            path.color = color;
            store.add_color(c, color);
            while (c.i != path.i || c.j != path.j) {
                if (c.i > path.i) --c.i;
                else if (c.i < path.i) ++c.i;
                if (c.j > path.j) --c.j;
                else if (c.j < path.j) ++c.j;
                store.add_color(c, color);
            }
        }
        if (droid.laden == undefined) {
            var colors = store.cell(droid.destignation).colors;
            for (var c = 0, cl = colors.length; c < cl; ++c) {
                var d = colors[c][1];
                if (d == droid || d.laden) continue;
                d.uncolorable = true;
            }
        }
        return paths;
    }

    function calc_droid_path_unload_r(store, droid, rack) {
        var sm, lm, op, a;
        for (var i = 0; i < droid.path.length; ++i) {
            var path = droid.path[i];
            if (path.t == 'dest') {
                droid.laden = rack;
                store.update_map();
                var paths = sd.make_and_color_path(store, droid, path);
                droid.laden = undefined;
                if (paths) {
                    var psl = paths.length - 1;
                    lm = paths[psl];
                    sm = psl ? paths[psl - 1] : droid;
                    droid.path.splice(i, 1);
                    for (var j = paths.length - 1; j >= 0; --j)
                        droid.path.splice(i, 0, paths[j]);
                }
            }
            else if (path.t == 'unload') { op = path.operator; break; }
        }
        if (sm.i == lm.i) a = sm.j > lm.j ? 0 : 180;
        else if (sm.j == lm.j) a = sm.i > lm.i ? 270 : 90;
        return sd.calc_droid_rotate_delta({ i: lm.i, j: lm.j, r: a }, op);
    }

    function calc_droid_path_return_r(store, droid) {
        store.update_map();
        for (var i = 0; i < droid.path.length; ++i) {
            if (droid.path[i].t == 'dest')
                return sd.calc_droid_rotate_delta(droid,
                        sd.dynamic_find_path(store, droid, droid.path[i])[0]);
        }
    }

    function apply_charge_loss(droid, v, a, delta) {
        var e = droid.laden != undefined ? 1 : 0;
        var pv = droid_params.crr * droid_params.mass[e] * v;
        var pair = droid_params.s[e] * 1.2 * v * v * v / 2;
        var pa = droid_params.mass[e] * a * v;
        droid.charge_loss += (pa + pv + pair) / 3600 * delta * droid_params.efficiency;
    }

    this.droid_charge_loss = function(droid, delta) {
        droid.charge_loss_delta = delta;
        if (droid.charge_loss >= 0) {
            droid.charge_loss += droid_params.const_loss / 3600 * delta;
            droid.charge -= droid.charge_loss / droid_params.max_charge;
            if (droid.charge < 0) droid.charge = 0;
        }
    }

    function apply_charge_gain(droid, delta) {
        var c = droid_params.charge_velocity * delta;
        droid.charge += c / droid_params.max_charge;
        if (droid.charge > 1) droid.charge = 1;
        droid.charge_loss = -c;
    }

    this.droid_path_factory = {
        'state': function(store, droid, state, delta) {
            droid.nostatechange = false;
            droid.state = state.state;
            droid.stateinfo = state.stateinfo;
            if (state.callback) state.callback.call(droid);
            return true;
        },
        'dest': function(store, droid, dest, delta) {
            if (droid.charge_color) {
                store.del_color(droid, droid.charge_color);
                delete droid.charge_color;
            }
            store.update_map();
            var res = sd.make_and_color_path(store, droid, dest);
            droid.waiting = res === false;
            return res;
        },
        'rotate': function(store, droid, path, delta) {
            if (path.r.delta > 0) {
                var e = droid.carry ? 1 : 0;
                var r = delta * droid_params.rotate_velocity[e];
                path.r.delta -= r;
                if (path.r.delta < 0) {
                    r += path.r.delta;
                    path.r.delta = 0;
                }
                droid.r += r * path.r.sign;
                if (droid.carry) droid.rack_r += r * path.r.sign;
                var v = droid_params.rotate_velocity[e] * Math.PI / 180 * 0.6;
                apply_charge_loss(droid, v, droid_params.move_accel[e], delta);
                if (droid.charge < 0) droid.charge = 0;
                if (path.r.delta == 0) {
                    droid.r = Math.round(droid.r);
                    if (droid.carry) droid.rack_r = Math.round(droid.rack_r);
                    return true;
                }
                return false;
            }
            return true;
        },
        'grab': function(store, droid, path, delta) {
            droid.nochange = false;
            if (path.r == undefined) {
                var r = calc_droid_path_unload_r(store, droid, path.rack);
                var rr = path.rack.r - r.delta * r.sign;
                while (rr >= 360) rr -= 360;
                while (rr < 0) rr += 360;
                path.r = sd.calc_droid_rotate_delta(droid, null, { r: rr });
            }
            if (!path.color) store.add_color(droid, path.color = [-1, droid]);
            if (sd.droid_path_factory.rotate(store, droid, path, delta)) {
                if (droid.grabbed < 1) {
                    droid.grabbed += delta / droid_params.grab_time;
                    return false;
                }
                else droid.grabbed = 1;
                droid.laden = path.rack;
                droid.rack_r = droid.laden.r;
                droid.carry = true;
                path.rack.loader = droid;
                store.del_color(droid, path.color);
                return true;
            }
            return false;
        },
        'prepare': function(store, droid, path, delta) {
            if (!droid.laden) return true;
            var a = calc_droid_path_return_r(store, droid);
            if (a.delta != 0) return [
                { t: "drop", rack: droid.laden, keep: true, child: path.child },
                { t: "grab", rack: droid.laden, r: a, child: path.child },
            ];
            return true;
        },
        'unload': function(store, droid, path, delta) {
            droid.nochange = false;
            if (path.r == undefined) {
                path.rack.unloaded = 0;
                path.r = sd.calc_droid_rotate_delta(path.rack, path.operator);
                store.add_color(droid, path.color = [-1, droid]);
            }
            if (!sd.droid_path_factory.rotate(store, droid, path, delta)) return false;
            if (path.rack.unloaded < 1) {
                path.rack.unloaded += delta / droid_params.unload_time;
                return false;
            }
            --path.rack.count;
            path.rack.unloaded = 0;
            store.del_color(droid, path.color);
            return true;
        },
        'drop': function(store, droid, path, delta) {
            droid.nochange = false;
            if (path.r == undefined) {
                path.r = true;
                store.add_color(droid, path.color = [-1, droid]);
            }
            if (droid.grabbed > 0) {
                droid.grabbed -= delta / droid_params.drop_time;
                return false;
            }
            droid.grabbed = 0;
            droid.carry = false;
            if (!path.keep) {
                droid.laden.loader = undefined;
                droid.laden = undefined;
                droid.rack_r = undefined;
            }
            store.del_color(droid, path.color);
            return true;
        },
        'charge': function(store, droid, path, delta) {
            droid.nochange = false;
            if (path.color == undefined) {
                store.add_color(droid, path.color = [-1, droid]);
            }
            if (droid.charge < 1) {
                apply_charge_gain(droid, delta);
                return false;
            }
            droid.discharged = false;
            store.del_color(droid, path.color);
            return true;
        },
        'complexcharge': function(store, droid, path, delta) {
            store.add_color(droid, droid.charge_color = [-2, droid]);
            return [
                { t: "move", i: path.station.i, j: path.station.j },
                { t: "charge" },
                { t: "move", i: droid.i, j: droid.j, norotate: true },
            ];
        },
        'stand': function(store, droid, path, delta) {
            droid.nochange = false;
            if (path.r == undefined) {
                path.r = sd.calc_droid_rotate_delta(droid, null, { r: path.rr });
                store.add_color(droid, path.color = [-1, droid]);
            }
            var res = sd.droid_path_factory.rotate(store, droid, path, delta);
            if (res) store.del_color(droid, path.color);
            return res;
        },
        'move': function(store, droid, path, delta) {
            droid.nochange = false;
            var e = droid.laden != undefined ? 1 : 0;
            if (!path.norotate && path.r == undefined) {
                path.r = sd.calc_droid_rotate_delta(droid, path);
            }
            if (path.m == undefined) {
                var m = path.m = { i: 0, j: 0 };
                if (droid.i < path.i) m.i = 1;
                else if (droid.i > path.i) m.i = -1;
                if (droid.j < path.j) m.j = 1;
                else if (droid.j > path.j) m.j = -1;
                m.velocity = 0;
                m.start = { i: droid.i, j: droid.j };
                m.distance = Math.abs(droid.i - path.i) + Math.abs(droid.j - path.j);
                m.topass = Math.floor(m.distance);
                m.color = [-2, droid];
                m.space = undefined;
                m.collision_time = 0;
                store.add_color(m.start, m.color);
            }
            if (!path.norotate && !sd.droid_path_factory.rotate(store, droid, path, delta)) return false;
            var m = path.m;
            m.distance = Math.abs(droid.i - path.i) + Math.abs(droid.j - path.j);
            var col = true;
            while (col === true) col = find_space(store, m, droid, path);
            if (col === false) {
                var cell = store.cell(path);
                if (cell.type == sd.CELL.PACK) droid.operator_queue_time += delta;
                else if (cell.type == sd.CELL.CHARGE) droid.charge_queue_time += delta;
                else droid.traffic_jam_time += delta;
                m.collision_time += delta;
                if (m.collision_time > 1) {
                    m.collision_time = 0;
                    var loop = find_loop_collision(store, droid);
                    if (loop !== false) {
                        sd.update_error_collision(store, droid, loop, function() {
                            resolve_collision(store, { i: m.start.i + m.i, j: m.start.j + m.j });
                        });
                    }
                }
            }
            var asign = m.space < -m.velocity * m.velocity / 2 / droid_params.move_accel[e + 2] ? 2 : 0;
            m.velocity += droid_params.move_velocity[e] * droid_params.move_accel[e + asign] * delta;
            if (m.velocity > droid_params.move_velocity[e]) m.velocity = droid_params.move_velocity[e];
            if (m.velocity < 0.01) m.velocity = 0.01;
            var dd = m.velocity * delta;
            if (dd < 0.0001) dd = 0.0001;
            m.distance -= dd;
            var passed = m.topass - Math.ceil(m.distance);
            if (m.topass - m.distance > 0.5) {
                store.del_color(m.start, m.color);
                store.del_color(m.start, path.color);
            }
            while (passed > 0) {
                store.del_color(m.start, m.color);
                store.del_color(m.start, path.color);
                m.start.i += m.i; m.start.j += m.j;
                --passed; --m.topass; ++droid.passed;
            }
            if (m.distance <= 0) {
                droid.i = path.i; droid.j = path.j;
                store.del_color(droid, path.color);
                return true;
            }
            m.space -= dd;
            if (m.space <= 0) {
                m.velocity = 0; m.space = 0;
                droid.i = m.start.i; droid.j = m.start.j;
                m.distance = Math.abs(droid.i - path.i) + Math.abs(droid.j - path.j);
                return false;
            }
            droid.i += m.i * dd; droid.j += m.j * dd;
            apply_charge_loss(droid, m.velocity, Math.abs(droid_params.move_accel[e + asign]), delta);
            return false;
        }
    };

    function check_if_half_space(droid, m, owner) {
        m.space = (owner.i - droid.i) * m.i + (owner.j - droid.j) * m.j - 1;
        return m.space > 0;
    }

    function find_space(store, m, droid, path) {
        if (droid.charge_color) { m.space = m.distance; return; }
        var cc = { i: m.start.i, j: m.start.j };
        var ccf = false, ccount = 0;
        for_each_color_path(store, cc, path, function(color) {
            if (color[0] < path.color[0]) { ccf = color; ++ccount; }
            else return true;
        });
        if (ccf) { cc.i -= m.i; cc.j -= m.j; }
        m.space = (cc.i - droid.i) * m.i + (cc.j - droid.j) * m.j;
        droid.hitch = undefined;
        if (m.space <= 0 && m.distance > 0) {
            var old_color = ccf[0], owner = ccf[1];
            if (old_color > 0 && owner.path[0].t == "move" && m.distance >= 1) {
                var cell = store.cell(droid.destignation);
                var br = true;
                if (cell.park != undefined) {
                    var colors = cell.colors;
                    for (var c = 0, cl = colors.length; c < cl; ++c)
                        if (colors[c][0] != path.color[0]) { br = false; break; }
                }
                if (br) {
                    ccf[0] = store.color + 20000;
                    var col = find_collision(store, owner, ccf[0], droid);
                    ccf[0] = col ? old_color : store.color++;
                    if (!col) return true; 
                }
                if (ccount == 1 && check_if_half_space(droid, m, owner)) return;
            }
            droid.hitch = owner;
            return false;
        }
    }

    function for_each_color_path(store, cc, path, callback) {
        var w = true, m = path.m;
        while ((cc.i != path.i || cc.j != path.j) && w) {
            cc.i += m.i; cc.j += m.j;
            var colors = store.cell(cc).colors;
            for (var c = 0, cl = colors.length; c < cl; ++c) {
                w &= callback(colors[c], cc);
                if (w === false) break;
            }
        }
    }

    function check_wrong_colors(store, cc, color) {
        var colors = store.cell(cc).colors;
        for (var c = 0, cl = colors.length; c < cl; ++c)
            if (colors[c][0] != color) return true;
        return false;
    }

    function find_collision(store, droid, color, other) {
        if (droid.uncolorable) return true;
        var path = droid.path[0];
        var m = path.m;
        if (!m) return true;
        if (m.space <= 0) return check_wrong_colors(store, m.start, color);
        else {
            if (check_wrong_colors(store, m.start, color)) return true;
            if (check_wrong_colors(store, { i: m.start.i + m.i, j: m.start.j + m.j }, color)) return true;
        }
        var cc = { i: m.start.i, j: m.start.j };
        var ccf = false;
        for_each_color_path(store, cc, path, function(color) {
            if (color[0] < path.color[0]) { ccf = true; return false; }
            else return true;
        });
        if (ccf) { cc.i -= m.i; cc.j -= m.j; }
        var distance = Math.abs(droid.i - cc.i) + Math.abs(droid.j - cc.j);
        if (distance < 1) return true;
        var e = droid.laden != undefined ? 1 : 0;
        return distance < -m.velocity * m.velocity / 2 / droid_params.move_accel[e + 2];
    }

    function find_loop_collision(store, droid) {
        var d = droid.hitch;
        if (d == undefined) return false;
        var loop = [droid.number];
        while (d) {
            if (loop.indexOf(d.number) != -1) {
                loop.push(d.number);
                return loop;
            }
            loop.push(d.number);
            d = d.hitch;
        }
        return false;
    }

    function resolve_collision(store, cc) {
        store.cell(cc).colors = [];
    }

    this.calc_droid_rotate_delta = function(droid, path, object) {
        while (droid.r >= 360) droid.r -= 360;
        while (droid.r < 0) droid.r += 360;
        var rdesct;
        if (path) rdesct = { 10: 0, 0: 0, 11: 90, 20: 180, 9: 270 }
            [Math.sign(path.i - droid.i) + Math.sign(path.j - droid.j) * 10 + 10];
        else rdesct = object ? object.r : droid.r;
        var rdelta1 = rdesct - droid.r;
        var rdelta2 = rdelta1 + ((rdelta1 > 0) ? -360 : 360);
        var rdelta = Math.abs(rdelta1) < Math.abs(rdelta2) ? rdelta1 : rdelta2;
        var rsign = Math.sign(rdelta);
        var rdelta = Math.abs(rdelta);
        return { sign: rsign, delta: Math.round(rdelta) };
    }

    this.add_droid_state = function(droid, state, stateinfo, callback) {
        droid.path.push({ t: "state", state: state, stateinfo: stateinfo, callback: callback });
    }

    this.add_droid_move_dest = function(droid, c) {
        droid.path.push({ t: "dest", i: c.i, j: c.j, r: c.r });
    }

    this.add_droid_grab = function(droid, rack) {
        droid.path.push({ t: "grab", rack: rack });
    }
    this.add_droid_unload = function(droid, rack, operator) {
        droid.path.push({ t: "unload", rack: rack, operator: operator, linked: true });
        droid.path.push({ t: "prepare", child: true });
    }

    this.add_droid_drop = function(droid, rack) {
        droid.path.push({ t: "drop", rack: rack });
    }

    this.add_droid_charge = function(droid, station) {
        if (station) droid.path.push({ t: "complexcharge", station: station });
        else droid.path.push({ t: "charge" });
    }

    function spread(store, s, callback) {
        var active_c = [s];
        var finished = false;
        var iteration = 0;
        do {
            finished = true;
            var new_active_c = [];
            function check_cell(ac, acell, cc) {
                var ccell = store.cell(cc);
                if (ccell.type == sd.CELL.VOID) return true;
                var res = callback(ac, acell, cc, ccell, iteration);
                if (res == 1) return true;
                if (res == 2) new_active_c.push(cc);
            }
            for (var i = 0, acl = active_c.length; i < acl; ++i) {
                var cross_finished = true;
                var ac = active_c[i], acell = store.cell(ac);
                cross_finished &= check_cell(ac, acell, { i: ac.i - 1, j: ac.j });
                cross_finished &= check_cell(ac, acell, { i: ac.i + 1, j: ac.j });
                cross_finished &= check_cell(ac, acell, { i: ac.i, j: ac.j - 1 });
                cross_finished &= check_cell(ac, acell, { i: ac.i, j: ac.j + 1 });
                finished &= cross_finished;
            }
            active_c = new_active_c;
            ++iteration;
        } while (!finished);
    }

    function check_direction_r(diri, dirj, r) {
        return diri == 1 && r != 90 || diri == -1 && r != 270
            || dirj == 1 && r != 180 || dirj == -1 && r != 0;
    }


    this.dynamic_find_path = function(store, s, c) {
        if (s.i == c.i && s.j == c.j) return [{ t: "stand", rr: s.r }];
        store.cell(s).s = { d: 0, r: s.r, p: 0 };
        spread(store, s, function(ac, acell, cc, ccell, ii) {
            if (!ccell.s) ccell.s = {};
            if (ccell.s.d <= 0) return;
            var move_cost = 60;
            if (ccell.rackno != undefined) {
                var b = store.racks[ccell.rackno].busy;
                if (s.laden || (b != undefined && b != s.number)) {
                    ccell.s.d = -1; return; 
                }
                else move_cost = 40;
            }
            if (ccell.type == sd.CELL.OPERATOR || ccell.type == sd.CELL.CHARGE) {
                ccell.s.d = -1; return
            }
            if (ccell.droidno != undefined && ccell.droidno != s.number && ccell.type == sd.CELL.NORMAL) {
                ccell.s.d = -1; return;
            }
            if (ccell.rackno == undefined && ccell.park != undefined)
                if (s.laden == undefined || s.laden.no != ccell.park) {
                    ccell.s.d = -1; return;
                }
            if (ccell.type == sd.CELL.PACK || ccell.type == sd.CELL.APPROACH) {
                move_cost = 1000;
            }
            if (ccell.type == sd.CELL.DIRECTION) {
                var diri = cc.i - ac.i, dirj = cc.j - ac.j;
                var fail = check_direction_r(diri, dirj, ccell.r);
                if (fail) move_cost = 100000;
            }
            if (s.laden == undefined) move_cost += ccell.cost;
            function calc_cost(acs, cost) {
                ac.r = acs.r;
                var rr = sd.calc_droid_rotate_delta(ac, cc);
                var r = Math.round(ac.r + rr.sign * rr.delta);
                var p = rr.delta == 0 ? acs.p + 1 : 0;
                cost -= p * 8;
                if (cost < 10) cost = 10;
                cost += rr.delta * 2;
                return { d: acs.d + cost, r: r, p: p, cf: ac };
            }
            var nd = calc_cost(acell.s, move_cost);
            if (acell.s2 && acell.s2.d != undefined) {
                var nd2 = calc_cost(acell.s2, move_cost);
                if (nd2.d < nd.d) { nd = nd2; nd.f = true; }
            }
            if (ccell.s.d == undefined || ccell.s.d > nd.d) {
                ccell.s2 = ccell.s; ccell.s = nd;
                return 2;
            }
            if (ccell.s2 == undefined || ccell.s2.d > nd.d) {
                ccell.s2 = nd;
                return 2;
            }
            return 1;
        });

        var cc = c;
        var snake = [];
        if (s.i != cc.i || s.j != cc.j) snake.push(cc);
        var end = false, f = false, failure = false;
        while (!end) {
            var cell = store.cell(cc);
            if (!cell.s) { failure = true; break; }
            cc = f ? cell.s2.cf : cell.s.cf;
            end = cc.i == s.i && cc.j == s.j;
            if (!end) { snake.push(cc); f = cell.s.f; }
        }
        if (failure) {
            store.for_each_cell(function() { delete this.s; delete this.s2; });
            return false;
        }

        snake.reverse();
        var p = s, pdir, path = [];
        for (var i = 0; i < snake.length; ++i) {
            var n = snake[i];
            var dir = n.i - p.i + (n.j - p.j) * 10;
            if (pdir == undefined) pdir = dir;
            if (pdir != dir) path.push({ t: "move", i: p.i, j: p.j });
            pdir = dir;
            p = n;
        }
        path.push({ t: "move", i: p.i, j: p.j });

        store.for_each_cell(function() { delete this.s; delete this.s2; });
        return path;
    }

    /*function print(store) {
        $t.empty(sd.dr.info_layer);
        var maxw = 0;
        store.for_each_cell(function(i, j) {
            if (this.s != undefined && this.s.d > maxw && this.s.d < 10000) maxw = this.s.d;
        });
        store.for_each_cell(function(i, j) {
            if (this.s != undefined) {
                var dir = '', s = this.s;
                if (s.cf && s.cf.i == i + 1) dir = '←';
                if (s.cf && s.cf.i == i - 1) dir = '→';
                if (s.cf && s.cf.j == j + 1) dir = '↑';
                if (s.cf && s.cf.j == j - 1) dir = '↓';
                $t.svg.svg('text', { x: 100 * i + 10, y: 100 * j + 15 }, 
                        sd.dr.info_layer).innerHTML = s.d + dir;
                $t.svg.svg('text', { 'text-anchor': 'end', x: 100 * i + 90, y: 100 * j + 15 }, 
                        sd.dr.info_layer).innerHTML = i + ';' + j;
                var c = 255 - Math.round(255 / maxw * s.d);
                $t.svg.svg('rect', { x: 100 * i, y: 100 * j, width: 100, height: 100,
                        style: 'fill: rgba(' + c + ',' + c + ', 0, 0.1);' }, sd.dr.info_layer).innerHTML = s.d + dir;
            }
            if (this.s2 != undefined && this.s2.d != undefined) {
                var dir = '', s = this.s2;
                if (s.cf && s.cf.i == i + 1) dir = '←';
                if (s.cf && s.cf.i == i - 1) dir = '→';
                if (s.cf && s.cf.j == j + 1) dir = '↑';
                if (s.cf && s.cf.j == j - 1) dir = '↓';
                $t.svg.svg('text', { x: 100 * i + 10, y: 100 * j + 95 }, 
                        sd.dr.info_layer).innerHTML = s.d + dir;
            }
        });
    }*/

}).apply(teal.storedroids = teal.storedroids || {});
