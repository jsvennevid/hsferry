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
            this.tick();
        }, this), 1000);
    },

    onClose: function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    },

    tick: function () {
        if (this._next.length > 0) {
            var now = new Date();
            var next = this._next[0];
            var delta = next - now;

            if (delta < -5000) {
                this.update();
            } else {
                this.render();
            }
        } else {
            this.update();
        }
    },

    update: function () {
        this._next = this.options.schedule.getNext(this.options.location, 2);
        this.render();
    },

    render: function () {
        if (this.$el.children().length == 0) {
            this.$el.html(this.template());
        }

        var location = this.$el.find("td:first-child");
        var tl1 = this.$el.find("td:nth-child(2) div:first-child");
        var tl2 = this.$el.find("td:nth-child(2) div:nth-child(2)");

        location.html(this.location());
        tl1.html(this.timeLeft(0));
        tl2.html(this.timeLeft(1));

        if (this._next.length > 0) {
            var now = new Date();
            var next = this._next[0];
            var delta = next - now;

            tl1.toggleClass("text-danger", (delta >= 0) && (delta < 60 * 1000));
            tl1.toggleClass("text-muted", (delta < 0));
        }
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

        _.defer(_.bind(function () {
            this.update();
        }, this));
    },

    render: function () {
        this.$el.html(this.template());
        return this;
    },

    update: function () {
        var geolocation = navigator.geolocation;
        if (geolocation) {
            geolocation.getCurrentPosition(_.bind(this.onPosition, this), _.bind(this.onPositionError, this), {
                enableHighAccuracy: true,
                maximumAge: 5 * 60 * 1000
            });
            this.$el.find("div#spinner").toggleClass('hidden', false);
        }
    },

    onPositionError: function () {
        this.$el.find("div#spinner").toggleClass('hidden',true);
        setTimeout(_.bind(this.update, this), 60 * 1000);
    },

    onPosition: function (position) {
        this.$el.find("div#spinner").toggleClass('hidden',true);

        this._position = position;
        this.render();

        setTimeout(_.bind(this.update, this), 60 * 1000);
    },

    getDirections: function () {
        if (!this._position) {
            return "";
        }

        var result = this.options.geomap.get("walking", this._position.coords.latitude, this._position.coords.longitude, this._position.coords.accuracy);
        if (!result) {
            return "";
        }

        return i18n.t('departures.walk-distance', {
            time: Math.ceil(result.duration / 60),
            distance: Math.ceil(result.distance),
            location: result.name,
            accuracy: Math.ceil(result.accuracy)
        });
    }
});