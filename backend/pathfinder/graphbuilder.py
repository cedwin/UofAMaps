#!/usr/bin/env python
from backend.pathfinder.utils import MetaPolygon

import Polygon
import Polygon.Utils
# The voronoinavgraph module defines how the navigation graph is computed.
# To compute the navigation graph by some other method, any module that
# implements the computeNavGraph(Graph, Polygon): Graph function can be used.
from backend.pathfinder.voronoinavgraph import computeNavGraph
from backend.pathfinder.graph import Graph, Node, Edge, Position
from backend.pathfinder.connectiongraph import ConnectionGraph, ConnectedEntity, ConnectedPortal
from backend.pathfinder.utils import straightLineDistance, MetaPolygon
from backend.pathfinder.searchalgorithm import SearchAlgorithm
import backend.pathfinder.graphmanager as gman
import copy
import backend.pathfinder.graphvisualizer as graphvisualizer
from backend.pathfinder.CampusMapPyAPICaller import CampusMapAPICaller

edgeLenLowerBound = 10
maxEdges = 8

def buildFloorNavGraph(mpHallways, rooms, portals, entrances):
	"""Given a list of hallway MetaPolygons mpHallways and a list of room
	MetaPolygons mpRooms for a floor,	return the navigation graph that represents
	how to navigate on that floor."""
	hallway = Polygon.Polygon()
	navGraph = Graph()
	hallways = []
	if len(mpHallways) > 0:
		hallways = getNamedPolygonsFromMetaPolygons(mpHallways)
		hallway = union(hallways)
		navGraph = buildNavGraph(hallway)
	spacePolys = []
	roomPolys = getNamedPolygonsFromMetaPolygons(rooms)
	
# 	addRoomsToNavGraph(navGraph, hallway, roomPolys)

	portalPolys = getNamedPolygonsFromMetaPolygons(portals)
# 	addRoomsToNavGraph(navGraph, hallway, portalPolys)
	spacePolys.extend(roomPolys)
	spacePolys.extend(portalPolys)
	addRoomsToNavGraph(navGraph, hallway, spacePolys)
	
	npPortals = getNamedPolygonsFromMetaPolygons(portals)
	hallways.extend(npPortals)
	hallway = union(hallways)
	entrancePolys = getNamedPolygonsFromMetaPolygons(entrances)
	addRoomsToNavGraph(navGraph, hallway, entrancePolys)
	return navGraph

# deprecated 
def buildFloorPortalConnectionGraph(connectionGraph, flNavGraph, portals):
	"""
	* for each floor, get the navGraph and list of portals for that floor
  * for portalA in portals
	* mark portalA as 'seen'
	* for portalB in portals
	  * if seen portalB already then skip it
	  * use low level algorithm to return the distance of the path between
			  portalA and portalB if it exists
	  * add nodeA for portalA and nodeB for portalB to graph
	  * add edge to graph between portalA and portalB with given distance
	"""
	seen = set()
	for portalA in portals:
		seen.add(portalA)
		for portalB in portals:
			if portalB in seen: continue
			nodeA = flNavGraph.getNode(portalA.getName(), portalA.getRefId())
			nodeB = flNavGraph.getNode(portalB.getName(), portalB.getRefId())
			assert(nodeA is not None)
			assert(nodeB is not None)
			nodeU = connectionGraph.addNode(nodeA.getPosition(), portalA.getName(),
											portalA.getRefId())
			nodeV = connectionGraph.addNode(nodeB.getPosition(), portalB.getName(),
											portalB.getRefId())
			connectionFinder = SearchAlgorithm(nodeA, nodeB)
			solution = connectionFinder.search()
			if solution is not None:
				connectionGraph.addEdge(nodeU, nodeV, solution.getDistance())
	return connectionGraph

def buildConnectionGraph(entities):
	connectionGraph = ConnectionGraph()
	nodes = []
	for entity in entities:
		nodes.append(connectionGraph.addNode(entity.getPosition(), entity.getName(),
					 entity.getRefId(), entity.getLevel(), entity.getBuilding()))
	assert(len(entities) == len(nodes))
	for i, (entityA, nodeA) in enumerate(zip(entities, nodes)[:-1]):
		for entityB, nodeB in zip(entities[i+1:], nodes[i+1:]):
			print "Getting path for", \
				entityA.getName(), entityA.getRefId(), \
				entityA.getBuilding(),"level", entityA.getLevel(),"to", \
				entityB.getName(), entityB.getRefId(), \
				entityB.getBuilding(),"level", entityB.getLevel()
