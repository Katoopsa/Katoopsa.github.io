"use strict";

(function(earth) {

    function get_img_texture(name) {
        var img = $t.id(name);
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    this.make_geo_vector = function(lat, lon) {
        var vector = new THREE.Vector3(1, 0, 0);
        var matrix = new THREE.Matrix4();
        matrix.makeRotationZ(Math.PI / 2 * lat / 90);
        vector.applyMatrix4(matrix);
        matrix.makeRotationY(Math.PI * lon / 180);
        vector.applyMatrix4(matrix);
        return vector;
    }

    this.earth = function(container, opts) {
        this.w = 500;
        this.h = 500;
        this.scale = Math.sqrt(this.w * this.w + this.h * this.h) / 9;
        this.use_adapvite_timestep = true;
        this.container = container;
        this.opts = opts || {};

        this.animate_funcs = {};
        this.last_time;
        this.current_date;
        this.running;
        this.winter = 1.0;
        this.zoom = 1.0;

        this.renderer = new THREE.WebGLRenderer({ 
                minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, 
                format: THREE.RGBFormat });
        this.renderer.setClearColor(0, 1);

        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(20, 1, 1, 1);
        this.scene = new THREE.Scene();

        this.sol_position = new THREE.Vector3(-1, 0, 0);
        this.earth = new THREE.Object3D();
        this.materials = {};
        
        this.materials.color = new THREE.ShaderMaterial({
            uniforms: {
                u_summer_map: { type: 't', value: get_img_texture('earth_summer') },
                u_winter_map: { type: 't', value: get_img_texture('earth_winter') },
                u_bump_map: { type: 't', value: get_img_texture('earth_bump') },
                u_specular_map: { type: 't', value: get_img_texture('earth_specular') },
                u_clouds_map: { type: 't', value: get_img_texture('earth_clouds') },
                u_night_map: { type: 't', value: get_img_texture('earth_night') },
                u_sol_position: { type: 'v3' },
                u_winter: { type: 'f' },
            },
            vertexShader: $t.id('shader_color_vertex').textContent,
            fragmentShader: $t.id('shader_color_fragment').textContent,
        });
        var color_sphere = new THREE.Mesh(new THREE.SphereGeometry(5 * this.scale, 64, 64), 
                this.materials.color);

        this.materials.atmosphere = new THREE.ShaderMaterial({
            uniforms: {
                u_sol_position: { type: 'v3' },
            },
            transparent: true,
            vertexShader: $t.id('shader_atmosphere_vertex').textContent,
            fragmentShader: $t.id('shader_atmosphere_fragment').textContent,
        });
        var atmosphere = new THREE.Mesh(new THREE.SphereGeometry(5.01 * this.scale, 64, 64), 
                this.materials.atmosphere);

        this.earth.add(color_sphere);
        this.earth.add(atmosphere);
        this.scene.add(this.earth);

        this.earth.scale.y = 0.99;

        this.set_date(new Date());

        (function(box, container) {
            $t.bind(container, ['mousedown', 'touchstart'], function(ev) {
                box.mouse_start = $t.get_mouse_coords(ev);
            });
            $t.bind(container, ['mouseup', 'touchend'], function(ev) {
                delete box.mouse_start;
            });
            $t.bind(container, ['mousemove', 'touchmove'], function(ev) {
                if (!box.mouse_start) return;
                var new_mouse = $t.get_mouse_coords(ev);
                var dx = Math.PI / box.w / 2 * (new_mouse.x - box.mouse_start.x);
                var dy = Math.PI / box.h / 2 * (new_mouse.y - box.mouse_start.y);
                if (ev.button == 0 || ev.changedTouches) {
                    box.scene.rotation.x += dy;
                    box.scene.rotation.y += box.scene.rotation.z == 0 ? dx : -dx;
                }
                else if (ev.button == 1) {
                    box.set_date(new Date(box.current_date.getTime() - dx * 10000000
                            - Math.sign(dy * 100) * 24 * 3600000));
                }
                box.mouse_start = new_mouse;
                box.render();
                if (box.opts.render_callback) box.opts.render_callback.call(box);
            });
            $t.bind(container, ['wheel'], function(ev) {
                box.zoom += 0.1 * Math.sign(ev.deltaY);
                box.adjust_camera();
                box.render();
                if (box.opts.render_callback) box.opts.render_callback.call(box);
            });

        })(this, container);
    };

    this.earth.prototype.update_uniforms = function() {
        var pos = this.sol_position.clone();
        this.scene.updateMatrix();
        pos.applyMatrix4(this.scene.matrix);

        this.materials.color.uniforms.u_sol_position.value = pos;
        this.materials.color.uniforms.u_winter.value = this.winter;
        this.materials.atmosphere.uniforms.u_sol_position.value = pos;
    };

    this.earth.prototype.adjust_camera = function() {
        var wh = this.ch / this.aspect / Math.tan(10 * Math.PI / 180);
        this.camera.aspect = this.cw / this.ch;
        this.camera.far = wh * 1.3 * this.zoom;
        this.camera.position.z = wh * this.zoom;
        this.camera.updateProjectionMatrix();
    }

    this.earth.prototype.resize = function() {
        this.cw = this.container.clientWidth / 2;
        this.ch = this.container.clientHeight / 2;
        this.renderer.setSize(this.cw * 2, this.ch * 2);

        this.aspect = Math.min(this.cw / this.w, this.ch / this.h);
        this.adjust_camera();
    };

    this.earth.prototype.add_point = function(vector, color) {
        var point = new THREE.Mesh(new THREE.SphereGeometry(0.05 * this.scale, 8, 8), 
                new THREE.MeshLambertMaterial({ emissive: color }));
        point.position.copy(vector);
        point.position.multiplyScalar(5 * this.scale);
        this.earth.add(point);
    }

    this.earth.prototype.set_date = function(date) {
        var seconds = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
        var days = ((date.getTime() / 1000 - 30672000) % 31556926) / 31556926;
        var matrix = new THREE.Matrix4();
        matrix.makeRotationY(-seconds / 24 / 3600 * Math.PI * 2);
        var pos = new THREE.Vector3(-1,
                -Math.cos(days * 2 * Math.PI) * Math.sin(23.439281 / 360.0 * 2 * Math.PI), 0);
        pos.normalize();
        pos.applyMatrix4(matrix);

        this.sol_position.copy(pos);

        var jan15 = ((date.getTime() / 1000 - 1209600) % 31556926) / 31556926 * 14 - 7;
        this.winter = 1 - Math.exp(-0.5 * jan15 * jan15 / 10);
        this.current_date = date;
    };

    this.earth.prototype.get_look_at_matrix = function(vector) {
        var matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion(),
            scene_vector = new THREE.Vector3(vector.x, 0, vector.z), res = new THREE.Matrix4();
        this.earth.updateMatrix();
        matrix.extractRotation(this.earth.matrix);
        res.multiplyMatrices(matrix.getInverse(matrix), res);
        scene_vector.normalize();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), scene_vector);
        matrix.makeRotationFromQuaternion(quaternion);
        res.multiplyMatrices(matrix.getInverse(matrix), res);
        matrix.makeRotationX(vector.angleTo(scene_vector) * Math.sign(vector.y));
        res.multiplyMatrices(matrix, res);
        return res;
    }

    this.earth.prototype.look_at = function(vector) {
        this.scene.matrix.identity();
        this.scene.applyMatrix(this.get_look_at_matrix(vector));
    };

    this.earth.prototype.render = function() {
        this.update_uniforms();
        this.renderer.render(this.scene, this.camera);
    };

    this.earth.prototype.__animate = function() {
        var render_time = new Date();
        var delta = render_time.getTime() - this.last_time;
        function timeout(dt) {
            (function(t, dt) {
                if (t.__timer) {
                    clearTimeout(t.__timer);
                    delete t.__timer;
                }
                if (dt == 0) requestAnimationFrame(function() { t.__animate(); });
                else t.__timer = setTimeout(function() { t.__animate(); }, dt);
            })(this, dt);
        }
        function do_render() {
            this.set_date(new Date(this.current_date.getTime() + delta));
            this.render();
            this.last_time = render_time.getTime();
            if (this.opts.render_callback) this.opts.render_callback.call(this);
        }
        var render_flag = false;
        for (var i in this.animate_funcs) {
            render_flag |= this.animate_funcs[i].call(this, i, delta);
        }
        if (render_flag) do_render.call(this);
        if (Object.keys(this.animate_funcs).length) timeout.call(this, render_flag ? 0 : 1000);
    }

    this.earth.prototype.start_animate = function(animate_func, index) {
        this.last_time = (new Date()).getTime();
        this.render();
        if (this.opts.render_callback) this.opts.render_callback.call(this);
        this.animate_funcs[index] = animate_func;
        this.__animate();
    };
    this.earth.prototype.stop_animate = function(index) {
        delete this.animate_funcs[index];
    }

    this.earth.prototype.animate_realtime = function() {
        var last_current_date = this.current_date;
        return function(index, delta) {
            var res = (last_current_date.getUTCMinutes() != new Date(this.current_date.getTime() + delta).getUTCMinutes() ||
                    delta > 60000);
            if (res) last_current_date = new Date(this.current_date.getTime() + delta);
            return res;
        };
    };

    this.earth.prototype.animate_fastertime = function() {
        return function(index, delta) {
            delta = delta * 60 * 60;
            this.current_date = new Date(this.current_date.getTime() + delta);
            this.scene.rotation.y += this.scene.rotation.z == 0 ? 0.0003 : -0.0003;
            return true;
        };
    };

    this.earth.prototype.animate_fasttime = function() {
        var days = 0;
        return function(index, delta) {
            days += delta;
            var yl = 24 * 3600 / 6000 * 2;
            var nd = Math.floor(days / yl);
            delta = delta * 6000 * 2;
            if (nd) {
                delta += nd * 24 * 3600000;
                days -= nd * yl;
            }
            this.current_date = new Date(this.current_date.getTime() + delta);
            this.scene.rotation.y += this.scene.rotation.z == 0 ? 0.001 : -0.001;
            return true;
        };
    };

    this.earth.prototype.animate_look_at = function(vector, duration, accel) {
        var quaternion_start = new THREE.Quaternion(), quaternion_stop = new THREE.Quaternion();
        var start_zoom = this.zoom, position = 0;
        quaternion_start.setFromRotationMatrix(this.scene.matrix);
        quaternion_stop.setFromRotationMatrix(this.get_look_at_matrix(vector));

        return function(index, delta) {
            var quaternion = new THREE.Quaternion(), matrix = new THREE.Matrix4();
            quaternion.copy(quaternion_start);
            position += delta / duration;
            if (position > 1.0) {
                position = 1.0;
                this.stop_animate(index);
            }
            quaternion.slerp(quaternion_stop, Math.pow(position, accel));
            matrix.makeRotationFromQuaternion(quaternion);
            this.scene.matrix.identity();
            this.scene.applyMatrix(matrix);
            this.zoom = start_zoom + (1.0 - start_zoom) * position;
            this.adjust_camera();
            return true;
        }
    };

    this.earth.prototype.animate_css = function(guis, param_name, stop_value, duration) {
        var start_value = guis[0].style[param_name];
        if (start_value == '') start_value = 1.0;
        start_value = parseFloat(start_value);
        var value = start_value;
        return function(index, delta) {
            value += (stop_value - start_value) * delta / duration;
            if (value < stop_value && value < start_value
                    || value > stop_value && value > start_value) {
                value = stop_value;
                this.stop_animate(index);
            }
            for (var i in guis) {
                guis[i].style[param_name] = value;
            }
            return true;
        }
    };

}).apply(teal.earth = teal.earth || {});

