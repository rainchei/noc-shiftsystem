from django.conf.urls import url

from . import views


app_name = 'shiftsystem'
urlpatterns = [
    url(r'^$', views.IndexView.as_view(), name='index'),
    url(r'^home/', views.HomeView.as_view(), name='home'),
    url(r'^leave/$', views.LeaveView.as_view(), name='leave'),
    url(r'^secret/schedules/$', views.schedules, name='schedules'),
    url(r'^secret/save/$', views.save_change, name='save'),
]