# 			print "--------node A", nodeA
# 			print "--------node B", nodeB
			path = entityA.getConnectionTo(entityB)
			if path is not None:
				print "adding path"
				edge = connectionGraph.addEdgeWithPath(nodeA, nodeB, path)
				if nodeA.level == nodeB.level:
					edge.floor = nodeA.level
				else:
					edge.floor = None
				# edge.path = path
			else:
				print "no path found"
	return connectionGraph

def addRoomToBuildingGraph(roomName, refId, floor, buildingKey, buildingGraph, reverse=False):
	caller = CampusMapAPICaller()
	success = caller.getFloorJsonFromServer(buildingKey, floor)
	if not success:
		exit("Cannot access to CampusmapAPI")
	portals = caller.getPortals()
	entrances = caller.getEntrances()
	flNavGraph = gman.loadFloorNavGraph(buildingKey, floor)
	roomNodeFl = flNavGraph.getNode(roomName, refId)
	assert roomNodeFl is not None
	roomNode = buildingGraph.addNode(roomNodeFl.getPosition(), roomName, refId, floor)
	spaces = []
	spaces.extend(portals)
	spaces.extend(entrances)
	for space in spaces:
		portalNodeFl = flNavGraph.getNode(space.getName(), space.getRefId())
		portalNodeBldg = buildingGraph.getNode(space.getName(), space.getRefId(), floor, buildingKey)
		assert portalNodeFl is not None
		finder = None
		if not reverse:
			finder = SearchAlgorithm(roomNodeFl, portalNodeFl)
		else:
			finder = SearchAlgorithm(portalNodeFl, roomNodeFl)
		path = finder.search()
		if path is not None:
			print "Adding edge"
			path.environment = buildingKey
			edge = buildingGraph.addEdgeWithPath(roomNode, portalNodeBldg, path)
			# edge.path = path
			edge.floor = floor

	# Should just build connection graph with the nodes as connected entities already
	# need to create connected portals from building graph nodes
	return roomNode

def addRoomToCampusGraph(roomName, roomRefId, roomFloor, roomBuildingKey,  campusGraph, position, reverse=False):
	buildingGraph = gman.loadBuildingConnectionGraph(roomBuildingKey)
	roomNode = addRoomToBuildingGraph(roomName, roomRefId, roomFloor, roomBuildingKey, buildingGraph, reverse)
	edgesAdded = []
	for node in buildingGraph.getNodes():
		if node.name == "Entrance":
			# rooms don't have lat longs right now so can't use any heuristic; use 0-heuristic
			finder = None
			if not reverse:
				finder = SearchAlgorithm(roomNode, node)
			else:
				finder = SearchAlgorithm(node, roomNode)
			pathToDoor = finder.search(["Stairs", "Elevator", "Entrance", ""])
			if pathToDoor is not None:
				pathToDoor.environment = roomBuildingKey
				campusNode = campusGraph.addNode(position, roomName, roomRefId, roomFloor)
				extDoorNode = campusGraph.getNode(node.name, node.refId, node.level, node.building)
				if extDoorNode is not None:
					edgesAdded.append(campusGraph.addEdgeWithPath(campusNode, extDoorNode, pathToDoor))
	print "Added", len(edgesAdded), "edges for", roomName, "to", roomBuildingKey
	weight = 0
	for edge in edgesAdded:
		weight += edge.getCost()
	print "with total weight", weight
	return campusNode


# def addRoomsToNavGraph(navGraph, hallway, rooms):
# 	#print "addRoomsToNavGraph:"
# 	addRoomToNavGraph(navGraph, hallway, rooms)
# 	#print "done adding"

def addRoomToNavGraph(navGraph, hallway, room):
	addRoomsToNavGraph(navGraph, hallway, [room])

