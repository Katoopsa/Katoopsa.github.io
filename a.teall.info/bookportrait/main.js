"use strict";

var color_names = {
    aqua: '#00ffff', azure: '#007fff', black: '#000000', blood: '#cc0000',
    blue: '#0000ff', bronze: '#cd7f32', brown: '#a52a2a', crimson: '#dc143c',
    cyan: '#00ffff', fuchsia: '#ff00ff', gold: '#ffd700', gray: '#808080',
    grey: '#808080', green: '#00ff00', lime: '#bfff00', maroon: '#800000',
    olive: '#808000', orange: '#ffa500', pink: '#ffc0cb', purple: '#800080',
    red: '#ff0000', rose: '#ff007f', silver: '#c0c0c0', teal: '#008080',
    vanilla: '#f3e5ab', white: '#ffffff', yellow: '#ffff00'
};

var row_wide = 40;
var cell_size = 15;

function process_book_portrait(text) {
    var refs = [], counts = {};
    for (var color in color_names) {
        var count = 0;
        var regex = new RegExp('\\b' + color + '\\b', 'ig');
        var match;
        while (match = regex.exec(text)) {
            refs.push([match.index, color]);
            ++count;
        }
        counts[color] = count;
    }
    refs.sort(function(a, b) { return a[0] < b[0] ? -1 : 1; });

    var rows = Math.ceil(refs.length / row_wide);

    $t.id('status').innerHTML = 'Total number of color references: ' + refs.length;
    var count_string = '';
    for (var i in counts)
        if (counts[i]) count_string += i + ' (' + counts[i] + '); ';
    $t.id('counts').innerHTML = count_string;
    $t.empty($t.id('canvas_place'));
    var canvas = $t.element('canvas', { id: 'canvas',
        width: row_wide * cell_size, height: rows * cell_size }, $t.id('canvas_place'));
    var context = canvas.getContext('2d');

    for (var i in refs) {
        context.fillStyle = color_names[refs[i][1]];
        context.fillRect((i % row_wide) * cell_size,
                Math.floor(i / row_wide) * cell_size, cell_size, cell_size);
    }

    $t.element('p', {}, $t.id('canvas_place'));
    var save_button = $t.element('button', {}, $t.id('canvas_place'));
    save_button.innerHTML = 'Save as image';
    $t.bind(save_button, 'click', function (e) {
        window.open(canvas.toDataURL());
    });
}

function initialize() {
    $t.bind($t.id('upload_file_button'), 'click', function (e) {
        $t.raise_event($t.id('upload_file'), 'click');
    });
    
    $t.bind($t.id('upload_file'), 'change', function (e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function(res) { process_book_portrait(res.target.result); };
        reader.readAsText(file);
    });
}

