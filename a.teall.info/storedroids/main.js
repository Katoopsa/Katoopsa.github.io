"use strict";
(function(storedroids) {
    var get_bbox = function(sel, absolute) {
        var bbox = sel.getBBox();
        if (absolute) {
            var p = this.svg[0].createSVGPoint();
            p.x = bbox.x; p.y = bbox.y;
            p = p.matrixTransform(get_ctm(sel, absolute));
            bbox.x = p.x; bbox.y = p.y;
        }
        return bbox;
    };

    var get_ctm = function(sel, absolute) {
        return sel.getTransformToElement(absolute ? absolute : sel.parentNode);
    };

    var sd = this;

    this.drawer = function(svgplace, stateplace, timeplace) {
        this.svgplace = svgplace;
        this.stateplace = stateplace;
        this.timeplace = timeplace;
        this.svg = $t.svg.svg('svg', { version: '1.1', id: 'svg_canvas' }, svgplace);
        this.defs = $t.svg.svg('defs', {}, this.svg);

        $t.svg.svg('polyline', { points: "0,0 30,15 0,30 5,15 0,0", class: 'sd-path-arrow' }, 
            $t.svg.svg('marker', { id: 'sd_path_arrow', orient: 'auto', markerUnits: 
                    'userSpaceOnUse', markerWidth: 30, markerHeight: 30, refX: 30, refY: 15 }, this.defs));

        $t.svg.svg('feGaussianBlur', { 'in': "SourceGraphic", 'stdDeviation': 3 }, 
            $t.svg.svg('filter', { 'id': 'sd_unload_blur' }, this.defs));

        var cellsize = this.cellsize = 100;
        var scale = 0.4;
        var width, height;
        var scroll = { x: 0, y: 0 };
        var mouse = undefined;
        var svg = this.svg;
        
        var layers = this.layers = $t.svg.svg('g', {}, svg);
        layers.transform.baseVal.appendItem(this.svg.createSVGTransform());
        layers.transform.baseVal.appendItem(this.svg.createSVGTransform());

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight - $t.id('ui').clientHeight;
            $t.set(svg, { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height });
        }
        $t.bind(window, 'resize', function() { resize(); });
        resize();

        function rescale() {
            layers.transform.baseVal.getItem(0).setScale(scale, scale);
            layers.transform.baseVal.getItem(1).setTranslate(scroll.x, scroll.y);
        }

        this.look_all = function() {
            var bbox = get_bbox(layers);
            scale = Math.min(width / bbox.width, height / bbox.height) * 0.9;
            var w = bbox.width * scale;
            var h = bbox.height * scale;
            scroll.x = (width - w) / 2 / scale + 40;
            scroll.y = (height - h) / 2 / scale + 40;
            rescale();
        };

        var m2w = this.m2w = function(mouse) {
            return { i: (mouse.x / scale - scroll.x) / cellsize,
                    j: ((mouse.y - svgplace.offsetTop) / scale - scroll.y) / cellsize };
        };
        var w2m = this.w2m = function(wcoord) {
            return { x: (cellsize * wcoord.i + scroll.x) * scale,
                    y: (cellsize * wcoord.j + scroll.y) * scale + svgplace.offsetTop };
        };
        this.m2c = function(mouse) {
            var w = m2w(mouse);
            return { i: Math.floor(w.i), j: Math.floor(w.j) };
        }

        function zoom_to_mouse(mouse, multiplier) {
            var cur_pos = m2w(mouse);
            scale *= multiplier;
            var new_scroll = w2m(cur_pos);
            scroll.x -= (new_scroll.x - mouse.x) / scale;
            scroll.y -= (new_scroll.y - mouse.y) / scale;
        }

        $t.bind(svg, 'wheel', function(ev) {
            zoom_to_mouse($t.get_mouse_coords(ev), ev.deltaY > 0 ? 0.9 : 1.1);
            sd.gui_tooltip_remove();
            rescale();
            ev.stopPropagation();
            ev.preventDefault();
            return true;
        });
        $t.bind(svg, 'mousedown', function(ev) {
            mouse = $t.get_mouse_coords(ev);
            scroll.mx = scroll.x;
            scroll.my = scroll.y;
        });
        $t.bind(svg, 'mouseup', function(ev) {
            mouse = undefined;
            delete svg.style.cursor;
        });
        $t.bind(svg, 'mousemove', function(ev) {
            if (mouse) {
                svg.style.cursor = 'default';
                var new_mouse = $t.get_mouse_coords(ev);
                scroll.x = (new_mouse.x - mouse.x) / scale + scroll.mx;
                scroll.y = (new_mouse.y - mouse.y) / scale + scroll.my;
                rescale();
            }
        });

        this.clear = function() {
            $t.empty(layers);
            $t.empty(stateplace);
            this.grid_layer = undefined;
        }

        this.redraw_grid = function(store) {
            if (this.grid_layer) $t.empty(this.grid_layer);
            else this.grid_layer = $t.svg.svg('g', {}, layers);
            var grid_layer = this.grid_layer;
            var drawer = this;

            for (var i = 0; i < store.width; ++i) {
                $t.svg.svg('text', { class: 'sd-grid-text', x: (i + 0.5) * cellsize, y: -40 },
                        grid_layer).innerHTML = i + 1;
                $t.svg.svg('text', { class: 'sd-grid-text', x: (i + 0.5) * cellsize, y: store.height * cellsize + 40 },
                        grid_layer).innerHTML = i + 1;
            }
            for (var j = 0; j < store.height; ++j) {
                $t.svg.svg('text', { class: 'sd-grid-text', x: -40, y: (store.height - j - 0.5) * cellsize },
                        grid_layer).innerHTML = j + 1;
                $t.svg.svg('text', { class: 'sd-grid-text', x: store.width * cellsize + 40,
                        y: (store.height - j - 0.5) * cellsize }, grid_layer).innerHTML = j + 1;
            }

            store.for_each_cell(function(i, j) {
                if (sd.IMG[this.type]) {
                    var descr = { i: i, j: j, r: this.r };
                    grid_layer.appendChild(drawer.prepare_object(descr, sd.IMG[this.type]));
                    drawer.update_object(descr);
                }
                function is_void_cell(cell) {
                    return cell.type == sd.CELL.VOID || cell.type == sd.CELL.OPERATOR;
                }

                if (!is_void_cell(this)) {
                    var rect = $t.svg.svg('rect', {
                        x: cellsize * i, y: cellsize * j, width: cellsize, height: cellsize,
                        class: 'sd-floor-cell-normal'
                    }, grid_layer);
                    this.rect = rect;
                    function check_walls(di, dj, xi, xj) {
                        if (is_void_cell(store.cell({ i: i + di, j: j + dj }))) {
                            var x1 = cellsize * (i + (di == 1 ? 1 : 0));
                            var y1 = cellsize * (j + (dj == 1 ? 1 : 0));
                            $t.svg.svg('line', {
                                x1: x1, y1: y1, 
                                x2: x1 + Math.abs(dj) * cellsize, 
                                y2: y1 + Math.abs(di) * cellsize,
                                class: 'sd-floor-wall'
                            }, grid_layer);
                        }
                    }
                    check_walls(-1, 0);
                    check_walls(1, 0);
                    check_walls(0, 1);
                    check_walls(0, -1);
                }
            });
        }

        this.draw = function(store) {
            this.redraw_grid(store);

            var droid_layer = this.droid_layer = $t.svg.svg('g', {}, layers);
            for (var r in store.droids) {
                var droid = store.droids[r];
                droid_layer.appendChild(this.prepare_droid(droid, 'droid'));
                this.update_droid(droid);
                sd.update_droid_state(store, this, droid);
            }

            var rack_layer = this.rack_layer = $t.svg.svg('g', {}, layers);
            for (var r = 0; r < store.racks.length; ++r) {
                var rack = store.racks[r];
                rack_layer.appendChild(this.prepare_rack(rack, 'rack', r));
                this.update_rack(rack);
            }

            this.info_layer = $t.svg.svg('g', {}, layers);
            this.bound_rect = $t.svg.svg('rect', { x: 0, y: 0, width: cellsize * store.width, 
                    height: cellsize * store.height, style: 'opacity: 0.001' }, layers);

            this.look_all();
        };

        this.draw_path = function(droid, move_path) {
            var cs = this.cellsize;
            function cp(c) { return ' ' + (c.i + 0.5) * cs + ' ' + (c.j + 0.5) * cs; }
            var d = '';
            for (var i in move_path) {
                d += 'L' + cp(move_path[i]);
            }
            return $t.svg.svg('path', { d: 'M' + cp(droid) + ' ' + d, class: 'sd-path', style: 'opacity: 1.0' }, this.info_layer);
        };

        this.show_paths = function(droid) {
            var move_path = [];
            for (var i = 0; i < droid.path.length; ++i) {
                if (droid.path[i].t == 'move' && !droid.path[i].path_added) {
                    move_path.push(droid.path[i]);
                    droid.path[i].path_added = true;
                }
                else break;
            }
            if (move_path.length)
                this.move_paths.push(this.draw_path(droid, move_path));
        };

        var update_droid_state_last_time = 0;
        function update_all_droid_state(store, drawer) {
            var notext = true;
            if ((new Date()).getTime() - update_droid_state_last_time > 100) {
                update_droid_state_last_time = (new Date()).getTime();
                notext = false;
            }
            for (var i in store.droids)
                sd.update_droid_state(store, drawer, store.droids[i], notext);
        }

        this.__animate = function(ics) {
            if (!this.norender) {
                var store = ics.store;
                var render_time = (new Date()).getTime();
                var delta = (render_time - this.last_time) / 1000 * ics.timescale;
                this.last_time = render_time;
                for (var i in store.droids) {
                    var droid = store.droids[i];
                    this.update_droid(droid);
                    if (ics.timescale) this.show_paths(droid);
                }
                if (ics.timescale) update_all_droid_state(store, this);
                for (var i = 0; i < this.move_paths.length; ++i) {
                    var el = this.move_paths[i];
                    el.style.opacity -= delta / 2;
                    if (el.style.opacity <= 0) {
                        this.move_paths.splice(i--, 1);
                        this.info_layer.removeChild(el);
                    }
                }
                if (ics.timescale != 0 && ics.last_info_update_time < render_time - 1000 / ics.timescale) {
                    ics.last_info_update_time = render_time;
                    sd.update_info(this, ics);
                }
                for (var r in store.racks) this.update_rack(store.racks[r]);
            }
            if (!this.stopped) {
                (function(t, ics) {
                    requestAnimationFrame(function() { t.__animate(ics); });
                })(this, ics);
            }
        };

        this.animate = function(ics) {
            this.last_time = (new Date()).getTime();
            this.move_paths = [];
            sd.update_info(this, ics);
            this.__animate(ics);
        };
    };

    this.drawer.prototype.update_object = function(descr) {
        if (descr.nochange) return;
        var x = descr.i * this.cellsize, y = descr.j * this.cellsize;
        descr.g.transform.baseVal.getItem(0).setTranslate(x, y);
        if (descr.r) descr.el.transform.baseVal.getItem(0).setRotate(descr.r, this.cellsize / 2, this.cellsize / 2);
        descr.nochange = true;
    }

    this.drawer.prototype.update_rack = function(descr) {
        if (descr.nochange) return;
        var x = descr.i * this.cellsize, y = descr.j * this.cellsize;
        if (descr.r == undefined) descr.r = 0;
        if (!this.onlyimages) {
            descr.un.style.opacity = descr.unloaded ? 100 : 0;
        }
        descr.el.transform.baseVal.getItem(0).setRotate(descr.r, this.cellsize / 2, this.cellsize / 2);
        descr.g.transform.baseVal.getItem(0).setTranslate(x, y);
        descr.nochange = true;
    }

    this.drawer.prototype.update_droid = function(descr) {
        if (descr.nochange) return;
        var x = descr.i * this.cellsize, y = descr.j * this.cellsize;
        if (descr.r == undefined) descr.r = 0;
        descr.el.transform.baseVal.getItem(0).setRotate(descr.r, this.cellsize / 2, this.cellsize / 2);
        descr.g.transform.baseVal.getItem(0).setTranslate(x, y);
        if (!this.onlyimages) {
            descr.gr.style.opacity = descr.grabbed;
            var color = 'lightgreen';
            if (descr.charge < 0.5) color = 'orange';
            if (descr.charge < 0.2) color = 'red';
            descr.chl.style.fill = color;
            $t.set(descr.chl, { width: this.cellsize / 2 * 1.1 * descr.charge });
        }
        descr.nochange = true;
    }

    this.drawer.prototype.prepare_object = function(o, name) {
        o.g = $t.svg.svg('g', {});
        o.el = $t.svg.svg('g', {}, o.g);
        $t.svg.svg('use', { href: '#' + name }, o.el);
        o.el.transform.baseVal.appendItem(this.svg.createSVGTransform());
        o.g.transform.baseVal.appendItem(this.svg.createSVGTransform());
        return o.g;
    }

    this.drawer.prototype.prepare_rack = function(o, name, no) {
        o.nochange = false;
        o.no = no;
        o.unloaded = 0;
        o.count = 100;
        o.g = $t.svg.svg('g', {});
        o.el = $t.svg.svg('g', {}, o.g);
        $t.svg.svg('use', { href: '#' + name }, o.el);
        $t.svg.svg('text', { class: 'sd-object-text', 'text-anchor': 'start', 'alignment-baseline': 'middle',
                x: this.cellsize * 0.7 / 2, y: this.cellsize * 1.2 / 2 }, o.g).innerHTML = o.text;
        if (!this.onlyimages) {
            $t.svg.svg('text', { class: 'sd-object-no', 'text-anchor': 'start', 'alignment-baseline': 'middle',
                    x: this.cellsize * 0.7 / 2, y: this.cellsize * 0.8 / 2 }, o.g).innerHTML = (o.no + 1);
            o.un = $t.svg.svg('circle', { class: 'sd-object-unload', r: this.cellsize / 8,
                    cx: this.cellsize / 2, cy: this.cellsize * 0.2 }, o.el);
        }
        o.el.transform.baseVal.appendItem(this.svg.createSVGTransform());
        o.g.transform.baseVal.appendItem(this.svg.createSVGTransform());
        return o.g;
    };

    this.drawer.prototype.prepare_droid = function(o, name) {
        o.nochange = false;
        o.grabbed = 0;
        o.charge = o.charge || 1;
        o.state = sd.STATE.READY;
        o.passed = 0;
        o.traffic_jam_time = 0;
        o.operator_queue_time = 0;
        o.charge_queue_time = 0;
        o.collisions = 0;
        o.waitpoint = { i: o.i, j: o.j, r: o.r ? o.r : 0 };
        o.g = $t.svg.svg('g', {});
        if (!this.onlyimages) {
            o.bound = $t.svg.svg('rect', { class: 'sd-object-select',
                    width: this.cellsize, height: this.cellsize, x: 0, y: 0 }, o.g);
            o.bound.style.visibility = 'hidden';
        }
        o.el = $t.svg.svg('g', {}, o.g);
        $t.svg.svg('use', { href: '#' + name }, o.el);
        if (!this.onlyimages) {
            $t.svg.svg('text', { class: 'sd-object-number', 'text-anchor': 'end', 'alignment-baseline': 'middle',
                    x: this.cellsize * 1.3 / 2, y: this.cellsize * 1.2 / 2 }, o.g).innerHTML = o.number;
            o.gr = $t.svg.svg('rect', { class: 'sd-object-grab', width: this.cellsize / 2 * 1.1,
                    height: this.cellsize / 2 * 1.1,
                    x: this.cellsize / 2 * 0.45, y: this.cellsize / 2 * 0.45 }, o.el);
            o.chl = $t.svg.svg('rect', { class: 'sd-object-charge-level', width: this.cellsize / 2 * 1.1,
                    height: this.cellsize * 0.05, x: this.cellsize / 2 * 0.45, y: this.cellsize * 0.9 }, o.g);
            o.ch = $t.svg.svg('rect', { class: 'sd-object-charge-bar', width: this.cellsize / 2 * 1.1,
                    height: this.cellsize * 0.05, x: this.cellsize / 2 * 0.45, y: this.cellsize * 0.9 }, o.g);
        }
        o.el.transform.baseVal.appendItem(this.svg.createSVGTransform());
        o.g.transform.baseVal.appendItem(this.svg.createSVGTransform());
        return o.g;
    };

    this.drawer.prototype.load_svg = function(name) {
        var deferred = $t.deferred();
        var ajax = new XMLHttpRequest();
        ajax.open("get", name + '.svg', true);
        var defs = this.defs;
        ajax.onreadystatechange = function() {
            if (ajax.readyState == 4) {
                var p = $t.svg.svg('g', { id: name }, defs);
                p.innerHTML = ajax.responseText;
                deferred.resolve();
            }
        };
        ajax.send();
        return deferred.promise();
    };

    this.drawer.prototype.load_svgs = function(list) {
        var promises = [];
        var drawer = this;
        for (var i in sd.IMG)
            if (sd.IMG[i])
                (function(i) { promises.push(drawer.load_svg(sd.IMG[i])); })(i);
        return $t.when(promises);
    };

}).apply(teal.storedroids = teal.storedroids || {});

