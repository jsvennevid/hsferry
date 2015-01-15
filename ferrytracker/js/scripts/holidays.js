function getEasterDay(date) {
    var year = date.getFullYear();

    var a = year % 19;
    var b = year % 4;
    var c = year % 7;
    var k = Math.floor(year / 100);
    var p = Math.floor((13 + (8*k)) / 25);
    var q = Math.floor(k / 4);
    var M = (15 - p + k - q) % 30;
    var N = (4 + k - q) % 7;
    var d = (19 * a + M) % 30;
    var e = (2 * b + 4 * c + 6 * d + N) % 7;

    var day = 24 * 60 * 60 * 1000;
    var base = moment([year, 2, 22]);

    var target = base.add((d + e), 'days').toDate();

    if ((d == 29 && e == 6) && ((target.getMonth() + 1) == 4) && (target.getDate() == 26)) {
        target.setDate(19);
    }

    if ((d == 28 && e == 6 && (((11 * M + 11) % 30) < 19)) && ((target.getMonth() + 1) == 4) && (target.getDate() == 25)) {
        target.setDate(18);
    }

    return target;
}

/* Missing holidays are not listed since they don't impact schedule */
var holidays = [
    /* Nyårsdagen */
    [1,1],
    /* Trettondagsafton */
    [1,5],
    /* Trettondedag jul */
    [1,6],

    /* Långfredagen - Annandag påsk */
    function (date) {
        var easterDay = getEasterDay(date);
        var start = moment(easterDay).add(-2, 'days').toDate();
        var end = moment(easterDay).add(2, 'days').toDate();
        return (date.getTime() >= start.getTime()) && (date.getTime() < end.getTime());
    },

    /* Första maj */
    [5,1],

    /* Kristi himmelfärdsdag */
    function (date) {
        var easterDay = getEasterDay(date);

        var start = moment(easterDay).add(6,'weeks').add(-3,'days').toDate();
        var end = moment(start).add(1,'days').toDate();

        return (date.getTime() >= start.getTime()) && (date.getTime() < end.getTime());
    },

    /* Sveriges nationaldag */
    [6,1],

    /* Midsommarafton */
    function (date) {
        var start = moment([date.getFullYear(), 5, 19]).day(5).toDate();
        var end = moment(start).add(1, 'days').toDate();

        return (date.getTime() >= start.getTime()) && (date.getTime() < end.getTime());
    },

    /* Julafton */
    [12,24],
    /* Juldagen */
    [12,25],
    /* Annandag Jul */
    [12,26],

    /* Nyårsafton */
    [12,31]
];

function isHoliday(date) {
    return _.some(holidays, function (holiday) {
        if (_.isFunction(holiday)) {
            return holiday(date);
        } else if (_.isArray(holiday)) {
            return ((date.getMonth() + 1) == holiday[0]) && (date.getDate() == holiday[1]);
        } else {
            return false;
        }
    });
}
