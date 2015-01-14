function Schedule() {
    this.initialize.apply(this, arguments);
}

_.extend(Schedule.prototype, {
    initialize: function (data) {
        this._data = data;
    },

    getLocations: function () {
        return _.chain(this._data.locations).keys().sortBy(function (name) {
            return name;
        }).value();
    },

    getNext: function (location, count, date) {
        if (_.isDate(count)) {
            date = count;
            count = 1;
        }

        if (_.isUndefined(count)) {
            count = 1;
        }

        if (_.isUndefined(date)) {
            date = new Date();
        }

        var type = this._classify(date);
        var departures = this._data.locations[location][type].departures;

        var hour = date.getHours();
        var minute = date.getMinutes();

        var result = [];
        for (var index = 0; index <= 1; ++index, minute = -1) {
            var curr = (hour + index) % 24;
            var key = curr < 10 ? "0".concat(curr) : curr;

            result = result.concat(_.chain(departures[key]).filter(function (time) {
                return minute < time;
            }).map(function (time) {
                var output = new Date(date.getTime());
                output.setHours(hour + index);
                output.setMinutes(time);
                output.setSeconds(0);
                return output;
            }).value());
        }

        return result.slice(0,count);
    },

    _classify: function (date) {
        // TODO: check holiday status

        var hour = date.getHours();
        var weekday = date.getDay();

        if (hour < 1) {
            weekday = (weekday + 6) % 7;
        }

        switch (weekday) {
            case 0:case 6: return "weekend";
            default: return "workday";
        }
    }
});


