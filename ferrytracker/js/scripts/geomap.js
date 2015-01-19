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
        }, 1);

        if (!results.length) {
            return null;
        }
        var result = results[0];
        var match = result[0];

        var d = this.distance(coords.latitude, coords.longitude, match.lat, match.lon) * 1000;

        var duration = match.dur + (d / ((5*1000)/(60*60)));
        var distance = match.dst + d;

        return {
            duration: duration,
            distance: distance,
            name: this._data.locations[match.loc],
            accuracy: coords.accuracy > d ? coords.accuracy : d
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