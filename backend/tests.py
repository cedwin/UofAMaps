"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.core.urlresolvers import reverse

class CampusMapsTests(TestCase):
    def test_index_view_returns_successfully(self):
        """
        Tests that index returns in success
        """
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'frontend/CampusMaps.html' )
        self.assertContains(response, '<title>401 Campus Maps</title>')

 	def test_exterior_proxy_API_call_returns_successfully(self):
 		"""
        Tests that exterior proxy API call is working
        """
        response = self.client.get(reverse('proxy_to_exterior'), {'category':1,'flag':1,'isMobile':'false'})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'UAlberta.WebService.Maps.Data.ExteriorReturn')

 	def test_interior_proxy_API_call_returns_successfully(self):
 		"""
        Tests that interior proxy API call is working
        """
        response = self.client.get(reverse('proxy_to_interior'), {'BuildingName':'sub','Level':1})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'UAlberta.WebService.Maps.Data.InteriorReturn')

	def test_pathfinding_API_call_returns_successfully(self):
		"""
        Tests that pathfinding API call is working
        """
        response = self.client.get(reverse('pathfinding'), {'BuildingName':'sub','Level':1})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Lines')
