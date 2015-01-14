function getEasterDay() {
    var d = new Date();
    return d;
}

function getMidsummerDay() {
    var d = new Date();
    return d;
}

function getAllSaintsDay() {
    var d = new Date();
    return d;
}

var holidays = [
    /* Nyårsdagen */
    [1,1],
    /* Trettondagsafton */
    [1,5],
    /* Trettondedag jul */
    [1,6],

    /* Skärtorsdagen */
    /* Långfredagen */
    /* Påskafton */
    /* Påskdagen */
    /* Annandag påsk */

    /* Valborgsmässoafton */
    /* Första maj */
    [5,1],

    /* Kristi himmelfärdsdag */
    /* Sveriges nationaldag */

    /* Pingstafton */
    /* Pingstdagen */

    /* Midsommarafton */
    /* Midsommardagen */

    /* Allhelgonaafton */
    /* Alla helgons dag */

    /* Julafton */
    [12,24],
    /* Juldagen */
    [12,25],
    /* Annandag Jul */
    [12,26],

    /* Nyårsafton */
    [12,31],
];

function isHoliday(date) {
    var d = new Date();

    return _.some(holidays, function (holiday) {
        if (_.isFunction(holiday)) {
            return holiday(date);
        } else if (_.isArray(holiday)) {
            return ((d.getMonth() + 1) == holiday[0]) && (d.getDate() == holiday[1]);
        } else {
            return false;
        }
    });
}
