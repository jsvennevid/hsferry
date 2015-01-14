var app = new (FerryTracker.Router.extend({
    initialize: function () {
    },

    routes: {
        "": "showDeparture"
    },


    showDeparture: function () {
        this.showView("#body", new DepartureView({ schedule: this.schedule }));
    }
}));

async.parallel([
    function (callback) {
        $.ajax({
            url: "data/schedule.json",
            dataType: "json"
        }).done(function (data) {
            app.schedule = new Schedule(data);
        }).always(function () {
            callback();
        });
    }, Template.preload
], function () {
    if (!Backbone.History.started) {
        Backbone.history.start();
    }
});

