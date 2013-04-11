#!/usr/bin/env python
from backend.pathfinder.utils import Position
from numpy import *
from copy import deepcopy

class Graph(object):
	"""Class to represent a graph.
	Graph is stored as a list of nodes and edges.
	Nodes and edges are objects that can be queried.
	Each node has a euclidean position and a list of its neighbors.
	Each edge has references to the nodes on its ends.
	"""
	def __init__(self):
		self.nodes = set()
		self.edges = set()
		self.newNodeIndex = -1
		self.newEdgeIndex = -1
		self.nodeMap = {}
	
	def addNode(self, position=None, name=None, refId=None, level=None, building=None):
		"""Add a node to the graph.
		position -- position of the node (default None)
		name -- name to associate with this node (default None)"""
		node = Node(self, self._assignNewNodeIndex(), position)
		self.nodes.add(node)
		node.name, node.refId, node.level, node.building = name, refId, level, building
		self.nodeMap[(name, refId, level, building)] = node
		return node

	def removeNode(self, node):
		"""Remove a node from the graph."""
		for neighbor in node.getNeighbors():
			edge = self.getEdge(node, neighbor)
			# remove it from neighbor's list
			neighbor.removeEdge(edge)
			# remove it from graph's list
			self.edges.remove(edge)
		self.nodes.remove(node)
		
	def getNode(self, name, refId=None, level=None, building=None):
		if (name, refId, level, building) in self.nodeMap.keys():
			print "getNode", (name, refId, level, building)
			return self.nodeMap[(name, refId, level, building)]
		if (name, refId, level) in self.nodeMap.keys():
			print "getNode", (name, refId, level)
			return self.nodeMap[(name, refId, level)]
		if (name, refId) in self.nodeMap.keys():
			print "getNode", (name, refId)
			return self.nodeMap[(name, refId)]
		print "Node not found for key", (name, refId, level, building)
		
	def addEdge(self, node1, node2, cost=1):
		"""Add an edge between node1 and node2 to the graph."""
		edge = Edge(node1, node2, self._assignNewEdgeIndex(), cost)
		self._addEdge(edge, node1, node2)
		return edge

	def addExistingEdge(self, edge):
		edge.index = self._assignNewEdgeIndex()
		node1, node2 = edge.getEnds()
		self._addEdge(edge, node1, node2)

	def _addEdge(self, edge, node1, node2):
		assert node1 in self.nodes
		assert node2 in self.nodes
		assert node1 is not node2
		node1.addEdge(edge)
		node2.addEdge(edge)
		self.edges.add(edge)		
		
	def removeEdge(self, edge):
		"""Remove an edge from the graph."""
		node1, node2 = edge.getEnds()
		node1.removeEdge(edge)
		node2.removeEdge(edge)
		self.edges.remove(edge)
		
	def getEdge(self, node1, node2):
		"""Return the edge between node1 and node2."""
		ends = set([node1, node2])
		for edge in self.getEdges():
			if ends == edge.getEnds():
				return edge

	def getNodes(self):
		return self.nodes
	
	def getEdges(self):
		return self.edges

	def addGraph(self, graph):
		# union all nodes and edges in graph to this graph
		self.nodes |= deepcopy(graph.getNodes())
		self.edges |= deepcopy(graph.getEdges())

	def _assignNewNodeIndex(self):
		"""Increment and return an index for a new node."""
		self.newNodeIndex += 1
		return self.newNodeIndex
	
	def _assignNewEdgeIndex(self):
		"""Increment and return an index for a new edge."""
		self.newEdgeIndex += 1
		return self.newEdgeIndex


