// global module
var MODULE = (function() {

    var pub = {};  // this could be used as a public property/method.
    pub.shiftsOnCalendar = [];  // store calendar data which rendered from database.
    pub.checkedMembers = [];

    return pub;
})();