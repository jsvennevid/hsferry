var app = new (FerryTracker.Router.extend({
    initialize: function () {
    },

    routes: {
        "": "showDeparture"
    },

    showDeparture: function () {
        this.showView("#body", new DepartureView({ schedule: this.schedule, geomap: this.geomap }));
    }
}));

async.parallel([
    function (callback) {
        $.ajax({
            url: "ferrytracker/data/schedule.json",
            dataType: "json"
        }).done(function (data) {
            app.schedule = new Schedule(data);
        }).always(function () {
            callback();
        });
    },
    function (callback) {
        $.ajax({
            url: "ferrytracker/data/geo.json",
            dataType: "json"
        }).done(function (data) {
            app.geomap = new GeoMap(data);
        }).always(function () {
            callback();
        });
    },
    Template.preload,
    function (callback) {
        i18n.init({
            detectLngQS: 'lang',
            load: 'unspecific',
            resGetPath: 'ferrytracker/data/locales/__lng__/__ns__.json'
        }, function () {
            callback(null);
        });
    },
    function (callback) {
        addToHomescreen({
            startDelay: 5,
            skipFirstVisit: true
        });
        async.nextTick(callback);
    }
], function () {
    if (!Backbone.History.started) {
        Backbone.history.start();
    }
});

$(document).ready(function () {
    var appCache = window.applicationCache;
    if (appCache) {
        appCache.addEventListener('updateready', function () {
            toastr.options = {
                "positionClass": "toast-bottom-center",
                "timeOut": 10000,
                "onclick": function () {
                    window.location.reload();
                }
            };
            toastr.warning(i18n.t('application.updated.content'), i18n.t('application.updated.title'));
        }, false);
    }
});
