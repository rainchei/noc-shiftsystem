from django.views.generic import ListView
from django.http import JsonResponse, Http404, HttpResponse
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth.mixins import LoginRequiredMixin
import calendar
import json
import csv

from .models import Schedule, Worker, Swap


class IndexView(LoginRequiredMixin, ListView):
    """
    Render the template index.html to display the page including the calendar view.
    """
    model = Worker
    template_name = 'shiftsystem/index.html'
    login_url = '/login/'


def schedules(request):
    """
    Collect the monthly parameters(start, end) of url request to filter out the worker schedules.
    Make a event for each shifts, then append it into events for displaying on calendar.
    URL request is sent by calendar visiting {% url 'shiftsystem:schedules' %}.
    """
    # calendar's request format: "?start=2017-03-26&end=2017-05-07&_=1491113790262"
    # the _ parameter is to prevent the browser from caching the response.
    start, end = request.GET.get('start'), request.GET.get('end')  # request returns string only

    sy, sm, sd = int(start.split('-')[0]), int(start.split('-')[1]), int(start.split('-')[2])  # turn into int
    ey, em, ed = int(end.split('-')[0]), int(end.split('-')[1]), int(end.split('-')[2])
    s_time = timezone.make_aware(datetime(sy, sm, sd))  # make aware to avoid naive runtime warning of queryset.
    e_time = timezone.make_aware(datetime(ey, em, ed))

    # returns a filtered QuerySet that will “follow” foreign-key relationship.(lte/gte: less/greater than or equal to)
    # this is a performance booster using foreign-key relationships that don't require database queries.
    shifts = Schedule.objects.filter(start_date__gte=s_time).filter(start_date__lte=e_time).select_related('worker')
    data = []

    for shift in shifts:  # it executes its database query the first time you iterate over it.

        shift_type_choices = (
            ('NT', 'Night'),
            ('DY', 'Day'),
            ('SG', 'Swing'),
        )
        for s in shift_type_choices:
            if shift.shift_type == s[0]:
                shift_type = s[1]

        leave_type_choices = (
            ('ON', 'On Duty'),
            ('AN', 'Annual Leave'),
            ('FL', 'Floating Holiday'),
            ('CO', 'Compensated Leave'),
            ('OF', 'Official Leave'),
            ('PE', 'Personal Leave'),
            ('PA', 'Parental Leave'),
            ('SI', 'Sick Leave'),
            ('ME', 'Menstrual Leave'),
            ('MA', 'Marital Leave'),
            ('FU', 'Funeral Leave'),
            ('BI', 'Birthday Leave'),
            ('NO', 'NoPay Leave'),
            ('RE', 'Rearrange'),
        )
        leave_type = "On Duty"  # default
        for l in leave_type_choices:
            if shift.leave_type == l[0]:
                leave_type = l[1]
                break

        start_milli = int(shift.start_date.timestamp()) * 1000  # for event id

        event = {
            'worker': shift.worker.username,
            'start': shift.start_date + timedelta(hours=8),  # Increase 8 hours to match +08:00.
            'end': shift.end_date + timedelta(hours=8),
            'type': shift_type,
            'color': shift.worker.color,
            'description': "{0}\n{1}\n{2}\nDeputy: {3}".format(
                shift.worker.username,
                shift_type,
                leave_type,
                shift.deputy),
            'id': "{0}{1}".format(shift.worker.employ_id, start_milli),  # id: employ_id + start
            'title': shift.title,
        }
        # if event has title, meaning it has leave hours.
        if shift.title:
            event['textColor'] = 'black'
        # swap check
        swap = Swap.objects.filter(to_date=shift.start_date)
        if swap:
            from_date = swap[0].from_date + timedelta(hours=8)  # Increase 8 hours to match +08:00.
            event['description'] += "\nMoved from: {0}".format(from_date.date())
        data.append(event)
    return JsonResponse(data, safe=False)


