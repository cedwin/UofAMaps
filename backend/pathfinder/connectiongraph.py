from backend.pathfinder.graph import Graph, Node, Edge
import backend.pathfinder.graphmanager as gman
from backend.pathfinder.searchalgorithm import SearchAlgorithm, Path
from backend.pathfinder.utils import Position
import backend.pathfinder.GoogleMapAPICaller as google

defaultEdgeWeight = 100
EXTERIOR = "exterior"

class ConnectionGraph(Graph):

	def addEdgeWithPath(self, node1, node2, path):
		edge = EdgeWithPath(node1, node2, self._assignNewEdgeIndex(), path)
		self._addEdge(edge, node1, node2)
		return edge

class ConnectedEntity(Node):
	def __init__(self, name, refId, level, building, position, graph=None):
		self._name = name
		self._refId = refId
		self._level = level
		self._building = building
		Node.__init__(self, graph, None, position)

	def getName(self):
		return self._name
		   
	def getRefId(self):
		return self._refId

	def getLevel(self):
		return self._level

	def getBuilding(self):
		return self._building

	def getConnectionTo(self, other):
		# DOES THIS NEED TO BE HERE?
		# i think we are guaranteed that the entities will be in the
		# same building now.
		# has to be in same building or we need to use google
		if self._building != other._building:
			# else use google to find the path
			return None
		# Can connect to any other entity only on same 'level'
		if self._level != other._level:
			return None
		# now should be in same building on same level
		# can use search algorithm to find the connection
		# get nav graph from building and level
		print "loading nav graph..."
		flNavGraph = gman.loadFloorNavGraph(self._building, self._level)
		if flNavGraph is not None:
			nodeA = flNavGraph.getNode(self.getName(), self.getRefId())
			nodeB = flNavGraph.getNode(other.getName(), other.getRefId())
			if nodeA and nodeB is not None:
				connectionFinder = SearchAlgorithm(nodeA, nodeB)
				print "finding path..."
				path = connectionFinder.search(["Stairs", "Elevator", "Entrance"])
				if path is not None:
					path.environment = self.getBuilding()
				return path
		print "flNavGraph was None"

class EdgeWithPath(Edge):
	def __init__(self, node1, node2, index, path):
		Edge.__init__(self, node1, node2, index, path.getDistance())
		self.environment = path.environment
		assert index is not None
		success = gman.savePath(path.environment, index, path)
		if not success:
			raise Exception("Could not save ({})-({}) path".format((node1.name, node1.refId), (node2.name, node2.refId)))

	def getFloor(self):
		node1, node2 = self.ends
		try:
			if node1.floor == node2.floor:
				return node1.floor
		except:
			return None

	def getPath(self):
		return gman.loadPath(self.environment, self.getIndex())

class ConnectedPortal(ConnectedEntity):
	def __init__(self, space, building, level, graph=None):
		self._space = space
		position = None
		print "ConnectedPortal(): Loading", (building,level), "nav graph"
		flNavGraph = gman.loadFloorNavGraph(building, level)
		if flNavGraph is not None:
			print "ConnectedPortal(): Getting", (space.getName(), space.getRefId()), "node"
			node = flNavGraph.getNode(space.getName(), space.getRefId())
			if node is not None:
				position = node.getPosition()
			else:
				print "ConnectedPortal()-Warning: node was none for", (space.getName(), space.getRefId()), (building,level)
		else:
			print "ConnectedPortal()-Warning: nav graph was none for", (building, level)
		ConnectedEntity.__init__(self, space.getName(), space.getRefId(),
		                         level, building, position, graph)
	
	def getPolygon(self):
		return self._space.getPolygon()
	   
	def getConnectionTo(self, other):
		# DOES THIS NEED TO BE HERE?
		# i think we are guaranteed that the entities will be in the
		# same building now.
		# has to be in same building or we need to use google
		if self._building != other._building:
			# else use google to find the path
			return None
		# Can connect to any other entity only on same 'level'
		if self._level != other._level:
			# on different levels.  If name and refId are equal, then there is a
			# connection consisting of a single edge with some default weight
			# TODO: need to adjust edge weight if the nodes are greater
			# 	than one level apart.  Levels are strings however, so how to
			#   get an ordering? Create a mapping between level strings and numbers?
			if (self.getName(), self.getRefId()) == (other.getName(), other.getRefId()):
				floorsApart = abs(float(self._level) - float(other._level))
				path = Path()
				path.addEdge(Edge(self, other, None, defaultEdgeWeight * floorsApart))
				path.environment = self._building
				return path
			return None
		# now should be in same building on same level
		# can use search algorithm to find the connection
		# get nav graph from building and level
		print "loading nav graph..."
		flNavGraph = gman.loadFloorNavGraph(self._building, self._level)
		if flNavGraph is not None:
			nodeA = flNavGraph.getNode(self.getName(), self.getRefId())
			nodeB = flNavGraph.getNode(other.getName(), other.getRefId())
			if nodeA and nodeB is not None:
				connectionFinder = SearchAlgorithm(nodeA, nodeB)
				print "finding path..."
				path = connectionFinder.search(["Stairs", "Elevator", "Entrance"])
				if path is not None:
					path.environment = self.getBuilding()
				return path
		print "flNavGraph was None"

class ConnectedIntDoor(ConnectedPortal):

	def getConnectionTo(self, other):
		if self._level != other._level:
			return None
		else:
			return ConnectedPortal.getConnectionTo(self, other)

class ConnectedExtDoor(ConnectedEntity):
	def __init__(self, name, refId, building, level, x, y, graph=None):
		ConnectedEntity.__init__(self, name, refId, level, building, 
			                     Position(x,y), graph)

	def getConnectionTo(self, other):
		# has to be in same building or we need to use google
		if self._building != other._building:
			# use google to find the path distance
			googleCaller = google.GoogleMapAPICaller()
			distance = googleCaller.getPathDistance(self.getY(), self.getX(), other.getY(), other.getX())
			if distance is not None:
				path = Path()
				path.addEdge(Edge(self, other, None, distance))
				path.environment = EXTERIOR
				return path
		# else return the path to get to the other door
		# path is stored in the building connection graph so load that
		bldConGraph = gman.loadBuildingConnectionGraph(self.getBuilding())
		if bldConGraph is not None:
			nodeA = bldConGraph.getNode(self.getName(), self.getRefId(), self.getLevel(), self.getBuilding())
			nodeB = bldConGraph.getNode(other.getName(), other.getRefId(), other.getLevel(), self.getBuilding())
			# edge = nodeA.getEdgeTo(nodeB)
			connectionFinder = SearchAlgorithm(nodeA, nodeB)
			print "finding path..."
			path = connectionFinder.search(["Stairs", "Elevator", "Entrance"])
			if path is not None:
				path.environment = self._building
			return path
			# if edge is not None:
			# 	return edge.path
