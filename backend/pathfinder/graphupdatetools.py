from backend.pathfinder.CampusMapPyAPICaller import CampusMapAPICaller, CampusMapExteriorAPICaller
from backend.pathfinder.graphbuilder import (
	buildFloorNavGraph, 
	buildConnectionGraph
)
from backend.pathfinder.graphmanager import (
	saveFloorNavGraph,
	saveBuildingConnectionGraph,
	saveCampusConnectionGraph
)
from backend.pathfinder.connectiongraph import ConnectedPortal, ConnectedIntDoor, ConnectedExtDoor
import backend.pathfinder.dbh as dbh
from backend.pathfinder.graphvisualizer import outputGraph

# buildingKeys = ["ATH", "CAB", "SUB"]
buildingKeys = ["sub", "cab", "ath"]

def updateDbFloorNavGraph(buildingKey, level):
	# build the floor nav graph for buildingKey and level
	caller = CampusMapAPICaller()
	success = caller.getFloorJsonFromServer(buildingKey, level)
	if not success:
		return False
	hallways = caller.getHallways()
	rooms = caller.getRooms()
	portals = caller.getPortals()
	entrances = caller.getEntrances()
	navGraph = None
	# for portal in portals:
	# 	if portal.getName() == "Stairs":
	# 		hallways.append(portal)
	# if len(hallways) > 0:
	navGraph = buildFloorNavGraph(hallways, rooms.values(), portals, entrances)
	return saveFloorNavGraph(buildingKey, level, navGraph)

def updateDbBuildingConnectionGraph(buildingKey, levels):
	"""Ensure database is already populated with the building floor nav graphs
	before running."""
	entities = []
	for level in levels:
		# if int(level) > 6: 
		# 	break
		print "Accessing API for " + buildingKey + "," + level
		caller = CampusMapAPICaller()
		success = caller.getFloorJsonFromServer(buildingKey, level)
		if not success:
			continue
		for portal in caller.getPortals():
			entities.append(ConnectedPortal(portal, buildingKey, level))
		for entrance in caller.getEntrances():
			entities.append(ConnectedIntDoor(entrance, buildingKey, level))
		print "Finish for level", level, buildingKey
		print "--------------------------------------"
	# connectionGraph = Graph()
	# buildConnectionGraph(connectionGraph, entities)
	connectionGraph = buildConnectionGraph(entities)
	return saveBuildingConnectionGraph(connectionGraph, buildingKey)

def updateDbCampusConnectionGraph(campusKey):
	"""Ensure database is already populated with the building connection graphs
	before running."""
	entities = []
	for building in buildingKeys:
		doors = None
		try:
			doors = dbh.getDoors(building)
		except Exception as e:
			print e
			continue
		if doors is not None:
			for floor, doorNum, lat, lon in doors:
				# print (floor, doorNum, x, y)
				entities.append(ConnectedExtDoor("Entrance", doorNum, building, str(floor), lon, lat))
	# connectionGraph = Graph()
	# buildConnectionGraph(connectionGraph, entities)
	connectionGraph = buildConnectionGraph(entities)
	return saveCampusConnectionGraph(connectionGraph, campusKey)

def populateCampusGraphDatabase(category=0, flag=1, isMobile=True):
	caller = CampusMapExteriorAPICaller()
	success = caller.getExteriorMap(str(category), str(flag), str(False))
	if not success:
		print "Cannot get exterior data [cat="+category+",flag="+flag+",isMobile="+isMobile+"] from the CampusMapAPI"
		return False
	
	for bkey in buildingKeys:	
		print "Creating graphs for", bkey
		levels = caller.getFloorNumberList(bkey)
		print "for levels", levels
		# Populate database with NavGraph of all building
		for level in levels:
			print "Creating floor nav graph for", bkey, "level", level
			# if int(level) > 6: 
			# 	print "breaking"
			# 	break
			updateDbFloorNavGraph(bkey, level)
		# Populate database with building connection graph
		print "Creating building graph for", bkey
		updateDbBuildingConnectionGraph(bkey, levels)
	# Populate campus connection graph
	print "Creating campus graph for", flag
	updateDbCampusConnectionGraph(flag)
		
if __name__ == "__main__":
	import argparse
	parser = argparse.ArgumentParser()
	parser.add_argument("--type", default="", choices=['floor', 'building', 'campus'],
	                    help="The type of graph to update.")
	parser.add_argument("--key", help="The key for the building or campus.")
	parser.add_argument("--levels", nargs='*', help="Levels to update")
	args = parser.parse_args()

	if args.type == 'floor':
		for level in args.levels:			
			updateDbFloorNavGraph(args.key, level)
	elif args.type == 'building':
		updateDbBuildingConnectionGraph(args.key, args.levels)
	elif args.type == 'campus':
		updateDbCampusConnectionGraph(args.key)
	else:
		populateCampusGraphDatabase(0,1,True)
	# updateDbCampusConnectionGraph(1)
	# updateDbFloorNavGraph("sub", "1")
	# updateDbBuildingConnectionGraph("sub", ["-1", "1", "2", "3", "4", "5", "6", "7"])
	pass
