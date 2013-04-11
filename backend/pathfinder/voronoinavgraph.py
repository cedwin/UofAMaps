#!/usr/bin/env python

"""Module to compute the navigation graph that describes how polygons
can be traversed by a graph search algorithm.
Usage:
from voronoinavgraph import computeNavGraph
navGraph = computeNavGraph(graphOfPolygon, polygon)

where polygon is a Polygon object, and graphOfPolygon is a graph representation
of polygon."""

import backend.pathfinder.voronoi as voronoi
import Polygon
from backend.pathfinder.graph import Graph, Node, Edge, Position
from backend.pathfinder.utils import straightLineDistance
from backend.pathfinder.RamerDouglasPeuckerAlgorithm import RamerDouglasPeuckerForNavGraph
from backend.pathfinder.graphvisualizer import outputGraph
# from backend.pathfinder.graphbuilder import polygonToGraph as polToGraph


def computeNavGraph(graphOfPolygon, polygon, tolerance=30):
	"""Return the graph that represents navigable space inside polygon.
	graphOfPolygon -- a Graph representing a polygon defined by nodes and edges
	polygon -- the Polygon that corresponds to graphOfPolygon."""
	# get the voronoi graph of the polygon
	voronoiGraph = _getVoronoiGraph(graphOfPolygon)
	# cleanup the voronoi graph relative to the polygon to get the navGraph
	_cleanupVoronoiGraph(voronoiGraph, polygon)
	# set the edge costs to be the distance between nodes
	for edge in voronoiGraph.getEdges():
		nodeA, nodeB = edge.getEnds()
		edge.setCost(straightLineDistance(nodeA, nodeB))
	# _removeCloseNodes(voronoiGraph, graphOfPolygon, tolerance)
	return voronoiGraph

def _getVoronoiGraph(graph):
	points = _getPointList(graph)
	triple = voronoi.computeVoronoiDiagram(points)
	return _voronoiToGraph(triple)

def _getPointList(graph):
	points = []
	for node in graph.getNodes():
		x = node.getX()
		y = node.getY()
		points.append(Position(x, y))
	return points

def _voronoiToGraph(voronoiTriple):
# voronoiTriple is a triple consisting of:
#		   (1) a list of 2-tuples, which are the x,y coordinates of the 
#			   Voronoi diagram vertices
#		   (2) a list of 3-tuples (a,b,c) which are the equations of the
#			   lines in the Voronoi diagram: a*x + b*y = c
#		   (3) a list of 3-tuples, (l, v1, v2) representing edges of the 
#			   Voronoi diagram.  l is the index of the line, v1 and v2 are
#			   the indices of the vetices at the end of the edge.  If 
#			   v1 or v2 is -1, the line extends to infinity.
	# add nodes to the graph from from first list and store in array.
	# the indicies will be the same as in the list
	# then iterate over the list of edges,  
	# for each edge, look up the vertices in the array and add an edge between them.
	graph = Graph()
	voronoiNodes = []
	for vCoord in voronoiTriple[0]:
		node = graph.addNode(Position(vCoord[0], vCoord[1]))
		voronoiNodes.append(node)
	for eCoord in voronoiTriple[2]:
		if -1 in eCoord:
			continue
		nodeA = voronoiNodes[eCoord[1]]
		nodeB = voronoiNodes[eCoord[2]]
		graph.addEdge(nodeA, nodeB)
	return graph
	
def _cleanupVoronoiGraph(graph, polygon):
	# go through nodes in the graph
	# if they are outside the polygon then delete the node
	# and its edges from the graph
	nodes = graph.getNodes().copy()
	for node in nodes:
		if not polygon.isInside(node.getX(), node.getY()):
			graph.removeNode(node)
			
def _removeCloseNodes(graph, graphOfPolygon, tolerance):
	from backend.pathfinder.graphbuilder import polygonToGraph
	nodeList = list(graph.getNodes().copy())
	toSimplifyCurves = []
	sum = 0
# 	print "total original nodes", len(nodeList)
	starNodes = {}
	for node in nodeList:
		starNodes[node]=0
	for node in nodeList:
		if len(node.getNeighbors()) > 2:
			for neighbor in node.getNeighbors():
				curve = [node]
				starNodes[node] +=1
				nextNode = neighbor
# 				print "Neighbors of next node", len(nextNode.getNeighbors())
				while (True):					
#   					print "next node:", nextNode
					curve.append(nextNode)

					if (len(nextNode.getNeighbors()) != 2):
						if starNodes[nextNode] == len(nextNode.getNeighbors()):
							curve = []
						break
					for nextNeighbor in nextNode.getNeighbors():
						if (nextNeighbor is not nextNode and nextNeighbor not in curve):
							nextNode = nextNeighbor
							break
# 				#after break, still in neighbor loop
 				sum += len(curve)
#   				print "curve length", len(curve)
  				if len(curve) > 0:
				  	toSimplifyCurves.append(curve)

#  	print "sum of length of curves:", sum
#  	print "total number of curves", len(toSimplifyCurves)
	assert(len(toSimplifyCurves) > 0)
	assert(len(nodeList) > 0)
  	print "Simplifying graph using modified RamerDouglasPeucker algorithm.."
#  	time.sleep(2)
# 	print "b4", len(graph.getNodes())
#   	outputGraph(graph, None, "testSimplifiedNavGraphb4")
	counter = 0
	for curve in toSimplifyCurves:
# 		print "curve #",counter, ", length =",len(curve), "of total", len(toSimplifyCurves)
		counter += 1
		graph = RamerDouglasPeuckerForNavGraph(graph, curve , graphOfPolygon, tolerance)
	print "Done simplifying"
# 	print "after", len(graph.getNodes())
# 	outputGraph(graph, None, "testSimplifiedNavGraph", False, 30)
#  	outputGraph(graph, None, "testSimplifiedNavGraph")
	
