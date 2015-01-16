DepartureView = FerryTracker.View.extend({
    className: "container",
    id: "departure",

    initialize: function (options) {
        this.template = Template.get("departure");
        this.options = options;

        this.footerView = new DepartureFooterView({ geomap: this.options.geomap });

        this.addAll();
    },

    onClose: function () {
        if (this.footerView) {
            this.footerView.close();
            delete this.footerView;
        }
    },

    render: function () {
        this.$el.html(this.template());
        var root = this.$el.find("tbody");
        _.each(this.getChildViews(), function (item) {
            root.append(item.render().el);
        });
        this.$el.find('tfoot').append(this.footerView.render().el);
        return this;
    },

    addAll: function () {
        this.closeChildViews();
        _.each(this.options.schedule.getLocations(), this.addOne, this);
        this.render();
    },

    addOne: function (location) {
        var view = new DepartureItemView({ location: location, schedule: this.options.schedule });
        this.addChildView(view);
    }
});

DepartureItemView = FerryTracker.View.extend({
    tagName: "tr",

    initialize: function (options) {
        this.template = Template.get("departure-item");
        this.options = options;

        this.update();

        setInterval(_.bind(function () {
            this.render();
        }, this), 1000);
    },

    onClose: function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    },

    update: function () {
        // TODO: schedule next refresh
        this._next = this.options.schedule.getNext(this.options.location, 2);
        if (this._next.length == 0) {
            this.timeout = setTimeout(_.bind(this.update, this), 15 * 60 * 1000);
        } else {
            var now = new Date();
            var next = this._next[0];
            var delta = next - now;

            this.timeout = setTimeout(_.bind(this.update, this), delta + 5 * 1000);
        }

        this.render();
    },

    render: function () {
        this.$el.html(this.template());
        return this;
    },

    location: function () {
        return this.options.location;
    },

    nextTime: function () {
        if (this._next.length == 0) {
            return "";
        }

        var next = this._next[0];

        var hours = next.getHours();
        var minutes = next.getMinutes();

        return (hours < 10 ? "0".concat(hours) : hours) + ":" + (minutes < 10 ? "0".concat(minutes) : minutes);
    },

    timeLeft: function (index) {
        var next = this._next[index];
        if (!next) {
            return "";
        }

        var now = new Date();
        var delta = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));

        var output = "";

        var hours = Math.floor((delta / (60 * 60)));
        if (hours > 0) {
            output = output.concat(hours < 10 ? "0".concat(hours) : hours.toString()) + ":";
        }

        var minutes = Math.floor((delta / 60) % 60);
        output = output + (minutes < 10 ? "0".concat(minutes) : minutes.toString()) + ":";

        var seconds = Math.floor(delta % 60);
        output = output + (seconds < 10 ? "0".concat(seconds) : seconds.toString());

        return output;
    }
});

DepartureFooterView = FerryTracker.View.extend({
    tagName: 'tr',
    id: "departure-footer",

    initialize: function (options) {
        this.options = options;
        this.template = Template.get('departure-footer');
        this.update();
    },

    render: function () {
        this.$el.html(this.template());
        return this;
    },

    update: function () {
        var geolocation = navigator.geolocation;
        if (geolocation) {
            geolocation.getCurrentPosition(_.bind(this.onPosition, this), function () {}, {
                enableHighAccuracy: true,
                maximumAge: 5 * 60 * 1000
            });
        }
    },

    onPosition: function (position) {
        this._position = position;
        this.render();

        setTimeout(_.bind(this.update, this), 5 * 60 * 1000);
    },

    getDirections: function () {
        if (!this._position) {
            return "";
        }

        var result = this.options.geomap.get("walking", this._position.coords.latitude, this._position.coords.longitude);
        if (!result) {
            return "";
        }

        return i18n.t('departures.walk-distance', {
            time: Math.ceil(result.duration / 60),
            distance: Math.ceil(result.distance),
            location: result.name
        });
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