function earth_initialize() {
    $t.remove($t.id('loading_text'));

    var guis = [$t.id('gui1'), $t.id('gui2'), $t.id('guimusic')];

    guis[1].style.display = 'block';
    if (window.location.hash.search('nogui') != -1) {
        guis[0].style.display = 'none';
        guis[1].style.display = 'none';
    }

    const month_names = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
        "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    function update_labels() {
        var date = this.current_date;
        $t.id('time_indicator').value = (date.getUTCHours() < 10 ? '0' : '') + date.getUTCHours() +
            ':' + (date.getUTCMinutes() < 10 ? '0' : '') + date.getUTCMinutes() + ', ' +
            month_names[date.getUTCMonth()] + ' ' + date.getUTCDate();
    }

    $t.bind($t.id('time_indicator'), ['change'], function() {
        var datestr = $t.id('time_indicator').value;
        var res = /(\d\d):(\d\d),\s+(\w+)\s+(\d+)/.exec(datestr);
        if (!res) return;
        var date = new Date(0);
        var month = month_names.indexOf(res[3]);
        if (month == -1) return;
        date.setUTCMonth(month);
        if (!res[4]) return;
        date.setUTCDate(res[4]);
        date.setUTCHours(res[1]);
        date.setUTCMinutes(res[2]);
        earth.set_date(date);
        earth.render();
    });

    var canvas = $t.id('canvas');
    var earth = new $t.earth.earth(canvas, {
        render_callback: update_labels
    });

    $t.bind(window, ['resize'], function() {
        canvas.style.width = window.innerWidth - 1 + 'px';
        canvas.style.height = window.innerHeight - 1 + 'px';
        earth.resize();
        earth.render();
    });
    $t.raise_event(document.body, 'resize');

    earth.set_date(new Date());

    $t.bind($t.id('button_set_current'), ['click'], function() {
        earth.set_date(new Date());
        earth.render();
    });

    var viewer_vector = $t.earth.make_geo_vector(54.9158, 37.4111);
    earth.look_at(viewer_vector);

    $t.bind($t.id('button_find_me'), ['click'], function() {
        earth.start_animate(earth.animate_look_at(viewer_vector, 1000, 0.3), 'look_at');
    });

    var mode_buttons = { realtime: $t.id('button_realtime'), 
        fastertime: $t.id('button_fastertime'), fasttime: $t.id('button_fasttime') };
    var mode_func = function() {
        for (var i in mode_buttons) {
            $t.set(mode_buttons[i], { state: '' });
            earth.stop_animate(i);
        }
        $t.set(this, { state: 'active' });
        var mode = this.getAttribute('mode');
        earth.start_animate(earth['animate_' + mode](), mode);
    };
    for (var i in mode_buttons) {
        $t.bind(mode_buttons[i], ['click'], mode_func);
    }

    var music_tracks = [
        { name: 'What A Wonderful World', link: 'https://youtu.be/OpE0kPSDfWA', url: 'https://sites.google.com/site/tealyatina/share/what_a_wonderful_world.mp3' }
    ];
    var audio = new Audio();
    audio.type = 'audio/mpeg';
    var audio_random_track = function() {
        var i = 0;
        $t.id('music_name').innerHTML = music_tracks[i].name;
        $t.id('music_link').innerHTML = music_tracks[i].link;
        $t.id('music_link').href = music_tracks[i].link;
        audio.src = music_tracks[i].url;
    }
    $t.bind(audio, ['ended'], function() {
        audio_random_track();
        audio.play();
    });
    $t.bind($t.id('button_music'), ['click'], function() {
        if (this.getAttribute('state') == 'active') {
            $t.set(this, { state: '' });
            guis[2].style.display = 'none';
            audio.pause();
        }
        else {
            $t.set(this, { state: 'active' });
            guis[2].style.display = 'block';
            if (!audio.src) audio_random_track();
            audio.play();
        }
    });
    if (window.location.hash.search('music') != -1) {
        $t.raise_event($t.id('button_music'), 'click');
    }

    var mouse_timeout, last_mouse_time = new Date().getTime();
    window.gui_visible = true;
    var gui_timeout = function() {
        if (new Date().getTime() - last_mouse_time >= 2900) {
            earth.stop_animate('gui');
            window.gui_visible = false;
            earth.start_animate(earth.animate_css(guis, 'opacity', 0.3, 600), 'gui');
        }
        else {
            clearInterval(mouse_timeout);
            mouse_timeout = setTimeout(gui_timeout, 3000);
        }
    };
    $t.bind(document.body, ['mousemove', 'click', 'touchstart'], function() {
        last_mouse_time = new Date().getTime();
        if (!window.gui_visible) {
            earth.stop_animate('gui');
            window.gui_visible = true;
            earth.start_animate(earth.animate_css(guis, 'opacity', 1.0, 100), 'gui');
            clearInterval(mouse_timeout);
            mouse_timeout = setTimeout(gui_timeout, 3000);
        }
    });
    mouse_timeout = setTimeout(gui_timeout, 3000);

    $t.set(mode_buttons.realtime, { state: 'active' });
    earth.start_animate(earth.animate_realtime(), 'realtime');

    //earth.add_point(viewer_vector, 0xf00000);

    var ajax = new XMLHttpRequest();
    ajax.open("get", 'http://ip-api.com/json', true);
    ajax.onreadystatechange = function() {
        if (ajax.readyState == 4) {
            var res = JSON.parse(ajax.responseText);
            if (res.lat && res.lon) {
                viewer_vector = $t.earth.make_geo_vector(res.lat, res.lon);
                earth.start_animate(earth.animate_look_at(viewer_vector, 1000, 0.3), 'look_at');
            }
        }
    };
    ajax.send();
}
