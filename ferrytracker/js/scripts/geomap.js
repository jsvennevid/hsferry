function GeoMap() {
    this.initialize.apply(this, arguments);
}

_.extend(GeoMap.prototype, {
    initialize: function (data) {
        this._data = data;
    },

    get: function (type, lat, lon, acc) {
        var map = this._data.maps[type];
        if (!map) {
            return null;
        }

        // TODO: use a k/d-tree to find closest location instead
        // TODO: take position accuracy into account (sphere query and estimate)

        var match = _.reduce(map, function (previous, current) {
            if (!previous) {
                return current;
            }

            var px = (lat-previous.p[0]), py = (lon-previous.p[1]);
            var pd = px*px + py*py;

            var cx = (lat-current.p[0]), cy = (lon-current.p[1]);
            var cd = cx*cx + cy*cy;

            if (pd > cd) {
                return current;
            }

            return previous;
        });

        if (!match) {
            return null;
        }

        var d = this.distance(lat, lon, match.p[0], match.p[1]);
        return {
            duration: match.t[0],
            distance: match.t[1],
            name: this._data.locations[match.t[2]],
            delta: acc > d ? acc : d
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