from django.db import models
from django.contrib.auth.models import (
    BaseUserManager, AbstractBaseUser
)
from datetime import timedelta


class WorkerManager(BaseUserManager):

    def create_user(self, employ_id, username, email, color, password=None):
        """
        Creates and saves a User with the given employ_id, username, email, color, and password.
        """
        if not employ_id:
            raise ValueError('Users must have an employ id')

        user = self.model(
            employ_id=employ_id,
            username=username,
            email=self.normalize_email(email),
            color=color,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, employ_id, username, password, email, color):
        """
        Creates and saves a superuser with the given employ_id, username, email, color, and password.
        """
        user = self.create_user(
            employ_id=employ_id,
            username=username,
            password=password,
            email=email,
            color=color,
        )
        user.is_admin = True
        user.save(using=self._db)


class Worker(AbstractBaseUser):

    employ_id = models.PositiveIntegerField(
        # The primary key field is read-only. It implies unique=True, null=False.
        # If you change the value of the primary key on an existing object and then save it,
        # a new object will be created alongside the old one.
        verbose_name='Employ ID',
        primary_key=True,
    )
    username = models.CharField(max_length=20)
    email = models.EmailField(max_length=60)
    # When use ImageField, may need to set the MEDIA_ROOT, the doc:
    # https://docs.djangoproject.com/en/1.10/ref/models/fields/#django.db.models.FileField.storage
    # icon = models.ImageField(upload_to='static/', null=True, blank=True)
    icon = models.CharField(max_length=50)
    color = models.CharField(max_length=10)

    # for admin
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)

    # for class method, e.g. Worker.objects.all()
    objects = WorkerManager()

    # for login and used as the unique identifier
    USERNAME_FIELD = 'employ_id'
    REQUIRED_FIELDS = ['username', 'email', 'color']

    # Overrides method in Model.
    def __str__(self):
        return self.username

    def get_full_name(self):
        # The user is identified by their email
        return self.email

    def get_short_name(self):
        # The user is identified by their employ_id
        return self.employ_id

    @staticmethod
    def has_perm(self):
        """Does the user have a specific permission?"""
        # Simplest possible answer: Yes, always
        return True

    @staticmethod
    def has_module_perms(self):
        """Does the user have permissions to view the app `app_label`?"""
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self):
        """Is the user a member of staff?"""
        # Simplest possible answer: All admins are staff
        return self.is_admin


class Schedule(models.Model):

    # A many-to-one relationship. Required field 'worker' representing the shift owner in parent class.
    # Note that "worker_id" is the default database index,
    # which is different from the customized "worker_set.employ_id".
    worker = models.ForeignKey(
        Worker,
        on_delete=models.CASCADE,
        max_length=10,
    )
    start_date = models.DateTimeField('work starts on')
    end_date = models.DateTimeField('work ends on')

    # Define shift choices, which includes the actual value and a readable name for each.
    NIGHT = 'NT'
    DAY = 'DY'
    SWING = 'SG'
    SHIFT_TYPE_CHOICES = (
        (NIGHT, 'Night'),
        (DAY, 'Day'),
        (SWING, 'Swing'),
    )

    shift_type = models.CharField(
        max_length=2,
        choices=SHIFT_TYPE_CHOICES,
        unique_for_date='start_date',
    )

    # Leave start/end time
    title = models.CharField(
        'Leave start/end time',
        default="",
        max_length=12,
    )

    # Define leave type choices, which includes the actual value and a readable name for each.
    LEAVE_TYPE_CHOICES = (
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
    leave_type = models.CharField(
        default="ON",
        max_length=2,
        choices=LEAVE_TYPE_CHOICES,
    )

    # One gonna take over the works.
    deputy = models.CharField(
        default="None",
        verbose_name='responsibility goes to',
        max_length=20,
    )

    # At the moment of login, the users' employ_id.
    login_id = models.CharField('the owner of creation or update', max_length=10)
    # The moment of creation
    create_date = models.DateTimeField('the date of creation', auto_now_add=True)
    # The moment of update
    update_date = models.DateTimeField('the date of update', auto_now=True)

    def __str__(self):
        # Overrides method in Model.
        for c, s in self.SHIFT_TYPE_CHOICES:
            if self.shift_type == c:
                s_type = s
        return "{worker} {date} {type}".format(
            worker=self.worker,
            date=(self.start_date + timedelta(hours=8)).date(),
            type=s_type)

    class Meta:
        # Workers can only schedule one shift in a day.
        unique_together = ('worker', 'start_date')


class Swap(models.Model):
    worker = models.ForeignKey(
        Worker,
        on_delete=models.CASCADE,
        max_length=10,
    )
    from_date = models.DateTimeField('Swap from')
    to_date = models.DateTimeField('Swap to')

    # class Meta:
    #     unique_together = (('worker', 'from_date'), ('worker', 'to_date'))

    def __str__(self):
        worker = self.worker
        from_date = self.from_date + timedelta(hours=8)  # Increase 8 hours to match +08:00.
        to_date = self.to_date + timedelta(hours=8)  # Increase 8 hours to match +08:00.
        return "{worker}: from {from_date} to {to_date}".format(
            worker=worker,
            from_date=from_date.date(),
            to_date=to_date.date())


class ActionRecords(models.Model):

    # A many-to-one relationship. Required field 'worker' representing the shift owner in parent class.
    worker = models.ForeignKey(
        Worker,
        on_delete=models.CASCADE,
        max_length=10,
    )
    action = models.CharField('the record of action', max_length=10)
    # At the moment of logging, users' employ_id.
    login_id = models.CharField('the owner of action', max_length=10)
    # The moment of creation of this action
    create_date = models.DateTimeField('the date of action', auto_now_add=True)

    def __str__(self):
        # Overrides method in Model.
        return "{actor}-{action}-{time}".format(actor=self.login_id, action=self.action, time=self.create_date)
