"use strict";

(function(renderer) {

    this.svg_renderer = function(container, opts) {
        this.container = container;
        this.opts = opts;
        this.svg = $t.svg.svg('svg', {
                version: '1.1', viewBox: '0 0 ' + opts.width + ' ' + opts.height,
                width: opts.width, height: opts.height },
            $t.element('div', { id: 'svgform', class: 'main-form', tabindex: 1 }, container));
        this.layer = $t.svg.svg('g', {
            transform: 'translate(' + opts.width / 2 + ' ' + opts.height / 2 + ')' }, this.svg);
    }

    this.svg_renderer.prototype.screen_to_world = function(event) {
        return new $t.math.vector(
            this.container.scrollLeft - this.container.offsetLeft + event.pageX - this.opts.width / 2,
            this.container.scrollTop - this.container.offsetTop + event.pageY - this.opts.height / 2
        );
    }

    this.svg_renderer.prototype.clear = function() {
        $t.empty(this.layer);
    }

    var movement_quantity = function(object) {
        var pos1 = object.last_render_position, pos2 = object.values.position;
        return pos1.vector.clone().sub(pos2.vector).len2() +
            Math.pow(pos1.heading * object.radius_bound - pos2.heading * object.radius_bound, 2);
    }

    this.svg_renderer.prototype.render = function() {
        for (var i = this.scene.objects.length - 1; i >= 0; --i) {
            var object = this.scene.objects[i];
            if (object.last_render_position != undefined) {
                object.stoped = movement_quantity(object) < 0.01;
                if (object.stoped) continue;
            }
            this.opts.render_func.call(this, object, this.layer, 'render_' + object.name);
            object.last_render_position = $t.copy(object.values.position);
        }
    }

    this.svg_renderer.prototype._run_proxy = function() {
        var oldtime = this.time;
        ++this.iteration;
        this.scene.step(((new Date()).getTime() - oldtime) / 1000, true);
        if (this.iteration % 2) {
            this.scene.step(0);
            this.render();
        }
        this.time = (new Date()).getTime();
        var interval = this.interval - (this.time - oldtime);
        if (interval < 0) interval = 1;
        var instance = this;
        if (this.scene) this.timeout = setTimeout(function() { instance._run_proxy(); }, interval);
    }

    this.svg_renderer.prototype.run = function(scene, fps) {
        this.scene = scene;
        this.iteration = 0;
        this.scene.step(0);
        this.render();
        this.time = (new Date()).getTime();
        this.interval = 1000 / (fps * 2 || 100);
        var instance = this;
        if (!this.timeout) this.timeout = setTimeout(function() { instance._run_proxy(); }, this.interval);
    }

    this.svg_renderer.prototype.stop = function() {
        this.scene = undefined;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
    }

    this.svg_renderer.prototype.is_running = function() {
        return this.scene != undefined;
    }

}).apply(teal.renderer = teal.renderer || {});
