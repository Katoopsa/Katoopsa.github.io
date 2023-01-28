"use strict";

function rpc(params, callback, noparse) {
    var ajax = new XMLHttpRequest();
    ajax.open("post", 'f', true);
    ajax.onreadystatechange = function() {
        if (ajax.readyState == 4)
            callback.call(ajax, noparse ? ajax.responseText : JSON.parse(ajax.responseText));
    };
    ajax.send(JSON.stringify(params));
}

function login_initialize() {
    document.getElementById('lfcopy').innerHTML = "© 2016—" +
        (new Date()).getFullYear() + " Киберсклад.рф";
    if (window.location.search.indexOf('exit=true') != -1) {
        return;
    }
    rpc({ method: "login", url: window.location.href }, function(response) {
        if (response['user']) {
            var exit_link = response['url'];
            document.getElementById('bexit').href = exit_link;
            rpc({ method: "init" }, function(response) {
                if (!response.length) window.location = exit_link;
                else {
                    eval.call(window, response);
                    teal.storedroids_initialize();
                }
            }, true);
        }
        else {
            document.body.removeChild(document.getElementById('hider'));
            document.getElementById('submit').addEventListener('click', function() {
                window.location = response['url'];
            });
        }
    });
}

