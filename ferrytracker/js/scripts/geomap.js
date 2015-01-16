function GeoMap() {
    this.initialize.apply(this, arguments);
}

_.extend(GeoMap.prototype, {
    initialize: function (data) {
        this._data = data;
    },

    get: function (type, lat, lon) {
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

        return {
            duration: match.t[0],
            distance: match.t[1],
            name: this._data.locations[match.t[2]]
        };
    }
});