teal.storedroids_initialize = function() {
    $t.remove($t.id('hider'));
    $t.id('ui').style.display = 'block';
    requestAnimationFrame(function() { main_preparation(); });
}

//var store_string = "23!15!h!23Pi25-A9AU-A10BU3-A5Ai~4Ai-A6Bi~4Bi-A-H22-A-E-G3-A6CU-A10EU-A2-B-H2-A2Di~4Di-A6Fi~4Fi-A-B-C-D-G19-A2-B-F2-A6GU-A10IU-A-E-G3-A6Hi-A10Ji-A-F24-A5KU~4KU-A6MU~4MU3-A9Li-A10Ni24-A23OU";

var store_string = "24!26!v!-A22A_2-A-HBi23-A-F-JBi-ADs~9Ds-A10Es~2-A-EBi-A10D_~-A10E_2-A-EBi23-A-F-JBi-A10Fs-A10Gs2-A-HBi-A10F_-A10G_2-A-BBi24-A-BBi-A10Hs-A10Is-I-G-BBi-AH_~9H_-A10I_-I-G-BBi23-A-G-BBi-A10Js-A10Ks-F-D-CBi-A10J_-A10K_-F-D-CBi23-A-I-BBi-ALs~9Ls-AN_9Ms-G-I-BBi-A10L_-A10M_-G-I-BBi24-A-BBi-A10Ns-A10Os2-A-BBi-A10N_-A10O_2-A-HBi23-A-F-JBi-A10Ps~-A10Rs2-A-EBi-AP_~9P_-A10R_~2-A-EBi23-A-F-J-A22Cs2-A-H";