def addRoomsToNavGraph(navGraph, hallway, rooms):
	"""Given a polygon of a hallway, the corresponding navigation graph,
	and a polygon of a room to add to the nav graph, return the nav graph
	that has a node and edge added to it representing access to the room."""
	# have a polygon of the hallway, and of the room to add
	# first union the hallway and room
	edgesToAdd = set()
	edgesToRemove = set()
	newNodes = set()

	#Scan through all room, collect edges to be added
	#Add edges to NavGapth only after checked all rooms
	#So that 'roomEdge' wont intersects with each other
	#Before: roomEdge of one room added before could intersects with roomEdge
	#that is considered after 
	edges = navGraph.getEdges()
	noNodes = len(navGraph.getNodes())
	noEdges = len(navGraph.getEdges())

	print "Adding rooms:"

	for roomObj in rooms:
		if isinstance(roomObj, MetaPolygon):
			roomObj = getNamedPolygonFromMetaPolygon(roomObj)
		numEdges = len(edgesToAdd)
		room = roomObj.getPolygon()		
		print roomObj.getName(), roomObj.getRefId()
		# tolerance should be fairly high to ensure proper union
		Polygon.setTolerance(1)
		# also scale up the room slightly
		room.scale(1.001, 1.001)
		union = hallway + room
		unionGraph = polygonToGraph(union)
		roomGraph = polygonToGraph(room)		
		
		# add center point? of room as node to navGraph
		x, y = room.center()
		roomNode = navGraph.addNode(Position(x, y), roomObj.getName(), roomObj.getRefId())
		roomNode.name = roomObj.getName()
		newNodes.add(roomNode)
		
	# intersect with any edge in the polygon				
		# wallNodes = []
		# for roomWall in roomGraph.getEdges():
		# 	wallNodes.append(Node(None,1, roomWall.getCenterPosition()))		
		
		# add roomEdges strategy 1
		numRoomEdgeToAdd = 0
# 		for wallNode in wallNodes:
# #  			print "wall node#", i
# #  			i+=1
# # 			counter = 0
# 			for navEdge in navGraph.getEdges():
# 				potentialNavNode = navEdge.getIntersectedNodeWithRay(roomNode,wallNode)
				
# 				if potentialNavNode is None:
# # 					print "no potent nav node"
# 					continue
# # 				counter +=1
# 	# 					print "potentNavNode", potentialNavNode
# 				potentialRoomEdge = Edge(roomNode, potentialNavNode)
# # 				print "potent room edge",potentialRoomEdge.getEnds()
# 				intersected = 0
# 				for edge in unionGraph.getEdges():
# 					if edge.intersects(potentialRoomEdge):
# 						intersected += 1
# 						if intersected > 1:
# 							break
# # 				print "intersected??",  intersected
# 				if intersected  <= 1:
# 					numRoomEdgeToAdd += 1
# 					#connect room to potentNavNode
# 					newNavNode = navGraph.addNode(potentialNavNode.getPosition())
# #   					print newNavNode
# 					edgesToAdd.add(Edge(roomNode, newNavNode))
# # 					#connect newNavNode to NavGrap and remove redundant edge
# 					nodeA, nodeB = navEdge.getEnds()
# 					edgesToAdd.add(Edge(nodeA, newNavNode))
# 					edgesToAdd.add(Edge(nodeB, newNavNode))
# 					edgesToRemove.add(navEdge)
# 			print "total potent nav nodes:", counter

		#add roomEdge strategy #2
		if 	numRoomEdgeToAdd == 0:
			nodes = sorted(navGraph.getNodes(),
						   key=lambda node: straightLineDistance(node, roomNode))
			for node in nodes:
				addedSoFar = len(edgesToAdd) - numEdges
				if addedSoFar >= maxEdges: break
			#for node in navGraph.getNodes():
	#			#print "-----------------checking node #" + str(i) + "--------------"
				sameNode = False
				
				if node in newNodes:
					continue
				roomEdge = Edge(roomNode, node)	
				
				intersected = False
				for edge in unionGraph.getEdges():
					if roomEdge.intersects(edge):
						intersected = True
						break
					
				if not intersected:
					edgesToAdd.add(Edge(roomNode, node))

		print "added %d edges" % (len(edgesToAdd) - numEdges)
	#Checked all rooms, start adding edges to NavGraph	 
	for edge in edgesToRemove:
		navGraph.removeEdge(edge)			
	for edge in edgesToAdd:
		roomNode, node = edge.ends
		navGraph.addEdge(roomNode, node, straightLineDistance(roomNode, node))
	