class Node(object):
	"""Represents a node in a graph."""
	def __init__(self, graph, index, position):
		self.edges = set()
		self.index = index
		self.graph = graph
		self.position = position
		
	def addEdge(self, edge):
		"""Add an edge to this node's edge list."""
		self.edges.add(edge)
		
	def removeEdge(self, edge):
		"""Remove an edge from this node's edge list."""
		self.edges.remove(edge)
		
	def getIndex(self):
		return self.index
		
	def getNeighbors(self):
		"""Return the set of neighbors of this node."""
		neighbors = set()
		for edge in self.edges:
			node1, node2 = edge.getEnds()
			neighbors.add(node1)
			neighbors.add(node2)
		if self in neighbors:
			neighbors.remove(self)
		return neighbors
	
	def getEdgeTo(self, node):
		"""Return the edge that connects this node to a given node."""
		return self.graph.getEdge(self, node)
	
	def getPosition(self):
		return self.position
	
	def setPosition(self, position):
		self.position = position
	
	def getX(self):
		return self.position.x()
	
	def getY(self):
		return self.position.y()
	
	def getZ(self):
		return self.position.z()
	
	def getPerpendicularLine(self, edge):
		ABC = self.getLineFormula(edge)
		A,B,C=0,0,0
		if ABC[0] == 0:
			A = 0
			C = self.getY()
		elif ABC[1] == 0:
			B = 0
			C = self.getX()
		else:
			B = 1
			A = - ABC[1]/ABC[0]
			C = - (A*self.getX() + self.getY()) 
		return
	
	def getPerpendicularIntersect(self, edge):
		edgeNodeA, edgeNodeB = edge.getEnds()
		x1 = edgeNodeA.getX()
		y1 = edgeNodeA.getY()
		x2 = edgeNodeB.getX()
		y2 = edgeNodeB.getY()
		x3 = self.getX()
		y3 = self.getY()
		k = ((y2-y1) * (x3-x1) - (x2-x1) * (y3-y1)) / ((y2-y1)*(y2-y1) + (x2-x1)*(x2-x1))
		x4 = x3 - k * (y2-y1)
		y4 = y3 + k * (x2-x1)
		
		px = x2-x1
		py = y2-y1
		dAB = px*px + py*py;
		u = ((x3 - x1) * py + (y3 - y1) * px)
		x = x1 + u * px
		y = y1 + u * py
		return Node(None, 1, Position(x4,y4))
	
	def getLineFormula(self, nodeB):
	    xDifference = nodeB.getX() - self.getX()
	    yDifference = nodeB.getY() - self.getY()
	    A=0
	    B=0
	    C=0
	    if xDifference==0:
	        B = 0
	        A = 1
	        C = -self.getX()
	    elif yDifference==0:
	        A = 0
	        B = 1
	        C = -self.getY()
	    else:
	        B=1
	        A = -(yDifference/xDifference)
	        C = -(self.getY() + self.getX()*A)
	    return [A,B,C]
	  
	def getPerpendicularDistance(self, edge):
		edgeNodeA, edgeNodeB = edge.getEnds()
		# ABC in Ax + By + C = 0
		ABC = edgeNodeA.getLineFormula(edgeNodeB)
		return ( abs(ABC[0]*self.getX() + ABC[1]*self.getY() + ABC[2]) )/(math.sqrt( ABC[0]*ABC[0] + ABC[1]*ABC[1]))
	
