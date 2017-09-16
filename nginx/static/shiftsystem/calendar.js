// render the events from database on the calendar.
$(document).ready(function() {

    // page is now ready, initialize the calendar...
    $('#calendar').fullCalendar({

        editable: false,

        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,listMonth'
        },

        events: {
            url: "secret/schedules/",
            type: 'get',
            success: function(events) {
                getShiftsOnCalendar(events);  // save all unfiltered events first
                checkCheckbox();
                events = $.map(events, function(e) {
                    if (shiftHasFilteredOut(e))
                        return null;
                    else
                        return enableWorkerShifts(e);
                });
                return events;
            },
            error: function() {
                alert('There is an error while fetching events from database.');
            }
        },

        timeFormat: 'H(:mm)', // displaying all events in a 24-hour format, uppercase H for 24-hour clock

        // display description when hovering onto events
        eventRender: function(event, element) {
            element.attr('title', event.description);
        },

        // send an event of "delete" to database
        eventClick: function(event_click, element) {
            if (event_click.editable != true) {
                alertify.showWarning(
                    "You cannot edit this shift.<br>" +
                    "Perhaps to check the worker again?"
                );
            }
            else {  // if shift is editable
            var event = normalizeEvent(event_click);
                if (event_click.textColor == 'black') {  // cancelling leaves
                    alertify.confirm(
                        "You are about to...",
                        "Cancel the leave of <font style='color: " + event_click.color + "'>" + event_click.worker +
                        " </font> on <font style='color: red'>" + event_click.start['_i'].toDateString() + "</font>.",
                        function() {  // when 'ok' is clicked
                            event.action = "cancel";
                            var eventsCel = [];  // an array for storing leaves to be cancelled.
                            // ask the database to cancel the leave...
                            eventsCel.push(event);
                            var json_string = JSON.stringify(eventsCel);
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
                            alertify.success('Leave cancelled.')
                        },
                        function() { alertify.error("Cancelled.") }  // when 'cancel' is clicked
                    );
                } else {  // deleting shifts
                    alertify.confirm(
                        "You are about to...",
                        "Delete <font style='color: " + event_click.color + "'>" + event_click.worker +
                        " </font> on <font style='color: red'>" + event_click.start['_i'].toDateString() + "</font>.",
                        function() {  // when 'ok' is clicked
                            if (event_click.swap_from) {
                                var swap_event = normalizeEvent(event_click);
                                swap_event.action = "delete_swap";
                                swap_event.start = swap_event.swap_from;
                                swap_event.end = swap_event.swap_to;
                            }
                            event.action = "delete";
                            var eventsDel = [];  // an array for storing events to be deleted.
                            // ask the database to delete the shift, and the swap...
                            eventsDel.push(event, swap_event);
                            var json_string = JSON.stringify(eventsDel);
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
                            alertify.success('Shift deleted.')
                        },
                        function() { alertify.error("Cancelled.") }  // when 'cancel' is clicked
                    );
                }
            }
        },

        eventDrop: function(event_moved, delta, revertFunc) {
            if (event_moved.title) {  // the shifts having leave applied could not be moved.
                revertFunc();
                alertify.showWarning(
                    "Please cancel the leave before moving the shift."
                );
            } else {
                // from this date
                var from_date = event_moved.start['_i'];
                // change to this date
                var to_date_s = new Date(Number(event_moved.start));  // this time would somehow has been plus 8 hours.
                var to_date_e = new Date(Number(event_moved.end));  // this time would somehow has been plus 8 hours.
                alertify.confirm(
                    "You are about to...",
                    "Move <font style='color: " + event_moved.color + "'>" + event_moved.worker +
                    " </font> from <font style='color: red'>" + from_date.toDateString() + "</font> to " +
                    "<font style='color: red'>" + to_date_s.toDateString() + "</font>.<br>" +
                    "<div class='checkbox'><label for='swap'><input type='checkbox' id='swap'><strong> Swap</strong></label></div>",
                    function() {  // when 'ok' is clicked
                        var from_event = normalizeEvent(event_moved);
                        from_event.action = "delete";
                        var to_event = normalizeEvent(event_moved);
                        to_event.action = "add";
                        to_event.start = to_date_s.getTime() - 28800000;  // 8 hours = 28800 seconds
                        to_event.end = to_date_e.getTime() - 28800000;
                        to_event.id = event_moved.id.slice(0,7) + to_event.start;
                        // let's validate that...
                        // a shift cannot be save twice (with same id)
                        var overlap = false;
                        var to_event_s = new Date(to_event.start);
                        var today = new Date();
                        for (var i = 0; i < MODULE.shiftsOnCalendar.length; i++) {
                            if (MODULE.shiftsOnCalendar[i].id == to_event.id) {
                                overlap = true;
                                console.log("[ERROR] " + to_event.worker + " on", to_event_s, "is already saved in db.");
                                break;
                            }
                        }
                        if (overlap) {
                            revertFunc();
                            alertify.showFailure(
                                "Oops! Something went wrong...<br>" +
                                "For more detail, please open the console log."
                            );
                        } else if (to_event_s < today) {  // the shift cannot be moved to the date before today.
                            revertFunc();
                            alertify.showWarning(
                                "The shift cannot be moved to the date before today."
                            );
                        } else {
                            var eventsDrop = [];  // an array for storing shifts to be deleted(from) and to be added(to).
                            // ask the database to delete/add the from_event/to_event...
                            eventsDrop.push(from_event, to_event);
                            // if swap is checked, ask the database to add the swap event
                            if (swapCheck()) {
                                var swap_event = normalizeEvent(event_moved);
                                swap_event.action = "swap";
                                swap_event.start = from_event.start;  // from_date
                                swap_event.end = to_event.start;  // to_date

                                eventsDrop.push(swap_event);
                            }
                            console.log(eventsDrop);

                            var json_string = JSON.stringify(eventsDrop);
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
                            alertify.success(from_date.toDateString() + ' moved to ' + to_date_s.toDateString())
                        }
                    },
                    function() {  // when 'cancel' is clicked
                        revertFunc();
                        alertify.error("Cancelled.")
                    }
                );
            }
        }
    });

    // shift filter
    // set the default values of the members to all checked in the shift filter
    $("#nocs").prop("checked", true);  // all members
    $("input[name='noc']").prop("checked", true);  // single member
    checkCheckbox();
    reFetchEventsFromDB();
    // select all and deselect all members
    $("#nocs").click(function() {
        if ($("#nocs").prop("checked")) {
            $("input[name='noc']").prop("checked", true);
            reFetchEventsFromDB();
        }
        else {
            $("input[name='noc']").prop("checked", false);
            console.log('Removing events on the calendar...');
            $('#calendar').fullCalendar('removeEvents');
        }
    });
    // select single user
    $("input[name='noc']").click(function() {
        checkCheckbox();
        reFetchEventsFromDB();
    });
});
