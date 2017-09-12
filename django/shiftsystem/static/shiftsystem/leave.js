// Set today as min of "startDayLeave".
function minTodayLeave() {

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;  // January is 0!
    var yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    today = yyyy + '-' + mm + '-' + dd;

    document.getElementById("startDayLeave").setAttribute("min", today);
    document.getElementById("endDayLeave").setAttribute("min", today);
}


// Set startDayLeave as min of "endDayLeave".
function minEndLeave() {

    var startDayLeave = document.getElementById("startDayLeave").value;

    document.getElementById("endDayLeave").setAttribute("value", startDayLeave);
    document.getElementById("endDayLeave").setAttribute("min", startDayLeave);
}


// Set startTimeLeave as value of "endTimeLeave".
function minEndTimeLeave() {

    var startTimeLeave = document.getElementById("startTimeLeave").value;

    document.getElementById("endTimeLeave").setAttribute("value", startTimeLeave);
}


// Remove time inputs if fullDay is checked
function removeTimeLeave() {

    var fullDay = document.getElementById("fullDay").checked;

    if (fullDay) {
        document.getElementById("startTimeLeave").setAttribute("type", "hidden");
        document.getElementById("endTimeLeave").setAttribute("type", "hidden");
        // only fullDay event could have different start/end date.
        document.getElementById("endDayLeave").disabled = false;
    } else {
        document.getElementById("startTimeLeave").setAttribute("type", "time");
        document.getElementById("endTimeLeave").setAttribute("type", "time");
        // only fullDay event could have different start/end date.
        document.getElementById("endDayLeave").disabled = true;
    }
}


