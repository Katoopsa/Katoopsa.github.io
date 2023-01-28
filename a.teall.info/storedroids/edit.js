"use strict";
(function(storedroids) {
    var sd = this;

    this.editor = function(store, drawer, editplace) {
        this.edit_selected_tool = undefined;
        this.drawer = drawer;
        this.editplace = editplace;
        var editor = this;

        var mouse = false, mouse_move = false;
        function editor_mousedown(ev) {
            mouse = $t.get_mouse_coords(ev);
            mouse_move = false;
        }
        function editor_mousemove(ev) {
            if (mouse) {
                var new_mouse = $t.get_mouse_coords(ev);
                mouse_move = Math.abs(new_mouse.x - mouse.x) > 3 ||
                        Math.abs(new_mouse.y - mouse.y) > 3;
            }
        }
        function editor_mouseup(ev) {
            mouse = false;
            if (mouse_move) return;
            var c = drawer.m2c($t.get_mouse_coords(ev));
            if (c.i < 0 || c.j < 0 || c.i >= store.width || c.j >= store.height) return;
            if (editor.edit_selected_tool != undefined)
                editor.edit_selected_tool(store, drawer, c);
        }

        this.bind_mouse = function() {
            $t.bind(drawer.svg, "mousedown", editor_mousedown);
            $t.bind(drawer.svg, "mousemove", editor_mousemove);
            $t.bind(drawer.svg, "mouseup", editor_mouseup);
        }
        this.unbind_mouse = function() {
            $t.unbind(drawer.svg, "mousedown", editor_mousedown);
            $t.unbind(drawer.svg, "mousemove", editor_mousemove);
            $t.unbind(drawer.svg, "mouseup", editor_mouseup);
        }
    }

    this.editor.prototype.clear = function() {
        this.unbind_mouse();
        this.edit_selected_tool = undefined;
        this.drawer.bound_rect.style.cursor = 'default';
    }

    function create_panel_button(editor, names, r, text, tool) {
        var editplace = editor.editplace, drawer = editor.drawer;
        var sp = {};
        sp.div = $t.element('div', { class: 'sd-info-panel-button-place' }, editplace);
        sp.svg = $t.svg.svg('svg', { version: '1.1', viewBox: '0 0 100 100', width: 40, height: 40 }, sp.div);
        sp.text = $t.element('span', { class: 'sd-info-panel-button-text' }, sp.div);
        sp.text.innerHTML = text;
        for (var i in names) {
            var pen = { i: 0, j: 0, r: r };
            sp.svg.appendChild(drawer.prepare_object(pen, names[i]));
            drawer.update_object(pen);
        }
        $t.bind(sp.div, ['click'], function() {
            for (var i  = 0; i < editplace.childNodes.length; ++i) {
                $t.clas(editplace.childNodes[i], 'sd-info-panel-selected');
            }
            $t.clas(sp.div, null, 'sd-info-panel-selected');
            editor.edit_selected_tool = tool;
            drawer.bound_rect.style.cursor = 'pointer';
            editor.bind_mouse();
        });
    }

    function delete_rack_at(store, drawer, c) {
        var rackindex = store.get_rack_index(c);
        if (rackindex != undefined) {
            var rack = store.racks[rackindex];
            drawer.rack_layer.removeChild(rack.g);
            store.racks.splice(rackindex, 1);
        }
    }
    function delete_droid_at(store, drawer, c) {
        var droidindex = store.get_droid_index(c);
        if (droidindex != undefined) {
            var droid = store.droids[droidindex];
            drawer.droid_layer.removeChild(droid.g);
            store.droids.splice(droidindex, 1);
        }
    }

    this.editor.prototype.show_panel_store = function() {
        $t.empty(this.editplace);
        this.clear();
        create_panel_button(this, ['delete'], 0, 'Отсутствующая<br/>ячейка', function(store, drawer, c) {
            var cell = store.cell(c);
            cell.r = 0;
            cell.type = sd.CELL.VOID;
            delete_rack_at(store, drawer, c);
            delete_droid_at(store, drawer, c);
            drawer.redraw_grid(store);
        });
        create_panel_button(this, ['floor'], 0, 'Свободная<br/>ячейка', function(store, drawer, c) {
            var cell = store.cell(c);
            cell.r = 0;
            cell.type = sd.CELL.NORMAL;
            drawer.redraw_grid(store);
        });
        create_panel_button(this, ['operator_point'], 0, 'Ячейка<br/>оператора', function(store, drawer, c) {
            var cell = store.cell(c);
            cell.r = 0;
            cell.type = sd.CELL.OPERATOR;
            delete_rack_at(store, drawer, c);
            delete_droid_at(store, drawer, c);
            drawer.redraw_grid(store);
        });
        create_panel_button(this, ['pack_point'], 0, 'Ячейка<br/>выборки<br/>заказа', function(store, drawer, c) {
            var cell = store.cell(c);
            cell.r = 0;
            cell.type = sd.CELL.PACK;
            delete_rack_at(store, drawer, c);
            delete_droid_at(store, drawer, c);
            drawer.redraw_grid(store);
        });
        create_panel_button(this, ['charge_point'], 0, 'Ячейка<br/>зарядки', function(store, drawer, c) {
            var cell = store.cell(c);
            cell.r = 0;
            cell.type = sd.CELL.CHARGE;
            delete_rack_at(store, drawer, c);
            delete_droid_at(store, drawer, c);
            drawer.redraw_grid(store);
        });
        create_panel_button(this, ['charge_approach'], 0, 'Ячейка<br/>подъезда<br/>к зарядке', function(store, drawer, c) {
            var cell = store.cell(c);
            cell.r = 0;
            cell.type = sd.CELL.APPROACH;
            delete_rack_at(store, drawer, c);
            delete_droid_at(store, drawer, c);
            drawer.redraw_grid(store);
        });
    }

    this.editor.prototype.show_panel_directions = function(editplace, drawer) {
        $t.empty(this.editplace);
        this.clear();
        create_panel_button(this, ['direction', 'delete'], 0, 'Удалить<br/>приоритет', function(store, drawer, c) {
            var cell = store.cell(c);
            if (cell.type == sd.CELL.DIRECTION) {
                cell.r = 0;
                cell.type = sd.CELL.NORMAL;
                drawer.redraw_grid(store);
            }
        });
        function create_direction(store, drawer, c, r) {
            var cell = store.cell(c);
            cell.r = r;
            cell.type = sd.CELL.DIRECTION;
            delete_rack_at(store, drawer, c);
            delete_droid_at(store, drawer, c);
            drawer.redraw_grid(store);
        }
        create_panel_button(this, ['direction'], 0, 'Въезд<br/>только с юга', function(store, drawer, c) {
            create_direction(store, drawer, c, 0);
        });
        create_panel_button(this, ['direction'], 90, 'Въезд<br/>только с запада', function(store, drawer, c) {
            create_direction(store, drawer, c, 90);
        });
        create_panel_button(this, ['direction'], 180, 'Въезд<br/>только с севера', function(store, drawer, c) {
            create_direction(store, drawer, c, 180);
        });
        create_panel_button(this, ['direction'], 270, 'Въезд<br/>только с востока', function(store, drawer, c) {
            create_direction(store, drawer, c, 270);
        });
    }

    this.editor.prototype.show_panel_racks = function(editplace, drawer) {
        $t.empty(this.editplace);
        this.clear();
        create_panel_button(this, ['rack', 'delete'], 0, 'Удалить<br/>стеллаж', function(store, drawer, c) {
            delete_rack_at(store, drawer, c);
            delete_droid_at(store, drawer, c);
        });
        function create_rack(store, drawer, c, r) {
            var cell = store.cell(c);
            if (cell.type == sd.CELL.NORMAL) {
                delete_rack_at(store, drawer, c);
                var obj = { i: c.i, j: c.j, r: r, text: text.value[0] || 'A' }
                store.racks.push(obj);
                drawer.rack_layer.appendChild(drawer.prepare_rack(obj, 'rack', 1));
                drawer.update_rack(obj);
            }
        }
        create_panel_button(this, ['rack'], 0, 'Стеллаж,<br/>повернут на север', function(store, drawer, c) {
            create_rack(store, drawer, c, 0);
        });
        create_panel_button(this, ['rack'], 90, 'Стеллаж,<br/>повернут на восток', function(store, drawer, c) {
            create_rack(store, drawer, c, 90);
        });
        create_panel_button(this, ['rack'], 180, 'Стеллаж,<br/>повернут на юг', function(store, drawer, c) {
            create_rack(store, drawer, c, 180);
        });
        create_panel_button(this, ['rack'], 270, 'Стеллаж,<br/>повернут на запад', function(store, drawer, c) {
            create_rack(store, drawer, c, 270);
        });
        var div = $t.element('div', { class: 'sd-info-panel-button-place', style: 'font-size: 150%' }, editplace);
        $t.inner('Товар:', $t.element('span', { style: 'margin-right: 10px; cursor: default' }, div));
        var text = $t.element('input', { class: 'small-input' }, div);
        text.value = "A";
    }

    this.editor.prototype.show_panel_droids = function(editplace, drawer) {
        $t.empty(this.editplace);
        this.clear();
        create_panel_button(this, ['droid', 'delete'], 0, 'Удалить<br/>робота', function(store, drawer, c) {
            delete_droid_at(store, drawer, c);
        });
        create_panel_button(this, ['droid'], 0, 
                'Складской робот <i>(размещается<br/> только под стеллажом)</i>', function(store, drawer, c) {
            var rackindex = store.get_rack_index(c);
            if (rackindex != undefined) {
                var rack = store.racks[rackindex];
                var obj = { i: c.i, j: c.j, r: rack.r, number: 1, path: [] };
                store.droids.push(obj);
                drawer.droid_layer.appendChild(drawer.prepare_droid(obj, 'droid'));
                drawer.update_droid(obj);
            }
        });
        $t.bind($t.inner('Свойства', $t.element('button', { class: 'small-text-button',
                        style: 'font-size: 150%' }, editplace)), ['click'], function() {
            sd.dialog_droid_params();
        });
    }

}).apply(teal.storedroids = teal.storedroids || {});
