"use strict";
    
    //force_on_sail = density_air * S * V * V / 2;
    //density_air = 1.2;
    //density_water = 1000.0;
    //fr = shep_velocity / sqrt(g * ship_length);

var $tvector = teal.math.vector;

function gravity(state, current) {
    this.point = new $tvector(0, 0);
    this.vector = new $tvector(0, 9.8 * 10 * state.properties.mass);
    return true;
}

function friction_hard(state, current) {
    this.point = new $tvector(0, 0);
    var friction_factor = 1.5;
    this.vector = new $tvector(
        -current.velocity.vector.x * friction_factor * state.properties.mass,
        -current.velocity.vector.y * friction_factor * state.properties.mass
    );
    this.heading = -current.velocity.heading * friction_factor * state.properties.inertia;
    return true;
}

function friction_soft(state, current) {
    var front = new $tvector(state.properties.length, state.properties.width);
    var diag = front.len2();
    var velocity = current.velocity.vector.clone().rotate(-current.position.heading);
    var friction_factor = 0.3;

    this.point = new $tvector(0, 0);
    this.vector = (new $tvector(
        -velocity.x * friction_factor * Math.abs(front.x),
        -velocity.y * friction_factor * Math.abs(front.y)
    )).rotate(current.position.heading);
    this.heading = -current.velocity.heading * friction_factor * diag * 10;
    return true;
}

function draw_ship(s, layer, id) {
    var g = $t.id(id);
    var svgc = this;
    if (!g) {
        g = $t.svg.svg('g', { id: id }, layer);
        $t.svg.svg('title', {}, g).textContent = s.name;
        $t.svg.svg('rect', {
            x: 0, y: 0, id: 'hull_' + id,
            width: s.properties.width,
            height: s.properties.length,
            style: 'fill: rgba(0, 0, 0, 0.2); stroke: black'
        }, g);

        $t.bind(g, 'mousedown', function(event) {
            var mouse = svgc.screen_to_world(event);
            var point = $t.physics.world_to_object(mouse.clone(), s);
            s.forces.mouse_tracking = { point: point, vector: new $tvector(0, 0), heading: 0,
                style: 'stroke: green', mouse: mouse, func: function() {
                    this.vector = this.mouse.clone().sub(
                        $t.physics.object_to_world(this.point.clone(), s));
                    return true;
                } };
            svgc.binded_object = s;
        });
    }
    else {
        $t.remove($t.get_elements_by_class('force', g));
    }

    $t.set(g, {
        transform: 'translate(' + s.values.position.vector.x + ' ' + s.values.position.vector.y + ') ' +
                   'rotate(' + s.values.position.heading / Math.PI * 180 + ') ' +
                   'translate(' + -s.properties.width / 2 + ' ' + -s.properties.length / 2 + ')',
    });
    var forces_string = '';
    for (var i in s.forces) {
        var f = s.forces[i];
        if (!f) continue;
        $t.svg.svg('circle', {
            cx: s.properties.width / 2 + f.point.x, cy: s.properties.length / 2 + f.point.y,
            r: 2, id: id + '.force.point.' + i, class: 'force',
            style: 'fill: rgba(0, 0, 0, 0.2); stroke: black'
        }, g);
        var v = f.vector.clone().rotate(-s.values.position.heading);
        var path = $t.svg.svg('path', {
            id: id + '.force.vector.' + i, class: 'force',
            d: 'm ' + (s.properties.width / 2 + f.point.x) + ' ' + (s.properties.length / 2 + f.point.y) +
            ' l ' + v.x + ' ' + v.y,
            style: f.style
        }, g);
        $t.svg.svg('title', {}, path).textContent = s.time;
    }
}

