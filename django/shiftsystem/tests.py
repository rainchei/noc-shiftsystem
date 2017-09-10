from django.shortcuts import reverse
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from datetime import datetime
import json

from .models import Worker, Schedule, Leave, ActionRecords


class StrMethodTests(TestCase):
    """Test the string method representing the outputs of objects of shiftsystem models."""

    def test_worker_str(self):
        worker = Worker(username='Flying_Hog')
        self.assertEquals(
            str(worker),
            'Flying_Hog'
        )

    def test_schedule_str(self):
        now = timezone.now().date()
        schedule = Schedule(
            start_date=now,
            shift_type='NT',
        )
        self.assertEquals(
            str(schedule),
            "{date}-{type}".format(date=now, type='NT')
        )

    def test_leave_str(self):
        now = timezone.now()
        tmr = timezone.now() + timedelta(days=1)
        leave = Leave(
            start_date=now,
            end_date=tmr,
        )
        self.assertEquals(
            str(leave),
            "from {start} to {end}".format(start=now, end=tmr)
        )

    def test_actionrecords_str(self):
        now = timezone.now()
        actionrecords = ActionRecords(
            login_id='7777777',
            action='high and dry',
            create_date=now,
        )
        self.assertEquals(
            str(actionrecords),
            "{actor}-{action}-{time}".format(actor='7777777', action='high and dry', time=now)
        )


def create_pseudo_worker():
    """
    Create a worker with given employ_id, password, username, email, color.
    """
    employ_id = 1234567
    username = "Jeremy_Lin"
    email = "jeremy_lin@example.com"
    color = "black"
    password = "linsanity"

    return Worker.objects.create_user(
        employ_id=employ_id,
        username=username,
        email=email,
        color=color,
        password=password,
    )


class CreateWorkerTests(TestCase):
    """Test the results of creating workers and login/logout methods."""

    def test_worker_login_logout(self):
        """
        Workers with saved profile should be displayed on the index.
        """
        create_pseudo_worker()
        # login and get the response from the IndexView.
        self.client.login(employ_id=1234567, password="linsanity")
        response = self.client.get(reverse("shiftsystem:index"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["object_list"][0].username, "Jeremy_Lin")
        # logout and get the response from the IndexView.
        self.client.logout()
        response = self.client.get(reverse("shiftsystem:index"))
        self.assertEqual(response.status_code, 302)


def create_secret_url(start, end):
    """
    Create a url with the given start/end params, whose format should be yyyy-mm-dd.
    """
    url = "/shiftsystem/secret/schedules/?start=" + start + "&end=" + end
    return url


class SecretScheduleTests(TestCase):
    """Test the outputs on the secret schedule view based on different start/end params."""

    def test_schedule_with_no_params(self):
        """
        If no start/end params input, it should return a AttributeError with 501.
        """
        try:
            self.client.get("/shiftsystem/secret/schedules/")
        except AttributeError as err:
            print("Expected AttributeError Raised:", err)

    def test_empty_schedule_and_invalid_or_valid_params(self):
        """
        It should return [] if the schedule is empty or the params are invalid.
        """
        # empty schedule
        response1 = self.client.get(create_secret_url("2017-04-23", "2017-05-23"))
        [self.assertEquals(
            json.loads(i),
            [],
        ) for i in response1]

        # create a pseudo schedule on 2017-04-30 with shift_type="NT"
        worker = create_pseudo_worker()
        s_date = timezone.make_aware(datetime(2017, 4, 30))  # schedule:start_date
        e_date = timezone.make_aware(datetime(2017, 4, 30))  # schedule:end_date
        worker.schedule_set.create(
            start_date=s_date,
            end_date=e_date,
            shift_type="NT",
        )

        # invalid params of start/end
        response2 = self.client.get(create_secret_url("2017-04-23", "2017-03-23"))
        [self.assertEquals(
            json.loads(i),
            [],
        ) for i in response2]

        # valid params of start/end
        response3 = self.client.get(create_secret_url("2017-04-23", "2017-05-23"))
        [self.assertEquals(
            json.loads(i)[0]['start'],
            "2017-04-30T00:00:00Z",
        ) for i in response3]
