// Set today as min of "startDay" and "endDay".
function minToday() {

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

    document.getElementById("startDay").setAttribute("min", today);
    document.getElementById("endDay").setAttribute("min", today);
}


// Set startDay as min of "endDay".
function minEnd() {

    var startDay = document.getElementById("startDay").value;

    document.getElementById("endDay").setAttribute("value", startDay);
    document.getElementById("endDay").setAttribute("min", startDay);
    document.getElementById("endDay").disabled = false;
}


// Press button "Submit" to save the events into database.
function submitShift() {

    // the workers username and employ_id
    var username = document.getElementById('worker').value.split('-')[0];
    var employ_id = document.getElementById('worker').value.split('-')[1];

    // Get input values from input#startDay, input#endDay in "index.html".
    var startDay = new Date(document.getElementById("startDay").value);
    var endDay = new Date(document.getElementById("endDay").value);
    // Get selected indexes from form#frm1#dayOfWeek in "index.html".
    var dayOfWeek = document.getElementById('dayOfWeek');
    // Loop all options to see which days of week are checked. Push the checked days into an array named "dayOfCheck".
    var dayOfCheck = [];
    for (var i = 0; i < dayOfWeek.options.length; i++) {
        if (dayOfWeek.options[i].selected == true) {
            dayOfCheck.push(i);
        }
    }
    // Loop everyday from startDay to endDay to compare with "dayOfCheck".
    // Get the input dates that matched with "dayOfCheck", and push them into "inputDays".
    var inputDays = [];
    for (var d = startDay; d <= endDay; d.setDate(d.getDate() + 1)) {
        if (dayOfCheck.indexOf(d.getDay()) != -1) {
            // Set the datetime default hour to 0, such as "Tue Mar 28 2017 00:00:00 GMT+0800 (CST)".
            inputDays.push(new Date(d.setHours(0)));
        }
    }

    if (inputDays.length == 0) {
        alertify.showFailure(
            "Oops! Something went wrong...<br>" +
            "Perhaps to check the days of week again?"
        );
    } else {
    // Compare the events with existing ones before saving them into database.
        // Get the selected value from shiftType in "index.html".
        var shiftType = document.getElementById('shiftType').value;
        var eventsAdd = [];  // store events to be added into the database.
        var invalidAdd = 0;  // count the number of invalid input shifts

        for (var i = 0; i < inputDays.length; i++) {

            // the default datetime of inputDays is set to as "Tue Mar 28 2017 00:00:00 GMT+0800 (CST)".
            var start = inputDays[i];
            switch (shiftType) {
                case "Night":
                    break;
                case "Day":
                    start.setHours(9);
                    break;
                case "Swing":
                    start.setHours(15);
            }
            var end = new Date(start);  // new Date() to avoid interfering the content of start.
            end.setTime(start.getTime() + (9.5*60*60*1000));  // shift duration is 9.5 hours.

            var event = {};  // declare new event storing each inputDay values for current worker.
            event = {
                action: 'add',
                worker: username,  // worker.username
                type: shiftType,
                start: start.getTime(),
                end: end.getTime(),
                id: employ_id + start.getTime(),  // worker.employ_id
            };

            // compare the event with those are rendered from database.
            var calendarEvents = MODULE.shiftsOnCalendar;

            // start checking database data...
            var invalid = 0;  // index of comparing the existing calendar events.
            for (var j = 0; j < calendarEvents.length; j++) {
                if (event.id == calendarEvents[j].id) {
                    invalid += 1;
                    invalidAdd += 1;
                    console.log("[ERROR] " + username + " on", start, "is already saved in db.")  // log on console log.
                }
            }
            // only to push this new event if it's not on the current calendar, meaning invalid is emtpy.
            if (invalid == 0) {
                eventsAdd.push(event);  // for saving into database.
            }
        }
        // if any shift already exists on the calendar or any error happens, alertify.alert to check the console log.
        if (invalidAdd == inputDays.length) {
            alertify.showFailure(
                "Oops! Something went wrong...<br>" +
                "For more detail, please open the console log."
            );

        } else if (invalidAdd > 0) {
            // Save newly added events into the database.
            var json_string = JSON.stringify(eventsAdd);
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
            alertify.showFailure(
                invalidAdd + " counts of invalid events.<br>" +
                "For more detail, please open the console log."
            );

        } else {
            // Save newly added events into the database.
            var json_string = JSON.stringify(eventsAdd);
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
}


// Convert the string to datetime for some validations
function normalizeEvent(e) {

    var event = {};
    event = {
        'worker': e.worker,
        'start': e.start['_i'].getTime(),
        'end': e.end['_i'].getTime(),
        'type': e.type,
        'color': e.color,
        'description': e.description,  // split("\n")[0] is username, split("\n")[1] is shift_type
        'id': e.id,
    };

    if (e.swap_from) {
        e_from = new Date(e.swap_from).getTime() - 28800000;  // 8 hours = 28800 seconds
        e_to = new Date(e.swap_to).getTime() - 28800000;  // 8 hours = 28800 seconds
        event.swap_from = e_from;
        event.swap_to = e_to;
    }

    return event;
}


// Return an array of objects in json for some validations
function getShiftsOnCalendar(objectEvents) {

    var event = {};
    var events = [];

    for (var i = 0; i < objectEvents.length; i++) {
        // format 2017-04-14T00:00:00Z
        var start = objectEvents[i].start;
        var end = objectEvents[i].end;
        // start
        var sy = Number(start.split('T')[0].split('-')[0]);  // year
        var sm = Number(start.split('T')[0].split('-')[1]) - 1;  // month, 0 is January
        var sd = Number(start.split('T')[0].split('-')[2]);  // day
        var sh = Number(start.split('T')[1].split(':')[0]);  // hour
        var st = Number(start.split('T')[1].split(':')[1]);  // minute
        // end
        var ey = Number(end.split('T')[0].split('-')[0]);  // year
        var em = Number(end.split('T')[0].split('-')[1]) - 1;  // month, 0 is January
        var ed = Number(end.split('T')[0].split('-')[2]);  // day
        var eh = Number(end.split('T')[1].split(':')[0]);  // hour
        var et = Number(end.split('T')[1].split(':')[1]);  // minute
        // json
        objectEvents[i].start = new Date(sy, sm, sd, sh, st)
        objectEvents[i].end = new Date(ey, em, ed, eh, et)

        events.push(objectEvents[i]);
    }
    // Save the calendar data which rendered from database for later event of invalid comparison
    MODULE.shiftsOnCalendar = events;
}


// Checks whether the members checkbox is checked and update the checked members list
function checkCheckbox() {

    var checkedBox = [];
    $("input[name='noc']:checkbox:checked").each(function() {
        checkedBox.push($(this).val());  // it seems that jquery cannot recognize the module patterns.
    });
    MODULE.checkedMembers = checkedBox;  // update the checked members list
//    console.log(MODULE.checkedMembers);
}


// Checks whether the shift is filtered or not
function shiftHasFilteredOut(e) {

    if (MODULE.checkedMembers.indexOf(e.worker) == -1) {  // shift worker does not exist in checked members list
        return true;
    } else {
        return false;
    }
}


// Refetch events from database
function reFetchEventsFromDB() {
    console.log('Refetching events from the database...');
    $('#calendar').fullCalendar('refetchEvents');
}


// Check current worker and enable his/her shifts on current calendar.
function enableWorkerShifts(e) {
    var employ_id = document.getElementById('worker').value.split('-')[1];
    var today = new Date();
    // editable if the shift...
    // belongs to the current worker; later than today
//    if (e.id.slice(0,7) == employ_id && e.id.slice(7) >= today) {
//        e.editable = true;
//    }
    if (e.id.slice(0,7) == employ_id) {
        e.editable = true;
    }
    return e
}


// Alertify function
// defines warning model using dialog factory
if (!alertify.showWarning) {
    alertify.dialog('showWarning', function factory(){
        return {
            build: function() {
                var html = '<i class="fa fa-cog fa-spin" style="color: red; vertical-align: middle; margin-right: 20px; font-size: 20px;"></i>';
                html += ' WARNING';
                this.setHeader(html);
            }
        };
    }, false, 'alert');
}
// defines error model using dialog factory
if (!alertify.showFailure) {
    alertify.dialog('showFailure', function factory(){
        return {
            build: function() {
                var html = '<i class="fa fa-exclamation-triangle" style="color: red; vertical-align: middle; margin-right: 20px; font-size: 20px;"></i>';
                html += ' ERROR';
                this.setHeader(html);
            }
        };
    }, false, 'alert');
}


function exportCSV() {
    // Get input values from input#startExp, input#endExp in "index.html".
    var startExp = new Date(document.getElementById("startExp").value);
    var endExp = new Date(document.getElementById("endExp").value);
//    endExp.setDate(endExp.getDate() + 1);  // increment one day to end date, so as to include the last date.

    if (isNaN(startExp.getTime()) || isNaN(endExp.getTime())) {
        alertify.showFailure(
            "Oops! Something went wrong...<br>" +
            "Did you forget to input the start/end date?"
        );
    } else {
        var exportType = document.getElementById("exportType").value;
        var loc = 'export/?start=' + startExp.toISOString().slice(0,10).replace(/-/g,"/") +
                    '&end=' + endExp.toISOString().slice(0,10).replace(/-/g,"/") + '&export=' +
                    exportType + '&workers=' + MODULE.checkedMembers.toString();
    //    console.log(loc);
        window.location = loc;
    }

}


// check if day-to-day is checked when moving shifts
function swapCheck() {
    var swap = document.getElementById("swap").checked;
    console.log(swap);
    return swap
}


// Lets go debugging!
function debug() {

    console.log('[DEBUG]');
    // test script goes ...
}