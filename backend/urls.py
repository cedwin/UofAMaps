from django.conf.urls import patterns, url
from django.conf import settings
from backend import views

urlpatterns = patterns('',
    url(r'^$', views.index, name='index'),

    url(r'^api/pathfinding/$', views.pathfinding, name='pathfinding'),

    url(r'^api/exterior/$', views.proxy_to_exterior, {'target_url': settings.EXTERIOR_API_URL}, name='proxy_to_exterior'),

    url(r'^api/interior/$', views.proxy_to_interior, {'target_url': settings.INTERIOR_API_URL}, name='proxy_to_interior'),
)