// Press button "Submit" to submit input events into database.
//function submitLeave() {
//
//    // the workers username and employ_id
//    var username = document.getElementById('worker').value.split('-')[0];
////    var employ_id = document.getElementById('worker').value.split('-')[1];
//
//    // the input value of start/end date object, e.g. string "2017-04-08"
//    var startDayLeave = document.getElementById("startDayLeave").value;
//    var endDayLeave = document.getElementById("endDayLeave").value;
//
//    // the input value of start/end time object, e.g. string "23:00"
//    // note that if the value of a time object is empty, it would be "00:00"
//    var startTimeLeave = document.getElementById("startTimeLeave").value;
//    var endTimeLeave = document.getElementById("endTimeLeave").value;
//
//    // store the input value of start/end datetime objects
//    var startDateLeave = new Date(startDayLeave + " " + startTimeLeave);
//    var endDateLeave = new Date(endDayLeave + " " + endTimeLeave);
//
//    // Get the selected value of leaveType and deputy in "index.html".
//    var leave_type = document.getElementById('leaveType').value;
//    var deputy = document.getElementById('deputy').value;
//
//    var valid = "good";
//    var fullDay = document.getElementById("fullDay").checked;
//
//    // if fullDay is checked, set startDateLeave to startDayLeave 00:00, and endDateLeave to (endDayLeave + 1) 00:00.
//    if (fullDay) {
//        startDateLeave.setHours(0);
//        startDateLeave.setMinutes(0);
//        endDateLeave.setDate(endDateLeave.getDate() + 1);
//        endDateLeave.setHours(0);
//        endDateLeave.setMinutes(0);
//    }
//    // only fullDay event could have different start/end date, here's to prevent if something went wrong.
//    else if (startDateLeave.getDate() != endDateLeave.getDate()) {
//        valid = "bad";
//        alertify.showFailure(
//            "Please check 'Full Day' to input different days.<br>" +
//            "Un-check 'Full Day' to input different times"
//        );
//    }
//    // the end must be greater than the start, raise an alert if not.
//    else if (startDateLeave >= endDateLeave) {
//        valid = "bad";
//        alertify.showFailure(
//            "The end must be greater than the start.<br>" +
//            "Perhaps to check the input time again?"
//        );
//    }
//
//    // after the validation of the input values ...
//    if (valid == "good") {
//
//        console.log('input values:');
//        console.log('leave start', startDateLeave);
//        console.log('leave end', endDateLeave);
////        console.log('the result goes here ...\n');
//
//        // catches only current workers shifts on calendar
//        var userShiftsOnCal = [];
//        for (var i = 0; i < MODULE.shiftsOnCalendar.length; i++) {
//            if (MODULE.shiftsOnCalendar[i].worker == username) {
//                userShiftsOnCal.push(MODULE.shiftsOnCalendar[i])
//            }
//        }
//
//        // compare the event with those are rendered from database.
//        var noMatchCount = 0;  // count the number of no match userShiftsOnCal.
//        var leaveEvent = {};  // the event storing the leave data, this one is for save changes into model Leave.
//        var eventsLeave = [];
//
//        for (var i = 0; i < userShiftsOnCal.length; i++) {
//
//            // the event storing the leave data, this one is for save changes into model Schedule.
//            var scheduleEvent = {};
//
//            // If fullDay is checked, the shift with any matched start must be a full day leave,
//            // except for the ONLY shift type that cross a day, which is swing shift.
//            // This ensures that, for example, if one has checked fullDay and input startDateLeave as 2017-04-12.
//            // The swing shift which starts on 2017-04-11 should not be counted as leave event, though it ends
//            // on 2017-04-12.
//            if (fullDay) {
//                // the shift starts in between of the input leave duration must be a full day leave.
//                if ( startDateLeave <= userShiftsOnCal[i].start && userShiftsOnCal[i].start < endDateLeave ) {
//                    if (userShiftsOnCal[i].type == 'Swing') {
//
//                    } else {
//                        console.log('applying full leave on (', userShiftsOnCal[i].start, userShiftsOnCal[i].end, ') ...');
//
//                        scheduleEvent.action = 'update';
//                        scheduleEvent.worker = username;  // worker.username
//                        scheduleEvent.type = userShiftsOnCal[i].type;
//                        // leverage start/end to filter out the instance of Schedule that needs to update
//                        scheduleEvent.start = userShiftsOnCal[i].start.getTime();
//                        scheduleEvent.end = userShiftsOnCal[i].end.getTime();
//                        scheduleEvent.title = 'Full Day';  // leave start/end as event title
//
//                        eventsLeave.push(scheduleEvent);  // pushing the array if it belongs to the user
//                    }
//                }
//                else {  // others should be invalid events.
//                    noMatchCount += 1;
//                }
//            }
//            else {  // if fullDay is not checked, the input duration should be less than 24 hours.
//                // make sure that the date of input and shift are on the same date.
//                if ( startDateLeave.getMonth() == userShiftsOnCal[i].start.getMonth() &&
//                startDateLeave.getDate() == userShiftsOnCal[i].start.getDate() ) {
//                    console.log('applying partial leave on (', userShiftsOnCal[i].start, userShiftsOnCal[i].end, ') ...');
//                    var leaveHours = "";
//                    leaveHours = startDateLeave.getHours() + ":" + startDateLeave.getMinutes() + "-" +
//                                endDateLeave.getHours() + ":" + endDateLeave.getMinutes();
//
//                    scheduleEvent.action = 'update';
//                    scheduleEvent.worker = username;  // worker.username
//                    scheduleEvent.type = userShiftsOnCal[i].type;
//                    // leverage start/end to filter out the instance of Schedule that needs to update
//                    scheduleEvent.start = userShiftsOnCal[i].start.getTime();
//                    scheduleEvent.end = userShiftsOnCal[i].end.getTime();
//                    scheduleEvent.title = leaveHours;  // leave start/end as event title
//
//                    eventsLeave.push(scheduleEvent);  // pushing the array if it belongs to the user
//                }
//                else {  // others should be invalid events.
//                    noMatchCount += 1;
//                }
//            }
//        }
//
//        if (noMatchCount == userShiftsOnCal.length) {  // if all userShiftsOnCal have no match to the input values.
//            alertify.showFailure(
//                "No shift matches to the input value.<br>" +
//                "Perhaps to check the start/end date again?"
//            );
//        } else {  // save the eventsLeave if at least one event is valid.
//            leaveEvent.action = 'leave';
//            leaveEvent.worker = username;  // worker.username
//            leaveEvent.start = startDateLeave.getTime();
//            leaveEvent.end = endDateLeave.getTime();
//            leaveEvent.type = leave_type;
//            leaveEvent.deputy = deputy;
//
//            eventsLeave.push(leaveEvent);
//
//            var json_string = JSON.stringify(eventsLeave);
//            $.ajax({
//                type: "POST",
//                url: "secret/save/",
//                data: {item: json_string},
//                success: function(data) {
//                    console.log('You have successfully executed...');
//                    for (var i = 0; i < data.length; i++) {
//                        console.log(data[i]);
//                    }
//                    reFetchEventsFromDB();
//                }
//            });
//        }
//    }
//}


