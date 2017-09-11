// cancel the schedule title after deleting the leave events
function updateDeleted(worker, start, end) {

    var worker = worker;
    var start = new Date(start);
    var end = new Date(end);

    // if start/end are on the same date, plus one day to end date, in order to cancel on the start date.
    if (String(start) == String(end)) {
        end.setDate(end.getDate() + 1);
    }

    var event = {};
    event.action = 'cancel';
    event.worker = worker;
    event.start = start.getTime();
    event.end = end.getTime();

    var eventsCancel = [];

    // Saving newly added events into the database ...
    eventsCancel.push(event);
    var json_string = JSON.stringify(eventsCancel);
    $.ajax({
        type: "POST",
        url: "/shiftsystem/secret/save/",
        data: {item: json_string},
        success: function(data) {
            console.log('Django has responded:');
            for (var i = 0; i < data.length; i++) {
                console.log(data[i]);
            }
        }
    });
    location.reload();  // reload the page to refresh the contents
}