function initialize() {
    $t.element('div', { id: 'property_list', style: 'position: absolute; left: 30px; top: 30px' }, document.body);

    var svgc = new $t.renderer.svg_renderer($t.id('svg'), {
        width: 4000, height: 4000, render_func: draw_ship });

    $t.bind(svgc.container, 'mousemove', function(event) {
        if (!svgc.binded_object) return;
        svgc.binded_object.forces.mouse_tracking.mouse = svgc.screen_to_world(event);
    });

    $t.bind(svgc.container, 'mouseup', function(event) {
        if (!svgc.binded_object) return;
        delete svgc.binded_object.forces.mouse_tracking;
        svgc.binded_object = null;
    });

    $t.bind(window, 'resize', function() {
        svgc.container.style.width = window.innerWidth + 'px';
        svgc.container.style.height = window.innerHeight + 'px';
    });

    $t.raise_event(window, 'resize');
    svgc.container.scrollLeft = svgc.opts.width / 2 - svgc.container.offsetWidth / 2;
    svgc.container.scrollTop = svgc.opts.height / 2 - svgc.container.offsetHeight / 2;

    $t.bind(document.body, 'keydown', function(event) {
        if (event.keyCode == 27) {
            svgc.clear();
            scene = $t.copy(base_scene);
            svgc.run(scene);
        }
        else if (event.keyCode == 13) {
            if (svgc.is_running()) svgc.stop();
            else svgc.run(scene);
        }
    });

    var ship = {
        //mass: 420000.0, length: 26.0, width: 9.0, draft: 2.8, /*sails: 820,*/
        mass: 0.04, length: 26.0, width: 9.0, draft: 2.8, inertia: 0.04 * 300
    };
    var ship2 = {
        mass: 0.06, length: 30.0, width: 30.0, draft: 2.8, inertia: 0.06 * 300
    };

    var objects = [
        {
            name: 'brig',
            properties: ship,
            values: {
                position: { vector: new $tvector(0, 0), heading: -Math.PI / 2 / 2 },
                velocity: { vector: new $tvector(0, 0), heading: 0 }
            },
        },
        {
            name: 'sloop',
            properties: ship,
            values: {
                position: { vector: new $tvector(-15, 0), heading: 0 },
                velocity: { vector: new $tvector(0, 0), heading: 0 }
            },
        },
        {
            name: 'brig2',
            properties: ship2,
            values: {
                position: { vector: new $tvector(0, -50), heading: 0 },
                velocity: { vector: new $tvector(0, 0), heading: 0 }
            },
        },
        {
            name: 'sloop2',
            properties: ship2,
            values: {
                position: { vector: new $tvector(-38, -50), heading: Math.PI / 2 / 2 },
                velocity: { vector: new $tvector(10, 0), heading: 0 }
            },
        },
        {
            name: 'frigate',
            properties: { mass: 0.1, length: 50.0, width: 18.0, draft: 2.8, inertia: 0.1 * 300 },
            values: {
                position: { vector: new $tvector(0, 150), heading: Math.PI / 2 / 2 },
                velocity: { vector: new $tvector(0, 0), heading: 0 }
            },
        }
    ];

    var scene = new $t.physics.scene(objects, {});

    for (var i in scene.objects) {
        var obj = scene.objects[i];
        obj.bound = $t.math.make_box_bound(obj.properties);
        obj.radius_bound = $t.math.make_radius_bound(obj.properties);
        if (!obj.forces) obj.forces = {};
        obj.forces.friction = { func: friction_hard, style: 'stroke: red' };
        //obj.forces.gravity = { func: gravity, style: 'stroke: blue' };
    }

/*    scene.joints.push([
        0,
        4, new $tvector(0, -1), new $tvector(0, 0), 0, $t.physics.earth, new $tvector(0, 1), new $tvector(0, 0), 0,
        0
    ]);
    scene.joints.push([
        0,
        4, new $tvector(0, 1), new $tvector(0, 0), 0, $t.physics.earth, new $tvector(0, -1), new $tvector(0, 0), 0,
        0
    ]);*/

    var base_scene = $t.copy(scene);

    $t.id('property_list').innerHTML = '<h6><img src="../favicon.ico" style="vertical-align: middle"></img>'
	+ ' <a href="..">teal</a> physics engine</h6>'
        + '<p>2d version,<br/>liquid friction, gravity is off</p>'
        + '<p>use mouse to move and collide cubes,'
        + '<br/><em>esc</em> to restart, <em>enter</em> to pause</p>';

    svgc.run(scene);
}