# 	print "added totally %d nodes" % (len(navGraph.getNodes()) - noNodes)
# 	print "added totally %d edges" % (len(navGraph.getEdges()) - noEdges)
# 	for node in navGraph.getNodes():
# 		for neighbour in node.getNeighbors():
# 			assert(node.getEdgeTo(neighbour) is not None)

def buildNavGraph(hallway):
	"""Construct the navigation graph from a hallway polygon."""
	# first, get graph from polygon
	hallwayGraph = polygonToGraph(hallway)
	# subdivide the edges to get more resolution
	subdivideEdges(hallwayGraph)
	# compute the navGraph by using the module function
	# graphvisualizer.outputGraph(hallwayGraph, None, "checkBuildNavGraph")
	navGraph = computeNavGraph(hallwayGraph, hallway)
	navGraph.outline = hallway
	return navGraph

def polygonToGraph(polygon):
	graph = Graph()
	# for each contour in the polygon
	for contour in polygon:		
		pointList = Polygon.Utils.pointList(contour)
		# create one node initially
		firstNode = graph.addNode(Position(pointList[0], pointList[1]))
		lastNode = firstNode
		# for each pair of coords, add a node and add edge to the last node
		for i in range(2, len(pointList)-1, 2):
			node = graph.addNode(Position(pointList[i], pointList[i+1]))
			distance = straightLineDistance(lastNode, node)
			graph.addEdge(lastNode, node, distance)
			lastNode = node
		# add edge between last and first node to ensure the polygon is simple
		distance = straightLineDistance(lastNode, firstNode)
		graph.addEdge(lastNode, firstNode, distance)
	return graph

def subdivideEdges(graph, length=None):
	if length is None and len(graph.getEdges()) > 0:
		# nasty law of demeter violation. Refactor soon.
		length = list(graph.getEdges())[0].getCost()
		for edge in graph.getEdges():
			length = min(edge.getCost(), length)
	# subdivide each edge in graph into segments <= length
	# don't go too small
	length = max(edgeLenLowerBound, length)
	edges = graph.getEdges().copy()
	for edge in edges:
		subdivideEdge(graph, edge, length)

def subdivideEdge(graph, edge, minEdgeLen):
	# base case: edge is <= minEdgeLen
	if edge.getCost() > minEdgeLen:
		# get ends of edge
		nodeA, nodeB = edge.getEnds()
		# compute midpoint between ends
		xA = nodeA.getX()
		yA = nodeA.getY()
		xB = nodeB.getX()
		yB = nodeB.getY()
		
		xC = (xA + xB) / 2
		yC = (yA + yB) / 2
		
		# add new node at midpoint
		nodeC = graph.addNode(Position(xC, yC))
		# delete original edge from graph
		graph.removeEdge(edge)
		# create two new edges between ends and midpoint
		edgeA = graph.addEdge(nodeA, nodeC, straightLineDistance(nodeA, nodeC))
		edgeB = graph.addEdge(nodeB, nodeC, straightLineDistance(nodeB, nodeC))
		# recursively call self on new edges
		subdivideEdge(graph, edgeA, minEdgeLen)
		subdivideEdge(graph, edgeB, minEdgeLen)
		
def getNamedPolygonsFromMetaPolygons(metaPolygons):
	namedPolys = []
	for metaPoly in metaPolygons:
		namedPolys.append(getNamedPolygonFromMetaPolygon(metaPoly))
	return namedPolys

def getNamedPolygonFromMetaPolygon(metaPoly):
	name = metaPoly.getName()
	refId = metaPoly.getRefId()
	posList = metaPoly.getPolygon()
	pointList = []
	for pos in posList:
		x, y = pos.x(), pos.y()
		pointList.append((x,y))
	polygon = Polygon.Polygon(pointList)
	return NamedPolygon(name, refId, polygon)

def union(polygons):
	Polygon.setTolerance(1)
	union = Polygon.Polygon()
	for polygon in polygons:
		union += polygon.getPolygon()
	return union

# not sure that this works
def graphUnion(graphs):
	graph = copy.deepcopy(graphs.pop())
	for otherGraph in graphs:
		graph.addGraph(otherGraph)
	return graph

class NamedPolygon(object):
	def __init__(self, name, refId, polygon):
		self._name = name
		self._refId = refId
		self._polygon = polygon
		
	def getName(self):
		return self._name
	
	def getRefId(self):
		return self._refId
	
	def getPolygon(self):
		return self._polygon