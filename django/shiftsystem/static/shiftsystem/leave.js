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


// Press button "Submit" to submit input events into database. (unfinished)
function submitLeave() {

    // the workers username and employ_id
    var username = document.getElementById('worker').value.split('-')[0];
//    var employ_id = document.getElementById('worker').value.split('-')[1];

    // the input value of start/end date object, e.g. string "2017-04-08"
    var startDayLeave = document.getElementById("startDayLeave").value;
    var endDayLeave = document.getElementById("endDayLeave").value;

    // the input value of start/end time object, e.g. string "23:00"
    // note that if the value of a time object is empty, it would be "00:00"
    var startTimeLeave = document.getElementById("startTimeLeave").value;
    var endTimeLeave = document.getElementById("endTimeLeave").value;

    // store the input value of start/end datetime objects
    var startDateLeave = new Date(startDayLeave + " " + startTimeLeave);
    var endDateLeave = new Date(endDayLeave + " " + endTimeLeave);

    // Get the selected value of leaveType and deputy in "index.html".
    var leave_type = document.getElementById('leaveType').value;
    var deputy = document.getElementById('deputy').value;

    var valid = "good";

    var fullDay = document.getElementById("fullDay").checked;
    if (fullDay) {
    // if fullDay is checked, set startDateLeave to startDayLeave 00:00, and endDateLeave to (endDayLeave + 1) 00:00.
        startDateLeave.setHours(0);
        startDateLeave.setMinutes(0);
        endDateLeave.setDate(endDateLeave.getDate() + 1);
        endDateLeave.setHours(0);
        endDateLeave.setMinutes(0);
    }
    else if (startDateLeave.getDate() != endDateLeave.getDate()) {
    // only fullDay event could have different start/end date, here's to ensure of it even someone hand type-in.
        valid = "bad";
        alertify.showFailure(
            "Please check 'Full Day' to input different days.<br>" +
            "Un-check 'Full Day' to input different times"
        );
    }
    else if (startDateLeave >= endDateLeave) {
    // the end must be greater than the start, raise an alert if not.
        valid = "bad";
        alertify.showFailure(
            "The end must be greater than the start.<br>" +
            "Perhaps to check the input time again?"
        );
    }

    // after the validation of the input values ...
    if (valid == "good") {

//        console.log('input values:');
//        console.log('leave start', startDateLeave);
//        console.log('leave end', endDateLeave);
//        console.log('the result goes here ...\n');

        // compare the event with those are rendered from database.
        var calendarEvents = MODULE.shiftsOnCalendar;
        var noMatchCount = 0;  // count the number of no match calendarEvents.
        var leaveEvent = {};  // the event storing the leave data, this one is for save changes into model Leave.
        var eventsAdd = [];

        for (var i = 0; i < calendarEvents.length; i++) {

            // the event storing the leave data, this one is for save changes into model Schedule.
            var scheduleEvent = {};

            // if fullDay is checked, the shift with any matched start must be a full day leave.
            // Exclude the matched end for the ONLY shift type that cross a day, which is swing shift.
            // This ensures that, for example, if one has checked fullDay and startDateLeave of 2017-04-12.
            // The swing shift which starts on 2017-04-11 should not be counted as leave event, though it ends
            // on 2017-04-12.
            if (fullDay) {
                if (  // the shift starts in between of the input leave duration must be a full day leave.
                startDateLeave <= calendarEvents[i].start &&
                calendarEvents[i].start < endDateLeave
                ) {
                    console.log('applying full leave on (', calendarEvents[i].start, calendarEvents[i].end, ') ...');

                    scheduleEvent.action = 'update';
                    scheduleEvent.worker = username;  // worker.username
                    scheduleEvent.type = calendarEvents[i].type;
                    // leverage start/end to filter out the instance of Schedule that needs to update
                    scheduleEvent.start = calendarEvents[i].start.getTime();
                    scheduleEvent.end = calendarEvents[i].end.getTime();
                    scheduleEvent.title = 'Full Day';  // leave start/end as event title

                    eventsAdd.push(scheduleEvent);  // pushing the array if it belongs to the user
                }
                else {  // others should be invalid events.
                    noMatchCount += 1;
                }
            }
            else {  // if fullDay is not checked, the input duration should be less than 24 hours.
                if (  // make sure that the date of input and shift are on the same date.
                startDateLeave.getMonth() == calendarEvents[i].start.getMonth() &&
                startDateLeave.getDate() == calendarEvents[i].start.getDate()
                ) {
                    console.log('applying partial leave on (', calendarEvents[i].start, calendarEvents[i].end, ') ...');
                    var leaveHours = "";
                    leaveHours = startDateLeave.getHours() + ":" + startDateLeave.getMinutes() + "-" +
                                endDateLeave.getHours() + ":" + endDateLeave.getMinutes();

                    scheduleEvent.action = 'update';
                    scheduleEvent.worker = username;  // worker.username
                    scheduleEvent.type = calendarEvents[i].type;
                    // leverage start/end to filter out the instance of Schedule that needs to update
                    scheduleEvent.start = calendarEvents[i].start.getTime();
                    scheduleEvent.end = calendarEvents[i].end.getTime();
                    scheduleEvent.title = leaveHours;  // leave start/end as event title

                    eventsAdd.push(scheduleEvent);  // pushing the array if it belongs to the user
                }
                else {  // others should be invalid events.
                    noMatchCount += 1;
                }
            }
        }

        if (noMatchCount == calendarEvents.length) {  // if all calendarEvents have no match to the input values.
            alertify.showFailure(
                "No shifts match to the input values.<br>" +
                "Perhaps to check the start/end date again?"
            );
        } else {  // save the eventsAdd if at least one event is valid.
            leaveEvent.action = 'leave';
            leaveEvent.worker = username;  // worker.username
            leaveEvent.start = startDateLeave.getTime();
            leaveEvent.end = endDateLeave.getTime();
            leaveEvent.type = leave_type;
            leaveEvent.deputy = deputy;

            eventsAdd.push(leaveEvent);

            var json_string = JSON.stringify(eventsAdd);
            $.ajax({
                type: "POST",
                url: "secret/save/",
                data: {item: json_string},
                success: function(data) {
                    console.log('Django has responded:');
                    for (var i = 0; i < data.length; i++) {
                        console.log(data[i]);
                    }
                    console.log('Refetching events from the database ...');
                    $('#calendar').fullCalendar('refetchEvents');
                }
            });
        }
    }
}


// Lets go debugging!
function debug() {

    console.log('debug button clicked ...');
    // test script goes ...

    // checking the database contents of shiftsOnCalendar
    console.log("total database events:", MODULE.shiftsOnCalendar.length);
    console.log("database are", MODULE.shiftsOnCalendar);
}