function main_preparation() {
    var sd = $t.storedroids;
    var store, ics, editor;

    var params = $t.get_url_params();
    if (params['s'] && params['s'].length > 5) store_string = params.s;

    var drawer = sd.dr = new sd.drawer($t.id('svgplace'), $t.id('stateplace'), $t.id('timeplace'));
    drawer.load_svgs().done(function() {
        $t.raise_event($t.id('brun'), 'click');
    });

    function store_mousedown(ev) { sd.gui_store_mousedown(ev); }
    function store_mouseup(ev) { sd.gui_store_mouseup(store, drawer, ev); }
    function store_mousemove(ev) { sd.gui_store_mousemove(ics, drawer, ev); }

    var last_mode = 'run';
    sd.gui_button_group($t.id('modes'));
    $t.bind($t.id('brun'), ['click'], function() {
        if (last_mode != 'run') {
            store.update_map();
            store_string = sd.save_to_string(store);
        }
        last_mode = 'run';
        store = new sd.store();
        sd.load_from_string(store, store_string);
        if (ics) ics.stopped = true;
        if (editor) editor.clear();
        drawer.stopped = true;
        setTimeout(function() {
            drawer.stopped = false;
            ics = new sd.ics(store);
            drawer.clear();
            drawer.onlyimages = false;
            drawer.draw(store);
            drawer.bound_rect.style.visibility = 'hidden';
            $t.bind(drawer.svg, "mousedown", store_mousedown);
            $t.bind(drawer.svg, "mouseup", store_mouseup);
            $t.bind(drawer.svg, "mousemove", store_mousemove);
            store.prepare_map();
            drawer.animate(ics);
            ics.animate();
            ics.working = true;
            $t.raise_event($t.id('bpause'), 'click');
            $t.id('edit').style.display = 'none';
            $t.id('editpanels').style.display = 'none';
            $t.id('play').style.display = 'inline-block';
            $t.id('playpanels').style.display = 'block';
            window.store = store;
        }, 100);
    });
    $t.bind($t.id('bedit'), ['click'], function() {
        last_mode = 'edit';
        store = new sd.store();
        sd.load_from_string(store, store_string);
        if (ics) ics.stopped = true;
        if (editor) editor.clear();
        drawer.stopped = true;
        setTimeout(function() {
            ics = new sd.ics(store);
            editor = new sd.editor(store, drawer, editplace);
            drawer.clear();
            drawer.onlyimages = true;
            drawer.draw(store);
            drawer.bound_rect.style.visibility = 'visible';
            $t.unbind(drawer.svg, "mousedown", store_mousedown);
            $t.unbind(drawer.svg, "mouseup", store_mouseup);
            $t.unbind(drawer.svg, "mousemove", store_mousemove);
            store.prepare_map();
            $t.raise_event($t.id('bestore'), 'click');
            $t.id('edit').style.display = 'inline-block';
            $t.id('editpanels').style.display = 'block';
            $t.id('play').style.display = 'none';
            $t.id('playpanels').style.display = 'none';
            $t.id('errorpanels').style.display = 'none';
        }, 100);
    });

    sd.gui_button_group($t.id('playback'));
    $t.bind($t.id('bpause'), ['click'], function() {
        ics.timescale = 0;
    });
    $t.bind($t.id('bplay1'), ['click'], function() {
        ics.store.collision = false;
        ics.timescale = 1;
    });
    $t.bind($t.id('bplay4'), ['click'], function() {
        ics.store.collision = false;
        ics.timescale = 4;
    });
    $t.bind($t.id('bplay16'), ['click'], function() {
        ics.store.collision = false;
        ics.timescale = 16;
    });
    $t.bind($t.id('bautowork'), 'click', function() {
        ics.store.collision = false;
        sd.dialog_emulate(ics, drawer);
    });
    $t.bind($t.id('bautoworkhour'), 'click', function() {
        ics.store.collision = false;
        sd.dialog_emulate_hour(ics, drawer);
    });

    sd.gui_button_group($t.id('editback'));
    $t.bind($t.id('bestore'), ['click'], function() {
        editor.show_panel_store(editplace, drawer);
    });
    $t.bind($t.id('bedirections'), ['click'], function() {
        editor.show_panel_directions(editplace, drawer);
    });
    $t.bind($t.id('beracks'), ['click'], function() {
        editor.show_panel_racks(editplace, drawer);
    });
    $t.bind($t.id('bedroids'), ['click'], function() {
        editor.show_panel_droids(editplace, drawer);
    });

    $t.bind($t.id('bsave'), ['click'], function() {
        sd.dialog_save(store);
    });
    $t.bind($t.id('bnew'), ['click'], function() {
        sd.dialog_new(ics, drawer);
    });
    $t.bind($t.id('bdroid_character'), ['click'], function() {
        sd.dialog_droid_params();
    });
    $t.bind($t.id('bcollog'), ['click'], function() {
        sd.dialog_collisions();
    });
}
