var gm = require('googlemaps');
var kdtree = require('kdtree');
var config = require('config');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');

gm.config('console-key', config.geo.key);

//"delta": [-0.000899,0.001768]


function createRawMap(type, map, locations, callback) {
    var size = [map.end[0]-map.start[0], map.end[1]-map.start[1]];
    var samples = [Math.ceil(size[0]/map.delta[0]),Math.ceil(size[1]/map.delta[1])];

    var coords = [];

    for (var i = 0; i < samples[0]; ++i) {
        for (var j = 0; j < samples[1]; ++j) {
            var lat = map.start[0] + map.delta[0] * i;
            var lon = map.start[1] + map.delta[1] * j;

            coords.push([lat, lon]);
        }
    }

    var names = _.keys(locations);
    var locs = _.map(locations, function (coord, name) {
        return [name].concat(coord);
    });

    var results = [];

    var index = 0;
    async.eachSeries(coords, function (coord, callback) {
        var origin = coord.join(",");
        var distances = {};

        console.log("%d/%d samples", ++index, samples[0]*samples[1]);

        async.eachSeries(locs, function (loc, callback) {
            var name = loc.slice(0,1)[0];
            var dest = loc.slice(1).join(",");
            callback = _.once(callback);

            gm.directions(origin, dest, function (err, result) {
                do {
                    if (err) {
                        break;
                    }

                    if (result.routes.length == 0) {
                        break;
                    }

                    try {
                        distances[name] = {
                            distance: result.routes[0].legs[0].distance.value,
                            duration: result.routes[0].legs[0].duration.value
                        };
                    } catch (e) {}
                } while (0);

                callback(err);
            }, 'false', type);
        }, function (err) {
            if (err) {
                callback(err);
                return;
            }

            if (distances.length == 0) {
                callback(null);
                return;
            }

            var result = _.reduce(_.keys(distances), function (previous, current) {
                if (_.isUndefined(previous)) {
                    return current;
                }

                if (distances[previous].duration > distances[current].duration) {
                    return current;
                }

                return previous;
            });

            results.push({
                "p": coord,
                "t": [distances[result].duration,distances[result].distance, _.indexOf(names, result)]
            });
            callback(null);
        });
    }, function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, results);
    });
}

var maps = {
    "locations": _.keys(config.geo.locations),
    "maps": {}
};

async.series([
    function (callback) {
        createRawMap("walking", config.geo.maps.walking, config.geo.locations, function (err, map) {
            if (err) {
                callback(err);
                return;
            }

            maps.maps["walking"] = map;
            callback(null);
        });
    }
], function (err) {
    if (err) {
        console.log("ERROR", err);
        return;
    }

    fs.writeFile(config.geo.target, JSON.stringify(maps), function (err) {
        console.log("RESULT", err);
    });
});

