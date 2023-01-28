"use strict";
(function(storedroids) {
    var sd = this;

    function calc_average(time, count) {
        var d = new Date(null);
        var average_time_string = '-';
        if (count > 0 && time != undefined) {
            var seconds = Math.round(time / count);
            d.setSeconds(seconds);
            if (seconds < 60 * 60) 
                average_time_string = d.toISOString().substr(14, 5);
            else
                average_time_string = d.toISOString().substr(11, 8);
        }
        return average_time_string;
    }

    function get_current_time_string(time) {
        var d = new Date(null);
        var days = Math.floor(time / (60 * 60 * 24));
        d.setSeconds(time);
        return days + '/' + d.toISOString().substr(11, 8);
    }

    this.update_info = function(drawer, ics) {
        var total_passed = 0;
        var total_traffic_jam_time = 0;
        var total_operator_queue_time = 0;
        var total_charge_queue_time = 0;
        var total_collisions = 0;
        for (var i in ics.store.droids) {
            var droid = ics.store.droids[i];
            total_passed += droid.passed;
            total_traffic_jam_time += droid.traffic_jam_time;
            total_operator_queue_time += droid.operator_queue_time;
            total_charge_queue_time += droid.charge_queue_time;
            total_collisions += droid.collisions;
        }
        var dl = ics.store.droids.length;
        if (dl == 0) dl = 1;
        var hour_scale = ics.current_time ? 60 * 60 / ics.current_time : 0;
        var carge_loss = ics.charge_carry_loss + ics.charge_empty_loss / 1000;
        $t.empty(drawer.timeplace);
        $t.inner(sd.gui_make_table({
            'Модельное время работы': get_current_time_string(ics.current_time),
            'Обработано заказов': ics.order_count,
            'Среднее количество<br/> заказов в час': Math.round(ics.order_count * hour_scale),
            'Среднее время на заказ': calc_average(ics.order_time, ics.order_count),
            'Минимальное время на заказ': calc_average(ics.min_order_time, 1),
            'Максимальное время на заказ': calc_average(ics.max_order_time, 1),
            'Простой операторов<br/> за период': calc_average(ics.current_time - ics.load_time, 1) +
                    ' (' + Math.round((ics.current_time - ics.load_time) / (ics.current_time + 0.0001) * 100) + '%)',
            'Остановок на перезарядку': ics.charge_count,
            'Среднее время на перезарядку': calc_average(ics.charge_time, ics.charge_count),
            'Средний пробег за период': Math.round(total_passed / dl) + ' м',
            'Средний пробег за 8 часов': Math.round(total_passed / dl * 8 * hour_scale) + ' м',
            'Среднее время в пробках<br/> за период': calc_average(total_traffic_jam_time, dl) + 
                    ' (' + Math.round(total_traffic_jam_time / dl / (ics.current_time + 1) * 100) + '%)',
            'Среднее время в очереди<br/> на отгрузку за период': calc_average(total_operator_queue_time, dl) + 
                    ' (' + Math.round(total_operator_queue_time / dl / (ics.current_time + 1) * 100) + '%)',
            'Среднее время в очереди<br/> на перезарядку за период': calc_average(total_charge_queue_time, dl) +
                    ' (' + Math.round(total_charge_queue_time / dl / (ics.current_time + 1) * 100) + '%)',
            'Суммарная потребленная<br/> энергия за период': carge_loss.toFixed(0) + ' Вт·ч',
            'Средняя потребляемая<br/> энергия за 8 часов':
                    (carge_loss * 8 * hour_scale / dl).toFixed(0) + ' Вт·ч',
            'Минимальный достигнутый<br/> заряд батареи': (ics.min_charge * 100).toFixed(0) + '%',
            'Средняя скорость разряда<br/> со стеллажом': 
                (ics.charge_carry_loss / sd.droid_params.max_charge * 100 * hour_scale / dl).toFixed(2) + ' %/ч',
            'Средняя скорость разряда<br/> без стеллажа': 
                (ics.charge_empty_loss / sd.droid_params.max_charge * 100 * hour_scale / dl).toFixed(2) + ' %/ч',
            'Обработано коллизий': total_collisions,
        }), drawer.timeplace);
    };

    function hide_all_wide_droid_state(store, drawer) {
        for (var i = 0; i < drawer.stateplace.childNodes.length; ++i)
            $t.clas(drawer.stateplace.childNodes[i], 'sd-info-droid-place-wide');
        for (var i = 0; i < store.droids.length; ++i) {
            sd.update_droid_state(store, drawer, store.droids[i]);
            store.droids[i].bound.style.visibility = "hidden";
        }
    }

    this.update_droid_state = function(store, drawer, droid, notext) {
        var sp = droid.stateplace;
        if (!sp) {
            sp = droid.stateplace = {};
            sp.div = $t.element('div', { class: 'sd-info-droid-place noselect' }, drawer.stateplace);
            sp.svg = $t.svg.svg('svg', { version: '1.1', viewBox: '0 0 100 100', width: 54, height: 54 }, sp.div);
            sp.droid = { number: droid.number, i: 0, j: 0 };
            sp.svg.appendChild(drawer.prepare_droid(sp.droid, 'droid'));
            sp.text = $t.element('span', { class: 'sd-info-droid-text' }, sp.div);
            $t.bind(sp.div, 'click', function() {
                var w = sp.div.classList.contains('sd-info-droid-place-wide');
                hide_all_wide_droid_state(store, drawer);
                if (!w) {
                    $t.clas(sp.div, null, 'sd-info-droid-place-wide');
                    sd.update_droid_state(store, drawer, droid);
                    droid.bound.style.visibility = "visible";
                }
            });
        }
        var rack = droid.laden;
        if (rack) {
            if (!sp.rack) {
                sp.rack = { text: rack.text, i: 0, j: 0 };
                sp.svg.appendChild(drawer.prepare_rack(sp.rack, 'rack', rack.no));
            }
            sp.rack.unloaded = rack.unloaded;
            sp.rack.count = rack.count;
            sp.rack.r = droid.rack_r;
            sp.rack.nochange = false;
            drawer.update_rack(sp.rack);
        }
        else {
            if (sp.rack) {
                sp.svg.removeChild(sp.rack.g);
                delete sp.rack;
            }
        }
        sp.droid.charge = droid.charge;
        sp.droid.grabbed = droid.grabbed;
        sp.droid.r = droid.r;
        sp.droid.nochange = false;
        drawer.update_droid(sp.droid);
        if (notext) return;
        var text = "";
        text += ["Свободен", "Направляется", "Перемещает", "Отгружает", "Возвращает",
             "Возвращается<br/>в точку ожидания", "Ожидает", "Заряжается", 
             '<span class="sd-redtext">Не в состоянии<br/>проложить маршрут</span>', 
             '<span class="sd-redtext">Нет энергии</span>'][droid.state];
        if ((droid.state == sd.STATE.MOVING || droid.state == sd.STATE.PATHFAIL) && droid.stateinfo) {
            if (droid.stateinfo.no)
                text += "<br/>к cтеллажу №" + (droid.stateinfo.no + 1);
            if (droid.stateinfo.type == sd.CELL.APPROACH)
                text += "<br/>к точке зарядки";
        }
        if ((droid.state == sd.STATE.DRAGGING || droid.state == sd.STATE.GOINGBACK
                    || droid.state == sd.STATE.OPERATOR) && droid.stateinfo) {
            text += "<br/>cтеллаж №" + (droid.stateinfo.no + 1) + "<br/>";
            text += "Товар: " + droid.stateinfo.text;
            text += ", кол-во: " + droid.stateinfo.count;
        }
        if (sp.div.classList.contains('sd-info-droid-place-wide')) {
            text += "<br/>Скорость: " + 
                (droid.path[0] ? droid.path[0].m ? droid.path[0].m.velocity : 0 : 0).toFixed(2) + " м/с";
            text += "<br/>Заряд: " + (droid.charge * 100).toFixed(0) + "%, " +
                (droid.charge * sd.droid_params.max_charge).toFixed(0)+ " Вт·ч";
            if (droid.charge_loss != undefined && droid.charge_loss_delta > 0)
                text += "<br/>Мгн. мощность: " + (droid.charge_loss / droid.charge_loss_delta * 3600).toFixed(2) + " Вт";
            if (droid.hitch)
                text += "<br/>Пропускает робота №" + droid.hitch.number;
        }
        sp.text.innerHTML = text;
    };

    var all_collisions = [];

    this.update_error_collision = function(store, droid, loop, resolver) {
        var scheme = [];
        for (var i in loop) { scheme.push("№" + loop[i]); }
        var text = get_current_time_string(store.current_time) + ". " +
            "Коллизия движения.<br/> Инициатор: робот №" + droid.number +
            " в координатах " + store.get_readable_coords(droid) +
            ".<br/>Схема взаимных помех: " + scheme.join('→') + ".";
        all_collisions.push(text);
        if (!sd.droid_params.stop_on_collision_flag) { 
            droid.collisions += 1;
            resolver(); 
            return; 
        }
        store.collision = true;
        $t.id('errorpanels').style.display = 'block';
        $t.id('errorplace').innerHTML = text + "<p></p>";
        var bsolve = $t.element('button', {}, $t.id('errorplace'));
        bsolve.innerHTML = "Разрешить коллизию, сделав роботов «прозрачными»";
        $t.bind(bsolve, 'click', function() {
            droid.collisions += 1;
            resolver(); 
            $t.id('errorplace').innerHTML = "";
            $t.id('errorpanels').style.display = 'none';
        });
    }

    this.update_error_discharge = function(store, droid) {
        var text = get_current_time_string(store.current_time) + ") " +
            "Коллизия заряда батареи.<br/> Инициатор: робот №" + droid.number +
            " в координатах " + store.get_readable_coords(droid) + ".";
        all_collisions.push(text);
        if (!sd.droid_params.stop_on_collision_flag) { 
            droid.collisions += 1;
            return; 
        }
        store.collision = true;
        $t.id('errorpanels').style.display = 'block';
        $t.id('errorplace').innerHTML = text + "<p></p>";
        var bsolve = $t.element('button', {}, $t.id('errorplace'));
        bsolve.innerHTML = "Разрешить коллизию, позволив роботу продолжить движение";
        $t.bind(bsolve, 'click', function() {
            droid.collisions += 1;
            $t.id('errorplace').innerHTML = "";
            $t.id('errorpanels').style.display = 'none';
        });
    }

    this.dialog_collisions = function() {
        var d = sd.gui_dialog_buttons("Журнал коллизий", {
            'ОК': function(d) { sd.gui_dialog_remove(d[0]); },
        });
        d[0].style['max-width'] = '500px';
        d[0].style['height'] = '300px';
        d[1].style['overflow'] = 'auto';
        d[1].style['positon'] = 'relative';
        d[1].style['height'] = '220px';
        for (var i = 0; i < all_collisions.length; ++i) {
            $t.element('div', { style: 'padding-bottom: 10px' }, d[1]).innerHTML = (i + 1) + ". " + all_collisions[i];
        }
        if (!all_collisions.length)
            $t.element('div', {}, d[1]).innerHTML = "Коллизий не зафиксировано.";
    };

    this.dialog_save = function(store) {
        var d = sd.gui_dialog_buttons("Склад теперь доступен по ссылке", {
            'ОК': function(d) { sd.gui_dialog_remove(d[0]); },
        });
        d[0].style['max-width'] = '500px';
        store.update_map();
        var s = location.origin + location.pathname + '?s=' + sd.save_to_string(store);
        d[1].innerHTML = '<a href="' + s + '">' + s + '</a>';
    };

    this.dialog_new = function(ics, drawer) {
        var d = sd.gui_dialog_buttons("Создание нового склада", {
            'ОК': function(d) {
                var ii = d[1].getElementsByTagName('input');
                var width = Math.floor(sd.gui_input_to_float(ii[0], 1, 100));
                var height = Math.floor(sd.gui_input_to_float(ii[1], 1, 100));
                ics.store.clear();
                ics.store.apply_geometry(sd.generate_rect_geometry(width, height));
                drawer.clear();
                drawer.draw(ics.store);
                ics.store.prepare_map();
                sd.gui_dialog_remove(d[0]); 
            },
            'Отмена': function(d) { sd.gui_dialog_remove(d[0]); },
        });
        $t.inner(sd.gui_make_table_inputs({ 'Длина, м:': ics.store.width, 'Ширина, м:': ics.store.height }), d[1]);
    }

    this.dialog_droid_params = function() {
        var d = sd.gui_dialog_buttons("Свойства и характеристики робота", {
            'Применить': function(d) {
                var ii = t1.getElementsByTagName('input');
                sd.droid_params.rotate_velocity[0] = sd.gui_input_to_float(ii[0], 1);
                sd.droid_params.rotate_velocity[1] = sd.gui_input_to_float(ii[1], 1);
                sd.droid_params.move_velocity[0] = sd.gui_input_to_float(ii[2], 0.01, 10);
                sd.droid_params.move_velocity[1] = sd.gui_input_to_float(ii[3], 0.01, 10);
                sd.droid_params.move_accel[0] = sd.gui_input_to_float(ii[4], 0.00001);
                sd.droid_params.move_accel[1] = sd.gui_input_to_float(ii[5], 0.00001);
                sd.droid_params.move_accel[2] = -sd.gui_input_to_float(ii[6], 0.00001);
                sd.droid_params.move_accel[3] = -sd.gui_input_to_float(ii[7], 0.00001);
                sd.droid_params.grab_time = sd.gui_input_to_float(ii[8], 0, 1000);
                sd.droid_params.drop_time = sd.gui_input_to_float(ii[9], 0, 1000);
                sd.droid_params.unload_time = sd.gui_input_to_float(ii[10], 0, 1000);
                var ii = t2.getElementsByTagName('input');
                sd.droid_params.mass[0] = sd.gui_input_to_float(ii[0], 2, 500);
                sd.droid_params.mass[1] = sd.gui_input_to_float(ii[1], 10, 1500);
                sd.droid_params.s[0] = sd.gui_input_to_float(ii[2], 0, 10);
                sd.droid_params.s[1] = sd.gui_input_to_float(ii[3], 0, 10);
                sd.droid_params.crr = sd.gui_input_to_float(ii[4], 0, 0.9);
                sd.droid_params.max_charge = sd.gui_input_to_float(ii[5], 1, 100000);
                sd.droid_params.charge_threshold_gold = sd.gui_input_to_float(ii[6], 0, 100) / 100;
                sd.droid_params.charge_threshold_red = sd.gui_input_to_float(ii[7], 0, 100) / 100;
                sd.droid_params.charge_threshold_crit = sd.gui_input_to_float(ii[8], 0, 100) / 100;
                sd.droid_params.const_loss = sd.gui_input_to_float(ii[9], 0, 1000);
                sd.droid_params.charge_velocity = sd.gui_input_to_float(ii[10], 0.01, 100);
                sd.droid_params.efficiency = sd.gui_input_to_float(ii[11], 0.01, 100) / 100;
                var ii = t3.getElementsByTagName('input');
                sd.droid_params.stop_on_collision_flag = ii[0].checked;
                sd.gui_dialog_remove(d[0]); 
            },
            'Отмена': function(d) { sd.gui_dialog_remove(d[0]); },
        });
        var t = $t.element('div', { style: 'display: inline-block' }, d[1]);
        var t1 = $t.element('div', { style: 'display: inline-block' }, t);
        $t.element('div', { style: 'display: inline-block; float: right; width: 30px' }, t);
        var t2 = $t.element('div', { style: 'display: inline-block; float: right' }, t);
        $t.inner(sd.gui_make_table_inputs({
            'Скорость разворота пустого, °/с:': sd.droid_params.rotate_velocity[0],
            'Скорость разворота груженого, °/с:': sd.droid_params.rotate_velocity[1],
            'Максимальная скорость пустого, м/с:': sd.droid_params.move_velocity[0],
            'Максимальная скорость груженого, м/с:': sd.droid_params.move_velocity[1],
            'Ускорение разгона пустого, м/с²:': sd.droid_params.move_accel[0],
            'Ускорение разгона груженого, м/с²:': sd.droid_params.move_accel[1],
            'Ускорение торможения пустого, м/с²:': -sd.droid_params.move_accel[2],
            'Ускорение торможения груженого, м/с²:': -sd.droid_params.move_accel[3],
            'Время подъема стеллажа, с:': sd.droid_params.grab_time,
            'Время опускания стеллажа, с:': sd.droid_params.drop_time,
            'Время отгрузки оператору, с:': sd.droid_params.unload_time,
        }), t1);

        $t.inner(sd.gui_make_table_inputs({
            'Масса пустого, кг:': sd.droid_params.mass[0],
            'Масса груженого, кг:': sd.droid_params.mass[1],
            'Фронтальная площадь пустого, м²:': sd.droid_params.s[0],
            'Фронтальная площадь груженого, м²:': sd.droid_params.s[1],
            'Коэффициент трения качения:': sd.droid_params.crr,
            'Максимальный заряд батареи, Вт·ч:': sd.droid_params.max_charge,
            'Желтый уровень заряда, %:': sd.droid_params.charge_threshold_gold * 100,
            'Красный уровень заряда, %:': sd.droid_params.charge_threshold_red * 100,
            'Минимальный уровень заряда, %:': sd.droid_params.charge_threshold_crit * 100,
            'Потребляемая мощность покоя, Вт:': sd.droid_params.const_loss,
            'Скорость заряда батареи, Вт·ч/с:': sd.droid_params.charge_velocity,
            'КПД силовой системы, %:': sd.droid_params.efficiency * 100,
        }), t2);
        var t3 = $t.element('div', {}, d[1]);
        $t.element('input', { type: 'checkbox' }, t3).checked = sd.droid_params.stop_on_collision_flag;
        $t.inner('Останавливать эмуляцию при коллизии', $t.element('span', {}, t3));
    };

    this.dialog_emulate_hour = function(ics, drawer) {
        var d = sd.gui_dialog();
        d.innerHTML = 'Выполняется эмуляция работы склада периодом 1 час.<br/>' + 
                'Выполнено <span id="percents">0</span>%';
        drawer.norender = true;
        ics.working = false;
        var i = 0;
        function emulate() {
            ics.animate_interval(100);
            if (++i < 6 * 6 && !ics.store.collision) {
                requestAnimationFrame(function() { emulate(); });
                $t.id('percents').innerHTML = Math.round((100 / 6 / 6) * i);
            }
            else {
                drawer.norender = false;
                ics.working = true;
                sd.update_info(drawer, ics);
                for (var j = 0; j < ics.store.droids.length; ++j)
                    sd.update_droid_state(ics.store, drawer, ics.store.droids[j]);
                sd.gui_dialog_remove(d);
            }
        }
        requestAnimationFrame(function() { emulate(); });
    }

    this.dialog_emulate = function(ics, drawer) {
        var working = true;
        var d = sd.gui_dialog_buttons("Эмуляция работы склада", {
            'Остановить': function(d) { working = false; },
        });
        d[0].style['text-align'] = 'left';
        drawer.norender = true;
        ics.working = false;
        var emultime = 0;
        function emulate() {
            ics.animate_interval(5 * 60);
            if (working && !ics.store.collision)
                requestAnimationFrame(function() { emulate(); });
            else {
                drawer.norender = false;
                ics.working = true;
                sd.update_info(drawer, ics);
                for (var j = 0; j < ics.store.droids.length; ++j)
                    sd.update_droid_state(ics.store, drawer, ics.store.droids[j]);
                sd.gui_dialog_remove(d[0]);
                return;
            }
            emultime += 5 * 60;
            sd.update_info(drawer, ics);
            for (var j = 0; j < ics.store.droids.length; ++j)
                sd.update_droid_state(ics.store, drawer, ics.store.droids[j]);
        }
        requestAnimationFrame(function() { emulate(); });
    }

    var mouse, mouse_cell, mouse_timeout;
    var tooltip = $t.id('tooltip');
    this.gui_store_mousedown = function(ev) {
        mouse = $t.get_mouse_coords(ev);
        sd.gui_tooltip_remove();
    }

    function is_in_cell(d, c) {
        return d.i < c.i && d.j < c.j && d.i + 1 > c.i && d.j + 1 > c.j;
    }

    this.gui_store_mouseup = function(store, drawer, ev) {
        var new_mouse = $t.get_mouse_coords(ev);
        if (!mouse) return;
        if (Math.abs(new_mouse.x - mouse.x) > 3 || Math.abs(new_mouse.y - mouse.y) > 3)
            return;
        var c = drawer.m2w(new_mouse);
        if (c.i < 0 || c.j < 0 || c.i >= store.width || c.j >= store.height) return;
        var droid;
        for (var i = 0; i < store.droids.length; ++i) {
            if (is_in_cell(store.droids[i], c)) { droid = store.droids[i]; break; }
        }
        if (droid) $t.raise_event(droid.stateplace.div, 'click');
        else hide_all_wide_droid_state(store, drawer);
    }

    this.gui_store_mousemove = function(ics, drawer, ev) {
        var new_mouse = $t.get_mouse_coords(ev);
        var c = drawer.m2c(new_mouse);
        if (mouse_cell && (c.i != mouse_cell.i || c.j != mouse_cell.j)) {
            sd.gui_tooltip_remove();
        }
        mouse_cell = c;
        if (mouse_timeout) {
            clearTimeout(mouse_timeout);
            mouse_timeout = undefined;
        }
        if (c.i < 0 || c.j < 0 || c.i >= ics.store.width || c.j >= ics.store.height) return; 
        mouse_timeout = setTimeout(function() {
            sd.gui_tooltip_show(ics, mouse_cell, drawer.w2m({ i: mouse_cell.i + 1, j: mouse_cell.j }));
        }, 300);
    }

    this.gui_tooltip_remove = function() {
        tooltip.style.display = "none";
    }

    this.gui_tooltip_show = function(ics, c, m) {
        tooltip.style.display = "inline-block";
        tooltip.style['top'] = m.y + "px";
        tooltip.style['left'] = m.x + "px";
        function update() {
            if (tooltip.style.display == "none") return;
            var store = ics.store;
            var s = "Ячейка " + store.get_readable_coords(c);
            var cc = { i: c.i + 0.5, j: c.j + 0.5 };
            for (var i = 0; i < store.droids.length; ++i) {
                var d = store.droids[i];
                if (is_in_cell(d, cc)) { s += "<hr/>Робот №" + d.number; }
                if (is_in_cell(d.waitpoint, cc)) { s += "<hr/>Место парковки робота №" + d.number; }
            }
            for (var i = 0; i < store.racks.length; ++i) {
                var r = store.racks[i];
                if (is_in_cell(r, cc)) {
                    s += "<hr/>Стеллаж №" + (r.no + 1);
                    s += "<br/>Товар: " + r.text;
                    s += "<br/>Количество: " + r.count;
                    break;
                }
            }
            var cell = store.cell(c);
            if (cell.park) { s += "<hr/>Место стеллажа №" + (cell.park + 1); }
            for (var i = 0; i < ics.packs.length; ++i) {
                var pack = ics.packs[i];
                if (is_in_cell(pack, cc)) { s += "<hr/>Место выборки заказа №" + (i + 1); }
            }
            for (var i = 0; i < ics.operators.length; ++i) {
                var op = ics.operators[i];
                if (is_in_cell(op, cc)) { s += "<hr/>Оператор №" + (i + 1); }
            }
            for (var i = 0; i < ics.chps.length; ++i) {
                var chp = ics.chps[i];
                if (is_in_cell(chp, cc)) { 
                    s += "<hr/>Подъезд к зарядке №" + (i + 1);
                    s += "<br/>Роботов в очереди: " + (chp.occupy || 0);
                }
            }
            for (var i = 0; i < ics.chsts.length; ++i) {
                var st = ics.chsts[i];
                if (is_in_cell(st, cc)) { s += "<hr/>Зарядка №" + (i + 1); }
            }

            tooltip.innerHTML = s;
            setTimeout(update, 100);
        }
        update();
    }

    this.gui_input_to_float = function(input, min, max) {
        var f = Math.abs(parseFloat(input.value));
        if (isNaN(f)) f = 0;
        if (min != undefined && f < min) f = min;
        else if (max != undefined && f > max) f = max;
        return f;
    }

    this.gui_make_table = function(dict) {
        var table = $t.element('table');
        for (var i in dict) {
            var tr = $t.element('tr', {}, table);
            $t.element('td', {}, tr).innerHTML = i;
            $t.inner(dict[i], $t.element('td', {}, tr));
        }
        return table;
    }

    this.gui_make_table_inputs = function(dict) {
        var dd = {};
        for (var i in dict) {
            var el = $t.element('input', { class: 'small-input' });
            el.value = dict[i];
            dd[i] = el;
        }
        return sd.gui_make_table(dd);
    }

    this.gui_button_group = function(sel) {
        var buttons = sel.children;
        for (var i = 0; i < buttons.length; ++i) {
            $t.bind(buttons[i], ['click'], function() {
                for (var j = 0; j < buttons.length; ++j) {
                    $t.set(buttons[j], { state: '' });
                }
                $t.set(this, { state: 'active' });
            });
        }
    }

    this.gui_checkbox = function(c) {
        var ce = $t.element('span', {});
        ce.innerHTML = '&#9744; ';
        c.insertBefore(ce, c.firstChild);
        $t.bind(c, ['click'], function() {
            if (this.getAttribute('state') == 'active') {
                $t.set(this, { state: '' });
                this.firstChild.innerHTML = '&#9744; ';
            }
            else {
                $t.set(this, { state: 'active' });
                this.firstChild.innerHTML = '&#9745; ';
            }
        });
    }

    this.gui_dialog = function() {
        var d = $t.element('div', { class: 'ui-inner' }, 
                $t.element('div', { class: 'ui-middle' }, 
                    $t.element('div', { class: 'ui-outer' }, document.body)));
        return d;
    }

    this.gui_dialog_remove = function(d) {
        $t.remove(d.parentNode.parentNode);
    }

    this.gui_dialog_buttons = function(title, buttons) {
        var d = sd.gui_dialog();
        d.style['text-align'] = 'left';
        d.innerHTML = '<b>' + title + '</b>';
        $t.element('br', {}, d);
        var b = $t.element('div', { style: 'margin-top: 10px; margin-bottom: 10px;' }, d);
        $t.element('br', {}, d);
        var btns = $t.element('div', { class: 'dialog-button-pane' }, d);
        for (var i in buttons) {
            (function(i, callback) {
                $t.bind($t.inner(i, $t.element('button', { class: 'small-text-button' }, btns)),
                    ['click'], function() { callback.call(this, [d, b]); })
            })(i, buttons[i]);
        }
        return [d, b];
    }

}).apply(teal.storedroids = teal.storedroids || {});
