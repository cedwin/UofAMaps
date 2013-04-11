#!/usr/bin/env python

# from backend.pathfinder.graphmanager import getCampusConnectionGraph
from backend.pathfinder.searchalgorithm import SearchAlgorithm
from backend.pathfinder.CampusMapPyAPICaller import CampusMapAPICaller
# from backend.pathfinder.graphbuilder import buildFloorNavGraph 
from backend.pathfinder.jsonutils import createJsonFromNodes
from backend.pathfinder.graphvisualizer import outputGraph



def findPaths(waypoints, outdoorParam=0):
	# takes a list of waypoints
	# can call waypoint.isInterior()
	# waypoint.getBuilding() -> building id
	# waypoint.getFloor() -> floor id
	# waypoint.getRoom() -> (roomName, refId)
	# waypoint.getCoord() -> (lat, long)

	# for each pair of waypoints, 
	paths = []
	for i in range(len(waypoints)-1):
		paths.append(findTwoPointPath(waypoints[i], waypoints[i+1], outdoorParam))
	return paths

def findTwoPointPath(start, end, outdoorParam=0):
    caller = CampusMapAPICaller()
    
    success = caller.getFloorJsonFromServer(start.building, start.floor)
    if not success:
        exit("Cannot access to CampusmapAPI")
    
#     hallways = caller.getHallways()
    startRooms = caller.getRooms()
    startPortals = caller.getPortals()

    caller = CampusMapAPICaller()
    
    success = caller.getFloorJsonFromServer(start.building, end.floor)
    if not success:
        exit("Cannot access to CampusmapAPI")

    endRooms = caller.getRooms()
    endPortals = caller.getPortals()

    startRefId = ""
    endRefId = ""

    startFlNavGraph = gman.loadFloorNavGraph(start.building, start.floor)
    startNode = None
    endNode = None
    if start.floor == end.floor and start.building == end.building:
        startNode = startFlNavGraph.getNode(start.name, startRefId)
        endNode = startFlNavGraph.getNode(end.name, endRefId)
    else:


        endFlNavGraph = gman.loadFloorNavGraph(end.building, end.floor)

        startBuildingGraph = gman.loadBuildingConnectionGraph(start.building)
        print "Done loading"
        startFlNode = None
        print "Adding edges to start node"
        print (start.name, startRefId)
        startFlNode = startFlNavGraph.getNode(start.name, startRefId)
        print start.name, startRefId
        print startFlNode
        assert startFlNode is not None
        print 1
        startNode = startBuildingGraph.addNode(startFlNode.getPosition(), start.name, startRefId, start.floor)
        print 2
        for portal in startPortals:
            portalNodeFl = startFlNavGraph.getNode(portal.getName(), portal.getRefId())
            portalNodeBldg = startBuildingGraph.getNode(portal.getName(), portal.getRefId(), start.floor)
            assert portalNodeFl is not None
            print 3
            finder = SearchAlgorithm(startFlNode, portalNodeFl)
            path = finder.search()
            print 4
            if path is not None:
                print "Adding edge"
                edge = startBuildingGraph.addEdge(startNode, portalNodeBldg, path.getDistance())
                print 5
                edge.path = path
                edge.floor = start.floor

        endFlNode = None
        print "Adding edges to end node"
        print (end.name, endRefId)
        endFlNode = endFlNavGraph.getNode(end.name, endRefId)
        endNode = startBuildingGraph.addNode(endFlNode.getPosition(), end.name, endRefId, end.floor)
        for portal in endPortals:
            portalNodeFl = endFlNavGraph.getNode(portal.getName(), portal.getRefId())
            portalNodeBldg = startBuildingGraph.getNode(portal.getName(), portal.getRefId(), end.floor)
            finder = SearchAlgorithm(endFlNode, portalNodeFl)
            path = finder.search()
            if path is not None:
                print "Adding edge"
                edge = startBuildingGraph.addEdge(endNode, portalNodeBldg, path.getDistance())
                edge.path = path
                edge.floor = end.floor

    # outputGraph(startBuildingGraph, None, "startBuildingGraph", False, 50)
    finder = SearchAlgorithm(startNode, endNode)
    
    solution = finder.search()

    # outputGraph(solution, None, "buildingPath", False, 50)
    
    if solution is None:
        exit("No path found. Sorry!")

    paths = []
    for edge in solution.getEdges():
        try:
            paths.append((edge.path, edge.floor))
        except Exception as e:
            continue
    data = []
    if len(paths) == 0:
        data.append(createJsonFromNodes(solution.getNodes(), start.building, start.floor))
    else:
        for path, floor in paths:
            nodes = path.getNodes()
            data.append(createJsonFromNodes(nodes, start.building, floor))

class RoomWaypoint(object):
	def __init__(self, name, building, floor):
		self.name = name
		self.building = building
		self.floor = floor