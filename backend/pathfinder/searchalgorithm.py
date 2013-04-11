#!/usr/bin/env python
"""Pathfinding module for the UofACampusMaps pathfinding project."""

import backend.pathfinder.priorityqueue as priorityqueue
from backend.pathfinder.utils import straightLineDistance

allowedNames = set(["Stairs", "Elevator", "Entrance", ""])

class SearchAlgorithm(object):
	"""Represents the A* pathfinding algorithm."""
	def __init__(self, startNode, goalNode, heuristic=straightLineDistance, printStuff=False):
		"""Initialize a pathfinder with a startNode, goalNode, and heuristic function.
		Different heuristic functions can be supplied to change A*'s behavior.
		"""
		self.printStuff = printStuff
		self.startNode = startNode
		self.goalNode = goalNode
		self.heuristic = heuristic
		self.frontier = priorityqueue.PriorityQueue()
		"Frontier is a priority queue of nodes being considered for exploration."
		self.explored = set([])
		"Explored is the set of nodes to which optimal paths have been found."
		self.parentOf = dict()
		"Contains the parent of a given node on the optimal path to that node."
		self.pathDistance = dict()
		"Distance to a given node from the startNode."
		self.frontier.insert(startNode)	
		self.explored.add(startNode)
		self.parentOf[self.startNode] = None
		self.pathDistance[self.startNode] = 0
		
	def estimate(self, node):
		"""A* evaluation function. Estimate of the distance to goalNode through node."""
		return self.pathDistance[node] + self.heuristic(node, self.goalNode)
	
	def solution(self, node):
		"""Return the path of nodes to node from startNode by following the parents."""
		solution = Path()
		solution.addNode(node)
		last = node
		next = self.parentOf[node]
		while next:
			solution.addNode(next)
			edge = last.getEdgeTo(next)
			solution.addEdge(edge)
			last = next
			next = self.parentOf[next]
		return solution
	
	def getDistanceToNeighbor(self, fromNode, neighbor):
		"""Return the distance to neighbor of fromNode on the current path."""
		edge = fromNode.getEdgeTo(neighbor)
		assert(fromNode in self.pathDistance.keys())
		return self.pathDistance[fromNode] + edge.getCost()

	def search(self, allowed=[]):
		self.allowed = allowed
		"""Main A* search routine."""
		while True:
			if self.frontier.isEmpty():
				return None
			if self.printStuff:	
				try:
					for a, b, node in self.frontier.getTasks():
						print "FrontierNode:", (node.name, node.refId, node.building, node.level), ", f is", self.estimate(node)
				except:
					pass
				print "------------------------------------------------------"
			node = self.frontier.pop()
			try:
				if self.printStuff:
					print "Considering", (node.name, node.refId, node.building, node.level), ", f is", self.estimate(node)
			except:
				print "Exception, passing"
				pass
			if node is self.goalNode:
				return self.solution(node)
			for neighbor in node.getNeighbors():
				if not self.navigable(neighbor):
					continue
				thisPathDistance = self.getDistanceToNeighbor(node, neighbor)
				if neighbor not in self.frontier and neighbor not in self.explored:
					self.parentOf[neighbor] = node
					self.pathDistance[neighbor] = thisPathDistance
					self.explored.add(neighbor)
					self.frontier.insert(neighbor, self.estimate(neighbor))
				elif neighbor in self.frontier and self.pathDistance[neighbor] > thisPathDistance:
					# insert also replaces
					# try:
					# 	if node is not self.goalNode and node is not self.startNode and node.name not in allowedNames:
					# 		# print "Continuing for " + node.name
					# 		continue
					# except Exception as e:
					# 	# print "Excepting"
					# 	# print e
					# 	pass
					# try:
					# 	if node.name != "":
					# 		print node.name
					# except:
					# 	pass
					self.parentOf[neighbor] = node
					self.pathDistance[neighbor] = thisPathDistance
					self.frontier.insert(neighbor, self.estimate(neighbor))

	def navigable(self, node):
		# print "Navigable?"
		try:
			if (node is not self.goalNode and 
				node is not self.startNode and 
				node.name is not None and
				node.name not in self.allowed):
				# print "Continuing for " + node.name
				# print node.name, "is not!"
				return False
		except Exception as e:
			print e
			pass
		# print "Yes!"
		return True
					
class Path(object):
	def __init__(self):
		self.nodes = []
		self.edges = []
		self.distance = None
		
	def addNode(self, node):
		self.nodes.append(node)

	def addEdge(self, edge):
		self.edges.append(edge)
		
	def getNodes(self):
		return list(reversed(self.nodes))
	
	def getEdges(self):
		return list(reversed(self.edges))
	
	def getDistance(self):
		distance = 0
		for edge in self.edges:
			distance += edge.getCost()
		return distance