class Edge(object):
	"""Represents an edge in the graph."""
	def __init__(self, node1, node2, index=None, cost=1):
		"""Initialize a new edge between node1 and node2 with a given index and cost.
		cost -- a cost value for the edge (default 1)
		"""
		self.index = index
		self.ends = set([node1, node2])
		self.cost = cost
		
	def getIndex(self):
		return self.index
	
	def getEnds(self):
		return self.ends
	
	def getCost(self):
		return self.cost
	
	def setCost(self, cost):
		self.cost = cost
		
	def getCenterPosition(self):
		nodeA, nodeB = self.ends
		x = (nodeA.getX() + nodeB.getX()) /2
		y = (nodeA.getY() + nodeB.getY()) /2
		return Position(x,y)

	def intersects(self, other) :
		"""
		#reference: http://www.cs.mun.ca/~rod/2500/notes/numpy-arrays/numpy-arrays.html and slides, both from F. S. Hill
		"""
		selfNodeA, selfNodeB = self.ends
		otherNodeA, otherNodeB = other.ends
		# test if they share a node:
		#if (selfNodeA is otherNodeA or selfNodeA is otherNodeB or
		#		selfNodeB is otherNodeA or selfNodeB is otherNodeB):
		#	return False
		x1, y1 = selfNodeA.getX(), selfNodeA.getY()
		x2, y2 = selfNodeB.getX(), selfNodeB.getY()
		x3, y3 = otherNodeA.getX(), otherNodeA.getY()
		x4, y4 = otherNodeB.getX(), otherNodeB.getY()
		
		# if two lines have at least one same node, then they are not intersect, based on our usage
		if (x1, y1) == (x3, y3) or (x1, y1) == (x4, y4) or (x2, y2) == (x3, y3) or (x2, y2) == (x4, y4):
			return False

		pointA = array( [x1, y1] )
		pointB = array( [x2, y2] )
		pointC = array( [x3, y3] )
		pointD = array( [x4, y4] )

		b = pointB - pointA
		d = pointD - pointC
		c = pointC - pointA

		dPerpendicular = empty_like(d)
		dPerpendicular[0] = -d[1]
		dPerpendicular[1] = d[0]

		bPerpendicular = empty_like(b)
		bPerpendicular[0] = -b[1]
		bPerpendicular[1] = b[0]


		denom1 = dot( b, dPerpendicular)	
		num1 = dot( c, dPerpendicular)

		denom2 = dot(d, bPerpendicular)
		num2 = dot(c, bPerpendicular)
		
		# parallel
		if  denom2 == 0:
			#print "denom2 is 0"
			return False
		
		if denom1 == 0 :
			#print "denom1 is 0"
			return False
		
		t = (num1 / denom1)
		u = - (num2 / denom2)

		if ( 0 <= t and  t <= 1
			and 0<= u and u <=1):
			return True
		else:
			return False
		

	def getIntersectedNodeWithRay(self, nodeStart, nodeEnd):
		selfNodeA, selfNodeB = self.ends
		otherNodeA, otherNodeB = nodeStart, nodeEnd
		# test if they share a node:
		#if (selfNodeA is otherNodeA or selfNodeA is otherNodeB or
		#		selfNodeB is otherNodeA or selfNodeB is otherNodeB):
		#	return False
		x1, y1 = selfNodeA.getX(), selfNodeA.getY()
		x2, y2 = selfNodeB.getX(), selfNodeB.getY()
		x3, y3 = otherNodeA.getX(), otherNodeA.getY()
		x4, y4 = otherNodeB.getX(), otherNodeB.getY()
		
		# if two lines have at least one same node, then they are not intersect, based on our usage
		if (x1, y1) == (x3, y3) or (x1, y1) == (x4, y4) or (x2, y2) == (x3, y3) or (x2, y2) == (x4, y4):
			return False

		pointA = array( [x1, y1] )
		pointB = array( [x2, y2] )
		pointC = array( [x3, y3] )
		pointD = array( [x4, y4] )

		b = pointB - pointA
		d = pointD - pointC
		c = pointC - pointA

		dPerpendicular = empty_like(d)
		dPerpendicular[0] = -d[1]
		dPerpendicular[1] = d[0]

		bPerpendicular = empty_like(b)
		bPerpendicular[0] = -b[1]
		bPerpendicular[1] = b[0]


		denom1 = dot( b, dPerpendicular)	
		num1 = dot( c, dPerpendicular)

		denom2 = dot(d, bPerpendicular)
		num2 = dot(c, bPerpendicular)
		
		# parallel
		if  denom2 == 0:
			#print "denom2 is 0"
			return None
		
		if denom1 == 0 :
			#print "denom1 is 0"
			return None
		
		t = (num1 / denom1)
		u = - (num2 / denom2)

		if ( 0 <= t and  t <= 1 and u >= 0):
			pointP = pointA + b*(num1 / denom1)
# 			print "intersect node: ", pointP
			return Node(None, 1, Position(pointP[0], pointP[1]))

  
