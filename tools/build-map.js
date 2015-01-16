var kdtree = require('kdtree');
var config = require('config');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var request = require('request');
var querystring = require('querystring');

function getBounds(filters) {
    var lats = _.chain(filters).map(function (filter) {
        return _.map(filter, function (p) {
            return p[0];
        });
    }).flatten().value();

    var lngs = _.chain(filters).map(function (filter) {
        return _.map(filter, function (p) {
            return p[1];
        });
    }).flatten().value();

    var northEast = [lats.reduce(function (p,c) {
        return p < c ? p : c;
    }),lngs.reduce(function (p,c) {
        return p < c ? p : c;
    })];

    var southWest = [lats.reduce(function (p,c) {
        return p > c ? p : c;
    }),lngs.reduce(function (p,c) {
        return p > c ? p : c;
    })];

    return [northEast,southWest];
}

function generateSamples(filters, delta) {
    var bounds = getBounds(filters);
    var points = [];

    var d = [Math.ceil((bounds[1][0]-bounds[0][0])/delta[0]), Math.ceil((bounds[1][1]-bounds[0][1])/delta[1])];

    for (var i = 0; i < d[0]; ++i) {
        for (var j = 0; j < d[1]; ++j) {
            var x = bounds[0][0] + i * delta[0];
            var y = bounds[0][1] + j * delta[1];

            if (!_.some(filters, function (filter) {
                return isInside(filter, x, y);
            }, this)) {
                continue;
            }

            points.push([x,y]);
        }
    }

    return points;
}

function isInside(poly, x, y) {
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i][1] <= y && y < poly[j][1]) || (poly[j][1] <= y && y < poly[i][1]))
        && (x < (poly[j][0] - poly[i][0]) * (y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
        && (c = !c);
    return c;
}


function buildBatchDistanceRequest(mode, origins, destination, callback) {
    var maxlen = 2048;

    var base = '/maps/api/distancematrix/json?';
    var valid;

    var args = {
        "key": config.geo.key,
        "avoid": "ferries",
        "mode": mode
    };

    var index = 0;
    do {
        index++;

        var local = _.extend({
            "origins": origins.slice(0, index).map(function (origin) {
                return origin.join(",");
            }).join("|"),
            "destinations": destination.join(",")
        }, args);

        var path = base + querystring.stringify(local);
        if (path.length < maxlen) {
            valid = path;
        }
    }
    while ((path.length < maxlen) && index < origins.length && (index < 10));

    if (!valid) {
        callback("no path generated");
        return;
    }

    callback(null, valid, index);
}

function createRawMap(type, map, locations, callback) {
    var coords = generateSamples(map, [0.0025, 0.005]);

    var names = _.keys(locations);
    var results = {};

/*
    async.series([
            function (callback) {
                fs.readFile("dump.json", function (err, data) {
                    results = JSON.parse(data);
                    callback(err);
                });
            }
        ]
*/
    async.eachSeries(names, function (name, callback) {
        var index = 0;

        var output = [];

        async.whilst(
            function () {
                return index < coords.length
            }, function (callback) {
                console.log("%d / %d samples (%s)", index, coords.length, name);

                buildBatchDistanceRequest(type, coords.slice(index), locations[name], function (err, path, count) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    index += count;

                    request.get({
                        "uri": "https://maps.googleapis.com" + path,
                        "json": true
                    }, function (err, response, body) {
                        if (err || response.statusCode != 200) {
                            callback(err || "Bad request response");
                            return;
                        }

                        if (body.status != "OK") {
                            callback("Bad response");
                            return;
                        }

                        output = output.concat(_.map(body.rows, function (row) {
                            return row.elements[0];
                        }));

                        setTimeout(function () {
                            callback(null);
                        }, 1000);
                    });
                });
            }, function (err) {
                if (err) {
                    callback(err);
                    return;
                }

                results[name] = output;
                callback(null);
            }
        );
    }, function (err) {
        if (err) {
            callback(err);
            return;
        }

	async.series([
/*		function (callback) {
        		fs.writeFile("dump.json", JSON.stringify(results,null,2), callback);
		}*/
	], function (err) {
		if (err) {
			callback(err);
			return;
		}

	        callback(null, _.compact(coords.map(function (coord, index) {
	            var output = _.reduce(names, function (previous, current) {
	                if (results[current][index].status != "OK") {
	                    return previous;
	                }

	                var pd = results[previous][index].duration.value;
	                var cd = results[current][index].duration.value;

	                if (pd > cd) {
	                    return current;
	                }

	                return previous;
	            });

	            if (!output) {
	                return null;
	            }

                var result = results[output][index];
                if (result.status != "OK") {
                    return null;
                }

                return {
	                "p": coord.map(function (v) {
	                    return Number(v.toFixed(6));
	                }),
	                "t": [
	                    results[output][index].duration.value,
	                    results[output][index].distance.value,
	                    _.indexOf(names, output)
	                ]
            		};
        	})));
	});
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
