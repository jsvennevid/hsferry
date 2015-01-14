var app = new (Backbone.Router.extend({
    initialize: function () {
    },

    routes: {
        "": "showSchedule"
    },


    showSchedule: function () {
        this.showView("#body", new ScheduleView(this.schedule));
    },

    showView: function (anchor, view) {
        if (this._activeView) {
            this._activeView.close();
            delete this._activeView;
        }

        if (view) {
            $(anchor).html(view.render().el);
            this._activeView = view;
        }
    }
}));

$.ajax({
    url: "schedule.json",
    dataType: "json"
}).done(function (data) {
    app.schedule = data;
}).always(function () {
    if (!Backbone.History.started) {
        Backbone.history.start();
    }
});