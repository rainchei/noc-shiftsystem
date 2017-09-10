// render the events from database on the calendar.
$(document).ready(function() {

    // page is now ready, initialize the calendar...
    $('#calendar').fullCalendar({
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
                alert('There was an error while fetching events.');
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

            var event = normalizeEvent(event_click);
            event.action = "delete";

            var eventsAdd = [];  // an array for storing events to be deleted.
            // check if the event belongs to the user
            var username = document.getElementById('worker').value.split('-')[0];
            if (event.worker == username) {

                // Saving newly added events into the database ...
                eventsAdd.push(event);  // pushing the array if it belongs to the user
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
            } else {
                window.alert(
                    "Sorry,\n" +
                    "You are not the owner of this shift.\n" +
                    "Perhaps to check the worker again?"
                );
            }
        },
    });

    // set the default values of the members to all checked in the shift filter
    $("#nocs").prop("checked", true);
    $("input[name='noc']").prop("checked", true);

    // select all and deselect all members
    $("#nocs").click(function() {

        if($("#nocs").prop("checked")) {
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
