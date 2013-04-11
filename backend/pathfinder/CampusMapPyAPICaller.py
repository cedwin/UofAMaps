import urllib2
import json
from backend.pathfinder.utils import Position
from backend.pathfinder.utils import MetaPolygon
from django.conf import settings


class CampusMapAPICaller(object):
	"""An interface to call CampusMapAPI and returns json object"""
	def __init__(self):
		self._floor_json_data = ""
		self._building_name = ""
		self._floor_level = ""
		
		self._stair_name = "stairs"
		self._elevator_name = "elevator"
		self._hallway_name = "hallway"
		self._washroom_name = "washroom"
		self._building_outline_name = "building outline"
		self._entrance_name = "entrance"
		self._x_name = "x"
		self._hole_name = "hole"
		
	"""Return True/False whether it could get the data from server.
	JSON Data is accessible through _floor_json_data
	Building name and floor level is also stored for reference. 
	Usage: call this function every time you want to get data from another floor,
	then call appropriate function for corresponding data"""
	def getFloorJsonFromServer(self, building_name, floor_level): 
		api_url = settings.INTERIOR_API_URL
		parameters = "{ 'parameters':{'BuildingName': '"+building_name+"', 'Level': "+str(floor_level)+"}}"
		headers = {"Content-type": "application/json"}
		req = urllib2.Request(api_url,parameters,headers)
		content = urllib2.urlopen(req)
		if content.getcode() == 200:
			self._floor_json_data = json.loads(content.read())
			self._building_name = building_name
			self._floor_level = floor_level
			return True
		else:
			return False
		
	def createMetaPolygonObject(self, name, poly):
		refID = poly['Options']['metaData']['referenceId']
		positions = []
		for point_3d in poly['Path']:
			x = point_3d['x']
			y = point_3d['y']
			z = point_3d['z']
			pos = Position(x,z,y)
			positions.append(pos)
		space = MetaPolygon(name, refID, positions)
		return space
	
	def getBuildingOutline(self):
		spaces = []
		for poly in self._floor_json_data['d']['Polys']:
			name = poly['Options']['metaData']['name']
			if  name.lower() == self._building_outline_name:
				space =  self.createMetaPolygonObject(name, poly)
				spaces.append(space)
		return spaces
			
	def getHallways(self):
		spaces = []
		for poly in self._floor_json_data['d']['Polys']:
			name = poly['Options']['metaData']['name']
			if  name.lower() == self._hallway_name:
				space =  self.createMetaPolygonObject(name, poly)
				spaces.append(space)
		return spaces
		
	def getRooms(self):
		spaces = {}
		seenNames = {}
		for poly in self._floor_json_data['d']['Polys']:
			name = poly['Options']['metaData']['name']
						# we should also check if extrusion is possible, if not
						# then don't include it as a room!
			if (name.lower() != self._building_outline_name and
					name.lower() != self._hallway_name and
					name.lower() != self._stair_name and
					name.lower() != self._elevator_name and
					name.lower() != self._entrance_name and
					name.lower() != self._x_name and
					name.lower() != self._hole_name):
				if name in seenNames.keys():
					seenNames[name] += 1
				else:
					seenNames[name] = 0
				space =  self.createMetaPolygonObject(name, poly)
				spaces[(name, seenNames[name])] = space
		return spaces
		
	def getPortals(self):
		spaces = []    
		for poly in self._floor_json_data['d']['Polys']:
			name = poly['Options']['metaData']['name']
			if  (name.lower() == self._stair_name or
					 name.lower() == self._elevator_name):
				space =  self.createMetaPolygonObject(name, poly)
				spaces.append(space)
		return spaces
		
	def getEntrances(self): 
		spaces = []   
		for poly in self._floor_json_data['d']['Polys']:
			name = poly['Options']['metaData']['name']
			if  name.lower() == self._entrance_name:
				space =  self.createMetaPolygonObject(name, poly)
				spaces.append(space)
		spaces.sort(key=lambda space: space.getPolygon()[0].y(), reverse=True)
		spaces.sort(key=lambda space: space.getPolygon()[0].x())
		for i, space in enumerate(spaces):
			# doors have to be saved with a number to distinguish them
			# that matches the number of the space in the database
			# Doors are enumerated by sorting first by y, then by x
			space._refId = i
		return spaces


class CampusMapExteriorAPICaller(object):
	def __init__(self):
		self._campus = "North Campus"
		self._category = 0
		self._flag = 1
		self._campus_map_json_data = ''
		
	def getExteriorMap(self, category, flag, isMobile): 
		api_url = settings.EXTERIOR_API_URL
		parameters = "{ 'parameters':{'category': '"+ category +"', 'flag': '"+ flag +"','isMobile': '"+ isMobile +"'}}"
		headers = {"Content-type": "application/json"}
		req = urllib2.Request(api_url,parameters,headers)
		content = urllib2.urlopen(req)
		if content.getcode() == 200:
			self._campus_map_json_data = json.loads(content.read())
			return True
		else:
			return False	
		
	def getFloorNumberList(self, buildingKey):
		floors = []
		for poly in self._campus_map_json_data['d']['Polys']:
			key = poly['BuildingKey']
			if  key.lower() == buildingKey:
				for level in poly['levels']:
					floor =  str(level['FloorNumber'])
					floors.append(floor)
		return floors


if __name__ == "__main__": 
	caller = CampusMapAPICaller()
	caller.getFloorJsonFromServer("csc", "1")
	print caller.getEntrances()[1].getPolygon()
	# print caller.getPortals()
	
	# caller = CamputMapExteriorAPICaller()
	# caller.getExteriorMap("0", "1", str(False))
	# print caller.getFloorNumberList('t')
	# caller = CampusMapAPICaller()
	# caller.getFloorJsonFromServer("SUB", "2")
	# caller.getPortals()
	# print caller.getPortals()
