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


// Press button "Submit" to save leave events into database.
function submitLeave() {
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
    // checks the worker shifts on calendar (for debug)
//    console.log("current worker: ", username);
//    console.log("total shift number: ", userShiftsOnCal.length);
//    console.log(userShiftsOnCal);
    // if fullDay is checked, set startDateLeave to startDayLeave 00:00, and endDateLeave to (endDayLeave + 1) 00:00.
    if (fullDay) {
        startDateLeave.setHours(0);
        startDateLeave.setMinutes(0);
        endDateLeave.setDate(endDateLeave.getDate() + 1);
        endDateLeave.setHours(0);
        endDateLeave.setMinutes(0);
    }
    // if full day is not checked, start/end date must be the same.
    else if (startDateLeave.getDate() != endDateLeave.getDate()) {
        alertify.showWarning(
            "Please check 'Full Day' for different start/end dates.<br>" +
            "Non-'Full Day' event could only be applied in one day."
        );
    }
    // checks the leave duration (for debug)
//    console.log('leave start: ', startDateLeave);
//    console.log('leave end: ', endDateLeave);
    var leaveEvents = [];  // final output data
    // check all shifts to apply leave event on the date
    for (var i = 0; i < userShiftsOnCal.length; i++) {
        // if full day is checked
        if (fullDay) {
            // the shift starts in between of the input leave duration must be a full day leave.
            if (startDateLeave <= userShiftsOnCal[i].start && userShiftsOnCal[i].start < endDateLeave) {
                var leave = {}
                // record leave start/end time on shift title
                leave.title = 'Full Day';

                // some other information
                leave.action = 'leave';
                leave.type = userShiftsOnCal[i].type;  // shift type
                leave.worker = username;  // worker.username
                leave.leave_type = leave_type;  // leave type
                leave.deputy = deputy;
                // leverage start/end to filter out the instance of worker shift that needs to update
                leave.start = userShiftsOnCal[i].start.getTime();
                leave.end = userShiftsOnCal[i].end.getTime();

                leaveEvents.push(leave);
            }
        }
        // if full day is not checked, the leave duration should be less than 24 hours.
        else {
            // first, get the target date.
            if (startDateLeave.getMonth() == userShiftsOnCal[i].start.getMonth() &&
            startDateLeave.getDate() == userShiftsOnCal[i].start.getDate() ) {
                var leave = {}
                var leaveHours = "";
                leaveHours = startDateLeave.toTimeString().split(" ")[0].slice(0,5)
                            + "-" + endDateLeave.toTimeString().split(" ")[0].slice(0,5);
                // record leave start/end time on shift title.
                // basically only this is different from the one above, but we duplicate codes to save memory.
                leave.title = leaveHours;

                // some other information
                leave.action = 'leave';
                leave.type = userShiftsOnCal[i].type;  // shift type
                leave.worker = username;  // worker.username
                leave.leave_type = leave_type;  // leave type
                leave.deputy = deputy;
                // leverage start/end to filter out the instance of worker shift that needs to update
                leave.start = userShiftsOnCal[i].start.getTime();
                leave.end = userShiftsOnCal[i].end.getTime();

                leaveEvents.push(leave);
            }
        }
    }
    // when no match shift was found, fire an alert
    if (leaveEvents.length == 0) {
        alertify.showFailure(
            "No non-leaving shift exists in between the leave start/end dates.<br>" +
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


// Lets go debugging!
function debug() {

    console.log('[DEBUG]');
    // test script goes ...
}
