function GeoMap() {
    this.initialize.apply(this, arguments);
}

_.extend(GeoMap.prototype, {
    initialize: function (data) {
        this._data = data;

        this.trees = {};
        _.each(this._data.maps, function (samples, type) {
            this.trees[type] = new kdTree(samples, _.bind(function (a,b) {
                return this.distance(a.lat, a.lon, b.lat, b.lon);
            }, this), ["lat", "lon"]);
        }, this);
    },

    get: function (type, coords) {
        var tree = this.trees[type];
        if (!tree) {
            return null;
        }

        // TODO: take position accuracy into account (sphere query and estimate)

        var results = tree.nearest({
            lat: coords.latitude,
            lon: coords.longitude
        }, 8, 0.5);

        if (results.length == 0) {
            results = tree.nearest({
                lat: coords.latitude,
                lon: coords.longitude
            }, 1);
        }

        var best = _.chain(results).groupBy(function (result) {
            return result[0].loc;
        }).map(function (members, loc) {
            return {a:loc,b:members.length};
        }).reduce(function (prev, curr) {
            return prev.b < curr.b ? curr : prev;
        }).value();
        results = _.chain(results).filter(function (r) {
            return r[0].loc == best.a;
        }).value();

        results = _.chain(results).sortBy(function (result) {
            return result[1];
        }).value().slice(0,3);

        var dur, dst;
        if (results.length > 1) {
            var ofs = results.map(function (result) {
                var d = 1 / this.distance(result[0].lat, result[0].lon, coords.latitude, coords.longitude);
                return [d, result[0]];
            }, this);

            var maxweights = (_.reduce(ofs, function (memo, curr) {
                return memo + curr[0];
            }, 0));

            dur = ofs.reduce(function (memo, curr) {
                var weight = curr[0];
                var p = weight / maxweights;
                return memo + curr[1].dur * p;
            }, 0);
            dst = ofs.reduce(function (memo, curr) {
                var weight = curr[0];
                var p = weight / maxweights;
                return memo + curr[1].dst * p;
            }, 0);
        } else {
            var result = results[0][0];

            var d = this.distance(result.lat, result.lon, coords.latitude, coords.longitude) * 1000;

            dur = result.dur + (d / ((5*1000)/(60*60)));
            dst = result.dst + d;
        }

        return {
            duration: dur,
            distance: dst,
            name: this._data.locations[best.a],
            accuracy: coords.accuracy
        };
    },

    distance: function (lat1, lon1, lat2, lon2) {
        var deg2rad = Math.PI / 180;
        lat1 *= deg2rad;
        lon1 *= deg2rad;
        lat2 *= deg2rad;
        lon2 *= deg2rad;
        var diam = 12742; // Diameter of the earth in km (2 * 6371)
        var dLat = lat2 - lat1;
        var dLon = lon2 - lon1;
        var a = (
            (1 - Math.cos(dLat)) +
            (1 - Math.cos(dLon)) * Math.cos(lat1) * Math.cos(lat2)
            ) / 2;

        return diam * Math.asin(Math.sqrt(a));
    }
});