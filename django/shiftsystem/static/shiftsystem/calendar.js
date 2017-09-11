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
            success: function(doc) {
                console.log('Received', $(doc).length, 'events.');
            },
            error: function() {
                alert('There is an error while fetching events.');
            }
        },

        timeFormat: 'H(:mm)', // displaying all events in a 24-hour format, uppercase H for 24-hour clock

        // display description when hovering onto events
        eventRender: function(event, element) {

            element.attr('title', event.description);
        },

        // triggered after all events have finished rendering, and after pressing prev/next.
        loading: function(bool) {
            if (bool) {
                console.log('The events are being populated from the database ...');
            }
            else {
                console.log('The events have been populated. Start initializing ...');
                initialize();
            }
        },

        // send an event of "delete" to database
        eventClick: function(event_click, element) {
            if (event_click.editable == true) {
                alertify.showFailure(
                    "This shift is not editable.<br>" +
                    "Perhaps to check the worker again?"
                );
            }
            else {  // if shift is editable
                var event = normalizeEvent(event_click);

                if (event_click.textColor == 'black') {  // cancelling leaves
                    event.action = "cancel";
                    var eventsCel = [];  // an array for storing leaves to be cancelled.

                    alertify.confirm(
                        "You are about to ...",
                        "Cancel the leave of <font style='color: " + event_click.color + "'>" + event_click.worker +
                        " </font> on <font style='color: red'>" + event_click.start['_i'].split('T')[0] + "</font>.",
                        function() {  // when 'ok' is clicked
                            // Saving newly added events into the database ...
                            eventsCel.push(event);  // pushing the array if it belongs to the user
                            var json_string = JSON.stringify(eventsCel);
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
                            alertify.success('Leave cancelled.')
                        },
                        function() { alertify.error("Cancelled.") }  // when 'cancel' is clicked
                    );


                } else {  // deleting shifts
                    event.action = "delete";
                    var eventsDel = [];  // an array for storing events to be deleted.

                    alertify.confirm(
                        "You are about to ...",
                        "Delete <font style='color: " + event_click.color + "'>" + event_click.worker +
                        " </font> on <font style='color: red'>" + event_click.start['_i'].split('T')[0] + "</font>.",
                        function() {  // when 'ok' is clicked
                            // Saving newly added events into the database ...
                            eventsDel.push(event);  // pushing the array if it belongs to the user
                            var json_string = JSON.stringify(eventsDel);
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
                            alertify.success('Shift deleted.')
                        },
                        function() { alertify.error("Cancelled.") }  // when 'cancel' is clicked
                    );
                }
            }
        },
    });

    // set the default values of the members to all checked in the shift filter
    $("#nocs").prop("checked", true);
    $("input[name='noc']").prop("checked", true);

    // select all and deselect all members
    $("#nocs").click(function() {

        if ($("#nocs").prop("checked")) {
            $("input[name='noc']").prop("checked", true);
            console.log('Refetching events from the database ...');
            $('#calendar').fullCalendar('refetchEvents');
        }
        else {
            $("input[name='noc']").prop("checked", false);
            console.log('Removing events on the calendar ...');
            $('#calendar').fullCalendar('removeEvents');
        }
    });

    // select single user
    $("input[name='noc']").click(function() {

        $('#calendar').fullCalendar('refetchEvents');
        initialize();
    });

    // because the event which triggered after all shifts have been rendered could not be located,
    // force it to return initial status after clicking prev/next button.
    $('body').on('click', 'button.fc-prev-button', function() {
        // set the default values of the members to all checked in the shift filter
        $("#nocs").prop("checked", true);
        $("input[name='noc']").prop("checked", true);
    });
    $('body').on('click', 'button.fc-next-button', function() {
        // set the default values of the members to all checked in the shift filter
        $("#nocs").prop("checked", true);
        $("input[name='noc']").prop("checked", true);
    });
});