// Lets go debugging!
function debug() {

    console.log('[DEBUG]');
    // test script goes ...

    // declare some variables to store input values
    var username = document.getElementById('worker').value.split('-')[0];
//    var employ_id = document.getElementById('worker').value.split('-')[1];
    var startDayLeave = document.getElementById("startDayLeave").value;  // string "2017-04-08"
    var endDayLeave = document.getElementById("endDayLeave").value;
    var startTimeLeave = document.getElementById("startTimeLeave").value;  // string "23:00", default "00:00"
    var endTimeLeave = document.getElementById("endTimeLeave").value;
    // then convert them as start/end datetime objects
    var startDateLeave = new Date(startDayLeave + " " + startTimeLeave);
    var endDateLeave = new Date(endDayLeave + " " + endTimeLeave);
    // get some other selected value in "index.html"
    var leave_type = document.getElementById('leaveType').value;
    var deputy = document.getElementById('deputy').value;
    var fullDay = document.getElementById("fullDay").checked;

    // catches only current workers and non-leave shifts on calendar
    var userShiftsOnCal = [];
    for (var i = 0; i < MODULE.shiftsOnCalendar.length; i++) {
        if (MODULE.shiftsOnCalendar[i].worker == username && !(MODULE.shiftsOnCalendar[i].title)) {
            userShiftsOnCal.push(MODULE.shiftsOnCalendar[i])
        }
    }
    // checks the worker shifts on calendar
    console.log("current worker: ", username);
    console.log("total shift number: ", userShiftsOnCal.length);
    console.log(userShiftsOnCal);

    // if fullDay is checked, set startDateLeave to startDayLeave 00:00, and endDateLeave to (endDayLeave + 1) 00:00.
    if (fullDay) {
        startDateLeave.setHours(0);
        startDateLeave.setMinutes(0);
        endDateLeave.setDate(endDateLeave.getDate() + 1);
        endDateLeave.setHours(0);
        endDateLeave.setMinutes(0);
    }
    // some other validations of input start/end values when not checking fullDay
    // only fullDay event could have different start/end date, here's to prevent if someone tries to break it.
    else if (startDateLeave.getDate() != endDateLeave.getDate()) {
        alertify.showFailure(
            "Please check 'Full Day' for different start/end dates.<br>" +
            "Un-check 'Full Day' for different start/end times on the same date."
        );
    }
    // the end must be greater than the start, raise an alert if not.
    else if (startDateLeave >= endDateLeave) {
        alertify.showFailure(
            "The end must be greater than the start.<br>" +
            "Perhaps to check the input start/end times again?"
        );
    }

    console.log('leave start: ', startDateLeave);
    console.log('leave end: ', endDateLeave);

    var leaveEvents = [];  // final output data
    // check all shifts to apply leave event on the date
    for (var i = 0; i < userShiftsOnCal.length; i++) {
        var leave = {}
        // if full day is checked
        if (fullDay) {
            // the shift starts in between of the input leave duration must be a full day leave.
            if (startDateLeave <= userShiftsOnCal[i].start && userShiftsOnCal[i].start < endDateLeave) {

                leave.action = 'leave';
                // leverage start/end to filter out the instance of worker shift that needs to update
                leave.start = userShiftsOnCal[i].start.getTime();
                leave.end = userShiftsOnCal[i].end.getTime();
                leave.type = userShiftsOnCal[i].type;  // shift type
                leave.worker = username;  // worker.username
                leave.leave_type = leave_type;  // leave type
                leave.deputy = deputy;
                leave.title = 'Full Day';  // record leave start/end time on shift title

                leaveEvents.push(leave);
            }
        }
        // if full day is not checked
        else {
            return;
        }
    }

    // when no match shift was found, fire an alert
    if (leaveEvents.length == 0) {
        alertify.showFailure(
            "No shift exists in between the leave start/end dates.<br>" +
            "Perhaps to check the start/end dates, or current worker?"
        );
    }
    // post the leaveEvents to backend if at least one event is valid.
    else {

        var json_string = JSON.stringify(leaveEvents);
        $.ajax({
            type: "POST",
            url: "secret/save/",
            data: {item: json_string},
            success: function(data) {
                console.log('You have successfully executed...');
                for (var i = 0; i < data.length; i++) {
                    console.log(data[i]);
                }
                reFetchEventsFromDB();
            }
        });
    }
}
