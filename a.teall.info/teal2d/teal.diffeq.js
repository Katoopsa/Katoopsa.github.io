"use strict";

(function(diffeq) {

    function mult_array(array1, coeff) {
        if (array1 instanceof Object) {
            for (var i in array1) 
                if (array1.hasOwnProperty(i))
                    array1[i] = mult_array(array1[i], coeff);
        }
        else array1 *= coeff;
        return array1;
    }
    function plus_array(array1, array2) {
        if (!array2) return array1;
        if (array1 instanceof Object) {
            for (var i in array1)
                if (array1.hasOwnProperty(i))
                    array1[i] = plus_array(array1[i], array2[i]);
        }
        else array1 += array2;
        return array1;
    }

    this.runge_kutta = function(storage, timedelta, func) {
        var k1 = mult_array(func.call(storage, storage.values), timedelta);
        storage.time += timedelta * 0.5;
        var k2 = mult_array(func.call(storage,
                plus_array(mult_array($t.copy(k1), 0.5), storage.values)), timedelta);
        var k3 = mult_array(func.call(storage,
                plus_array(mult_array($t.copy(k2), 0.5), storage.values)), timedelta);
        storage.time += timedelta * 0.5;
        var k4 = mult_array(func.call(storage,
                plus_array($t.copy(storage.values), k3)), timedelta);

        plus_array(k1, mult_array(k2, 2));
        plus_array(k1, mult_array(k3, 2));
        plus_array(k1, k4);
        plus_array(storage.values, mult_array(k1, 1.0 / 6.0));
    }

    this.euler = function(storage, timedelta, func) {
        plus_array(storage.values,
                mult_array(func.call(storage, storage.values), timedelta));
        storage.time += timedelta;
    }

    this.euler2 = function(storage, timedelta, func) {
        var k0 = $t.copy(storage.values);
        var k1 = $t.copy(func.call(storage, storage.values));
        plus_array(k0, mult_array($t.copy(k1), timedelta));
        storage.time += timedelta;
        plus_array(storage.values,
                mult_array(plus_array(k1, func.call(storage, k0)), timedelta * 0.5));
    }

}).apply(teal.diffeq = teal.diffeq || {});