def save_change(request):
    """
    django.core.exceptions.ValidationError: 'Sun Apr 02 2017 09:30:00 GMT+0800 (CST)' value has an invalid format.
    To avoid this exception, use django.utils.timezone method, make_aware(datetime.fromtimestamp(millisecond/1000.0)).
    """
    if request.is_ajax() and request.POST:

        json_string = request.POST.get('item')
        result = json.loads(json_string)

        # waiting to be changed too ...
        add_success = 0  # count the success add
        delete_success = 0  # count the success delete
        leave_success = 0  # count the success leave
        cancel_success = 0  # count the success cancel
        swap_success = 0  # count the success swap

        for x in range(0, len(result)):
            # worker is the foreign key of model Schedule
            username = result[x]['worker']
            worker = Worker.objects.get(username=username)  # leverage username to get the instance worker

            if 'type' in result[x]:
                s_type = result[x]['type']  # schedule:shift_type
            else:
                s_type = ""
            shift_type_choices = (
                ('NT', 'Night'),
                ('DY', 'Day'),
                ('SG', 'Swing'),
            )
            for s in shift_type_choices:
                if s_type == s[1]:
                    sh_type = s[0]

            if 'leave_type' in result[x]:
                l_type = result[x]['leave_type']
            else:
                l_type = ""
            leave_type_choices = (
                ('AN', 'Annual Leave'),
                ('FL', 'Floating Holiday'),
                ('CO', 'Compensated Leave'),
                ('OF', 'Official Leave'),
                ('PE', 'Personal Leave'),
                ('PA', 'Parental Leave'),
                ('SI', 'Sick Leave'),
                ('ME', 'Menstrual Leave'),
                ('MA', 'Marital Leave'),
                ('FU', 'Funeral Leave'),
                ('BI', 'Birthday Leave'),
                ('NO', 'NoPay Leave'),
                ('RE', 'Rearrange'),
            )
            for l in leave_type_choices:
                if l_type == l[1]:
                    le_type = l[0]
                    break

            start, end = int(result[x]['start']), int(result[x]['end'])
            s_date = timezone.make_aware(datetime.fromtimestamp(start/1000.0))  # schedule:start_date
            e_date = timezone.make_aware(datetime.fromtimestamp(end/1000.0))  # schedule:end_date

            action = result[x]['action']  # actions include add, delete, leave, cancel
            if action == "add":
                # create new instances of the worker's schedule set
                worker.schedule_set.create(
                    start_date=s_date,
                    end_date=e_date,
                    shift_type=sh_type,
                )
                add_success += 1

            elif action == "delete":
                # delete the instances of the worker's schedule set
                worker.schedule_set.get(
                    start_date=s_date,
                    end_date=e_date,
                    shift_type=sh_type,
                ).delete()
                delete_success += 1

            elif action == "leave":
                # update the instance of the worker's schedule set
                shift = worker.schedule_set.get(
                    start_date=s_date,
                    end_date=e_date,
                    shift_type=sh_type,
                )
                shift.title = result[x]['title']
                shift.leave_type = le_type
                shift.deputy = result[x]['deputy']
                shift.save()
                leave_success += 1

            elif action == "cancel":
                # remove the instance of the worker's leave set
                shifts = worker.schedule_set.filter(start_date__gte=s_date+timedelta(hours=-8))\
                    .filter(start_date__lt=e_date+timedelta(hours=-8))
                for shift in shifts:
                    shift.title = ""
                    shift.leave_type = ""
                    shift.deputy = ""
                    shift.save()
                cancel_success += 1

            elif action == "swap":
                # create new instances of the worker's swap set
                worker.swap_set.create(
                    from_date=s_date,
                    to_date=e_date,
                )
                swap_success += 1

        # sending back the response of success or error on shifts saving
        total_success = add_success + delete_success + leave_success + cancel_success + swap_success
        data = []

        if total_success == 0:
            data.append({'error': 'no events received!'})
        elif total_success != len(result):  # the number of requests and responses should be the same.
            data.append({'error': 'events not completely processed!'})
        else:  # send back the successfully saved events.
            for x in range(0, len(result)):
                event = {
                    x: "event ({0}, {1}, {2})".format(
                        result[x]['action'],
                        timezone.make_aware(datetime.fromtimestamp(result[x]['start'] / 1000.0)),
                        timezone.make_aware(datetime.fromtimestamp(result[x]['end'] / 1000.0))
                    )
                }
                data.append(event)

        return JsonResponse(data, safe=False)

    else:  # raise http 404 if it is not the ajax and post request.
        raise Http404


