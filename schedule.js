ScheduleTemplate = '' +
'<h1>Schema</h1>' +
'<table class="table table-striped">' +
'   <thead>' +
'       <tr>' +
'           <th>Plats</th>' +
'           <th>Nästa färja</th>' +
'           <th>Tid kvar</th>' +
'       </tr>' +
'   </thead>' +
'   <tbody>' +
'   </tbody>' +
'</table>' +
'';

ScheduleView = Backbone.View.extend({
    className: "container well",

    initialize: function (options) {
        this.template = _.template(ScheduleTemplate);
        this.schedule = options.schedule;

        this.update();

        setInterval(_.bind(function () {
            this.update();
        }, this), 60 * 1000);
    },

    render: function () {
        this.$el.html(this.template());
        var root = this.$el.find("tbody");
        _.each(this._items, function (item) {
            root.append(item.render().el);
        });
        return this;
    },

    update: function () {
        var d = new Date();

        var hour = d.getHours();
        var minute = d.getMinutes();
        var day = d.getDay();

        if (hour < 1) {
            day = ((day + 6) % 7);
        }

        // TODO: determine if holiday

        var active = _.findWhere(this.schedule, function (entry) {
            return _.indexOf(entry.days, day);
        });

        var nextTimes = _.object(_.map(active.locations, function (times, location) {
            var localMinute = minute;

            for (var curr = hour; curr <= (hour + 1) % 24; ++curr) {
                var key = curr < 10 ? "0".concat(curr) : curr;
                var closest = _.filter(times[key], function (time) {
                    return time > localMinute;
                });

                if (closest.length > 0) {
                    var next = closest[0];
                    return [location, {
                        time: key + ":" + (next < 10 ? "0".concat(next) : next),
                        offset: (curr * 60 + closest[0]) * 60
                    }];
                }

                localMinute = 0;
            }

            return [location, null];
        }));

        this._items = _.map(nextTimes, function (nextTime, location) {
            return new ScheduleItemView({
                location: location,
                time: nextTime.time,
                offset: nextTime.offset
            });
        });

        this.render();
    }
});

ScheduleItemTemplate = '' +
'<td><%= this.location() %></td>' +
'<td><%= this.nextTime() %></td>' +
'<td><%= this.timeLeft() %>' +
'';

ScheduleItemView = Backbone.View.extend({
    tagName: "tr",

    initialize: function (options) {
        this.template = _.template(ScheduleItemTemplate);
        this.options = options;

        setInterval(_.bind(function () {
            this.render();
        }, this), 1 * 1000);
    },

    render: function () {
        this.$el.html(this.template());
        return this;
    },

    location: function () {
        return this.options.location;
    },

    nextTime: function () {
        return this.options.time;
    },

    timeLeft: function () {
        var d = new Date();
        var now = (d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds();
        var offset = Math.max(0, this.options.offset - now);

        var output = "";

        var hours = Math.floor(offset / (60 * 60));
        if (hours > 0) {
            output = (hours < 10 ? "0".concat(hours) : hours) + ":";
        }

        var minutes = Math.floor((offset / 60)) % 60;
        output = output + (minutes < 10 ? "0".concat(minutes) : minutes) + ":";

        var seconds = offset % 60;
        output = output + (seconds < 10 ? "0".concat(seconds) : seconds);

        return output;
    }
});