class HomeView(ListView):
    """
    Render the template home.html to display the schedule instances.
    """
    model = Schedule
    template_name = 'shiftsystem/home.html'


def export_csv(request):
    """
    Export a csv file and ask browser to download it.
    """
    # get the export type from request.
    export = request.GET.get('export')
    # get the checked workers on shift filter from request, then get the checked workers employ id from db.
    workers = request.GET.get('workers')
    workers_list = workers.split(',')
    workers_id_list = []
    workers_all = Worker.objects.all()
    for w in workers_all:
        if w.username in workers_list:
            workers_id_list.append(w.employ_id)
    # get the query start/end date from request.
    start, end = request.GET.get('start'), request.GET.get('end')  # request returns string only
    sy, sm, sd = int(start.split('/')[0]), int(start.split('/')[1]), int(start.split('/')[2])  # turn into int
    ey, em, ed = int(end.split('/')[0]), int(end.split('/')[1]), int(end.split('/')[2])
    s_time = timezone.make_aware(datetime(sy, sm, sd))  # make aware to avoid naive runtime warning of queryset.
    e_time = timezone.make_aware(datetime(ey, em, ed))

    # Create the HttpResponse object with the appropriate CSV header.
    response = HttpResponse(content_type='text/csv')
    writer = csv.writer(response)

    # two types of exported csv files, bimonthly and day-to-day
    if export == 'Bimonthly':
        response['Content-Disposition'] = 'attachment; filename="bimonthly_rearrange.csv"'
        writer.writerow([
            'PERNR', 'BEGDA', 'ENDDA', 'SCHKZ', 'ZTERF'])
        writer.writerow([
            'Employ_ID', 'Start Date (yyyymmdd)', 'End Date (yyyymmdd)', 'Shift Code', 'Punch In (1:yes/ 9:no)'])

        result = []
        for e_id in workers_id_list:
            e_shifts = Schedule.objects.filter(worker=e_id).filter(
                start_date__gte=s_time).filter(start_date__lt=e_time).select_related('worker')
            s = set()  # use set to get unique value of day of week
            e_type = ""
            first = True
            for e_shift in e_shifts:
                s.add(calendar.day_name[(e_shift.start_date + timedelta(hours=8)).weekday()])  # day of week
                if first:
                    e_type = e_shift.shift_type
                    first = False
            result.append({
                'employ_id': e_id,
                'day of week': list(s),
                'type': e_type})

        # print(result)

        shift_codes = (
            [("Sunday", "Monday", "Tuesday", "Wednesday"), "DY", 'CF04'],
            [("Sunday", "Monday", "Tuesday", "Wednesday"), "SG", 'CF05'],
            [("Sunday", "Monday", "Tuesday", "Wednesday"), "NT", 'CF06'],
            [("Wednesday", "Thursday", "Friday", "Saturday"), "DY", 'CF07'],
            [("Wednesday", "Thursday", "Friday", "Saturday"), "SG", 'CF08'],
            [("Wednesday", "Thursday", "Friday", "Saturday"), "NT", 'CF09'],
        )

        final = []
        for r in result:
            for d, t, c in shift_codes:
                if set(d).intersection(r['day of week']) == set(d) and t == r['type']:
                    final.append((r['employ_id'], c))

        for f in final:
            writer.writerow([
                f[0],  # employ id
                start.replace("/", ""),
                end.replace("/", ""),
                f[1],  # shift code
                9])

    elif export == 'Day-to-day':
        response['Content-Disposition'] = 'attachment; filename="day_to_day_swap.csv"'
        # writer.writerow(['First row', 'Foo', 'Bar', 'Baz'])
        # writer.writerow(['Second row', 'A', 'B', 'C', '"test"', "Here's a quote"])

    return response
